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
  Logger,
} from './Logger'
import { GitRemoteRefMap } from './GitRemoteRefMap'


if (require.main === module) {
  (async () => {
    Logger.logLevel = 'silly'

    const git = new GitCommandManager()
    await git.init()
    const parser = new GitLsRemoteParser()
    const lsRemoteCmp = new GitLsRemoteOutputCmp()

    // Smoke test real mirrored repository, should not differ

    const sourceRemote = 'https://git.launchpad.net/beautifulsoup'
    const targetRemote = 'https://github.com/facsimiles/beautifulsoup.git'

    const [source, target] = await Promise.all(
      [sourceRemote, targetRemote].map(async (remote) =>
        parser.parse(await git.lsRemote({ remote }), remote)
      )
    )

    const diff = await lsRemoteCmp.compare(source, target)
    if (diff) {
      Logger.info('The repositories differ:')
      Logger.info(diff)
      Logger.info(diff.type.toString())
    } else {
      Logger.info('The repositories are exact clones.')
    }

    const runSmokeTest = async (testName: string, output1: GitLsRemoteOutput, output2: GitLsRemoteOutput) => {
      Logger.silly(''.padStart(79, '-'))
      Logger.warn(`Smoke test: ${testName}`)
      const diff = await lsRemoteCmp.compare(output1, output2)
      if (diff) {
        Logger.info('The repositories differ:')
        Logger.info(diff)
        Logger.info(diff.type.toString())
      } else {
        Logger.info('The repositories are exact clones.')
      }
    }

    // REF_COUNT_MISMATCH
    const oneRefOutput: GitLsRemoteOutput = { remote: 'one-ref-remote', refMap: new GitRemoteRefMap([{ refname: 'one', oid: ''.padStart(40, '0') }]) }
    const twoRefOutput: GitLsRemoteOutput = { remote: 'two-ref-remote', refMap: new GitRemoteRefMap([{ refname: 'one', oid: ''.padStart(40, '0') }, { refname: 'two', oid: ''.padStart(40, '0') }]) }
    await runSmokeTest('REF_COUNT_MISMATCH', oneRefOutput, twoRefOutput)

    // ZERO_REFS
    const emptyOutput: GitLsRemoteOutput = { remote: 'empty-remote', refMap: new GitRemoteRefMap() }
    await runSmokeTest('ZERO_REFS', emptyOutput, emptyOutput)

    // REF_NOT_FOUND
    const fooOutput: GitLsRemoteOutput = { remote: 'foo-remote', refMap: new GitRemoteRefMap([{ refname: 'foo', oid: ''.padStart(40, '0') }]) }
    const barOutput: GitLsRemoteOutput = { remote: 'bar-remote', refMap: new GitRemoteRefMap([{ refname: 'bar', oid: ''.padStart(40, '0') }]) }
    await runSmokeTest('REF_NOT_FOUND', fooOutput, barOutput)

    // OID_MISMATCH
    const fooZeroOutput: GitLsRemoteOutput = { remote: 'foo-zero-remote', refMap: new GitRemoteRefMap([{ refname: 'foo', oid: ''.padStart(40, '0') }]) }
    const fooOneOutput: GitLsRemoteOutput = { remote: 'foo-one-remote', refMap: new GitRemoteRefMap([{ refname: 'foo', oid: ''.padStart(40, '1') }]) }
    await runSmokeTest('OID_MISMATCH', fooZeroOutput, fooOneOutput)
  })()
}
