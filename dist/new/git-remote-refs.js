"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitPacketLine = exports.GitRemoteRefs = void 0;
// @see: https://github.com/facsimiles/turnip/blob/497f8526b52d012684a2d81b03275f0b24096251/turnip/pack/git.py#L35
const ERROR_PREFIX = 'ERR ';
class GitPacketLine {
    content;
    static HEX_LENGTH = 4;
    constructor(content) {
        this.content = content;
    }
    static FLUSH = new GitPacketLine('');
    static DELIM = new GitPacketLine('');
    serialize() {
        if (this === GitPacketLine.FLUSH)
            return '0000';
        if (this === GitPacketLine.DELIM)
            return '0001';
        const length = this.content.length + GitPacketLine.HEX_LENGTH + 1; // +1 for newline
        return `${length.toString(16).padStart(GitPacketLine.HEX_LENGTH, '0')}${this.content}\n`;
    }
    static COMMAND_LS_REFS = new GitPacketLine('command=ls-refs');
    static UNBORN = new GitPacketLine('unborn');
    static PEEL = new GitPacketLine('peel');
    static SYMREFS = new GitPacketLine('symrefs');
}
exports.GitPacketLine = GitPacketLine;
class BufferedAsyncIterator {
    iterator;
    buffer = [];
    done = false;
    constructor(iterator) {
        this.iterator = iterator;
    }
    async next() {
        if (this.buffer.length > 0) {
            return { value: this.buffer.shift(), done: false };
        }
        if (this.done) {
            return { value: undefined, done: true };
        }
        const result = await this.iterator.next();
        if (result.done) {
            this.done = true;
        }
        return result;
    }
    async peek() {
        if (this.buffer.length > 0) {
            return this.buffer[0];
        }
        const result = await this.next();
        if (result.done) {
            return undefined;
        }
        this.buffer.unshift(result.value);
        return result.value;
    }
    [Symbol.asyncIterator]() {
        return this;
    }
}
class GitPacketParser {
    buffer = '';
    async *parse(reader) {
        while (true) {
            if (this.buffer.length < GitPacketLine.HEX_LENGTH) {
                const { value, done } = await reader.read();
                if (done)
                    break;
                this.buffer += value;
                continue;
            }
            const packetLength = parseInt(this.buffer.slice(0, GitPacketLine.HEX_LENGTH), 16);
            if (packetLength === 0) {
                yield GitPacketLine.FLUSH;
                this.buffer = this.buffer.slice(GitPacketLine.HEX_LENGTH);
                continue;
            }
            if (packetLength === 1) {
                yield GitPacketLine.DELIM;
                this.buffer = this.buffer.slice(GitPacketLine.HEX_LENGTH);
                continue;
            }
            if (this.buffer.length < packetLength) {
                const { value, done } = await reader.read();
                if (done)
                    break;
                this.buffer += value;
                continue;
            }
            const packetContent = this.buffer.slice(GitPacketLine.HEX_LENGTH, packetLength - 1); // -1 to remove newline
            yield new GitPacketLine(packetContent);
            this.buffer = this.buffer.slice(packetLength);
        }
    }
}
class GitRemoteRefs {
    static USER_AGENT = 'GitRemoteRefs/1.0';
    capabilitiesCache = new Map();
    constructor() { }
    async fetchServerCapabilities(repoUrl) {
        const url = this.buildInfoRefsUrl(repoUrl);
        const response = await this.sendRequest(url, { method: 'GET' });
        await this.handleServiceAnnouncementPacket(packetIterator);
        return this.parseCapabilitiesPacket(packetIterator);
    }
    buildInfoRefsUrl(repoUrl) {
        const url = new URL(repoUrl);
        url.pathname = `${url.pathname}/info/refs`;
        url.search = '?service=git-upload-pack';
        return url.toString();
    }
    async sendRequest(url, options = {}) {
        const headers = {
            'Git-Protocol': 'version=2',
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
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const reader = response.body
            .pipeThrough(new TextDecoderStream())
            .getReader();
        const packetParser = new GitPacketParser();
        const packetIterator = new BufferedAsyncIterator(packetParser.parse(reader));
        const firstPktLine = await packetIterator.peek();
        if (!firstPktLine) {
            throw new Error('Unexpected end of stream');
        }
        if (firstPktLine.content.startsWith(ERROR_PREFIX)) {
            throw new Error(`Server daemon error: \`${firstPktLine.content.slice(ERROR_PREFIX.length)}\``);
        }
        return packetIterator;
    }
    async handleServiceAnnouncementPacket(packetIterator) {
        const firstPacket = await packetIterator.peek();
        if (!firstPacket) {
            throw new Error('Unexpected end of stream');
        }
        if (firstPacket.content === '# service=git-upload-pack') {
            await packetIterator.next(); // Consume the peeked packet
            const flushPacket = await packetIterator.next();
            if (flushPacket.done || flushPacket.value !== GitPacketLine.FLUSH) {
                throw new Error('Invalid service announcement packet: missing flush');
            }
        }
    }
    async parseCapabilitiesPacket(packetIterator) {
        const capabilities = { version: '' };
        // Parse version
        const versionPacket = await packetIterator.next();
        if (versionPacket.done || !versionPacket.value.content.startsWith('version ')) {
            throw new Error('Invalid version line in capabilities packet');
        }
        capabilities.version = versionPacket.value.content.split(' ')[1];
        if (capabilities.version !== '2') {
            throw new Error(`Unsupported Git protocol version: ${capabilities.version}`);
        }
        // Parse other capabilities
        for await (const line of packetIterator) {
            if (line === GitPacketLine.FLUSH)
                break;
            const [key, value] = line.content.split('=', 2);
            if (value === undefined) {
                capabilities[key] = [];
            }
            else {
                capabilities[key] = value.split(/\s+/);
            }
        }
        return capabilities;
    }
    async getServerCapabilities(repoUrl) {
        const hostname = new URL(repoUrl).hostname;
        if (!this.capabilitiesCache.has(hostname)) {
            const capabilities = await this.fetchServerCapabilities(repoUrl);
            this.capabilitiesCache.set(hostname, capabilities);
        }
        return this.capabilitiesCache.get(hostname);
    }
    createLsRefsRequest(capabilities) {
        if (!capabilities['ls-refs']) {
            throw new Error('Server does not support ls-refs command');
        }
        const packetLines = [
            GitPacketLine.COMMAND_LS_REFS,
            new GitPacketLine(`agent=${GitRemoteRefs.USER_AGENT}`),
        ];
        if (capabilities['object-format']) {
            packetLines.push(new GitPacketLine(`object-format=${capabilities['object-format'][0]}`));
        }
        packetLines.push(GitPacketLine.DELIM);
        if (capabilities['ls-refs'].includes('unborn')) {
            packetLines.push(GitPacketLine.UNBORN);
        }
        packetLines.push(GitPacketLine.PEEL);
        packetLines.push(GitPacketLine.SYMREFS);
        packetLines.push(GitPacketLine.FLUSH);
        return packetLines.map(line => line.serialize()).join('');
    }
    static parseRef(line) {
        const [oid, name, ...rest] = line.split(' ');
        if (!oid || !name)
            return null;
        const ref = { name, oid };
        rest.forEach(part => {
            if (part.startsWith('symref-target:')) {
                ref.symref = part.split(':')[1];
            }
        });
        return ref;
    }
    async *sendLsRefsCommand(repoUrl) {
        const capabilities = await this.getServerCapabilities(repoUrl);
        const url = new URL(repoUrl);
        url.pathname = `${url.pathname}/git-upload-pack`;
        const response = await this.sendRequest(url.toString(), {
            method: 'POST',
            contentType: 'application/x-git-upload-pack-request',
            body: this.createLsRefsRequest(capabilities)
        });
        const reader = response.body
            .pipeThrough(new TextDecoderStream())
            .getReader();
        const packetParser = new GitPacketParser();
        for await (const line of packetParser.parse(reader)) {
            if (line.content.startsWith('ERR ')) {
                throw new Error(`Server error: ${line.content.slice(4)}`);
            }
            const ref = GitRemoteRefs.parseRef(line.content);
            if (ref)
                yield ref;
        }
    }
    async *lsRefs(repoUrl) {
        yield* this.sendLsRefsCommand(repoUrl);
    }
    static compareRefs(refsA, refsB) {
        const refMapA = new Map(refsA.map(ref => [ref.name, ref]));
        const refMapB = new Map(refsB.map(ref => [ref.name, ref]));
        const inSyncRefs = [];
        const outOfSyncRefs = [];
        const missingRefs = [];
        for (const [name, refA] of refMapA) {
            const refB = refMapB.get(name);
            if (refB) {
                if (refA.oid === refB.oid) {
                    inSyncRefs.push(refA);
                }
                else {
                    outOfSyncRefs.push({ ref: refA, otherOid: refB.oid });
                }
                refMapB.delete(name);
            }
            else {
                missingRefs.push({ repo: 'B', ref: refA });
            }
        }
        for (const refB of refMapB.values()) {
            missingRefs.push({ repo: 'A', ref: refB });
        }
        const inSync = outOfSyncRefs.length === 0 && missingRefs.length === 0;
        return { inSync, inSyncRefs, outOfSyncRefs, missingRefs };
    }
    async compare(repoUrlA, repoUrlB) {
        const refsA = [];
        const refsB = [];
        for await (const ref of this.lsRefs(repoUrlA)) {
            refsA.push(ref);
        }
        for await (const ref of this.lsRefs(repoUrlB)) {
            refsB.push(ref);
        }
        const comparison = GitRemoteRefs.compareRefs(refsA, refsB);
        return comparison.inSync ? null : comparison;
    }
}
exports.GitRemoteRefs = GitRemoteRefs;
//# sourceMappingURL=git-remote-refs.js.map