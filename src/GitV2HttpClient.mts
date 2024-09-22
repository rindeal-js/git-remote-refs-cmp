import { url } from 'inspector'
import {
    FetchError,
    FetchErrorCode,
} from './Errors/FetchError.mjs'
import {
    GitDaemonError,
} from './Errors/GitDaemonError.mjs'
import {
    GitPktLine
} from './GitPktLine.mjs'
import {
    GitPktLineDecoderStream,
} from './GitPktLineDecoder.mjs'
import {
    GitPktLineReader,
} from './GitPktLineReader.mjs'
import {
    AbstractGitRemoteRefsFetcher,
} from './GitRemoteRefsFetcher.mjs'
import {
    HttpFetcher,
    BasicHttpFetcher,
} from './HttpFetcher.mjs'
import {
    UserAgent,
    Milliseconds,
} from './Types.mjs'


type GitV2HttpClientInit = {
    userAgent?: UserAgent
    timeout?: Milliseconds
    fetcher?: HttpFetcher
}

type ServerCapability = {
    key: string
    values: string[]
}

type FetchResponseFull = {
    -readonly [K in keyof Pick<Response, 'headers' | 'ok' | 'redirected' | 'status' | 'statusText' | 'type' | 'url'>]: Response[K]
}
type FetchResponseOutput = Partial<FetchResponseFull>

class GitV2HttpClient {
    public static GIT_PROTOCOL_VERSION = 2
    public readonly userAgent: UserAgent
    public readonly timeout: Milliseconds
    private readonly fetcher: HttpFetcher

    public constructor(options: GitV2HttpClientInit = {}) {
        this.userAgent = options.userAgent || AbstractGitRemoteRefsFetcher.USER_AGENT
        this.timeout = options.timeout || 5000
        this.fetcher = options.fetcher ?? new BasicHttpFetcher()
    }

    public async *fetchServerCaps(input: Request): AsyncGenerator<ServerCapability, void, unknown> {
        const url = new URL(input.url)
        url.pathname = `${url.pathname}/info/refs`
        url.search = '?service=git-upload-pack'

        const response: FetchResponseOutput = {}
        const pktLineReader = await this.fetchPktLines(new Request(url, input), response)

        const contentType = response.headers?.get('Content-Type')
        if ( contentType !== 'application/x-git-upload-pack-advertisement' ) {
            // TODO redirect to protocol v0 instead of error
            throw new Error(`Invalid git-upload-pack-advertisement content-type: ${contentType}`)
        }

        // parse service announcement (if any)
        const firstPktLine = await pktLineReader.peek()
        if ( ! firstPktLine ) {
            throw new Error('Unexpected end of stream when peeking first packet')
        } else if ( firstPktLine.content === '# service=git-upload-pack' ) {
            await pktLineReader.next() // Consume the peeked packet
            const flushPktItRes = await pktLineReader.next()
            if ( flushPktItRes.done ) {
                throw new Error(`Invalid service announcement packet: missing flush`)
            }
            if ( ! flushPktItRes.value.equals(GitPktLine.FLUSH) ) {
                throw new Error(`Invalid service announcement packet: expected flush, received: \`${flushPktItRes.value.rawLine}\``)
            }
        }

        // Parse version
        const versionPktItRes = await pktLineReader.next()
        if ( versionPktItRes.done || versionPktItRes.value.content !== `version ${GitV2HttpClient.GIT_PROTOCOL_VERSION}` ) {
            throw new Error(
                `Invalid/unsupported version line in capabilities packet` +
                (versionPktItRes.done ? '' : `: \`${versionPktItRes.value.rawLine}\``)
            )
        }

        const keyRegex = /^[A-Za-z0-9-_]+$/
        const valueRegex = /^[A-Za-z0-9 \-_.?,\\/{}[\]()<>!@#$%^&*+=:;]+$/

        for await (const pktLine of pktLineReader) {
            if ( pktLine.equals(GitPktLine.FLUSH) )
                break

            const [ key, value ] = pktLine.content.split('=', 2)

            if ( key && keyRegex.test(key) && ( ! value || valueRegex.test(value) ) ) {
                const cap: ServerCapability = {
                    key,
                    values: value?.split(/\s+/) || [],
                }
                yield cap
            } else {
                console.debug()
            }
        }
    }
    // Pick<Response, 'headers' | 'ok' | 'redirected' | 'status' | 'statusText' | 'type' | 'url'>
    public async fetchPktLines(input: Request, output?: Partial<FetchResponseOutput>): Promise<GitPktLineReader> {
        input.headers.set('Git-Protocol', `version=${GitV2HttpClient.GIT_PROTOCOL_VERSION}`)
        input.headers.set('Cache-Control', 'no-cache, no-store, max-age=0')
        if ( ! input.headers.has('User-Agent') ) {
            input.headers.set('User-Agent', this.userAgent)
        }
        const request = new Request(input, {
            referrerPolicy: 'no-referrer',
            mode: 'cors',
            signal: input.signal ?? AbortSignal.timeout(this.timeout),
        })

        // console.log({sendV2Request: request})
        let response: Response
        try {
            response = await this.fetcher.fetch(request)
        } catch(e: unknown) {
            const error = e as Error
            if ( error.name === 'AbortError' ) {
                throw FetchError.from(error, {request, code: FetchErrorCode.Timeout})
            }
            throw FetchError.from(error, {request, code: FetchErrorCode.Network})
        }
        if ( ! response.ok ) {
            if ( response.status === 400 ) {
                throw new FetchError(
                    `Bad Request: ${response.statusText}`,
                    { request, response, code: FetchErrorCode.BadRequest },
                )
            }
            throw new FetchError(
                `Request failed with status ${response.status}: ${response.statusText}`,
                { request, response, code: FetchErrorCode.BadResponse },
            )
        }

        if ( output ) {
            this.copyResponseAttributes(response, output)
        }

        const pktLineStream = response.body!
            .pipeThrough(new TextDecoderStream())
            .pipeThrough(new GitPktLineDecoderStream())
        const pktLineReader = new GitPktLineReader(pktLineStream)

        const firstPktLine = await pktLineReader.peek()
        if ( ! firstPktLine ) {
            throw new FetchError(
                `Unexpected end of stream when reading the first packet`,
                { request, response, code: FetchErrorCode.BadResponse },
            )
        }
        if (
            firstPktLine.rawLength > GitPktLine.HEX_LENGTH &&
            firstPktLine.content.startsWith(AbstractGitRemoteRefsFetcher.ERROR_PREFIX)
        ) {
            throw new GitDaemonError(firstPktLine.content.slice(AbstractGitRemoteRefsFetcher.ERROR_PREFIX.length))
        }

        return pktLineReader
    }

    private copyResponseAttributes(response: Response, output: FetchResponseOutput) {
        const copy: FetchResponseFull = {
            headers: response.headers,
            ok: response.ok,
            redirected: response.redirected,
            status: response.status,
            statusText: response.statusText,
            type: response.type,
            url: response.url,
        }
        Object.assign(output, copy)
        }
}


export {
    GitV2HttpClient,
}