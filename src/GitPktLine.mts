class GitPktLine {
    static readonly HEX_LENGTH = 4
    static readonly MAX_RAW_LENGTH = 4096
    static readonly FLUSH              = new GitPktLine({ rawLine: '0000', precompile: true })
    static readonly DELIM              = new GitPktLine({ rawLine: '0001', precompile: true })
    static readonly RESPONSE_END       = new GitPktLine({ rawLine: '0002', precompile: true })
    static readonly COMMAND_LS_REFS    = new GitPktLine({ content: 'command=ls-refs', precompile: true })
    static readonly UNBORN             = new GitPktLine({ content: 'unborn',  precompile: true })
    static readonly PEEL               = new GitPktLine({ content: 'peel',    precompile: true })
    static readonly SYMREFS            = new GitPktLine({ content: 'symrefs', precompile: true })
    static readonly OBJECT_FORMAT_SHA1 = new GitPktLine({ content: 'object-format=sha1', precompile: true })
    static readonly SPECIAL_LINES = [
        this.FLUSH,
        this.DELIM,
        this.RESPONSE_END,
    ]

    private _content: string | null
    private _rawLine: string | null
    private _rawLength: number | null = null

    constructor(init: { content?: string, rawLine?: string, precompile?: boolean }) {
        if ( init.content == null && init.rawLine == null ) {
            throw new Error('Either content or line must be provided')
        }

        this._content = init.content ?? null
        this._rawLine = init.rawLine ?? null

        if ( init.precompile ) {
            if ( this._rawLine == null ) {
                this._rawLine = GitPktLine.serialize(this._content as string)
            } else if ( this._content == null ) {
                this._content = GitPktLine.deserialize(this._rawLine as string)
            }
            this._rawLength = GitPktLine.parseLength(this._rawLine)
        }
    }

    get content(): string {
        if ( this._content == null ) {
            if ( this._rawLine == null ) throw new Error('Raw line is null')
                this._content = GitPktLine.deserialize(this._rawLine)
        }
        return this._content
    }

    get rawLine(): string {
        if ( this._rawLine == null ) {
            if ( this._content == null ) throw new Error('Content is null')
                this._rawLine = GitPktLine.serialize(this._content)
        }
        return this._rawLine
    }

    static parseLength(rawLine: string): number {
        return parseInt(rawLine.slice(0, GitPktLine.HEX_LENGTH), 16)
    }

    get rawLength(): number {
        if (this._rawLength == null) {
            this._rawLength = GitPktLine.parseLength(this.rawLine)
        }
        return this._rawLength
    }

    equals(other: GitPktLine): boolean {
        return this.rawLine === other.rawLine
    }

    static serialize(content: string): string {
        const length = GitPktLine.HEX_LENGTH + content.length + '\n'.length
        return `${length.toString(16).padStart(GitPktLine.HEX_LENGTH, '0')}${content}\n`
    }

    static deserialize(rawLine: string): string {
        const length = parseInt(rawLine.slice(0, GitPktLine.HEX_LENGTH), 16)
        return rawLine.slice(GitPktLine.HEX_LENGTH, length - 1) // Remove trailing newline
    }
}


export {
    GitPktLine,
}