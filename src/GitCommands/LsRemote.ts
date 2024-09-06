/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import {
  GitCommand,
} from '../GitCommand'


class GitLsRemoteCommand extends GitCommand {
  constructor(gitPath: string, private options: {
    remote?: string,
    branches?: boolean,
    tags?: boolean,
    exitCode?: boolean,
    patterns?: string[]
  }) {
    super(gitPath)
  }

  async execute(): Promise<string> {
    const args = ['ls-remote']

    if (this.options.branches) {
      args.push('--heads')
    }
    if (this.options.tags) {
      args.push('--tags')
    }
    if (this.options.exitCode) {
      args.push('--exit-code')
    }

    args.push('--')

    if (this.options.remote) {
      if (this.options.remote.startsWith('-')) {
        throw new Error('Invalid remote option')
      }
      args.push(this.options.remote)
    }
    if (this.options.patterns) {
      if (!this.options.remote) {
        throw new Error('Option `remote` is needed for option `patterns`')
      }
      for (const pattern of this.options.patterns) {
        if (pattern.startsWith('-')) {
          throw new Error('Invalid pattern option')
        }
        args.push(pattern)
      }
    }

    return this.execGit(args)
  }
}
