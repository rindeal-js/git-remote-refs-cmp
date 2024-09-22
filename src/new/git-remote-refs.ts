





type RefsMap = Map<RefName, GitRef>

type ServerCapabilities = {
    [key: string]: string[]
}




class 


class ServerCapabilitiesCache {
    private fetchServerCapabilitiesPromises: Map<Hostname, Promise<ServerCapabilities>> = new Map()



    private async getServerCapabilities(repoUrl: string | URL | Hostname): Promise<ServerCapabilities> {
        const hostname = new URL(repoUrl).hostname as Hostname

        if ( this.capabilitiesCache.has(hostname) ) {
            return this.capabilitiesCache.get(hostname)!
        }

        const promises = this.fetchServerCapabilitiesPromises

        if ( ! promises.has(hostname) ) {
            const fetchPromise = this.fetchServerCapabilities(repoUrl)
            .then(capabilities => {
                this.capabilitiesCache.set(hostname, capabilities)
                promises.delete(hostname)
                return capabilities
            })

            promises.set(hostname, fetchPromise)
        }

        return promises.get(hostname)!
    }

    async primeServerCapabilitiesCache(urls: (string | URL)[]): Promise<void> {
        const uniqueHostnames = new Set(urls.map(url => new URL(url).hostname))
        const fetchPromises: Promise<void>[] = []

        for (const hostname of uniqueHostnames) {
            if (
                ! this.capabilitiesCache.has(hostname as Hostname) &&
                ! this.fetchServerCapabilitiesPromises.has(hostname as Hostname)
            ) {
                const url = urls.find(u => new URL(u).hostname === hostname)!
                fetchPromises.push(this.getServerCapabilities(url).then(() => {}))
            }
        }

        await Promise.all(fetchPromises)
    }
}


async function createRefsMap(refGenerator: AsyncGenerator<GitRef, void, unknown>): Promise<RefsMap> {
    const refsMap: RefsMap = new Map()
    for await (const ref of refGenerator) {
        refsMap.set(ref.name, ref)
    }
    return refsMap
}

type GitChangedRef = {
    name: RefName
    base: GitRef
    other: GitRef
}

type GitRefsDiffResult = {
    unchanged: GitRef[]
    changed: GitChangedRef[]
    added: GitRef[]
    removed: GitRef[]
}

type GitRemoteRefsDiffOptions = {
    /** Refs with names matching any of these patterns will be excluded from comparison */
    excludes?: RegExp[]
}

function gitRemoteRefsCmp(baseRefs: RefsMap, otherRefs: RefsMap, options: GitRemoteRefsDiffOptions = {}): GitRefsDiffResult | null {
    const { excludes: excludePatterns = [] } = options
    const isRefNameExcluded = (name: RefName): boolean => excludePatterns.some(pattern => pattern.test(name))

    const unchanged: GitRef[] = []
    const changed: GitChangedRef[] = []
    const added: GitRef[] = []
    const removed: GitRef[] = []

    for ( const [name, baseRef] of baseRefs ) {
        if ( isRefNameExcluded(name) ) {
            continue
        }

        const otherRef = otherRefs.get(name)
        if ( otherRef ) {
            if ( baseRef.oid === otherRef.oid ) {
                unchanged.push(baseRef)
            } else {
                changed.push({ name, base: baseRef, other: otherRef })
            }
        } else {
            removed.push(baseRef)
        }
    }

    for ( const [name, otherRef] of otherRefs ) {
        if ( ! baseRefs.has(name) && ! isRefNameExcluded(name) ) {
            added.push(otherRef)
        }
    }

    const diffFound = !! ( changed.length || added.length || removed.length )

    return diffFound ? { unchanged, changed, added, removed } : null
}

export {
    GitRemoteRefsFetcher as AbstractGitRemoteRefsFetcher,
    GitV2SmartHttpRefsFetcher as GitSmartHttpRefsFetcher,
    createRefsMap,
    gitRemoteRefsCmp as gitRemoteRefsDiff,
    GitRef,
    RefsMap,
    GitRefsDiffResult as ComparisonResult,
    GitChangedRef as GitRefDiff,
    GitRemoteRefsDiffOptions as CompareOptions,
    RefName,
    HexString as Hex
}