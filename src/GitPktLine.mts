// git-pkt-line.ts
/* eslint-disable @typescript-eslint/no-non-null-assertion */

enum GitPktLineType {
    Data = 'data',
    Flush = 'flush',
    Delim = 'delim',
    ResponseEnd = 'response-end',
}

type GitPktLineInit =
    | { content: string; raw?: Uint8Array; precompile?: boolean }
    | { raw: Uint8Array; content?: string; precompile?: boolean }

const HEX_LENGTH = 4
// Application-level max; must also be <= protocol max (65520).
const MAX_RAW_LENGTH = 4096
const PROTOCOL_MAX_LENGTH = 65520

// Minimal, environment-agnostic UTF-8 helpers (Node + browser).
const encoder: {
    encode: (s: string) => Uint8Array
} = (() => {
    if (typeof TextEncoder !== 'undefined') {
        const te = new TextEncoder()
        return { encode: (s: string) => te.encode(s) }
    }
    // Node < 18 fallback
    if (typeof Buffer !== 'undefined') {
        return { encode: (s: string) => Uint8Array.from(Buffer.from(s, 'utf8')) }
    }
    throw new Error('No UTF-8 encoder available in this environment')
})()

const decoder: {
    decode: (b: Uint8Array) => string
} = (() => {
    if (typeof TextDecoder !== 'undefined') {
        const td = new TextDecoder('utf-8', { fatal: false })
        return { decode: (b: Uint8Array) => td.decode(b) }
    }
    if (typeof Buffer !== 'undefined') {
        return { decode: (b: Uint8Array) => Buffer.from(b).toString('utf8') }
    }
    throw new Error('No UTF-8 decoder available in this environment')
})()

class GitPktLine {
    static readonly HEX_LENGTH = HEX_LENGTH
    static readonly MAX_RAW_LENGTH = MAX_RAW_LENGTH
    static readonly PROTOCOL_MAX_LENGTH = PROTOCOL_MAX_LENGTH

    private _content: string | null
    private _raw: Uint8Array | null
    private _rawLength: number | null = null
    private _type: GitPktLineType | null = null

    // ---- Static constructors for control packets ----

    static readonly FLUSH = GitPktLine.fromControlLength(0, GitPktLineType.Flush)
    static readonly DELIM = GitPktLine.fromControlLength(1, GitPktLineType.Delim)
    static readonly RESPONSE_END = GitPktLine.fromControlLength(2, GitPktLineType.ResponseEnd)

    static readonly SPECIAL_LINES: readonly GitPktLine[] = [
        GitPktLine.FLUSH,
        GitPktLine.DELIM,
        GitPktLine.RESPONSE_END,
    ] as const

    static readonly COMMAND_LS_REFS = new GitPktLine({ content: 'command=ls-refs', precompile: true })
    static readonly UNBORN = new GitPktLine({ content: 'unborn', precompile: true })
    static readonly PEEL = new GitPktLine({ content: 'peel', precompile: true })
    static readonly SYMREFS = new GitPktLine({ content: 'symrefs', precompile: true })
    static readonly OBJECT_FORMAT_SHA1 = new GitPktLine({ content: 'object-format=sha1', precompile: true })

    constructor(init: GitPktLineInit) {
        if (init.content == null && init.raw == null) {
            throw new Error('Either content or raw must be provided')
        }

        this._content = init.content ?? null
        this._raw = init.raw ?? null

        // Precompute and validate if requested
        if (init.precompile) {
            if (this._raw == null) {
                // Data packet from content
                this._raw = GitPktLine.serializeContent(this._content as string)
            } else {
                // Determine type from raw
                const { length, type } = GitPktLine.parseLengthAndType(this._raw)
                this._rawLength = length
                this._type = type

                if (type === GitPktLineType.Data && this._content == null) {
                    this._content = GitPktLine.deserializeData(this._raw, length)
                }
            }
        }

        // If both content and raw are provided, validate consistency for data packets.
        if (this._content != null && this._raw != null) {
            const { length, type } = GitPktLine.parseLengthAndType(this._raw)
            this._rawLength = length
            this._type = type

            if (type === GitPktLineType.Data) {
                const decoded = GitPktLine.deserializeData(this._raw, length)
                if (decoded !== this._content) {
                    throw new Error('Provided content does not match provided raw pkt-line')
                }
            } else {
                // Control packets must not have content
                throw new Error('Control pkt-lines must not have content')
            }
        }
    }

    // ---- Public API ----

    get type(): GitPktLineType {
        if (this._type == null) {
            const raw = this.raw
            const { type } = GitPktLine.parseLengthAndType(raw)
            this._type = type
        }
        return this._type
    }

    get isControl(): boolean {
        const t = this.type
        return t === GitPktLineType.Flush || t === GitPktLineType.Delim || t === GitPktLineType.ResponseEnd
    }

    get isFlush(): boolean {
        return this.type === GitPktLineType.Flush
    }

    get isDelim(): boolean {
        return this.type === GitPktLineType.Delim
    }

    get isResponseEnd(): boolean {
        return this.type === GitPktLineType.ResponseEnd
    }

    /**
     * Logical content of a data pkt-line.
     * For control packets (flush/delim/response-end), accessing this throws.
     */
    get content(): string {
        if (this.isControl) {
            throw new Error('Control pkt-lines do not have content')
        }
        if (this._content == null) {
            if (this._raw == null) throw new Error('Raw bytes are null')
            const { length } = GitPktLine.parseLengthAndType(this._raw)
            this._content = GitPktLine.deserializeData(this._raw, length)
        }
        return this._content
    }

