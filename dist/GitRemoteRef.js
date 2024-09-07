"use strict";
/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleGitRemoteRef = exports.GitRemoteRefBase = void 0;
class GitRemoteRefBase {
    refname;
    oid;
    static _gitOidRegExp = /^[0-9a-f]{40}$/;
    static _gitRefNameRegExp = /^(?:refs\/(?:heads|tags|remotes)\/|HEAD$)/;
    constructor({ refname, oid }) {
        if (!GitRemoteRefBase._gitOidRegExp.test(oid)) {
            throw new Error(`Invalid OID: \`${oid}\``);
        }
        if (!GitRemoteRefBase._gitRefNameRegExp.test(refname)) {
            throw new Error(`Invalid refname: \`${refname}\``);
        }
        this.refname = refname;
        this.oid = oid;
    }
    static validateOid(oid) {
        return GitRemoteRefBase._gitOidRegExp.test(oid);
    }
    static validateRefName(refname) {
        return GitRemoteRefBase._gitRefNameRegExp.test(refname);
    }
}
exports.GitRemoteRefBase = GitRemoteRefBase;
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
}
exports.SimpleGitRemoteRef = SimpleGitRemoteRef;
//# sourceMappingURL=GitRemoteRef.js.map