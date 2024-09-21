import {
    BufferedAsyncIterator,
} from './BufferedAsyncIterator.mjs'
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
    GitPktLineIterator,
} from './GitPktLineIterator.mjs'
import {
    GitV2HttpClient,
} from './GitV2HttpClient.mjs'
import {
    GitRemoteRefsFetcher,
} from './GitRemoteRefsFetcher.mjs'
import {
    GitRef,
    Hostname,
    Oid,
    RefName,
    UserAgent,
} from './Types.mjs'


type GitV2SmartHttpRefsFetcherInit = {
    userAgent?: UserAgent
    client?: GitV2HttpClient
}

class GitV2SmartHttpRefsFetcher extends GitRemoteRefsFetcher {
    private capabilitiesCache: Map<Hostname, ServerCapabilities> = new Map()
    userAgentPktLine: GitPktLine
    client: GitV2HttpClient

    constructor(options: GitV2SmartHttpRefsFetcherInit = {}) {
        super()
        this.client = options.client ?? new GitV2HttpClient()
        const userAgent: string = options.userAgent || 'TODO'
        this.userAgentPktLine = new GitPktLine({content: `agent=${userAgent}`, precompile: true})
    }

    private getLsRefsRequestBodyStream(capabilities: ServerCapabilities): ReadableStream {
        const packetLines: GitPktLine[] = []

        /// Command
        packetLines.push(GitPktLine.COMMAND_LS_REFS)

        /// Capability List
        packetLines.push(this.userAgentPktLine)

        if (capabilities['object-format']?.length) {
            if ( capabilities['object-format'].length > 1 ) {
                throw new Error("Multiple object formats are not supported.")
            }
            if ( capabilities['object-format'][0] !== 'sha1' ) {
                throw new Error("Unsupported object format. Only 'sha1' is supported.")
            }
            packetLines.push(GitPktLine.OBJECT_FORMAT_SHA1)
        }

        /// Packet Delimiter
        packetLines.push(GitPktLine.DELIM)

        /// Command args
        if ( capabilities['ls-refs'].includes('unborn') ) {
            packetLines.push(GitPktLine.UNBORN)
        } else {
            // server will send just a single flush packet line and end the transmission
        }

        packetLines.push(GitPktLine.SYMREFS)
        packetLines.push(GitPktLine.PEEL)

        /// Packet Flush
        packetLines.push(GitPktLine.FLUSH)

        return new ReadableStream<string>({
            start(controller) {
                for ( const line of packetLines ) {
                    controller.enqueue(line.rawLine)
                }
                controller.close()
            }
        })
    }

    async *fetchRefs(repoUrl: string | URL): AsyncGenerator<GitRef, void, unknown> {
        const serverCaps = await this.getServerCapabilities(repoUrl)

        if ( ! serverCaps['ls-refs'] ) {
            throw new Error('Server does not support ls-refs command')
        }

        const url = new URL(repoUrl)
        url.pathname = `${url.pathname}/git-upload-pack`

        const pktLineReader = await this.client.fetchPktLines(new Request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-git-upload-pack-request',
            },
            body: this.getLsRefsRequestBodyStream(serverCaps),
        }))

        for await (const pktLine of pktLineReader) {
            const ref = this.parseRef(pktLine.content)
            if ( ref )
                yield ref
        }
    }

    private parseRef(line: string): GitRef | null {
        const [ oid, name, ...rest ] = line.split(' ')
        if ( ! oid || ! name ) return null

        const ref: GitRef = { name }
        if ( oid === 'unborn' ) {
            ref.unborn = true
        } else {
            ref.oid = oid
        }
        for ( const part of rest ) {
            const [ refAttr, value ] = part.split(':', 2)
            switch ( refAttr ) {
                case 'symref-target':
                    ref.symref = value as RefName
                    break
                case 'peeled':
                    ref.peeled = value as Oid
                    break
                default:
                    console.debug(`Unknown`, { refAttr })
            }
        }

        return ref
    }
}


export {
    GitV2SmartHttpRefsFetcher,
}