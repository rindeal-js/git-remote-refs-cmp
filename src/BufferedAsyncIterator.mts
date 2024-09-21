class BufferedAsyncIterator<T> implements AsyncIterableIterator<T> {
    private buffer: T[] = []
    private done = false

    public constructor(private iterator: AsyncIterator<T>) {}

    public async next(): Promise<IteratorResult<T, undefined>> {
        if ( this.buffer.length ) {
            return { value: this.buffer.shift() as T, done: false }
        }
        if ( this.done ) {
            return { value: undefined, done: true }
        }
        const result = await this.iterator.next()
        if ( result.done ) {
            this.done = true
        }
        return result
    }

    public async peek(): Promise<T | undefined> {
        if ( this.buffer.length > 0 ) {
            return this.buffer[0]
        }
        const result = await this.next()
        if ( result.done ) {
            return undefined
        }
        this.buffer.unshift(result.value)
        return result.value
    }

    [Symbol.asyncIterator](): BufferedAsyncIterator<T> {
        return this
    }
}

export {
    BufferedAsyncIterator,
}