import {
    GitPktLine,
} from "./GitPktLine.mjs"


class GitPktLineDecoder implements Transformer<string, GitPktLine> {
    private static readonly SPECIALS_RAW_LEN_TBL = GitPktLine.SPECIAL_LINES.reduce((acc: Record<number, GitPktLine>, line) => {
        acc[line.rawLength] = line
        return acc
    }, {})

    private buffer: string = ''

    public async transform(chunk: string, controller: TransformStreamDefaultController) {
        this.buffer += chunk

        while ( this.buffer.length >= GitPktLine.HEX_LENGTH ) {
            const hexLengthStr = this.buffer.slice(0, GitPktLine.HEX_LENGTH)
            const pktLineLength = parseInt(hexLengthStr, 16)

            if ( pktLineLength > GitPktLine.MAX_RAW_LENGTH ) {
                throw new Error(`Invalid packet: Length \`${pktLineLength}\` exceeds the maximum limit`)
            }

            if ( pktLineLength < GitPktLine.HEX_LENGTH ) {
                const pktLine = GitPktLineDecoder.SPECIALS_RAW_LEN_TBL[pktLineLength]
                if ( pktLine ) {
                    controller.enqueue(pktLine)
                } else {
                    throw new Error("Invalid pkt line length")
                }

                this.buffer = this.buffer.slice(GitPktLine.HEX_LENGTH)
                continue
            }

            if ( this.buffer.length < pktLineLength ) {
                break
            }

            const end = this.buffer.charAt(pktLineLength - 1) === '\n' ? pktLineLength - 1 : pktLineLength
            controller.enqueue(new GitPktLine({
                content: this.buffer.slice(GitPktLine.HEX_LENGTH, end),
                rawLine: this.buffer.slice(0, pktLineLength),
            }))
            this.buffer = this.buffer.slice(pktLineLength)
        }
    }
}

class GitPktLineDecoderStream extends TransformStream<string, GitPktLine> {
    constructor(_?: unknown, writableStrategy?: QueuingStrategy<string>, readableStrategy?: QueuingStrategy<GitPktLine>) {
        super(new GitPktLineDecoder(), writableStrategy, readableStrategy)
    }
}


export {
    GitPktLineDecoder,
    GitPktLineDecoderStream,
}
