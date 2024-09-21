interface GitRemoteRefsFetcher {
    fetchRefs(repoUrl: string | URL): AsyncGenerator<GitRef, void, unknown>
}


abstract class AbstractGitRemoteRefsFetcher implements GitRemoteRefsFetcher {
    public static readonly USER_AGENT: string = 'GitRemoteRefs/1.0'
    /** @see: https://github.com/facsimiles/turnip/blob/497f8526b52d012684a2d81b03275f0b24096251/turnip/pack/git.py#L35  */
    public static readonly ERROR_PREFIX: string = 'ERR '

    public abstract fetchRefs(repoUrl: string | URL): AsyncGenerator<GitRef, void, unknown>

    async fetchRefsAsMap(repoUrl: string | URL): Promise<RefsMap> {
        const refsMap: RefsMap = new Map()
        for await (const ref of this.fetchRefs(repoUrl)) {
            refsMap.set(ref.name, ref)
        }
        return refsMap
    }

    async multiFetchRefsAsMap(urls: string[] | URL[]): Promise<RefsMap[]> {
        return Promise.all(
            urls.map(url => this.fetchRefsAsMap(url))
        )
    }
}


export {
    GitRemoteRefsFetcher,
    AbstractGitRemoteRefsFetcher,
}