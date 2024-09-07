"use strict";
/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitVersionCommand = void 0;
const GitCommand_1 = require("../GitCommand");
const Logger_1 = require("../Logger");
class GitVersionCommand extends GitCommand_1.GitCommand {
    static versionRegex = /git version (?<version>\d+\.\d+\.\d+)/;
    async execute() {
        const versionOutput = await this.execGit(['version']);
        const versionMatch = versionOutput.match(GitVersionCommand.versionRegex);
        if (!versionMatch || !versionMatch.groups) {
            throw new Error('Unable to determine Git version');
        }
        Logger_1.Logger.debug(`Git version is \`${versionMatch.groups['version']}\``);
        return versionMatch[1];
    }
}
exports.GitVersionCommand = GitVersionCommand;
//# sourceMappingURL=Version.js.map