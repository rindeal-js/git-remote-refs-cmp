/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License: GPL-3.0-only OR GPL-2.0-only
 */
import { GitLsRemoteOutput } from './GitLsRemoteOutput';
import { GitRefDiff, GitRefDiffBase } from './GitRefDiff';
import { GitRefDiffType } from './GitRefDiffType';
import { GitRemoteRef } from './GitRemoteRef';
export { GitLsRemoteRefDiff, GitLsRemoteRefDiffBase, GitLsRemoteZeroRefsDiff, GitLsRemoteRefCountMismatchDiff, GitLsRemoteRefNotFoundDiff, GitLsRemoteOidMismatchDiff, };
interface GitLsRemoteRefDiff extends GitRefDiff {
    readonly sourceRemote: string;
    readonly targetRemote: string;
}
declare abstract class GitLsRemoteRefDiffBase extends GitRefDiffBase implements GitLsRemoteRefDiff {
    readonly message: string;
    readonly sourceRemote: string;
    readonly targetRemote: string;
    constructor(init: {
        source: GitLsRemoteOutput;
        target: GitLsRemoteOutput;
        sourceRef?: GitRemoteRef;
        targetRef?: GitRemoteRef;
    });
    protected abstract _getMessage(): string;
}
declare class GitLsRemoteZeroRefsDiff extends GitLsRemoteRefDiffBase {
    readonly type: GitRefDiffType;
    protected _getMessage(): string;
}
declare class GitLsRemoteRefCountMismatchDiff extends GitLsRemoteRefDiffBase {
    readonly type: GitRefDiffType;
    protected _getMessage(): string;
}
declare class GitLsRemoteRefNotFoundDiff extends GitLsRemoteRefDiffBase {
    readonly type: GitRefDiffType;
    protected _getMessage(): string;
}
declare class GitLsRemoteOidMismatchDiff extends GitLsRemoteRefDiffBase {
    readonly type: GitRefDiffType;
    protected _getMessage(): string;
}
