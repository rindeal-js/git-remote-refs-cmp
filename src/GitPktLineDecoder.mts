import {
    GitPktLine,
} from './GitPktLine.mjs'

class GitPktLineDecoder implements Transformer<Uint8Array, GitPktLine> {
    private static readonly SPECIALS_LEN_TBL: Record<number, GitPktLine> =
        GitPktLine.SPECIAL_LINES.reduce((acc: Record<number, GitPktLine>, line) => {
            acc[line.rawLength] = line
            return acc
        }, {})

    // Internal byte buffer
    private buffer: Uint8Array = new Uint8Array(0)
    private offset = 0 // start index into buffer

    public async transform(chunk: Uint8Array, controller: TransformStreamDefaultController<GitPktLine>) {
        this.appendChunk(chunk)

        // Process as many complete pkt-lines as possible
        // We always require at least 4 bytes for the header.
        while (this.availableBytes() >= GitPktLine.HEX_LENGTH) {
            const headerView = this.buffer.subarray(this.offset, this.offset + GitPktLine.HEX_LENGTH)
            const length = GitPktLineDecoder.parseHeaderLength(headerView)

            // Enforce application max early
            if (length > GitPktLine.MAX_RAW_LENGTH) {
                throw new Error(`Invalid packet: length ${length} exceeds maximum limit ${GitPktLine.MAX_RAW_LENGTH}`)
            }

            // Control packets: 0000, 0001, 0002
            if (length < GitPktLine.HEX_LENGTH) {
                const special = GitPktLineDecoder.SPECIALS_LEN_TBL[length]
                if (!special) {
                    throw new Error(`Invalid pkt-line control length: ${length}`)
                }

                // Control packets are just the 4-byte header; no payload, no newline.
                this.consumeBytes(GitPktLine.HEX_LENGTH)
                controller.enqueue(special)
                continue
            }

            // Data packets: need the full frame before we can decode
            if (this.availableBytes() < length) {
                // Wait for more data
                break
            }

            const raw = this.buffer.subarray(this.offset, this.offset + length)

            // Let GitPktLine do full validation (newline, protocol max, etc.)
            const pkt = GitPktLine.fromRaw(raw, /* precompile */ true)
            controller.enqueue(pkt)

            this.consumeBytes(length)
        }
    }

    // ---- Buffer management ----

    private availableBytes(): number {
        return this.buffer.length - this.offset
    }

    private appendChunk(chunk: Uint8Array): void {
        if (chunk.length === 0) return

        if (this.buffer.length === 0) {
            // Fast path: no existing data
            this.buffer = chunk
            this.offset = 0
            return
        }

        // Compact if we've consumed a lot
        if (this.offset > 0) {
            const remaining = this.buffer.subarray(this.offset)
            const merged = new Uint8Array(remaining.length + chunk.length)
            merged.set(remaining, 0)
            merged.set(chunk, remaining.length)
            this.buffer = merged
            this.offset = 0
        } else {
            // No consumed prefix; just append
            const merged = new Uint8Array(this.buffer.length + chunk.length)
            merged.set(this.buffer, 0)
            merged.set(chunk, this.buffer.length)
            this.buffer = merged
        }
    }

    private consumeBytes(count: number): void {
        this.offset += count
        if (this.offset >= this.buffer.length) {
            // Fully consumed; reset
            this.buffer = new Uint8Array(0)
            this.offset = 0
        }
    }

    // ---- Header parsing ----

    private static parseHeaderLength(header: Uint8Array): number {
        if (header.length !== GitPktLine.HEX_LENGTH) {
            throw new Error('Pkt-line header must be exactly 4 bytes')
        }

        let hex = ''
        for (let i = 0; i < GitPktLine.HEX_LENGTH; i++) {
            hex += String.fromCharCode(header[i])
        }

        if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
            throw new Error(`Invalid pkt-line length header: "${hex}"`)
        }

        const length = parseInt(hex, 16)
        if (!Number.isFinite(length) || length < 0 || length > 0xffff) {
            throw new Error(`Invalid pkt-line length value: ${length}`)
        }

        return length
    }
}

class GitPktLineDecoderStream extends TransformStream<Uint8Array, GitPktLine> {
    constructor(
        _?: unknown,
        writableStrategy?: QueuingStrategy<Uint8Array>,
        readableStrategy?: QueuingStrategy<GitPktLine>,
    ) {
        super(new GitPktLineDecoder(), writableStrategy, readableStrategy)
    }
}

export {
    GitPktLineDecoder,
    GitPktLineDecoderStream,
}
