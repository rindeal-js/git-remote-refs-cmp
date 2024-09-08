/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
import { GitRemoteRefsCmp, } from './GitRemoteRefsCmp.mjs';
export { GitCommandManager, } from './GitCommandManager.mjs';
export { GitLsRemoteOutputCmp, } from './GitLsRemoteOutputCmp.mjs';
export { GitLsRemoteParser, } from './GitLsRemoteParser.mjs';
export { GitLsRemoteZeroRefsDiff, GitLsRemoteRefCountMismatchDiff, GitLsRemoteRefNotFoundDiff, GitLsRemoteOidMismatchDiff, } from './GitLsRemoteRefDiff.mjs';
export { GitRefDiffType, } from './GitRefDiffType.mjs';
export { GitRemoteRefsCmp, } from './GitRemoteRefsCmp.mjs';
export { Logger, } from './Logger.mjs';
export { gitRemoteRefsCmp, };
async function gitRemoteRefsCmp(sourceRemote, targetRemote) {
    const cmp = new GitRemoteRefsCmp();
    await cmp.init();
    return cmp.compare(sourceRemote, targetRemote);
}
//# sourceMappingURL=index.mjs.map