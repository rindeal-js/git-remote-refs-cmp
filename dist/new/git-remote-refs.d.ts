type Hex = string;
type RefName = string;
type GitRef = {
    name: RefName;
    oid: Hex;
    symref?: RefName;
    peeled?: Hex;
};
type RefsMap = Map<RefName, GitRef>;
type FetchOptions = {
    gitProtocolVersion?: 0 | 1 | 2;
};
declare abstract class GitRemoteRefsFetcher {
    protected static readonly USER_AGENT = "GitRemoteRefs/1.0";
    /** @see: https://github.com/facsimiles/turnip/blob/497f8526b52d012684a2d81b03275f0b24096251/turnip/pack/git.py#L35  */
    protected static readonly ERROR_PREFIX = "ERR ";
    abstract fetchRefs(repoUrl: string | URL, options: FetchOptions): AsyncGenerator<GitRef, void, unknown>;
    fetchRefsAsMap(repoUrl: string | URL, options?: FetchOptions): Promise<RefsMap>;
    multiFetchRefsAsMap(requests: {
        url: string | URL;
        options?: FetchOptions;
    }[]): Promise<RefsMap[]>;
}
declare class GitSmartHttpRefsFetcher extends GitRemoteRefsFetcher {
    private capabilitiesCache;
    private sendRequest;
    private fetchServerCapabilities;
    private getServerCapabilities;
    fetchRefs(repoUrl: string | URL, options?: FetchOptions): AsyncGenerator<GitRef, void, unknown>;
    private parseRef;
}
declare function createRefsMap(refGenerator: AsyncGenerator<GitRef, void, unknown>): Promise<RefsMap>;
type GitChangedRef = {
    name: RefName;
    base: GitRef;
    other: GitRef;
};
type GitRefsDiffResult = {
    unchanged: GitRef[];
    changed: GitChangedRef[];
    added: GitRef[];
    removed: GitRef[];
};
type GitRemoteRefsDiffOptions = {
    /** Refs with names matching any of these patterns will be excluded from comparison */
    excludes?: RegExp[];
};
declare function gitRemoteRefsDiff(baseRefs: RefsMap, otherRefs: RefsMap, options?: GitRemoteRefsDiffOptions): GitRefsDiffResult | null;
export { GitRemoteRefsFetcher as AbstractGitRemoteRefsFetcher, GitSmartHttpRefsFetcher, createRefsMap, gitRemoteRefsDiff, GitRef, RefsMap, GitRefsDiffResult as ComparisonResult, GitChangedRef as GitRefDiff, FetchOptions, GitRemoteRefsDiffOptions as CompareOptions, RefName, Hex };
