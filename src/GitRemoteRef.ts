/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

export {
  GitRemoteRef,
  GitRemoteRefMap,
}

/**
 * Represents a reference in a remote Git repository.
 * 
 * @see {@link https://github.com/libgit2/libgit2/blob/403a03b3beaea7d26b9515e27dd36553239647ca/include/git2/net.h#L40-L50}
 * @see {@link https://github.com/libgit2/libgit2/blob/403a03b3beaea7d26b9515e27dd36553239647ca/src/libgit2/fetchhead.h#L15-L20}
 * 
 * @example
 * ```ts
 * const branchRef: GitRemoteRef = {
 *   refname: 'refs/heads/master',
 *   oid: 'd1e8c3f4b5a6c7d8e9f0a1b2c3d4e5f6a7b8c9d0'
 * };
 * 
 * const tagRef: GitRemoteRef = {
 *   refname: 'refs/tags/v1.0.1',
 *   oid: 'a1b2c3d4e5f6a7b8c9d0d1e8c3f4b5a6c7d8e9f0'
 * };
 * 
 * const pullRequestRef: GitRemoteRef = {
 *   refname: 'refs/pull/1/head',
 *   oid: 'f6a7b8c9d0d1e8c3f4b5a6c7d8e9f0a1b2c3d4e5'
 * };
 * ```
 */
interface GitRemoteRef {
  refname: string
  oid: string
}

/**
 * A map of reference names to their corresponding object IDs.
 * 
 * @example
 * ```ts
 * const refMap: GitRemoteRefMap = new GitRemoteRefMap([
 *   {refname: 'refs/heads/master', oid: 'd1e8c3f4b5a6c7d8e9f0a1b2c3d4e5f6a7b8c9d0'},
 *   {refname: 'refs/tags/v1.0.1', oid: 'a1b2c3d4e5f6a7b8c9d0d1e8c3f4b5a6c7d8e9f0'},
 * ])
 * refMap.setRef({refname: 'refs/pull/1/head', oid: 'f6a7b8c9d0d1e8c3f4b5a6c7d8e9f0a1b2c3d4e5'})
 *
 * for (const ref of refMap.refs()) {
 *   console.log(ref.refname)
 *   console.log(ref.oid)
 * }
 * ```
 */
class GitRemoteRefMap extends Map<string, string> {
  constructor(refs?: GitRemoteRef[]) {
    super(refs ? refs.map(ref => [ref.refname, ref.oid]) : [])
  }

  public *refs(): IterableIterator<GitRemoteRef> {
    for (const [refname, oid] of this.entries()) {
      yield { refname, oid }
    }
  }

  public *refnames(): IterableIterator<string> {
    return this.keys()
  }

  public *oids(): IterableIterator<string> {
    return this.values()
  }

  public setRef(ref: GitRemoteRef): this {
    this.set(ref.refname, ref.oid)
    return this
  }

  public getRef(refname: string): GitRemoteRef | undefined {
    const oid = this.get(refname)
    return oid ? { refname, oid } : undefined
  }

  public forEachRef(callback: (ref: GitRemoteRef) => void): void {
    for (const ref of this.refs()) {
      callback(ref)
    }
  }
}
