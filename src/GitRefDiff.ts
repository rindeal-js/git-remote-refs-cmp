/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License: GPL-3.0-only OR GPL-2.0-only
 */

import {
  GitRemoteRef,
  GitRemoteRefMap,
} from './GitRemoteRef'


export {
  GitRefDiffType,
  GitRefDiff,
  GitRefDiffBase,
}


enum GitRefDiffType {
  UNKNOWN = 'UNKNOWN',
  ZERO_REFS = 'ZERO_REFS',
  REF_COUNT_MISMATCH = 'REF_COUNT_MISMATCH',
  REF_NOT_FOUND = 'REF_NOT_FOUND',
  OID_MISMATCH = 'OID_MISMATCH',
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

  protected constructor(init: {sourceRefMap: GitRemoteRefMap, targetRefMap: GitRemoteRefMap, sourceRef?: GitRemoteRef, targetRef?: GitRemoteRef}) {
    this.sourceRefMap = init.sourceRefMap
    this.targetRefMap = init.targetRefMap
    this.sourceRef = init.sourceRef
    this.targetRef = init.targetRef
  }
}
