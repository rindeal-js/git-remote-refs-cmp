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
  type: GitRefDiffType
  message: string
  sourceRefMap: GitRemoteRefMap
  targetRefMap: GitRemoteRefMap
  sourceRef?: GitRemoteRef
  targetRef?: GitRemoteRef
}


class GitRefDiffBase implements GitRefDiff {
  public type: GitRefDiffType = GitRefDiffType.UNKNOWN
  public message: string = ''
  public sourceRefMap: GitRemoteRefMap
  public targetRefMap: GitRemoteRefMap
  public sourceRef?: GitRemoteRef
  public targetRef?: GitRemoteRef

  constructor(init: {sourceRefMap: GitRemoteRefMap, targetRefMap: GitRemoteRefMap, sourceRef?: GitRemoteRef, targetRef?: GitRemoteRef}) {
    this.sourceRefMap = init.sourceRefMap
    this.targetRefMap = init.targetRefMap
    this.sourceRef = init.sourceRef
    this.targetRef = init.targetRef
  }
}
