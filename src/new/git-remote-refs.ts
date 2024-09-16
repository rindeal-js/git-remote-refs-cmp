// @see: https://github.com/facsimiles/turnip/blob/497f8526b52d012684a2d81b03275f0b24096251/turnip/pack/git.py#L35
const ERROR_PREFIX = 'ERR '

type Hex = string
type Hostname = string

type GitRef = {
  name: string
  oid: Hex
  symref?: string
}

type ComparisonResult = {
  inSync: boolean
  inSyncRefs: GitRef[]
  outOfSyncRefs: { ref: GitRef; otherOid: Hex }[]
  missingRefs: { repo: 'A' | 'B'; ref: GitRef }[]
}

type ServerCapabilities = {
  [key: string]: string[]
}

class HttpError extends Error {
  status: number;
  statusText: string;
  headers: Headers;
  content: any;

  constructor(response: Response) {
    super(`HTTP error! status: ${response.status} ${response.statusText}`);
    this.status = response.status;
    this.statusText = response.statusText;
    this.headers = response.headers;
    this.content = null;

    // Initialize content asynchronously
    this.initContent(response);
  }

  public async initContent(response: Response) {
    try {
      const contentType = response.headers.get('Content-Type');
      this.content = contentType?.includes('application/json')
        ? await response.json()
        : await response.text();
    } catch {
      this.content = '';
    }
  }
}


class GitPacketLine {
  static HEX_LENGTH = 4
  static FLUSH = new GitPacketLine({ rawLine: '0000', precompile: true })
  static DELIM = new GitPacketLine({ rawLine: '0001', precompile: true })
  static COMMAND_LS_REFS = new GitPacketLine({ content: 'command=ls-refs', precompile: true })
  static UNBORN = new GitPacketLine({ content: 'unborn', precompile: true })
  static PEEL = new GitPacketLine({ content: 'peel', precompile: true })
  static SYMREFS = new GitPacketLine({ content: 'symrefs', precompile: true })

  protected _content: string | null
  protected _rawLine: string | null

  constructor(init: { content?: string, rawLine?: string, precompile?: boolean }) {
    if ( init.content == null && init.rawLine == null ) {
      throw new Error('Either content or line must be provided')
    }

    this._content = init.content ?? null
    this._rawLine = init.rawLine ?? null

    if ( init.precompile ) {
      if (this._rawLine == null && this._content != null) {
        this._rawLine = GitPacketLine.serialize(this._content)
      } else if (this._content == null && this._rawLine != null) {
        this._content = GitPacketLine.deserialize(this._rawLine)
      }
    }
  }

  public get content(): string {
    if ( this._content == null ) {
      if ( this._rawLine == null ) throw new Error()
      this._content = GitPacketLine.deserialize(this._rawLine)
    }
    return this._content
  }

  public get rawLine(): string {
    if ( this._rawLine == null ) {
      if ( this._content == null ) throw new Error()
      this._rawLine = GitPacketLine.serialize(this._content)
    }
    return this._rawLine
  }

  public equals(other: GitPacketLine): boolean {
    // console.log({equals: '', this: this.rawLine, other: other.rawLine, result: this.rawLine === other.rawLine})
    return this.rawLine === other.rawLine
  }

  public static serialize(content: string): string {
    const length = GitPacketLine.HEX_LENGTH + content.length + '\n'.length
    return `${length.toString(16).padStart(GitPacketLine.HEX_LENGTH, '0')}${content}\n`
  }

  public static deserialize(rawLine: string): string {
    const length = parseInt(rawLine.slice(0, GitPacketLine.HEX_LENGTH), 16)
    return rawLine.slice(GitPacketLine.HEX_LENGTH, length)
  }
}

class BufferedAsyncIterator<T> implements AsyncIterator<T>, AsyncIterable<T> {
  private buffer: T[] = []
  private done = false

  public constructor(private iterator: AsyncIterator<T>) {}

  public async next(): Promise<IteratorResult<T, undefined>> {
    if (this.buffer.length) {
      return { value: this.buffer.shift() as T, done: false }
    }
    if (this.done) {
      return { value: undefined, done: true }
    }
    const result = await this.iterator.next()
    if (result.done) {
      this.done = true
    }
    return result
  }

  public async peek(): Promise<T | undefined> {
    if (this.buffer.length > 0) {
      return this.buffer[0]
    }
    const result = await this.next()
    if (result.done) {
      return undefined
    }
    this.buffer.unshift(result.value)
    return result.value
  }

