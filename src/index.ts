/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import {
  GitLsRemoteRefDiff,
} from './GitLsRemoteRefDiff'
import {
  GitRemoteRefsCmp,
} from './GitRemoteRefsCmp'


export type { GitLsRemoteRefDiff } from './GitLsRemoteRefDiff'
export type { GitRemoteRefsCmp } from './GitRemoteRefsCmp'
export type { Logger } from './Logger'


export {
  gitRemoteRefsCmp,
}


async function gitRemoteRefsCmp(sourceRemote: string, targetRemote: string): Promise<GitLsRemoteRefDiff | null> {
  const cmp = new GitRemoteRefsCmp()
  await cmp.init()
  return cmp.compare(sourceRemote, targetRemote)
}
