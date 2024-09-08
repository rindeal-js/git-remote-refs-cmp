// git-remote-refs.ts

// Utility types
type Hex = string;

type GitRef = {
  name: string;
  oid: Hex;
  symref?: string;
};

type ComparisonResult = {
  inSync: boolean;
  inSyncRefs: GitRef[];
  outOfSyncRefs: { ref: GitRef; otherOid: Hex }[];
  missingRefs: { repo: 'A' | 'B'; ref: GitRef }[];
};

// Constants
const PACKET_DELIM = '0001';
const PACKET_FLUSH = '0000';
const GIT_HASH_ALGO = 'sha1';
const HEX_PACKET_LENGTH = 4;

// Regular expressions for strict parsing
const OID_REGEX = /^[0-9a-f]{40}([0-9a-f]{24})?$/i;
const REF_NAME_REGEX = /^[^\s]+$/;

class GitRemoteRefs {
  private static userAgent = 'GitRemoteRefs/1.0';
  private static textEncoder = new TextEncoder();
  private static textDecoder = new TextDecoder();

  private static readonly lsRefsRequest: Uint8Array = GitRemoteRefs.createLsRefsRequest();

  private static encodePacket(data: string): Uint8Array {
    const packetContent = `${data}\n`;
    const length = packetContent.length + HEX_PACKET_LENGTH;
    const packet = `${length.toString(16).padStart(HEX_PACKET_LENGTH, '0')}${packetContent}`;
    return GitRemoteRefs.textEncoder.encode(packet);
  }

  private static createLsRefsRequest(): Uint8Array {
    const packets: Uint8Array[] = [
      GitRemoteRefs.encodePacket(`command=ls-refs`),
      GitRemoteRefs.encodePacket(`agent=${GitRemoteRefs.userAgent}`),
      GitRemoteRefs.encodePacket(`object-format=${GIT_HASH_ALGO}`),
      GitRemoteRefs.textEncoder.encode(PACKET_DELIM),
      GitRemoteRefs.encodePacket('peel'),
      GitRemoteRefs.encodePacket('symrefs'),
      GitRemoteRefs.encodePacket('unborn'),
      GitRemoteRefs.textEncoder.encode(PACKET_FLUSH)
    ];

    return GitRemoteRefs.concatUint8Arrays(packets);
  }

  private static concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  }

  private static async* packetParser(reader: ReadableStreamDefaultReader<Uint8Array>): AsyncGenerator<string, void, unknown> {
    let buffer = new Uint8Array(0);

    while (true) {
      if (buffer.length < HEX_PACKET_LENGTH) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer = GitRemoteRefs.concatUint8Arrays([buffer, value]);
        continue;
      }

      const packetLength = parseInt(GitRemoteRefs.textDecoder.decode(buffer.slice(0, HEX_PACKET_LENGTH)), 16);

      if (packetLength === 0) {
        yield PACKET_FLUSH;
        buffer = buffer.slice(HEX_PACKET_LENGTH);
        continue;
      }

      if (packetLength === 1) {
        yield PACKET_DELIM;
        buffer = buffer.slice(HEX_PACKET_LENGTH);
        continue;
      }

      if (buffer.length < packetLength) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer = GitRemoteRefs.concatUint8Arrays([buffer, value]);
        continue;
      }

      const packetContent = GitRemoteRefs.textDecoder.decode(buffer.slice(HEX_PACKET_LENGTH, packetLength));
      yield packetContent.trim();
      buffer = buffer.slice(packetLength);
    }
  }

  private static parseRef(line: string): GitRef | null {
    const [oid, name, ...rest] = line.split(' ');
    if (!oid || !name || !OID_REGEX.test(oid) || !REF_NAME_REGEX.test(name)) return null;

    const ref: GitRef = { name, oid };
    rest.forEach(part => {
      if (part.startsWith('symref-target:')) {
        ref.symref = part.split(':')[1];
      }
    });

    return ref;
  }

  private static async sendLsRefsCommand(repoUrl: string): Promise<GitRef[]> {
    const url = new URL(repoUrl);
    url.pathname = `${url.pathname}/git-upload-pack`;

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-git-upload-pack-request',
        'Git-Protocol': 'version=2',
      },
      body: GitRemoteRefs.lsRefsRequest,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body!.getReader();
    const refs: GitRef[] = [];

    for await (const packet of GitRemoteRefs.packetParser(reader)) {
      if (packet === PACKET_FLUSH) break;
      const ref = GitRemoteRefs.parseRef(packet);
      if (ref) refs.push(ref);
    }

    return refs;
  }

  public static async lsRefs(repoUrl: string): Promise<GitRef[]> {
    return GitRemoteRefs.sendLsRefsCommand(repoUrl);
  }

  private static compareRefs(refsA: GitRef[], refsB: GitRef[]): ComparisonResult {
    console.log({refsA, refsB})
    const refMapA = new Map(refsA.map(ref => [ref.name, ref]));
    const refMapB = new Map(refsB.map(ref => [ref.name, ref]));

    const inSyncRefs: GitRef[] = [];
    const outOfSyncRefs: { ref: GitRef, otherOid: Hex }[] = [];
    const missingRefs: { repo: 'A' | 'B', ref: GitRef }[] = [];

    for (const [name, refA] of refMapA) {
      const refB = refMapB.get(name);
      if (refB) {
        if (refA.oid === refB.oid) {
          inSyncRefs.push(refA);
        } else {
          outOfSyncRefs.push({ ref: refA, otherOid: refB.oid });
        }
        refMapB.delete(name);
      } else {
        missingRefs.push({ repo: 'B', ref: refA });
      }
    }

    for (const refB of refMapB.values()) {
      missingRefs.push({ repo: 'A', ref: refB });
    }

    const inSync = outOfSyncRefs.length === 0 && missingRefs.length === 0;

    return { inSync, inSyncRefs, outOfSyncRefs, missingRefs };
  }

  public static async compare(repoUrlA: string, repoUrlB: string): Promise<ComparisonResult | null> {
    const [refsA, refsB] = await Promise.all([
      GitRemoteRefs.lsRefs(repoUrlA),
      GitRemoteRefs.lsRefs(repoUrlB)
    ]);

    const comparison = GitRemoteRefs.compareRefs(refsA, refsB);

    return comparison.inSync ? null : comparison;
  }
}

export { GitRemoteRefs, GitRef, ComparisonResult };
