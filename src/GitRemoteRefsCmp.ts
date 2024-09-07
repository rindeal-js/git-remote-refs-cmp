/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import {
  GitCommandManager,
} from './GitCommandManager'
import {
  GitLsRemoteParser,
} from './GitLsRemoteParser'
import {
  GitLsRemoteOutputCmp,
} from './GitLsRemoteOutputCmp'
import {
  GitLsRemoteOutput,
} from './GitLsRemoteOutput'
import {
  GitLsRemoteRefDiff,
} from './GitLsRemoteRefDiff'


export {
  GitRemoteRefsCmp,
}


class GitRemoteRefsCmp {
  public construct() {
    this.git = new GitCommandManager()
    this.parser = new GitLsRemoteParser()
    this.lsRemoteCmp = new GitLsRemoteOutputCmp()
  }

  public async init() {
    await this.git.init() 
  }

  private async processRemote(remote: string): Promise<GitLsRemoteOutput> {
    const rawOutput = await this.git.lsRemote({remote: sourceRemote})
    return this.parser.parse(rawOutput, remote)
  }
  
  public async compare(sourceRemote: string, targetRemote: string): Promise<GitLsRemoteRefDiff | null> {
    const promises = [sourceRemote, targetRemote].map(this.processRemote)
    [source, target] = await Promise.all(promises)
    return this.lsRemoteCmp.compare(source, target)
  }
}
