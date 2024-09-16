// Type definitions
type Hex = string
type Hostname = string
type RefName = string

type GitRef = {
  name: RefName
  oid: Hex
  symref?: RefName
  peeled?: Hex
}

type RefsMap = Map<RefName, GitRef>

type ServerCapabilities = {
  [key: string]: string[]
}

type FetchOptions = {
  gitProtocolVersion?: 0 | 1 | 2
}

type CompareOptions = {
  excludePatterns?: RegExp[]
}

// Error class
class HttpError extends Error {
  status: number
  statusText: string
  headers: Headers
  content: string

  constructor(response: Response) {
    super(`HTTP error! status: ${response.status} ${response.statusText}`)
    this.status = response.status
    this.statusText = response.statusText
    this.headers = response.headers
    this.content = ''
  }

  public async initContent(response: Response) {
    try {
      const contentType = response.headers.get('Content-Type')
      this.content = contentType?.includes('application/json')
        ? await response.json() as string
        : await response.text()
    } catch {
      this.content = ''
    }
  }
}

// GitPacketLine class
class GitPacketLine {
  static readonly HEX_LENGTH = 4
  static readonly FLUSH = new GitPacketLine({ rawLine: '0000', precompile: true })
  static readonly DELIM = new GitPacketLine({ rawLine: '0001', precompile: true })
  static readonly COMMAND_LS_REFS = new GitPacketLine({ content: 'command=ls-refs', precompile: true })
  static readonly UNBORN = new GitPacketLine({ content: 'unborn', precompile: true })
  static readonly PEEL = new GitPacketLine({ content: 'peel', precompile: true })
  static readonly SYMREFS = new GitPacketLine({ content: 'symrefs', precompile: true })

  private _content: string | null
  private _rawLine: string | null

  constructor(init: { content?: string, rawLine?: string, precompile?: boolean }) {
    if ( init.content == null && init.rawLine == null ) {
      throw new Error('Either content or line must be provided')
    }

    this._content = init.content ?? null
    this._rawLine = init.rawLine ?? null

    if ( init.precompile ) {
      if ( this._rawLine == null && this._content != null ) {
        this._rawLine = GitPacketLine.serialize(this._content)
      } else if ( this._content == null && this._rawLine != null ) {
        this._content = GitPacketLine.deserialize(this._rawLine)
      }
    }
  }

  get content(): string {
    if ( this._content == null ) {
      if ( this._rawLine == null ) throw new Error('Raw line is null')
      this._content = GitPacketLine.deserialize(this._rawLine)
    }
    return this._content
  }

  get rawLine(): string {
    if ( this._rawLine == null ) {
      if ( this._content == null ) throw new Error('Content is null')
      this._rawLine = GitPacketLine.serialize(this._content)
    }
    return this._rawLine
  }

  equals(other: GitPacketLine): boolean {
    return this.rawLine === other.rawLine
  }

  static serialize(content: string): string {
    const length = GitPacketLine.HEX_LENGTH + content.length + '\n'.length
    return `${length.toString(16).padStart(GitPacketLine.HEX_LENGTH, '0')}${content}\n`
  }

