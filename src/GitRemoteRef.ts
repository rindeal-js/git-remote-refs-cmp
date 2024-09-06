/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

export {
  GitRemoteRef,
  GitRemoteRefMap,
  GitRemoteRefBase,
  SimpleGitRemoteRef,
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

  /**
   * Returns an iterator of GitRemoteRef objects.
   */
  public *refs(): IterableIterator<GitRemoteRef> {
    for (const [refname, oid] of this.entries()) {
      yield { refname, oid }
    }
  }

  /**
   * Returns an iterator of reference names.
   */
  public *refnames(): IterableIterator<string> {
    return this.keys()
  }

  /**
   * Returns an iterator of object IDs.
   */
  public *oids(): IterableIterator<string> {
    return this.values()
  }

  /**
   * Sets a reference in the map.
   * 
   * @param ref - The GitRemoteRef to set.
   * @returns The updated GitRemoteRefMap.
   */
  public setRef(ref: GitRemoteRef): this {
    this.set(ref.refname, ref.oid)
    return this
  }

  /**
   * Gets a reference by its name.
   * 
   * @param refname - The name of the reference.
   * @returns The GitRemoteRef or undefined if not found.
   */
  public getRef(refname: string): GitRemoteRef | undefined {
    const oid = this.get(refname)
    return oid ? { refname, oid } : undefined
  }

  /**
   * Executes a callback for each reference in the map.
   * 
   * @param callback - The callback to execute.
   */
  public forEachRef(callback: (ref: GitRemoteRef) => void): void {
    for (const ref of this.refs()) {
      callback(ref)
    }
  }
}

class GitRemoteRefBase implements GitRemoteRef {
  static _gitOidRegExp = /^[0-9a-f]{40}$/
  static _gitRefNameRegExp = /^(?:refs\/(?:heads|tags|remotes)\/|HEAD$)/

  public static validateOid(oid: string): boolean {
    return GitRemoteRefBase._gitOidRegExp.test(oid)
  }

  public static validateRefName(refname: string): boolean {
    return GitRemoteRefBase._gitRefNameRegExp.test(refname)
  }
}

/**
 * A simple implementation of the GitRemoteRef interface.
 * 
 * @example
 * ```ts
 * const simpleRef = new SimpleGitRemoteRef({
 *   refname: 'refs/heads/develop',
 *   oid: 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0'
 * });
 * console.log(simpleRef.refname); // 'refs/heads/develop'
 * console.log(simpleRef.oid); // 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0'
 * ```
 */
class SimpleGitRemoteRef extends GitRemoteRefBase {
  refname: string;
  oid: string;

  constructor({ refname, oid }: GitRemoteRef) {
    if ( ! ( oid && GitRemoteRefBase.validateOid(oid) ) ) {
      throw new Error(`Invalid OID: \`${oid}\``)
    }
    if ( ! ( oid && GitRemoteRefBase.validateRefName(refname) ) ) {
      throw new Error(`Invalid refname: \`${refname}\``)
    }
    this.refname = refname
    this.oid = oid
  }
}
