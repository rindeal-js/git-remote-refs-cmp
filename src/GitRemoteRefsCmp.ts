/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import {
  Logger,
} from './Logger'
import {
  GitLsRemoteOutput,
} from './GitLsRemoteOutput'
import {
  GitLsRemoteRefDiff,
  GitLsRemoteZeroRefsDiff,
  GitLsRemoteRefCountMismatchDiff,
  GitLsRemoteRefNotFoundDiff,
  GitLsRemoteOidMismatchDiff,
} from './GitLsRemoteRefDiff'


export {
  GitRemoteRefsCmp,
}


class GitRemoteRefsCmp {
  public async lsRemoteOutputCmp(source: GitLsRemoteOutput, target: GitLsRemoteOutput): Promise<GitLsRemoteRefDiff | null> {
    Logger.trace(`Differ.diff() called`)

    if ( source.refMap.length === 0 || target.refMap.length === 0 ) {
      const refDiff = new GitLsRemoteZeroRefsDiff({ source, target })
      Logger.error(await refDiff.getMessage())
      return refDiff
    }

    if ( source.refMap.length !== target.refMap.length ) {
      const refDiff = new GitLsRemoteRefCountMismatchDiff({ source, target })
      Logger.warn(await refDiff.getMessage())
      return refDiff
    }

    for (const sourceRef of source.refMap.refs()) {
      const targetRef = target.refMap.getRef(sourceRef.refname)
      if ( ! targetRef ) {
        const refDiff = new GitLsRemoteRefNotFoundDiff({ source, target, sourceRef })
        Logger.warn(await refDiff.getMessage())
        return refDiff
      }
      if ( sourceRef.oid !== targetRef.oid ) {
        const refDiff = new GitLsRemoteOidMismatchDiff({ source, target, sourceRef, targetRef })
        Logger.warn(await refDiff.getMessage())
        return refDiff
      }
    }

    Logger.info(`No differences found`)
    return null
  }
}