    /**
     * Raw pkt-line bytes, exactly as they appear on the wire.
     */
    get raw(): Uint8Array {
        if (this._raw == null) {
            if (this._content == null) throw new Error('Content is null')
            this._raw = GitPktLine.serializeContent(this._content)
        }
        return this._raw
    }

    /**
     * Convenience: raw pkt-line as a UTF-8 string.
     * Note: this is only meaningful if the underlying bytes are valid UTF-8.
     */
    get rawLine(): string {
        return decoder.decode(this.raw)
    }

    get rawLength(): number {
        if (this._rawLength == null) {
            const { length } = GitPktLine.parseLengthAndType(this.raw)
            this._rawLength = length
        }
        return this._rawLength
    }

    equals(other: GitPktLine): boolean {
        const a = this.raw
        const b = other.raw
        if (a === b) return true
        if (a.length !== b.length) return false
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false
        }
        return true
    }

    // ---- Static helpers ----

    /**
     * Create a data pkt-line from content.
     */
    static fromContent(content: string, precompile = true): GitPktLine {
        return new GitPktLine({ content, precompile })
    }

    /**
     * Create a pkt-line from raw bytes.
     */
    static fromRaw(raw: Uint8Array, precompile = true): GitPktLine {
        return new GitPktLine({ raw, precompile })
    }

    /**
     * Legacy helper: parse from a UTF-8 string representation.
     * NOTE: Only safe if the original bytes were valid UTF-8.
     */
    static fromRawString(rawLine: string, precompile = true): GitPktLine {
        const rawBytes = encoder.encode(rawLine)
        return new GitPktLine({ raw: rawBytes, precompile })
    }

    // ---- Internal: control pkt-lines ----

    private static fromControlLength(len: 0 | 1 | 2, type: GitPktLineType): GitPktLine {
        const header = GitPktLine.encodeHexLength(len)
        const raw = header // control packets are just the 4-byte header
        const pkt = new GitPktLine({ raw, precompile: false })
        pkt._rawLength = len
        pkt._type = type
        return pkt
    }

    // ---- Internal: serialization / deserialization ----

    private static serializeContent(content: string): Uint8Array {
        const payload = encoder.encode(content)
        const length = HEX_LENGTH + payload.length + 1 // header + payload + '\n'

        if (length > PROTOCOL_MAX_LENGTH) {
            throw new Error(`Pkt-line length ${length} exceeds protocol max ${PROTOCOL_MAX_LENGTH}`)
        }
        if (length > MAX_RAW_LENGTH) {
            throw new Error(`Pkt-line length ${length} exceeds application max ${MAX_RAW_LENGTH}`)
        }

        const header = GitPktLine.encodeHexLength(length)
        const out = new Uint8Array(length)
        out.set(header, 0)
        out.set(payload, HEX_LENGTH)
        out[length - 1] = 0x0a // '\n'
        return out
    }

    private static deserializeData(raw: Uint8Array, length: number): string {
        // length includes header and trailing newline
        if (length < HEX_LENGTH + 1) {
            throw new Error('Invalid pkt-line length for data packet')
        }
        if (raw.length < length) {
            throw new Error('Pkt-line truncated')
        }
        if (raw[length - 1] !== 0x0a) {
            throw new Error('Pkt-line missing trailing newline')
        }
        const payload = raw.subarray(HEX_LENGTH, length - 1)
        return decoder.decode(payload)
    }

    private static encodeHexLength(length: number): Uint8Array {
        if (!Number.isInteger(length) || length < 0 || length > 0xffff) {
            throw new Error(`Invalid pkt-line length: ${length}`)
        }
        const hex = length.toString(16).padStart(HEX_LENGTH, '0')
        const bytes = new Uint8Array(HEX_LENGTH)
        for (let i = 0; i < HEX_LENGTH; i++) {
            bytes[i] = hex.charCodeAt(i) // ASCII
        }
        return bytes
    }

    private static parseLengthAndType(raw: Uint8Array): { length: number; type: GitPktLineType } {
        if (raw.length < HEX_LENGTH) {
            throw new Error('Pkt-line shorter than header length')
        }

        // Read 4 ASCII hex digits
        let hex = ''
        for (let i = 0; i < HEX_LENGTH; i++) {
            hex += String.fromCharCode(raw[i])
        }

        if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
            throw new Error(`Invalid pkt-line length header: "${hex}"`)
        }

        const length = parseInt(hex, 16)
        if (!Number.isFinite(length)) {
            throw new Error('Pkt-line length header is not a finite number')
        }

        if (length > PROTOCOL_MAX_LENGTH) {
            throw new Error(`Pkt-line length ${length} exceeds protocol max ${PROTOCOL_MAX_LENGTH}`)
        }
        if (length > MAX_RAW_LENGTH) {
            throw new Error(`Pkt-line length ${length} exceeds application max ${MAX_RAW_LENGTH}`)
        }

        // Control packets: 0000, 0001, 0002 (no payload, no newline)
        if (length === 0) {
            return { length, type: GitPktLineType.Flush }
        }
        if (length === 1) {
            return { length, type: GitPktLineType.Delim }
        }
        if (length === 2) {
            return { length, type: GitPktLineType.ResponseEnd }
        }

        // Data packets: length >= 4
        if (length < HEX_LENGTH + 1) {
            throw new Error(`Invalid data pkt-line length: ${length}`)
        }

        // We don't require raw.length === length here, only that it's at least that long;
        // callers that care about exact framing can enforce it at a higher level.
        if (raw.length < length) {
            throw new Error('Pkt-line truncated')
        }

        return { length, type: GitPktLineType.Data }
    }
}

export {
    GitPktLine,
    GitPktLineType,
}
