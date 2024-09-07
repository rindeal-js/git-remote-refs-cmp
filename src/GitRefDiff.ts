/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import {
  GitRemoteRef,
} from './GitRemoteRef'
import {
  GitRemoteRefMap,
} from './GitRemoteRefMap'
import {
  GitRefDiffType,
} from './GitRefDiffType'


export {
  GitRefDiff,
  GitRefDiffBase,
}


interface GitRefDiff {
  readonly type: GitRefDiffType
  readonly message: string
  readonly sourceRefMap: GitRemoteRefMap
  readonly targetRefMap: GitRemoteRefMap
  readonly sourceRef?: GitRemoteRef
  readonly targetRef?: GitRemoteRef
}


abstract class GitRefDiffBase implements GitRefDiff {
  public readonly type: GitRefDiffType = GitRefDiffType.UNKNOWN
  public readonly message: string = ''
  public readonly sourceRefMap: GitRemoteRefMap
  public readonly targetRefMap: GitRemoteRefMap
  public readonly sourceRef?: GitRemoteRef
  public readonly targetRef?: GitRemoteRef

  public constructor(init: {sourceRefMap: GitRemoteRefMap, targetRefMap: GitRemoteRefMap, sourceRef?: GitRemoteRef, targetRef?: GitRemoteRef}) {
    this.sourceRefMap = init.sourceRefMap
    this.targetRefMap = init.targetRefMap
    this.sourceRef = init.sourceRef
    this.targetRef = init.targetRef
  }
}
