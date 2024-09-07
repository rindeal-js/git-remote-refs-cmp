/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License: GPL-3.0-only OR GPL-2.0-only
 */
import { GitRemoteRef } from './GitRemoteRef';
import { GitRemoteRefMap } from './GitRemoteRefMap';
import { GitRefDiffType } from './GitRefDiffType';
export { GitRefDiff, GitRefDiffBase, };
interface GitRefDiff {
    readonly type: GitRefDiffType;
    readonly message: string;
    readonly sourceRefMap: GitRemoteRefMap;
    readonly targetRefMap: GitRemoteRefMap;
    readonly sourceRef?: GitRemoteRef;
    readonly targetRef?: GitRemoteRef;
}
declare abstract class GitRefDiffBase implements GitRefDiff {
    readonly type: GitRefDiffType;
    readonly message: string;
    readonly sourceRefMap: GitRemoteRefMap;
    readonly targetRefMap: GitRemoteRefMap;
    readonly sourceRef?: GitRemoteRef;
    readonly targetRef?: GitRemoteRef;
    constructor(init: {
        sourceRefMap: GitRemoteRefMap;
        targetRefMap: GitRemoteRefMap;
        sourceRef?: GitRemoteRef;
        targetRef?: GitRemoteRef;
    });
}
