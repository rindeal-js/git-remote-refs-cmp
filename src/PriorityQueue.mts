class PriorityQueue<T> {
    private heap: T[]
    private comparator: ( a: T, b: T ) => boolean

    constructor( comparator: ( a: T, b: T ) => boolean ) {
        this.heap = []
        this.comparator = comparator
    }

    private parent( index: number ): number {
        return Math.floor( ( index - 1 ) / 2 )
    }

    private leftChild( index: number ): number {
        return 2 * index + 1
    }

    private rightChild( index: number ): number {
        return 2 * index + 2
    }

    private swap( i: number, j: number ): void {
        [ this.heap[ i ], this.heap[ j ] ] = [ this.heap[ j ], this.heap[ i ] ]
    }

    private siftUp( index: number ): void {
        while ( index > 0 && this.comparator( this.heap[ index ], this.heap[ this.parent( index ) ] ) ) {
            this.swap( index, this.parent( index ) )
            index = this.parent( index )
        }
    }

    private siftDown( index: number ): void {
        let maxIndex = index
        const left = this.leftChild( index )
        if ( left < this.heap.length && this.comparator( this.heap[ left ], this.heap[ maxIndex ] ) ) {
            maxIndex = left
        }
        const right = this.rightChild( index )
        if ( right < this.heap.length && this.comparator( this.heap[ right ], this.heap[ maxIndex ] ) ) {
            maxIndex = right
        }
        if ( index !== maxIndex ) {
            this.swap( index, maxIndex )
            this.siftDown( maxIndex )
        }
    }

    public push( item: T ): void {
        this.heap.push( item )
        this.siftUp( this.heap.length - 1 )
    }

    public pop(): T | undefined {
        if ( this.heap.length === 0 ) {
            return undefined
        }
        const result = this.heap[ 0 ]
        const end = this.heap.pop()
        if ( this.heap.length > 0 && end !== undefined ) {
            this.heap[ 0 ] = end
            this.siftDown( 0 )
        }
        return result
    }

    public peek(): T | undefined {
        return this.heap.length > 0 ? this.heap[ 0 ] : undefined
    }

    public size(): number {
        return this.heap.length
    }

    public isEmpty(): boolean {
        return ! this.heap.length
    }
}


export {
    PriorityQueue,
}
