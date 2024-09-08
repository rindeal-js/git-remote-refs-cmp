/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
import { GitRefDiffBase, } from './GitRefDiff.mjs';
import { GitRefDiffType, } from './GitRefDiffType.mjs';
export { GitLsRemoteRefDiffBase, GitLsRemoteZeroRefsDiff, GitLsRemoteRefCountMismatchDiff, GitLsRemoteRefNotFoundDiff, GitLsRemoteOidMismatchDiff, };
class GitLsRemoteRefDiffBase extends GitRefDiffBase {
    message;
    sourceRemote;
    targetRemote;
    constructor(init) {
        super({
            sourceRefMap: init.source.refMap,
            targetRefMap: init.target.refMap,
            sourceRef: init.sourceRef,
            targetRef: init.targetRef,
        });
        this.sourceRemote = init.source.remote;
        this.targetRemote = init.target.remote;
        this.message = this._getMessage();
    }
}
class GitLsRemoteZeroRefsDiff extends GitLsRemoteRefDiffBase {
    type = GitRefDiffType.ZERO_REFS;
    _getMessage() {
        const srcLen = this.sourceRefMap.size;
        const dstLen = this.targetRefMap.size;
        return `Zero refs: \`${this.sourceRemote}\` has \`${srcLen}\` refs, \`${this.targetRemote}\` has \`${dstLen}\` refs.`;
    }
}
class GitLsRemoteRefCountMismatchDiff extends GitLsRemoteRefDiffBase {
    type = GitRefDiffType.REF_COUNT_MISMATCH;
    _getMessage() {
        const srcLen = this.sourceRefMap.size;
        const dstLen = this.targetRefMap.size;
        return `Ref count mismatch: \`${this.sourceRemote}\` has \`${srcLen}\` refs, \`${this.targetRemote}\` has \`${dstLen}\` refs.`;
    }
}
class GitLsRemoteRefNotFoundDiff extends GitLsRemoteRefDiffBase {
    type = GitRefDiffType.REF_NOT_FOUND;
    _getMessage() {
        if (!this.sourceRef) {
            throw new Error('sourceRef is not initialized');
        }
        return `Ref not found: \`${this.sourceRef.refname}\` from \`${this.sourceRemote}\` is missing in \`${this.targetRemote}\`.`;
    }
}
class GitLsRemoteOidMismatchDiff extends GitLsRemoteRefDiffBase {
    type = GitRefDiffType.OID_MISMATCH;
    _getMessage() {
        const srcRef = this.sourceRef;
        const dstRef = this.targetRef;
        if (!srcRef || !dstRef) {
            throw new Error('sourceRef or targetRef is not initialized');
        }
        return `OID mismatch for ref \`${srcRef.refname}\`: source has \`${srcRef.oid}\`, target has \`${dstRef.oid}\`.`;
    }
}
//# sourceMappingURL=GitLsRemoteRefDiff.mjs.map