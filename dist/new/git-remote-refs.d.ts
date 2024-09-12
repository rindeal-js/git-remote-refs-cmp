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
    content: string;
    static HEX_LENGTH: number;
    constructor(content: string);
    static FLUSH: GitPacketLine;
    static DELIM: GitPacketLine;
    serialize(): string;
    static COMMAND_LS_REFS: GitPacketLine;
    static UNBORN: GitPacketLine;
    static PEEL: GitPacketLine;
    static SYMREFS: GitPacketLine;
}
declare class GitRemoteRefs {
    private static USER_AGENT;
    private capabilitiesCache;
    constructor();
    private fetchServerCapabilities;
    private buildInfoRefsUrl;
    private sendRequest;
    private handleServiceAnnouncementPacket;
    private parseCapabilitiesPacket;
    private getServerCapabilities;
    private createLsRefsRequest;
    private static parseRef;
    private sendLsRefsCommand;
    lsRefs(repoUrl: string): AsyncGenerator<GitRef, void, unknown>;
    private static compareRefs;
    compare(repoUrlA: string, repoUrlB: string): Promise<ComparisonResult | null>;
}
export { GitRemoteRefs, GitRef, ComparisonResult, GitPacketLine };
