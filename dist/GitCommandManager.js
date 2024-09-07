"use strict";
/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitCommandManager = void 0;
const Utils_1 = require("./Utils");
const Version_1 = require("./GitCommands/Version");
const LsRemote_1 = require("./GitCommands/LsRemote");
class GitCommandManager {
    gitVersion = '';
    gitPath = '';
    async init() {
        this.gitPath = await (0, Utils_1.which)('git');
        if (!this.gitPath) {
            throw new Error();
        }
        const versionCmd = new Version_1.GitVersionCommand(this.gitPath);
        this.gitVersion = await versionCmd.execute();
    }
    isInitialized() {
        return (!!this.gitPath);
    }
    async lsRemote(options) {
        console.assert(this.gitPath);
        const lsRemoteCommand = new LsRemote_1.GitLsRemoteCommand(this.gitPath, options);
        return lsRemoteCommand.execute();
    }
}
exports.GitCommandManager = GitCommandManager;
//# sourceMappingURL=GitCommandManager.js.map