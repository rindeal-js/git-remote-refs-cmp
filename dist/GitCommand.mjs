/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
import { execFile,
// exec,
 } from 'child_process';
import { Logger } from './Logger.mjs';
export { GitCommand, };
class GitCommand {
    gitPath;
    constructor(gitPath) {
        this.gitPath = gitPath;
    }
    execGit(args) {
        return new Promise((resolve, reject) => {
            Logger.debug('Executing: ' + [this.gitPath, ...args].map(a => `\`${a}\``).join(' '));
            execFile(this.gitPath, args, (error, stdout) => {
                // exec(`sleep 10 && ${[this.gitPath, ...args].join(' ')}`, (error, stdout) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(stdout);
                }
            });
        });
    }
}
//# sourceMappingURL=GitCommand.mjs.map