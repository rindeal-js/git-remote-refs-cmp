/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License: GPL-3.0-only OR GPL-2.0-only
 */

import {
  GitRefDiffType,
  GitRefDiff,
  GitRefDiffBase,
} from './GitRefDiff'
import {
  GitRemoteRef,
} from './GitRemoteRef'
import {
  GitLsRemoteOutput,
} from './GitLsRemoteOutput'

export {
  GitLsRemoteRefDiff,
  GitLsRemoteRefDiffBase,
  GitLsRemoteZeroRefsDiff,
  GitLsRemoteRefCountMismatchDiff,
  GitLsRemoteRefNotFoundDiff,
  GitLsRemoteOidMismatchDiff,
}

interface GitLsRemoteRefDiff extends GitRefDiff {
  sourceRemote: string
  targetRemote: string
}

class GitLsRemoteRefDiffBase extends GitRefDiffBase implements GitLsRemoteRefDiff {
  public sourceRemote: string
  public targetRemote: string

  constructor(init: {source: GitLsRemoteOutput, target: GitLsRemoteOutput, sourceRef?: GitRemoteRef, targetRef?: GitRemoteRef}) {
    super({
      sourceRefMap: init.source.refMap,
      targetRefMap: init.target.refMap,
      sourceRef: init.sourceRef,
      targetRef: init.targetRef,
    })
    this.sourceRemote = init.source.remote
    this.targetRemote = init.target.remote
    this.message = this._getMessage()
  }

  _getMessage(): string { throw new Error("Not implemented") }
}


class GitLsRemoteZeroRefsDiff extends GitLsRemoteRefDiffBase {
  type: GitRefDiffType = GitRefDiffType.ZERO_REFS

  _getMessage(): string {
    const srcLen = this.sourceRefMap.length
    const dstLen = this.targetRefMap.length
    return `Zero refs: \`${this.sourceRemote}\` has \`${srcLen}\` refs, \`${this.targetRemote}\` has \`${dstLen}\` refs.`
  }
}

class GitLsRemoteRefCountMismatchDiff extends GitLsRemoteRefDiffBase {
  type: GitRefDiffType = GitRefDiffType.REF_COUNT_MISMATCH

  _getMessage(): string {
    const srcLen = this.sourceRefMap.length
    const dstLen = this.targetRefMap.length
    return `Ref count mismatch: \`${this.sourceRemote}\` has \`${srcLen}\` refs, \`${this.targetRemote}\` has \`${dstLen}\` refs.`
  }
}

class GitLsRemoteRefNotFoundDiff extends GitLsRemoteRefDiffBase {
  type: GitRefDiffType = GitRefDiffType.REF_NOT_FOUND

  _getMessage(): string {
    if ( ! this.sourceRef ) {
      throw new Error('sourceRef is not initialized')
    }
    return `Ref not found: \`${this.sourceRef.refname}\` from \`${this.sourceRemote}\` is missing in \`${this.targetRemote}\`.`
  }
}

class GitLsRemoteOidMismatchDiff extends GitLsRemoteRefDiffBase {
  type: GitRefDiffType = GitRefDiffType.OID_MISMATCH

  _getMessage(): string {
    const srcRef = this.sourceRef
    const dstRef = this.targetRef
    if ( ! srcRef || ! dstRef ) {
      throw new Error('sourceRef or targetRef is not initialized');
    }
    return `OID mismatch for ref \`${srcRef.refname}\`: source has \`${srcRef.oid}\`, target has \`${dstRef.oid}\`.`
  }
}
