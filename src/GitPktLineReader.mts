import {
    BufferedAsyncIterator
} from './BufferedAsyncIterator.mjs'
import {
    GitPktLine,
} from './GitPktLine.mjs'


class GitPktLineReader extends BufferedAsyncIterator<GitPktLine> implements ReadableStreamDefaultReader {
    private reader: ReadableStreamDefaultReader<GitPktLine>

    constructor(stream: ReadableStream<GitPktLine>) {
        const reader = stream.getReader()
        super(new StreamReaderAsyncIterator(reader))
        this.reader = reader
    }

    cancel(reason?: unknown): Promise<void> {
        this.clearBuffer()
        this.done = true
        return this.reader.cancel(reason)
    }

    read(): Promise<ReadableStreamReadResult<GitPktLine>> {
        return this.next().then(processReadOrNextResult)
    }
    
    releaseLock(): void {
        this.reader.releaseLock()
    }

    get closed(): Promise<undefined> {
        return this.reader.closed
    }

    toStream(): ReadableStream<GitPktLine> {
        return new ReadableStream(new StreamReaderSource(this))
    }
}

function processReadOrNextResult<T>(
    { done, value }: ReadableStreamReadResult<T> | IteratorResult<T, undefined>
): { done: true; value: undefined } | { done: false, value: T } {
    return done
        ? { done: true, value: undefined }
        : { done: false, value }
}

class StreamReaderAsyncIterator<T> implements AsyncIterator<T> {
    constructor(private readonly reader: ReadableStreamDefaultReader<T>) {}

    next(): Promise<IteratorResult<T>> {
        return this.reader.read().then(processReadOrNextResult)
    }    
}

class StreamReaderSource<T> implements UnderlyingDefaultSource<T> {
    constructor(private readonly reader: ReadableStreamDefaultReader<T>) {}

    async pull(controller: ReadableStreamDefaultController<T>) {
        const { done, value } = await this.reader.read()
        if ( done ) {
            controller.close()
        } else {
            controller.enqueue(value)
        }
    }

    cancel(reason?: unknown) {
        this.reader.cancel(reason)
    }
}

export {
    GitPktLineReader,
}