  [Symbol.asyncIterator](): BufferedAsyncIterator<T> {
    return this
  }
}

type GitPacketLineIterator = BufferedAsyncIterator<GitPacketLine>

class GitPacketParser {
  private buffer: string = ''

  async *parse(reader: ReadableStreamDefaultReader<string>): AsyncGenerator<GitPacketLine, void, unknown> {
    while (true) {
      if (this.buffer.length < GitPacketLine.HEX_LENGTH) {
        const { value, done } = await reader.read()
        if (done) break
        this.buffer += value
        continue
      }

      const packetLength = parseInt(this.buffer.slice(0, GitPacketLine.HEX_LENGTH), 16)

      if (packetLength === 0) {
        yield GitPacketLine.FLUSH
        this.buffer = this.buffer.slice(GitPacketLine.HEX_LENGTH)
        continue
      }

      if (packetLength === 1) {
        yield GitPacketLine.DELIM
        this.buffer = this.buffer.slice(GitPacketLine.HEX_LENGTH)
        continue
      }

      if (this.buffer.length < packetLength) {
        const { value, done } = await reader.read()
        if (done) break
        this.buffer += value
        continue
      }

      console.log({rawLine: this.buffer.slice(0, packetLength)})

      const end = this.buffer.charAt(packetLength - 1) === '\n' ? packetLength - 1 : packetLength
      yield new GitPacketLine({
        content: this.buffer.slice(GitPacketLine.HEX_LENGTH, end),
        rawLine:    this.buffer.slice(0, packetLength),
      })
      this.buffer = this.buffer.slice(packetLength)
    }
  }
}

class GitRemoteRefs {
  private static USER_AGENT = 'GitRemoteRefs/1.0'
  private capabilitiesCache: Map<Hostname, ServerCapabilities> = new Map()

  constructor() {}

