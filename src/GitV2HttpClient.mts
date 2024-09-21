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

class GitV2HttpClient {
    public readonly userAgent: UserAgent
    public readonly timeout: Milliseconds
    private readonly fetcher: HttpFetcher
    
    public constructor(options?: GitV2HttpClientInit) {
        this.userAgent = options?.userAgent || AbstractGitRemoteRefsFetcher.USER_AGENT
        this.timeout = options?.timeout || 5000
        this.fetcher = options?.fetcher ?? new BasicHttpFetcher()
    }

    public async fetchPktLines(input: Request): Promise<GitPktLineReader> {
        input.headers.set('Git-Protocol', 'version=2')
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
}


export {
    GitV2HttpClient,
}