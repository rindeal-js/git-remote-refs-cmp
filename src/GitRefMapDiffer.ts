/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import { Logger } from './Logger'
import { GitRefMap } from './GitRefMap'
import { RefDiff , ZeroRefs , RefCountMismatch , RefNotFound , HashMismatch } from './RefDiff'


export { GitRefMapDiffer }


class GitRefMapDiffer {
  async diff(sourceRefs: GitRefMap, targetRefs: GitRefMap): Promise<RefDiff | null> {
    Logger.trace(`Differ.diff() called`)

    if ( sourceRefs.length === 0 || targetRefs.length === 0 ) {
      const refDiff = new ZeroRefs({ source, target })
      Logger.error(await refDiff.getMessage())
      return refDiff
    }

    if ( sourceRefs.length !== targetRefs.length ) {
      const refDiff = new RefCountMismatch({ source, target })
      Logger.warn(await refDiff.getMessage())
      return refDiff
    }

    for (const [sourceRefName, sourceRefHash] of sourceRefs.entries()) {
      const targetRefHash = targetRefs.get(sourceRefName)
      if ( ! targetRefHash ) {
        const refDiff = new RefNotFound({ source, target, sourceRef })
        Logger.warn(await refDiff.getMessage())
        return refDiff
      }
      if ( sourceRefHash !== targetRefHash ) {
        const refDiff = new HashMismatch({ source, target, sourceRef, targetRef })
        Logger.warn(await refDiff.getMessage())
        return refDiff
      }
    }
    Logger.info(`No differences found`)
    return null
  }
}
