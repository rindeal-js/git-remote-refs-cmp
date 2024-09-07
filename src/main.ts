/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import {
  GitCommandManager,
} from './GitCommandManager'
import {
  GitLsRemoteParser,
} from './GitLsRemoteParser'
import {
  GitLsRemoteOutputCmp,
} from './GitLsRemoteOutputCmp'
import {
  GitLsRemoteOutput,
} from './GitLsRemoteOutput'
import {
  GitLsRemoteRefDiff,
} from './GitLsRemoteRefDiff'
import {
  Logger,
} from './Logger'


if ( require.main === module ) {
  (async () => {
    Logger.logLevel = 'silly'

    git = new GitCommandManager()
    await git.init()
    parser = new GitLsRemoteParser()
    lsRemoteCmp = new GitLsRemoteOutputCmp()

    const [source, target] = Promise.all(
      [sourceRemote, targetRemote]
        .map(async (remote) =>
          parser.parse(await git.lsRemote({remote}), remote)
        )
    )

    // inject count mismatch fault
    const refnameToDelete = source.refMap.refnames()[0]
    source.refMap.delete(refnameToDelete)
    Logger.debug(`Injected fault by removing ref: \`${refnameToDelete}\``)

    const diff = lsRemoteCmp.compare(source, target)
    if ( diff ) {
      Logger.info('The repositories differ:')
      Logger.info(diff)
      Logger.info(diff.type.toString())
    } else {
      Logger.info('The repositories are exact clones.')
    }
  })()
}  
