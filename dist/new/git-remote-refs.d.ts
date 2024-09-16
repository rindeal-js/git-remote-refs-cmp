type Hex = string;
type GitRef = {
    name: string;
    oid: Hex;
    symref?: string;
};
type ComparisonResult = {
    inSync: boolean;
    inSyncRefs: GitRef[];
    outOfSyncRefs: {
        ref: GitRef;
        otherOid: Hex;
    }[];
    missingRefs: {
        repo: 'A' | 'B';
        ref: GitRef;
    }[];
};
declare class GitPacketLine {
    static HEX_LENGTH: number;
    static FLUSH: GitPacketLine;
    static DELIM: GitPacketLine;
    static COMMAND_LS_REFS: GitPacketLine;
    static UNBORN: GitPacketLine;
    static PEEL: GitPacketLine;
    static SYMREFS: GitPacketLine;
    protected _content: string | null;
    protected _rawLine: string | null;
    constructor(init: {
        content?: string;
        rawLine?: string;
        precompile?: boolean;
    });
    get content(): string;
    get rawLine(): string;
    equals(other: GitPacketLine): boolean;
    static serialize(content: string): string;
    static deserialize(rawLine: string): string;
}
declare class GitRemoteRefs {
    private static USER_AGENT;
    private capabilitiesCache;
    constructor();
    private sendRequest;
    private fetchServerCapabilities;
    private parseServerCapabilities;
    private getServerCapabilities;
    private sendLsRefsCommand;
    private static parseRef;
    lsRefs(repoUrl: string): AsyncGenerator<GitRef, void, unknown>;
    private static compareRefs;
    compare(repoUrlA: string, repoUrlB: string): Promise<ComparisonResult | null>;
}
export { GitRemoteRefs, GitRef, ComparisonResult, GitPacketLine };
