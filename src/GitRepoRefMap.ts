/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import { GitRefMap } from './GitRefMap'

export { GitRepoRefMap }

interface GitRepoRefMap {
  repo? : string
  refMap: GitRefMap
}
