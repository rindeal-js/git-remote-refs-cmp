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
  GitLsRemoteOutputCmp,
}


class GitLsRemoteOutputCmp {
  public async compare(source: GitLsRemoteOutput, target: GitLsRemoteOutput): Promise<GitLsRemoteRefDiff | null> {
    Logger.trace(`Differ.diff() called`)

    if ( source.refMap.size === 0 || target.refMap.size === 0 ) {
      const refDiff = new GitLsRemoteZeroRefsDiff({ source, target })
      Logger.error(await refDiff.message)
      return refDiff
    }

    if ( source.refMap.size !== target.refMap.size ) {
      const refDiff = new GitLsRemoteRefCountMismatchDiff({ source, target })
      Logger.warn(await refDiff.message)
      return refDiff
    }

    for (const sourceRef of source.refMap.refs()) {
      const targetRef = target.refMap.getRef(sourceRef.refname)
      if ( ! targetRef ) {
        const refDiff = new GitLsRemoteRefNotFoundDiff({ source, target, sourceRef })
        Logger.warn(await refDiff.message)
        return refDiff
      }
      if ( sourceRef.oid !== targetRef.oid ) {
        const refDiff = new GitLsRemoteOidMismatchDiff({ source, target, sourceRef, targetRef })
        Logger.warn(await refDiff.message)
        return refDiff
      }
    }

    Logger.info(`No differences found`)
    return null
  }
}
