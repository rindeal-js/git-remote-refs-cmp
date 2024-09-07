/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import {
  which,
} from 'Utils'
import {
  GitVersionCommand,
} from './GitCommands/Version'
import {
  GitLsRemoteCommand,
} from './GitCommands/LsRemote'


export {
  GitCommandManager,
}


class GitCommandManager {
  protected gitVersion: string = ''
  protected gitPath: string = ''

  public async init(): Promise<void> {
    this.gitPath = await which('git')
    const versionCmd = new GitVersionCommand(this.gitPath)
    this.gitVersion = await versionCmd.execute()
  }

  public async lsRemote(options: {
    remote?: string,
    branches?: boolean,
    tags?: boolean,
    exitCode?: boolean,
    patterns?: string[]
  }): Promise<string> {
    const lsRemoteCommand = new GitLsRemoteCommand(this.gitPath, options)
    return lsRemoteCommand.execute()
  }
}
