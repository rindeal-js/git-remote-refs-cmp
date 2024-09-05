/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import { Logger } from './Logger'
import { GitRefMap } from './GitRefMap'
import { RefDiff, ZeroRefs, RefCountMismatch, RefNotFound, HashMismatch } from './RefDiff'


export { GitLsRemoteParser }


const gitOidRegExp = /^[0-9a-f]{40}$/
const gitRefRegExp = /^(?:refs\/(?:heads|tags|remotes)\/|HEAD$)/


class GitLsRemoteParser {
  public parse(rawOutput: string): GitRefMap {
    if ( ! rawOutput ) {
      throw new Error("TODO")
    }

    const gitRefMap = new GitRefMap()
      
    for (const line of rawOutput.split('\n')) {
        if ( ! line ) break

        const [hash, name] = line.split('\t')
        if ( ! hash || ! name ) {
          const errorMsg = `Invalid \`git ls-remote\` output line: \`${line}\``
          Logger.error(errorMsg)
          throw new Error(errorMsg)
        }

        if ( ! gitOidRegExp.test(hash) ) {
          const errorMsg = `Invalid Git OID/hash: \`${hash}\``
          Logger.error(errorMsg)
          throw new Error(errorMsg)
        }

        if ( ! gitRefRegExp.test(name) ) {
          const errorMsg = `Invalid Git ref name: \`${name}\``
          Logger.error(errorMsg)
          throw new Error(errorMsg)
        }

        gitRefMap.set(name, hash)
        Logger.silly(`Parsed ref: \`${name}\` with hash: \`${hash}\``)
    }
  }
}


