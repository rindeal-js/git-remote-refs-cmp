"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitSmartHttpRefsFetcher = exports.AbstractGitRemoteRefsFetcher = void 0;
exports.createRefsMap = createRefsMap;
exports.gitRemoteRefsDiff = gitRemoteRefsDiff;
// Error class
class HttpError extends Error {
    status;
    statusText;
    headers;
    content;
    constructor(response) {
        super(`HTTP error! status: ${response.status} ${response.statusText}`);
        this.status = response.status;
        this.statusText = response.statusText;
        this.headers = response.headers;
        this.content = '';
    }
    async initContent(response) {
        try {
            const contentType = response.headers.get('Content-Type');
            this.content = contentType?.includes('application/json')
                ? await response.json()
                : await response.text();
        }
        catch {
            this.content = '';
        }
    }
}
// GitPacketLine class
class GitPacketLine {
    static HEX_LENGTH = 4;
    static FLUSH = new GitPacketLine({ rawLine: '0000', precompile: true });
    static DELIM = new GitPacketLine({ rawLine: '0001', precompile: true });
    static COMMAND_LS_REFS = new GitPacketLine({ content: 'command=ls-refs', precompile: true });
    static UNBORN = new GitPacketLine({ content: 'unborn', precompile: true });
    static PEEL = new GitPacketLine({ content: 'peel', precompile: true });
    static SYMREFS = new GitPacketLine({ content: 'symrefs', precompile: true });
    _content;
    _rawLine;
    constructor(init) {
        if (init.content == null && init.rawLine == null) {
            throw new Error('Either content or line must be provided');
        }
        this._content = init.content ?? null;
        this._rawLine = init.rawLine ?? null;
        if (init.precompile) {
            if (this._rawLine == null && this._content != null) {
                this._rawLine = GitPacketLine.serialize(this._content);
            }
            else if (this._content == null && this._rawLine != null) {
                this._content = GitPacketLine.deserialize(this._rawLine);
            }
        }
    }
    get content() {
        if (this._content == null) {
            if (this._rawLine == null)
                throw new Error('Raw line is null');
            this._content = GitPacketLine.deserialize(this._rawLine);
        }
        return this._content;
    }
    get rawLine() {
        if (this._rawLine == null) {
            if (this._content == null)
                throw new Error('Content is null');
            this._rawLine = GitPacketLine.serialize(this._content);
        }
        return this._rawLine;
    }
    equals(other) {
        return this.rawLine === other.rawLine;
    }
    static serialize(content) {
        const length = GitPacketLine.HEX_LENGTH + content.length + '\n'.length;
        return `${length.toString(16).padStart(GitPacketLine.HEX_LENGTH, '0')}${content}\n`;
    }
    static deserialize(rawLine) {
        const length = parseInt(rawLine.slice(0, GitPacketLine.HEX_LENGTH), 16);
        return rawLine.slice(GitPacketLine.HEX_LENGTH, length - 1); // Remove trailing newline
    }
}
class BufferedAsyncIterator {
    iterator;
    buffer = [];
    done = false;
    constructor(iterator) {
        this.iterator = iterator;
    }
    async next() {
        if (this.buffer.length) {
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
            // console.log({rawLine: this.buffer.slice(0, packetLength)})
            const end = this.buffer.charAt(packetLength - 1) === '\n' ? packetLength - 1 : packetLength;
            yield new GitPacketLine({
                content: this.buffer.slice(GitPacketLine.HEX_LENGTH, end),
                rawLine: this.buffer.slice(0, packetLength),
            });
            this.buffer = this.buffer.slice(packetLength);
        }
    }
}
// Abstract base class for GitRemoteRefsFetcher
class GitRemoteRefsFetcher {
    static USER_AGENT = 'GitRemoteRefs/1.0';
    /** @see: https://github.com/facsimiles/turnip/blob/497f8526b52d012684a2d81b03275f0b24096251/turnip/pack/git.py#L35  */
    static ERROR_PREFIX = 'ERR ';
    async fetchRefsAsMap(repoUrl, options = {}) {
        const refsMap = new Map();
        for await (const ref of this.fetchRefs(repoUrl, options)) {
            refsMap.set(ref.name, ref);
        }
        return refsMap;
    }
    async multiFetchRefsAsMap(requests) {
        return Promise.all(requests.map(({ url, options }) => this.fetchRefsAsMap(url, options ?? {})));
    }
}
exports.AbstractGitRemoteRefsFetcher = GitRemoteRefsFetcher;
// Renamed to GitSmartHttpRefsFetcher
class GitSmartHttpRefsFetcher extends GitRemoteRefsFetcher {
    capabilitiesCache = new Map();
    async sendRequest(url, options = {}) {
        // console.log({sendRequest: url})
        const headers = {
            'Git-Protocol': `version=${options.gitProtocolVersion ?? 2}`,
            'User-Agent': GitRemoteRefsFetcher.USER_AGENT,
            'Cache-Control': 'no-cache, no-store, max-age=0',
            ...(options.contentType && { 'Content-Type': options.contentType })
        };
        const response = await fetch(url, {
            method: options.method ?? 'GET',
            headers: headers,
            body: options.body ?? null,
            referrerPolicy: 'no-referrer',
            mode: 'cors',
        });
        if (!response.ok) {
            const error = new HttpError(response);
            await error.initContent(response);
            throw error;
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
        if (firstPktLine.content.startsWith(GitRemoteRefsFetcher.ERROR_PREFIX)) {
            throw new Error(`Server daemon error: \`${firstPktLine.content.slice(GitRemoteRefsFetcher.ERROR_PREFIX.length)}\``);
        }
        return packetIterator;
    }
    async fetchServerCapabilities(repoUrl, options = {}) {
        const gitProtocolVersion = 2;
        const url = new URL(repoUrl);
        url.pathname = `${url.pathname}/info/refs`;
        url.search = '?service=git-upload-pack';
        const lineIt = await this.sendRequest(url.toString(), { ...options, method: 'GET', gitProtocolVersion });
        // parse service announcement (if any)
        const firstPacket = await lineIt.peek();
        if (!firstPacket) {
            throw new Error('Unexpected end of stream when peeking first packet');
        }
        else if (firstPacket.content === '# service=git-upload-pack') {
            await lineIt.next(); // Consume the peeked packet
            const flushPktItResult = await lineIt.next();
            if (flushPktItResult.done || !flushPktItResult.value.equals(GitPacketLine.FLUSH)) {
                throw new Error(`Invalid service announcement packet: missing flush` +
                    (flushPktItResult.done ? '' : `, instead received: \`${flushPktItResult.value.rawLine}\``));
            }
        }
        // Parse version
        const versionPacketItRes = await lineIt.next();
        if (versionPacketItRes.done || versionPacketItRes.value.content !== `version ${gitProtocolVersion}`) {
            throw new Error(`Invalid/unsupported version line in capabilities packet` +
                (versionPacketItRes.done ? '' : `: \`${versionPacketItRes.value.rawLine}\``));
        }
        const capabilities = {};
        for await (const line of lineIt) {
            if (line.equals(GitPacketLine.FLUSH))
                break;
            const [key, value] = line.content.split('=', 2);
            capabilities[key] = value?.split(/\s+/) || [];
        }
        return capabilities;
    }
    async getServerCapabilities(repoUrl, options = {}) {
        const hostname = new URL(repoUrl).hostname;
        if (!this.capabilitiesCache.has(hostname)) {
            const capabilities = await this.fetchServerCapabilities(repoUrl, options);
            this.capabilitiesCache.set(hostname, capabilities);
        }
        return this.capabilitiesCache.get(hostname);
    }
    async *fetchRefs(repoUrl, options = {}) {
        const url = new URL(repoUrl);
        const capabilities = await this.getServerCapabilities(url, options);
        url.pathname = `${url.pathname}/git-upload-pack`;
        if (!capabilities['ls-refs']) {
            throw new Error('Server does not support ls-refs command');
        }
        const packetLines = [
            GitPacketLine.COMMAND_LS_REFS,
            new GitPacketLine({ content: `agent=${GitRemoteRefsFetcher.USER_AGENT}` }),
        ];
        if (capabilities['object-format']) {
            packetLines.push(new GitPacketLine({ content: `object-format=${capabilities['object-format'][0]}` }));
        }
        packetLines.push(GitPacketLine.DELIM);
        if (capabilities['ls-refs'].includes('unborn')) {
            packetLines.push(GitPacketLine.UNBORN);
        }
        packetLines.push(GitPacketLine.FLUSH);
        const requestBody = packetLines.map(line => line.rawLine).join('');
        const lineIt = await this.sendRequest(url.toString(), {
            method: 'POST',
            contentType: 'application/x-git-upload-pack-request',
            body: requestBody,
            ...options
        });
        for await (const line of lineIt) {
            const ref = this.parseRef(line.content);
            if (ref)
                yield ref;
        }
    }
    parseRef(line) {
        const [oid, name, ...rest] = line.split(' ');
        if (!oid || !name)
            return null;
        const ref = { name, oid };
        rest.forEach(part => {
            if (part.startsWith('symref-target:')) {
                ref.symref = part.split(':')[1];
            }
            else if (part.startsWith('peeled:')) {
                ref.peeled = part.split(':')[1];
            }
        });
        return ref;
    }
}
exports.GitSmartHttpRefsFetcher = GitSmartHttpRefsFetcher;
async function createRefsMap(refGenerator) {
    const refsMap = new Map();
    for await (const ref of refGenerator) {
        refsMap.set(ref.name, ref);
    }
    return refsMap;
}
function gitRemoteRefsDiff(baseRefs, otherRefs, options = {}) {
    const { excludes: excludePatterns = [] } = options;
    const isRefNameExcluded = (name) => excludePatterns.some(pattern => pattern.test(name));
    const unchanged = [];
    const changed = [];
    const added = [];
    const removed = [];
    for (const [name, baseRef] of baseRefs) {
        if (isRefNameExcluded(name)) {
            continue;
        }
        const otherRef = otherRefs.get(name);
        if (otherRef) {
            if (baseRef.oid === otherRef.oid) {
                unchanged.push(baseRef);
            }
            else {
                changed.push({ name, base: baseRef, other: otherRef });
            }
        }
        else {
            removed.push(baseRef);
        }
    }
    for (const [name, otherRef] of otherRefs) {
        if (!baseRefs.has(name) && !isRefNameExcluded(name)) {
            added.push(otherRef);
        }
    }
    const diffFound = !!(changed.length || added.length || removed.length);
    return diffFound ? { unchanged, changed, added, removed } : null;
}
//# sourceMappingURL=git-remote-refs.js.map