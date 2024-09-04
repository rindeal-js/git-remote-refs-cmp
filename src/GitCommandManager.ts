/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import { execFile } from 'child_process'


export class GitCommandManager {
  gitVersion: string

  async initialize() {
    const versionOutput = await this.execGit(['version'])
    const versionMatch = versionOutput.match(/git version (\d+\.\d+\.\d+)/)
    if ( ! versionMatch ) {
      throw new Error('Unable to determine Git version')
    }
    this.gitVersion = versionMatch[1]
  }

  async execGit(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      execFile('git', args, (error, stdout) => {
        if ( error ) {
          reject(error)
        } else {
          resolve(stdout)
        }
      })
    })
  }

  async lsRemote(options: {
    repository?: string,
    branches?: boolean,
    tags?: boolean,
    exitCode?: boolean,
    patterns?: string[]
  }): Promise<string> {
    const args = ['ls-remote']

    if ( options.branches ) {
      args.push('--heads')
    }
    if ( options.tags ) {
      args.push('--tags')
    }
    if ( options.exitCode ) {
      args.push('--exit-code')
    }

    args.push('--')

    if ( options.repository ) {
      if ( options.repository.startsWith('-') ) {
        throw new Error('Invalid repository option')
      }
      args.push(options.repository)
    }
    if ( options.patterns ) {
      if ( ! options.repository ) {
        throw new Error('Option `repository` is needed for option `patterns`')
      }
      for (const pattern of options.patterns) {
        if ( pattern.startsWith('-') ) {
          throw new Error('Invalid pattern option')
        }
        args.push(pattern)
      }
    }

    return this.execGit(args)
  }
}
