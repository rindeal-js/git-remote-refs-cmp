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


export type {
  GitCommandManager,
} from './GitCommandManager'
export type {
  GitLsRemoteOutput,
} from './GitLsRemoteOutput'
export type {
  GitLsRemoteOutputCmp,
} from './GitLsRemoteOutputCmp'
export type {
  GitLsRemoteParser,
} from './GitLsRemoteParser'
export type {
  GitLsRemoteRefDiff,
  GitLsRemoteZeroRefsDiff,
  GitLsRemoteRefCountMismatchDiff,
  GitLsRemoteRefNotFoundDiff,
  GitLsRemoteOidMismatchDiff,
} from './GitLsRemoteRefDiff'
export type {
  GitRefDiff,
} from './GitRefDiff'
export type {
  GitRefDiffType,
} from './GitRefDiffType'
export type {
  GitRemoteRefsCmp,
} from './GitRemoteRefsCmp'
export type {
  Logger,
} from './Logger'


export {
  gitRemoteRefsCmp,
}


async function gitRemoteRefsCmp(sourceRemote: string, targetRemote: string): Promise<GitLsRemoteRefDiff | null> {
  const cmp = new GitRemoteRefsCmp()
  await cmp.init()
  return cmp.compare(sourceRemote, targetRemote)
}
