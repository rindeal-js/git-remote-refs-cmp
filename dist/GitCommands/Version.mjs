/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
import { GitCommand, } from '../GitCommand.mjs';
import { Logger, } from '../Logger.mjs';
export { GitVersionCommand, };
class GitVersionCommand extends GitCommand {
    static versionRegex = /git version (?<version>\d+\.\d+\.\d+)/;
    async execute() {
        const versionOutput = await this.execGit(['version']);
        const versionMatch = versionOutput.match(GitVersionCommand.versionRegex);
        if (!versionMatch || !versionMatch.groups) {
            throw new Error('Unable to determine Git version');
        }
        Logger.debug(`Git version is \`${versionMatch.groups['version']}\``);
        return versionMatch.groups['version'];
    }
}
//# sourceMappingURL=Version.mjs.map