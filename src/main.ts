/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import { Logger } from './logger'
import { Repo } from './repo'


if ( require.main === module ) {
  (async () => {
    Logger.logLevel = 'silly'

    const sourceRepo = new Repo('https://git.launchpad.net/beautifulsoup')
    const targetRepo = new Repo('https://github.com/facsimiles/beautifulsoup.git')

    // inject count mismatch fault
    const sourceRefs = await sourceRepo.getRefs()
    Logger.debug(`Injected fault by removing ref: \`${sourceRefs.pop()?.name}\``)

    const diffResult = await sourceRepo.refsDiffer(targetRepo)
    if ( diffResult ) {
    Logger.info('The repositories differ:')
    Logger.info(diffResult)
    Logger.info(diffResult.type.toString())
    } else {
    Logger.info('The repositories are exact clones.')
    }
  })()
}  