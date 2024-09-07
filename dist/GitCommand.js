"use strict";
/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitCommand = void 0;
const child_process_1 = require("child_process");
const Logger_1 = require("./Logger");
class GitCommand {
    gitPath;
    constructor(gitPath) {
        this.gitPath = gitPath;
    }
    execGit(args) {
        return new Promise((resolve, reject) => {
            Logger_1.Logger.debug('Executing: ' + [this.gitPath, ...args].map(a => `\`${a}\``).join(' '));
            (0, child_process_1.execFile)(this.gitPath, args, (error, stdout) => {
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
exports.GitCommand = GitCommand;
//# sourceMappingURL=GitCommand.js.map