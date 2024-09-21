import {
    BufferedAsyncIterator
} from './BufferedAsyncIterator.mjs'
import {
    GitPktLine,
} from './GitPktLine.mjs'


class GitPktLineReader extends BufferedAsyncIterator<GitPktLine> implements ReadableStreamDefaultReader {
    private reader: ReadableStreamDefaultReader<GitPktLine>

    constructor(stream: ReadableStream<GitPktLine>) {
        super({
            next: async (): Promise<IteratorResult<GitPktLine>> => {
                const { done, value } = await this.reader.read()
                return done
                    ? { done: true,  value: undefined }
                    : { done: false, value }
            }
        })
        this.reader = stream.getReader()
    }

    async cancel(reason?: unknown): Promise<void> {
        return this.reader.cancel(reason)
    }

    read(): Promise<ReadableStreamReadResult<GitPktLine>> {
        return this.reader.read()
    }

    releaseLock(): void {
        this.reader.releaseLock()
    }

    get closed(): Promise<undefined> {
        return this.reader.closed
    }

    toStream(): ReadableStream<GitPktLine> {
        const reader = this.reader
        return new ReadableStream<GitPktLine>({
            async pull(controller) {
                const { done, value } = await reader.read()
                if (done) {
                    controller.close()
                } else {
                    controller.enqueue(value)
                }
            },
            cancel(reason) {
                reader.cancel(reason)
            }
        })
    }
}


export {
    GitPktLineReader,
}