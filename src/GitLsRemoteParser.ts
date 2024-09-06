/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import {
  Logger,
} from './Logger'
import {
  GitRemoteRef,
  GitRemoteRefMap,
  GitRemoteRefBase,
  SimpleGitRemoteRef,
} from './GitRemoteRef'
import {
  RefDiff,
  ZeroRefs,
  RefCountMismatch,
  RefNotFound,
  HashMismatch,
} from './RefDiff'


export {
  GitLsRemoteParser,
}


class GitLsRemoteParser {
  public parse(rawLsRemoteOutput: string, remote: string = ''): GitRemoteRefMap {
    if ( ! rawLsRemoteOutput ) {
      throw new Error("The `git ls-remote` output cannot be empty.")
    }

    const refMap = new GitRemoteRefMap()
      
    for (const line of rawLsRemoteOutput.split('\n')) {
        if ( ! line ) break  // EOF

        const [oid, refname] = line.split('\t')
        if ( ! oid || ! refname ) {
          const errorMsg = `Invalid \`git ls-remote\` output line: \`${line}\``
          Logger.error(errorMsg)
          throw new Error(errorMsg)
        }
        if ( ! GitRemoteRefBase.validateOid(oid) ) {
          const errorMsg = `Invalid Git OID/hash: \`${oid}\``
          Logger.error(errorMsg)
          throw new Error(errorMsg)
        }

        if ( ! GitRemoteRefBase.validateRefName(refname) ) {
          const errorMsg = `Invalid Git ref name: \`${refname}\``
          Logger.error(errorMsg)
          throw new Error(errorMsg)
        }

        const ref: GitRemoteRef = new SimpleGitRemoteRef({refname, oid})
        Logger.silly(`Parsed ref: \`${ref.refname}\` with oid: \`${ref.oid}\``)

        refMap.setRef(ref)
    }

    return refMap
  }
}


