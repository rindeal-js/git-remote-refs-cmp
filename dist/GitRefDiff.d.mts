/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
import { GitRemoteRef } from './GitRemoteRef.mjs';
import { GitRemoteRefMap } from './GitRemoteRefMap.mjs';
import { GitRefDiffType } from './GitRefDiffType.mjs';
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
