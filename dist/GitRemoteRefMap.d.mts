/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
import { GitRemoteRef } from './GitRemoteRef.mjs';
export { GitRemoteRefMap, };
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
declare class GitRemoteRefMap extends Map<string, string> {
    constructor(refs?: GitRemoteRef[]);
    /**
     * Returns an iterator of GitRemoteRef objects.
     */
    refs(): IterableIterator<GitRemoteRef>;
    /**
     * Returns an iterator of reference names.
     */
    refnames(): IterableIterator<string>;
    /**
     * Returns an iterator of object IDs.
     */
    oids(): IterableIterator<string>;
    /**
     * Sets a reference in the map.
     *
     * @param ref - The GitRemoteRef to set.
     * @returns The updated GitRemoteRefMap.
     */
    setRef(ref: GitRemoteRef): this;
    /**
     * Gets a reference by its name.
     *
     * @param refname - The name of the reference.
     * @returns The GitRemoteRef or undefined if not found.
     */
    getRef(refname: string): GitRemoteRef | undefined;
    /**
     * Executes a callback for each reference in the map.
     *
     * @param callback - The callback to execute.
     */
    forEachRef(callback: (ref: GitRemoteRef) => void): void;
}
