/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import { GitRefMap } from './GitRefMap'

export { GitRemoteRepoRefMap }

interface GitRemoteRepoRefMap {
  // repo - This parameter can be either a URL or the name of a remote (see the GIT URLS and REMOTES sections of git-fetch[1]).
  repo? : string
  refMap: GitRefMap
}
