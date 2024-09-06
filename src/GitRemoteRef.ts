/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

export { GitRemoteRef }


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
  /**
   * The full name of the reference.
   * 
   * @example
   * 'refs/heads/master'
   * 'refs/tags/v1.0.1'
   * 'refs/pull/1/head'
   */
  refname: string

  /**
   * The object ID (OID, hash) associated with the reference.
   * 
   * @example
   * 'd1e8c3f4b5a6c7d8e9f0a1b2c3d4e5f6a7b8c9d0'
   * 'a1b2c3d4e5f6a7b8c9d0d1e8c3f4b5a6c7d8e9f0'
   * 'f6a7b8c9d0d1e8c3f4b5a6c7d8e9f0a1b2c3d4e5'
   */
  oid: string
}
