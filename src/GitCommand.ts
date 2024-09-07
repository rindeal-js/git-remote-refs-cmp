/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import {
  execFile,
  // exec,
} from 'child_process'
import {
  Logger
} from './Logger'


export {
  GitCommand,
}


abstract class GitCommand {
  constructor(protected gitPath: string) {}

  abstract execute(): Promise<string>

  protected execGit(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      Logger.debug('Executing: ' + [this.gitPath, ...args].map(a => `\`${a}\``).join(' '))
      execFile(this.gitPath, args, (error, stdout) => {
      // exec(`sleep 10 && ${[this.gitPath, ...args].join(' ')}`, (error, stdout) => {
        if (error) {
          reject(error)
        } else {
          resolve(stdout)
        }
      })
    })
  }
}
