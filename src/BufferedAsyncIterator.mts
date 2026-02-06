/**
 * A peekable, buffered async iterator wrapper.
 *
 * Semantics:
 * - Single logical consumer only: do not call next()/peek()/return()/throw() concurrently.
 * - Values are consumed from an internal buffer first, then from the underlying iterator.
 * - peek() returns the next value without consuming it.
 * - return()/throw() are forwarded to the underlying iterator when available.
 */
class BufferedAsyncIterator<T, TReturn = unknown, TNext = unknown>
  implements AsyncIterableIterator<T, TReturn, TNext>
{
  /** Internal buffer of values that have been "looked ahead" but not consumed. */
  protected buffer: T[] = []

  /** Whether the underlying iterator has completed. */
  protected done = false

  /**
   * The final result from the underlying iterator once it is done.
   * After completion, subsequent next() calls will return this.
   */
  protected finalResult: IteratorResult<T, TReturn> | null = null

  public constructor(
    private readonly iterator: AsyncIterator<T, TReturn, TNext>
  ) {}

  /**
   * Get the next value from the iterator, consuming from the buffer first.
   *
   * Note: This class assumes a single logical consumer. Do not call next()
   * concurrently; always await the previous call before issuing another.
   */
  public async next(
    ...args: [] | [TNext]
  ): Promise<IteratorResult<T, TReturn>> {
    // Serve from buffer if available.
    if (this.buffer.length > 0) {
      const value = this.buffer.shift() as T
      return { value, done: false }
    }

    // If we've already seen completion, return the cached final result.
    if (this.done) {
      if (this.finalResult) {
        return this.finalResult
      }
      // Fallback: fabricate a completed result if we somehow have no finalResult.
      return { value: undefined as unknown as TReturn, done: true }
    }

    // Delegate to the underlying iterator.
    const result = await this.iterator.next(...args)

    if (result.done) {
      this.done = true
      this.finalResult = result
    }

    return result
  }

  /**
   * Peek at the next value without consuming it.
   *
   * If the iterator is done, returns the same completed result as next().
   * Otherwise, the value is buffered and will be returned again by next().
   */
  public async peek(): Promise<IteratorResult<T, TReturn>> {
    // If we already have buffered values, just show the first one.
    if (this.buffer.length > 0) {
      return { value: this.buffer[0] as T, done: false }
    }

    // Otherwise, pull from next().
    const result = await this.next()

    if (result.done) {
      // Propagate completion as-is (including any non-undefined TReturn).
      return result
    }

    // Buffer the value so that the next next() call sees it again.
    this.buffer.unshift(result.value as T)
    return { value: result.value, done: false }
  }

  /**
   * Clear any buffered (peeked but not yet consumed) values.
   * Does not affect the underlying iterator state.
   */
  public clearBuffer(): void {
    this.buffer.length = 0
  }

  /**
   * Signal early completion to the iterator.
   *
   * Forwards to the underlying iterator.return() when available, ensuring
   * cleanup semantics are preserved. Also clears the buffer and marks this
   * wrapper as done.
   */
  public async return(
    value?: TReturn | PromiseLike<TReturn>
  ): Promise<IteratorResult<T, TReturn>> {
    this.done = true
    this.clearBuffer()

    const resolvedValue =
      value instanceof Promise ? await value : (value as TReturn | undefined)

    if (typeof this.iterator.return === 'function') {
      const result = await this.iterator.return(resolvedValue as TReturn)
      this.finalResult = result
      return result
    }

    const fabricated: IteratorResult<T, TReturn> = {
      value: (resolvedValue ?? (undefined as unknown as TReturn)) as TReturn,
      done: true,
    }
    this.finalResult = fabricated
    return fabricated
  }

  /**
   * Propagate an error into the iterator.
   *
   * Forwards to the underlying iterator.throw() when available. Also clears
   * the buffer and marks this wrapper as done.
   */
  public async throw(
    e?: unknown
  ): Promise<IteratorResult<T, TReturn>> {
    this.done = true
    this.clearBuffer()

    if (typeof this.iterator.throw === 'function') {
      return this.iterator.throw(e)
    }

    // If the underlying iterator does not support throw, rethrow the error.
    throw e
  }

  /**
   * Async iterable protocol: the iterator is its own async iterable.
   */
  public [Symbol.asyncIterator](): BufferedAsyncIterator<T, TReturn, TNext> {
    return this
  }
}

export { BufferedAsyncIterator }
