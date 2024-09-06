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
  readonly sourceRemote: string
  readonly targetRemote: string
}

abstract class GitLsRemoteRefDiffBase extends GitRefDiffBase implements GitLsRemoteRefDiff {
  public readonly sourceRemote: string
  public readonly targetRemote: string

  protected constructor(init: {source: GitLsRemoteOutput, target: GitLsRemoteOutput, sourceRef?: GitRemoteRef, targetRef?: GitRemoteRef}) {
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

  protected abstract _getMessage(): string
}

class GitLsRemoteZeroRefsDiff extends GitLsRemoteRefDiffBase {
  public readonly type: GitRefDiffType = GitRefDiffType.ZERO_REFS

  protected _getMessage(): string {
    const srcLen = this.sourceRefMap.length
    const dstLen = this.targetRefMap.length
    return `Zero refs: \`${this.sourceRemote}\` has \`${srcLen}\` refs, \`${this.targetRemote}\` has \`${dstLen}\` refs.`
  }
}

class GitLsRemoteRefCountMismatchDiff extends GitLsRemoteRefDiffBase {
  public readonly type: GitRefDiffType = GitRefDiffType.REF_COUNT_MISMATCH

  protected _getMessage(): string {
    const srcLen = this.sourceRefMap.length
    const dstLen = this.targetRefMap.length
    return `Ref count mismatch: \`${this.sourceRemote}\` has \`${srcLen}\` refs, \`${this.targetRemote}\` has \`${dstLen}\` refs.`
  }
}

class GitLsRemoteRefNotFoundDiff extends GitLsRemoteRefDiffBase {
  public readonly type: GitRefDiffType = GitRefDiffType.REF_NOT_FOUND

  protected _getMessage(): string {
    if (!this.sourceRef) {
      throw new Error('sourceRef is not initialized')
    }
    return `Ref not found: \`${this.sourceRef.refname}\` from \`${this.sourceRemote}\` is missing in \`${this.targetRemote}\`.`
  }
}

class GitLsRemoteOidMismatchDiff extends GitLsRemoteRefDiffBase {
  public readonly type: GitRefDiffType = GitRefDiffType.OID_MISMATCH

  protected _getMessage(): string {
    const srcRef = this.sourceRef
    const dstRef = this.targetRef
    if (!srcRef || !dstRef) {
      throw new Error('sourceRef or targetRef is not initialized');
    }
    return `OID mismatch for ref \`${srcRef.refname}\`: source has \`${srcRef.oid}\`, target has \`${dstRef.oid}\`.`
  }
}
