/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import {
  GitRemoteRefMap,
} from './GitRemoteRef'

export {
  GitLsRemoteOutput,
}

/**
 * Represents the parsed output of the `git ls-remote` command.
 */
interface GitLsRemoteOutput {
  /**
   * The remote repository. This parameter can be either a URL or the name of a remote.
   * Refer to the GIT URLS and REMOTES sections of git-fetch[1] for more details.
   */
  remote: string

  /**
   * A map of references in the remote repository.
   */
  refMap: GitRemoteRefMap
}