  static deserialize(rawLine: string): string {
    const length = parseInt(rawLine.slice(0, GitPacketLine.HEX_LENGTH), 16)
    return rawLine.slice(GitPacketLine.HEX_LENGTH, length - 1) // Remove trailing newline
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

// Abstract base class for GitRemoteRefsFetcher
abstract class GitRemoteRefsFetcher {
  protected static readonly USER_AGENT = 'GitRemoteRefs/1.0'
  /** @see: https://github.com/facsimiles/turnip/blob/497f8526b52d012684a2d81b03275f0b24096251/turnip/pack/git.py#L35  */
  protected static readonly ERROR_PREFIX = 'ERR '

  abstract fetchRefs(repoUrl: string | URL, options: FetchOptions): AsyncGenerator<GitRef, void, unknown>
}

// Renamed to GitSmartHttpRefsFetcher
class GitSmartHttpRefsFetcher extends GitRemoteRefsFetcher {
  private capabilitiesCache: Map<Hostname, ServerCapabilities> = new Map()

  private async sendRequest(url: string, options: FetchOptions & { method?: string, contentType?: string, body?: string } = {}): Promise<GitPacketLineIterator> {
    const headers = {
      'Git-Protocol': `version=${options.gitProtocolVersion ?? 2}`,
      'User-Agent': GitRemoteRefsFetcher.USER_AGENT,
      'Cache-Control': 'no-cache, no-store, max-age=0',
      ...(options.contentType && { 'Content-Type': options.contentType })
    }

    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: headers,
      body: options.body ?? null,
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
    if ( firstPktLine.content.startsWith(GitRemoteRefsFetcher.ERROR_PREFIX)) {
      throw new Error(`Server daemon error: \`${firstPktLine.content.slice(GitRemoteRefsFetcher.ERROR_PREFIX.length)}\``)
    }

    return packetIterator
  }

  private async fetchServerCapabilities(repoUrl: string | URL, options: FetchOptions): Promise<ServerCapabilities> {
    const gitProtocolVersion = 2

    const url = new URL(repoUrl)
    url.pathname = `${url.pathname}/info/refs`
    url.search = '?service=git-upload-pack'
    const lineIter = await this.sendRequest(url.toString(), { ...options, method: 'GET', gitProtocolVersion })

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

    for await (const line of packetIterator) {
      if (line.equals(GitPacketLine.FLUSH)) break

      const [key, value] = line.content.split('=', 2)
      capabilities[key] = value?.split(/\s+/) || []
    }

    return capabilities
  }

  private async getServerCapabilities(repoUrl: string | URL, options: FetchOptions): Promise<ServerCapabilities> {
    const hostname = new URL(repoUrl).hostname as Hostname
    if ( ! this.capabilitiesCache.has(hostname) ) {
      const capabilities = await this.fetchServerCapabilities(repoUrl, options)
      this.capabilitiesCache.set(hostname, capabilities)
    }
    return this.capabilitiesCache.get(hostname)!
  }

  async *fetchRefs(repoUrl: string | URL, options: FetchOptions): AsyncGenerator<GitRef, void, unknown> {
    const url = new URL(repoUrl)
    const capabilities = await this.getServerCapabilities(url, options)
    url.pathname = `${url.pathname}/git-upload-pack`

    if ( !capabilities['ls-refs'] ) {
      throw new Error('Server does not support ls-refs command')
    }

    const packetLines: GitPacketLine[] = [
      GitPacketLine.COMMAND_LS_REFS,
      new GitPacketLine({content: `agent=${GitRemoteRefsFetcher.USER_AGENT}`}),
    ]

    if ( capabilities['object-format'] ) {
      packetLines.push(new GitPacketLine({content: `object-format=${capabilities['object-format'][0]}`}))
    }

    packetLines.push(GitPacketLine.DELIM)

    if ( capabilities['ls-refs'].includes('unborn') ) {
      packetLines.push(GitPacketLine.UNBORN)
    }

    packetLines.push(GitPacketLine.FLUSH)

    const requestBody = packetLines.map(line => line.rawLine).join('')

    const lineIter = await this.sendRequest(url.toString(), {
      method: 'POST',
      contentType: 'application/x-git-upload-pack-request',
      body: requestBody,
      ...options
    })

    for await (const line of lineIter) {
      const ref = this.parseRef(line.content)
      if ( ref ) yield ref
    }
  }

  private parseRef(line: string): GitRef | null {
    const [oid, name, ...rest] = line.split(' ')
    if ( !oid || !name ) return null

    const ref: GitRef = { name, oid }
    rest.forEach(part => {
      if ( part.startsWith('symref-target:') ) {
        ref.symref = part.split(':')[1] as RefName
      } else if ( part.startsWith('peeled:') ) {
        ref.peeled = part.split(':')[1] as Hex
      }
    })

    return ref
  }
}

// Function to create RefsMap
async function createRefsMap(refGenerator: AsyncGenerator<GitRef, void, unknown>): Promise<RefsMap> {
  const refsMap: RefsMap = new Map()
  for await (const ref of refGenerator) {
    refsMap.set(ref.name, ref)
  }
  return refsMap
}

// GitRefDiff and ComparisonResult types (unchanged)
type GitRefDiff = {
  name: RefName
  base: GitRef
  updated: GitRef
}

type ComparisonResult = {
  diffFound: boolean
  unchanged: GitRef[]
  changed: GitRefDiff[]
  added: GitRef[]
  removed: GitRef[]
}

// Redesigned GitRemoteRefsComparer class with improved efficiency
class GitRemoteRefsComparer {
  static compare(baseRefs: RefsMap, updatedRefs: RefsMap, options: CompareOptions = {}): ComparisonResult {
    const { excludePatterns = [] } = options
    const isRefNameExcluded = (name: string): boolean => excludePatterns.some(pattern => pattern.test(name))

    const unchanged: GitRef[] = []
    const changed: GitRefDiff[] = []
    const added: GitRef[] = []
    const removed: GitRef[] = []

    for ( const [name, baseRef] of baseRefs ) {
      if ( isRefNameExcluded(name) ) {
        continue
      }

      const updatedRef = updatedRefs.get(name)
      if ( updatedRef ) {
        if ( baseRef.oid === updatedRef.oid ) {
          unchanged.push(baseRef)
        } else {
          changed.push({ name, base: baseRef, updated: updatedRef })
        }
      } else {
        removed.push(baseRef)
      }
    }

    for ( const [name, updatedRef] of updatedRefs ) {
      if ( ! baseRefs.has(name) && ! isRefNameExcluded(name) ) {
        added.push(updatedRef)
      }
    }

    const diffFound = !! ( changed.length || added.length || removed.length )

    return { diffFound, unchanged, changed, added, removed }
  }
}

export { 
  GitRemoteRefsFetcher as AbstractGitRemoteRefsFetcher,
  GitSmartHttpRefsFetcher,
  createRefsMap,
  GitRemoteRefsComparer,
  GitRef,
  RefsMap,
  ComparisonResult,
  GitRefDiff,
  FetchOptions,
  CompareOptions,
  RefName,
  Hex
}