  private async sendRequest(url: string, options: { method?: string, contentType?: string, body?: string, gitProtocolVersion?: 0 | 1 | 2 } = {}): Promise<GitPacketLineIterator> {
    const headers = {
      'Git-Protocol': `version=${options.gitProtocolVersion ?? 2}`,
      'User-Agent': GitRemoteRefs.USER_AGENT,
      'Cache-Control': 'no-cache, no-store, max-age=0',
      ...(options.contentType && { 'Content-Type': options.contentType })
    };

    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: headers,
      body: options.body ?? null,
      // cache: 'no-store',  // node doesn't implement any caching as of node20, see https://github.com/nodejs/undici/issues/2760
      referrerPolicy: 'no-referrer',
      mode: 'cors',
    })

    if ( ! response.ok ) {
      const error = new HttpError(response)
      await error.initContent(response)
      throw error
    }

    const reader = response.body!
      .pipeThrough(new TextDecoderStream())
      .getReader()
    const packetParser = new GitPacketParser()
    const packetIterator = new BufferedAsyncIterator(packetParser.parse(reader))

    const firstPktLine = await packetIterator.peek()
    if ( ! firstPktLine ) {
      throw new Error('Unexpected end of stream')
    }
    if ( firstPktLine.content.startsWith(ERROR_PREFIX)) {
      throw new Error(`Server daemon error: \`${firstPktLine.content.slice(ERROR_PREFIX.length)}\``)
    }

    return packetIterator
  }

  private async fetchServerCapabilities(repoUrl: string | URL): Promise<ServerCapabilities> {
    const gitProtocolVersion = 2

    const url = new URL(repoUrl)
    url.pathname = `${url.pathname}/info/refs`
    url.search = '?service=git-upload-pack'
    const lineIter = await this.sendRequest(url.toString(), { method: 'GET', gitProtocolVersion})

    // parse service announcement (if any)
    const firstPacket = await lineIter.peek()
    if ( ! firstPacket ) {
      throw new Error('Unexpected end of stream when peeking first packet')
    } else if ( firstPacket.content === '# service=git-upload-pack' ) {
      await lineIter.next() // Consume the peeked packet
      const flushPacketItRes = await lineIter.next()
      if ( flushPacketItRes.done || ! flushPacketItRes.value.equals(GitPacketLine.FLUSH) ) {
        throw new Error(`Invalid service announcement packet: missing flush` + (flushPacketItRes.done ? '' : `, instead received: \`${flushPacketItRes.value.rawLine}\``))
      }
    }

    // Parse version
    const versionPacketItRes = await lineIter.next()
    if ( versionPacketItRes.done || versionPacketItRes.value.content !== `version ${gitProtocolVersion}` ) {
      throw new Error(`Invalid/unsupported version line in capabilities packet${versionPacketItRes.done ? '' : `: \`${versionPacketItRes.value.rawLine}\``}`)
    }

    return this.parseServerCapabilities(lineIter)
  }

  private async parseServerCapabilities(packetIterator: GitPacketLineIterator): Promise<ServerCapabilities> {
    const capabilities: ServerCapabilities = { }

    // Parse other capabilities
    for await (const line of packetIterator) {
      if (line.equals(GitPacketLine.FLUSH)) break

      const [key, value] = line.content.split('=', 2)
      capabilities[key] = value?.split(/\s+/) || []
    }

    console.log({capabilities})

    return capabilities
  }

  private async getServerCapabilities(repoUrl: string | URL): Promise<ServerCapabilities> {
    const hostname = new URL(repoUrl).hostname as Hostname
    if ( ! this.capabilitiesCache.has(hostname) ) {
      const capabilities = await this.fetchServerCapabilities(repoUrl)
      this.capabilitiesCache.set(hostname, capabilities)
    }
    return this.capabilitiesCache.get(hostname)!
  }

  private async* sendLsRefsCommand(repoUrl: string | URL): AsyncGenerator<GitRef, void, unknown> {
    const url = new URL(repoUrl)
    const capabilities = await this.getServerCapabilities(url)
    url.pathname = `${url.pathname}/git-upload-pack`

    if ( ! capabilities['ls-refs'] ) {
      throw new Error('Server does not support ls-refs command')
    }

    const packetLines: GitPacketLine[] = [
      GitPacketLine.COMMAND_LS_REFS,
      new GitPacketLine({content: `agent=${GitRemoteRefs.USER_AGENT}`}),
    ]

    if ( capabilities['object-format'] ) {
      packetLines.push(new GitPacketLine({content: `object-format=${capabilities['object-format'][0]}`}))
    }

    packetLines.push(GitPacketLine.DELIM)

    if ( capabilities['ls-refs'].includes('unborn') ) {
      packetLines.push(GitPacketLine.UNBORN)
    }
    // packetLines.push(GitPacketLine.PEEL) // will add `peeled:...`
    // packetLines.push(GitPacketLine.SYMREFS)  // will add `symref-target` like this: HEAD symref-target:refs/heads/master

    packetLines.push(GitPacketLine.FLUSH)

    const requestBody = packetLines.map(line => line.rawLine).join('')

    const lineIter = await this.sendRequest(url.toString(), {
      method: 'POST',
      contentType: 'application/x-git-upload-pack-request',
      body: requestBody
    })

    for await (const line of lineIter) {
      const ref = GitRemoteRefs.parseRef(line.content)
      if (ref) yield ref
    }
  }

  private static parseRef(line: string): GitRef | null {
    const [oid, name, ...rest] = line.split(' ')
    if (!oid || !name) return null

    const ref: GitRef = { name, oid }
    rest.forEach(part => {
      if (part.startsWith('symref-target:')) {
        ref.symref = part.split(':')[1]
      }
    })

    return ref
  }
  
  public async* lsRefs(repoUrl: string): AsyncGenerator<GitRef, void, unknown> {
    yield* this.sendLsRefsCommand(repoUrl);
  }

  private static compareRefs(refsA: GitRef[], refsB: GitRef[]): ComparisonResult {
    const refMapA = new Map(refsA.map(ref => [ref.name, ref]));
    const refMapB = new Map(refsB.map(ref => [ref.name, ref]));

    const inSyncRefs: GitRef[] = [];
    const outOfSyncRefs: { ref: GitRef, otherOid: Hex }[] = [];
    const missingRefs: { repo: 'A' | 'B', ref: GitRef }[] = [];

    for (const [name, refA] of refMapA.entries()) {
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

  public async compare(repoUrlA: string, repoUrlB: string): Promise<ComparisonResult | null> {
    const refsA: GitRef[] = [];
    const refsB: GitRef[] = [];
    
    const collectRefs = async (repoUrl: string, refs: GitRef[]) => {
      for await (const ref of this.lsRefs(repoUrl)) {
        refs.push(ref)
      }
    }
    
    await Promise.all([
      collectRefs(repoUrlA, refsA),
      collectRefs(repoUrlB, refsB),
    ])

    const comparison = GitRemoteRefs.compareRefs(refsA, refsB);

    return comparison.inSync ? null : comparison;
  }
}

export { GitRemoteRefs, GitRef, ComparisonResult, GitPacketLine };