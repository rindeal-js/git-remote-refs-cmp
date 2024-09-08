/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
import { which, } from './Utils.mjs';
import { GitVersionCommand, } from './GitCommands/Version.mjs';
import { GitLsRemoteCommand, } from './GitCommands/LsRemote.mjs';
export { GitCommandManager, };
class GitCommandManager {
    gitVersion = '';
    gitPath = '';
    async init() {
        this.gitPath = await which('git');
        if (!this.gitPath) {
            throw new Error();
        }
        const versionCmd = new GitVersionCommand(this.gitPath);
        this.gitVersion = await versionCmd.execute();
    }
    isInitialized() {
        return (!!this.gitPath);
    }
    async lsRemote(options) {
        console.assert(this.gitPath);
        const lsRemoteCommand = new GitLsRemoteCommand(this.gitPath, options);
        return lsRemoteCommand.execute();
    }
}
//# sourceMappingURL=GitCommandManager.mjs.map