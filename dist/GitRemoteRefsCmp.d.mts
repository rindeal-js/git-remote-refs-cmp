/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
import { GitCommandManager } from './GitCommandManager.mjs';
import { GitLsRemoteParser } from './GitLsRemoteParser.mjs';
import { GitLsRemoteOutputCmp } from './GitLsRemoteOutputCmp.mjs';
import { GitLsRemoteRefDiff } from './GitLsRemoteRefDiff.mjs';
export { GitRemoteRefsCmp, };
declare class GitRemoteRefsCmp {
    git: GitCommandManager;
    parser: GitLsRemoteParser;
    lsRemoteCmp: GitLsRemoteOutputCmp;
    constructor();
    init(): Promise<void>;
    isInitialized(): boolean;
    ensureIsInitialized(): Promise<void>;
    private processRemote;
    compare(sourceRemote: string, targetRemote: string): Promise<GitLsRemoteRefDiff | null>;
}
