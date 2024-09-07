"use strict";
/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitLsRemoteOutputCmp = void 0;
const Logger_1 = require("./Logger");
const GitLsRemoteRefDiff_1 = require("./GitLsRemoteRefDiff");
class GitLsRemoteOutputCmp {
    async compare(source, target) {
        Logger_1.Logger.trace(`Differ.diff() called`);
        if (source.refMap.size === 0 || target.refMap.size === 0) {
            const refDiff = new GitLsRemoteRefDiff_1.GitLsRemoteZeroRefsDiff({ source, target });
            Logger_1.Logger.error(await refDiff.message);
            return refDiff;
        }
        if (source.refMap.size !== target.refMap.size) {
            const refDiff = new GitLsRemoteRefDiff_1.GitLsRemoteRefCountMismatchDiff({ source, target });
            Logger_1.Logger.warn(await refDiff.message);
            return refDiff;
        }
        for (const sourceRef of source.refMap.refs()) {
            const targetRef = target.refMap.getRef(sourceRef.refname);
            if (!targetRef) {
                const refDiff = new GitLsRemoteRefDiff_1.GitLsRemoteRefNotFoundDiff({ source, target, sourceRef });
                Logger_1.Logger.warn(await refDiff.message);
                return refDiff;
            }
            if (sourceRef.oid !== targetRef.oid) {
                const refDiff = new GitLsRemoteRefDiff_1.GitLsRemoteOidMismatchDiff({ source, target, sourceRef, targetRef });
                Logger_1.Logger.warn(await refDiff.message);
                return refDiff;
            }
        }
        Logger_1.Logger.info(`No differences found`);
        return null;
    }
}
exports.GitLsRemoteOutputCmp = GitLsRemoteOutputCmp;
//# sourceMappingURL=GitLsRemoteOutputCmp.js.map