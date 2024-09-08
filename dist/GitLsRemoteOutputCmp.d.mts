/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
import { GitLsRemoteOutput } from './GitLsRemoteOutput.mjs';
import { GitLsRemoteRefDiff } from './GitLsRemoteRefDiff.mjs';
export { GitLsRemoteOutputCmp, };
declare class GitLsRemoteOutputCmp {
    compare(source: GitLsRemoteOutput, target: GitLsRemoteOutput): Promise<GitLsRemoteRefDiff | null>;
}
