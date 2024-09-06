/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

export {
  GitCommand,
}

abstract class GitCommand {
  constructor(protected gitPath: string) {}

  abstract execute(): Promise<string>

  protected execGit(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      execFile(this.gitPath, args, (error, stdout) => {
        if (error) {
          reject(error)
        } else {
          resolve(stdout)
        }
      })
    })
  }
}
