/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import {
  GitCommand,
} from '../GitCommand.mjs'


export {
  GitLsRemoteCommand,
  GitLsRemoteCommandOptions,
}


interface GitLsRemoteCommandOptions {
  branches?: boolean,
  exitCode?: boolean,
  getUrl?: boolean,
  patterns?: string[]
  refs?: boolean,
  remote?: string,
  tags?: boolean,
}

class GitLsRemoteCommand extends GitCommand {
  constructor(gitPath: string, private options: GitLsRemoteCommandOptions) {
    super(gitPath)
  }

  async execute(): Promise<string> {
    const args = ['ls-remote']

    if (this.options.branches) {
      args.push('--heads')
    }
    if (this.options.exitCode) {
      args.push('--exit-code')
    }
    if (this.options.getUrl) {
      args.push('--get-url')
    }
    if (this.options.refs) {
      args.push('--refs')
    }
    if (this.options.tags) {
      args.push('--tags')
    }

    args.push('--')

    if (this.options.remote) {
      if (this.options.remote.startsWith('-')) {
        throw new Error('Invalid remote option')
      }
      args.push(this.options.remote)
    }
    if (this.options.patterns) {
      if ( ! this.options.remote ) {
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
