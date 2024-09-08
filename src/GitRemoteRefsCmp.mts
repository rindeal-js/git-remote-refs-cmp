/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import {
  GitCommandManager,
} from './GitCommandManager.mjs'
import {
  GitLsRemoteParser,
} from './GitLsRemoteParser.mjs'
import {
  GitLsRemoteOutputCmp,
} from './GitLsRemoteOutputCmp.mjs'
import {
  GitLsRemoteOutput,
} from './GitLsRemoteOutput.mjs'
import {
  GitLsRemoteRefDiff,
} from './GitLsRemoteRefDiff.mjs'


export {
  GitRemoteRefsCmp,
}


class GitRemoteRefsCmp {
  git: GitCommandManager
  parser: GitLsRemoteParser
  lsRemoteCmp: GitLsRemoteOutputCmp

  public constructor() {
    this.git = new GitCommandManager()
    this.parser = new GitLsRemoteParser()
    this.lsRemoteCmp = new GitLsRemoteOutputCmp()
  }

  public async init() {
    await this.git.init() 
  }

  public isInitialized(): boolean {
    return this.git.isInitialized()
  }

  public async ensureIsInitialized() {
    if ( ! this.isInitialized() ) {
      await this.init()
    }
  }

  private async processRemote(remote: string): Promise<GitLsRemoteOutput> {
    const rawOutput = await this.git.lsRemote({ remote })
    return this.parser.parse(rawOutput, remote)
  }

  public async compare(sourceRemote: string, targetRemote: string): Promise<GitLsRemoteRefDiff | null> {
    await this.ensureIsInitialized()
    const [source, target] = await Promise.all(
      [sourceRemote, targetRemote].map(this.processRemote)
    )
    return this.lsRemoteCmp.compare(source, target)
  }
}
