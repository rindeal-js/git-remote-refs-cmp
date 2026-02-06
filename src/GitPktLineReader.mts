import {
  BufferedAsyncIterator,
} from './BufferedAsyncIterator.mjs'
import {
  GitPktLine,
} from './GitPktLine.mjs'

/**
 * A peekable, buffered reader over a ReadableStream<GitPktLine>.
 *
 * - Exposes the Web Streams ReadableStreamDefaultReader API (read/cancel/releaseLock/closed).
 * - Exposes AsyncIterator/AsyncIterable via BufferedAsyncIterator (next/peek/for-await-of).
 * - Single logical consumer: do not call read()/next()/peek() concurrently.
 */
class GitPktLineReader
  extends BufferedAsyncIterator<GitPktLine, undefined, unknown>
  implements ReadableStreamDefaultReader<GitPktLine>
{
  private readonly reader: ReadableStreamDefaultReader<GitPktLine>

  public constructor(stream: ReadableStream<GitPktLine>) {
    const reader = stream.getReader()
    super(new StreamReaderAsyncIterator(reader))
    this.reader = reader
  }

  /**
   * Web Streams: cancel the underlying reader and clear any buffered values.
   */
  public async cancel(reason?: unknown): Promise<void> {
    this.done = true
    this.clearBuffer()
    try {
      await this.reader.cancel(reason)
    } finally {
      // After cancel, the reader is effectively closed; we keep the lock
      // semantics consistent with the underlying reader.
    }
  }

  /**
   * Web Streams: read the next value, delegating to BufferedAsyncIterator.next().
   *
   * This preserves the ReadableStreamDefaultReader contract while still
   * benefiting from buffering/peeking.
   */
  public read(): Promise<ReadableStreamReadResult<GitPktLine>> {
    return this.next().then(processReadOrNextResult)
  }

  /**
   * Web Streams: release the lock on the underlying reader.
   *
   * Note: after releasing the lock, further use of this GitPktLineReader
   * (read/next/peek) is undefined and should be avoided.
   */
  public releaseLock(): void {
    this.reader.releaseLock()
  }

  /**
   * Web Streams: a promise that fulfills when the stream becomes closed.
   */
  public get closed(): Promise<void> {
    return this.reader.closed
  }

  /**
   * Re-expose this reader as a ReadableStream<GitPktLine>.
   *
   * Useful when you want to use peek()/next() sometimes, but still hand
   * a stream to other APIs.
   */
  public toStream(): ReadableStream<GitPktLine> {
    return new ReadableStream<GitPktLine>(new StreamReaderSource(this))
  }
}

/**
 * Normalize IteratorResult<T> and ReadableStreamReadResult<T> into
 * a ReadableStreamReadResult<T> shape.
 */
function processReadOrNextResult<T>(
  { done, value }: ReadableStreamReadResult<T> | IteratorResult<T, undefined>,
): ReadableStreamReadResult<T> {
  if (done) {
    return { done: true, value: undefined as unknown as T }
  }
  return { done: false, value: value as T }
}

/**
 * Wrap a ReadableStreamDefaultReader<T> as an AsyncIterator<T>.
 *
 * This is the bridge that lets BufferedAsyncIterator sit on top of a
 * Web Streams reader.
 */
class StreamReaderAsyncIterator<T> implements AsyncIterator<T, undefined, unknown> {
  public constructor(
    private readonly reader: ReadableStreamDefaultReader<T>,
  ) {}

  public next(): Promise<IteratorResult<T, undefined>> {
    return this.reader.read().then(processReadOrNextResult)
  }

  public async return(
    value?: undefined,
  ): Promise<IteratorResult<T, undefined>> {
    try {
      await this.reader.cancel()
    } catch {
      // Ignore cancellation errors; iterator contract only requires completion.
    }
    return { value: value as undefined, done: true }
  }

  public async throw(e?: unknown): Promise<IteratorResult<T, undefined>> {
    // Web Streams readers do not have a throw() method; propagate the error.
    throw e
  }
}

/**
 * Underlying source that pulls from a ReadableStreamDefaultReader<T>.
 *
 * Used by GitPktLineReader.toStream() to re-expose the reader as a stream.
 */
class StreamReaderSource<T> implements UnderlyingDefaultSource<T> {
  public constructor(
    private readonly reader: ReadableStreamDefaultReader<T>,
  ) {}

  public async pull(controller: ReadableStreamDefaultController<T>): Promise<void> {
    const { done, value } = await this.reader.read()
    if (done) {
      controller.close()
      return
    }
    controller.enqueue(value as T)
  }

  public async cancel(reason?: unknown): Promise<void> {
    try {
      await this.reader.cancel(reason)
    } catch {
      // Swallow cancellation errors; stream is being torn down anyway.
    }
  }
}

export {
  GitPktLineReader,
}
