class BufferedAsyncIterator<T> implements AsyncIterableIterator<T> {
    protected buffer: T[] = []
    protected done = false

    public constructor(private iterator: AsyncIterator<T>) {}

    public async next(): Promise<IteratorResult<T, undefined>> {
        if ( this.buffer.length ) {
            return { value: this.buffer.shift()!, done: false }
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

    public async peek(): Promise<IteratorResult<T, undefined>> {
        if ( this.buffer.length > 0 ) {
            return { value: this.buffer[0], done: false }
        }
        const result = await this.next()
        if ( result.done ) {
            return { value: undefined, done: true }
        }
        this.buffer.unshift(result.value)
        return { value: result.value, done: false }
    }    

    public clearBuffer() {
        this.buffer.length = 0
    }

    [Symbol.asyncIterator](): BufferedAsyncIterator<T> {
        return this
    }
}

export {
    BufferedAsyncIterator,
}