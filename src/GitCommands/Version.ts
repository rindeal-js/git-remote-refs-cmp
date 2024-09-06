/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import {
  GitCommand,
} from '../GitCommand'


class GitVersionCommand extends GitCommand {
  private static readonly versionRegex = /git version (\d+\.\d+\.\d+)/

  public async execute(): Promise<string> {
    const versionOutput = await this.execGit(['version'])
    const versionMatch = versionOutput.match(GitVersionCommand.versionRegex)
    if ( ! versionMatch ) {
      throw new Error('Unable to determine Git version')
    }
    return versionMatch[1]
  }
}
