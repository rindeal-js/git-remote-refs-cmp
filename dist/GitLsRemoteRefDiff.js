"use strict";
/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License: GPL-3.0-only OR GPL-2.0-only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitLsRemoteOidMismatchDiff = exports.GitLsRemoteRefNotFoundDiff = exports.GitLsRemoteRefCountMismatchDiff = exports.GitLsRemoteZeroRefsDiff = exports.GitLsRemoteRefDiffBase = void 0;
const GitRefDiff_1 = require("./GitRefDiff");
const GitRefDiffType_1 = require("./GitRefDiffType");
class GitLsRemoteRefDiffBase extends GitRefDiff_1.GitRefDiffBase {
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
exports.GitLsRemoteRefDiffBase = GitLsRemoteRefDiffBase;
class GitLsRemoteZeroRefsDiff extends GitLsRemoteRefDiffBase {
    type = GitRefDiffType_1.GitRefDiffType.ZERO_REFS;
    _getMessage() {
        const srcLen = this.sourceRefMap.size;
        const dstLen = this.targetRefMap.size;
        return `Zero refs: \`${this.sourceRemote}\` has \`${srcLen}\` refs, \`${this.targetRemote}\` has \`${dstLen}\` refs.`;
    }
}
exports.GitLsRemoteZeroRefsDiff = GitLsRemoteZeroRefsDiff;
class GitLsRemoteRefCountMismatchDiff extends GitLsRemoteRefDiffBase {
    type = GitRefDiffType_1.GitRefDiffType.REF_COUNT_MISMATCH;
    _getMessage() {
        const srcLen = this.sourceRefMap.size;
        const dstLen = this.targetRefMap.size;
        return `Ref count mismatch: \`${this.sourceRemote}\` has \`${srcLen}\` refs, \`${this.targetRemote}\` has \`${dstLen}\` refs.`;
    }
}
exports.GitLsRemoteRefCountMismatchDiff = GitLsRemoteRefCountMismatchDiff;
class GitLsRemoteRefNotFoundDiff extends GitLsRemoteRefDiffBase {
    type = GitRefDiffType_1.GitRefDiffType.REF_NOT_FOUND;
    _getMessage() {
        if (!this.sourceRef) {
            throw new Error('sourceRef is not initialized');
        }
        return `Ref not found: \`${this.sourceRef.refname}\` from \`${this.sourceRemote}\` is missing in \`${this.targetRemote}\`.`;
    }
}
exports.GitLsRemoteRefNotFoundDiff = GitLsRemoteRefNotFoundDiff;
class GitLsRemoteOidMismatchDiff extends GitLsRemoteRefDiffBase {
    type = GitRefDiffType_1.GitRefDiffType.OID_MISMATCH;
    _getMessage() {
        const srcRef = this.sourceRef;
        const dstRef = this.targetRef;
        if (!srcRef || !dstRef) {
            throw new Error('sourceRef or targetRef is not initialized');
        }
        return `OID mismatch for ref \`${srcRef.refname}\`: source has \`${srcRef.oid}\`, target has \`${dstRef.oid}\`.`;
    }
}
exports.GitLsRemoteOidMismatchDiff = GitLsRemoteOidMismatchDiff;
//# sourceMappingURL=GitLsRemoteRefDiff.js.map