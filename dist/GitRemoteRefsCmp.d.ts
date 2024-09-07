/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
import { GitCommandManager } from './GitCommandManager';
import { GitLsRemoteParser } from './GitLsRemoteParser';
import { GitLsRemoteOutputCmp } from './GitLsRemoteOutputCmp';
import { GitLsRemoteRefDiff } from './GitLsRemoteRefDiff';
export { GitRemoteRefsCmp, };
declare class GitRemoteRefsCmp {
    git: GitCommandManager;
    parser: GitLsRemoteParser;
    lsRemoteCmp: GitLsRemoteOutputCmp;
    constructor();
    init(): Promise<void>;
    private processRemote;
    compare(sourceRemote: string, targetRemote: string): Promise<GitLsRemoteRefDiff | null>;
}
