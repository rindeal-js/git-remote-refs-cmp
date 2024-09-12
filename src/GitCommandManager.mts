/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import {
  which,
} from './Utils.mjs'
import {
  GitVersionCommand,
} from './GitCommands/Version.mjs'
import {
  GitLsRemoteCommand,
  GitLsRemoteCommandOptions,
} from './GitCommands/LsRemote.mjs'


export {
  GitCommandManager,
}


class GitCommandManager {
  protected gitVersion: string = ''
  protected gitPath: string = ''

  public async init(): Promise<void> {
    this.gitPath = await which('git')
    if ( ! this.gitPath ) {
      throw new Error()
    }
    const versionCmd = new GitVersionCommand(this.gitPath)
    this.gitVersion = await versionCmd.execute()
  }

  public isInitialized(): boolean {
    return (!! this.gitPath)
  }

  public async lsRemote(options: GitLsRemoteCommandOptions): Promise<string> {
    console.assert(this.gitPath)
    const lsRemoteCommand = new GitLsRemoteCommand(this.gitPath, options)
    return lsRemoteCommand.execute()
  }
}
