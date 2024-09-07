"use strict";
/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitRemoteRefsCmp = void 0;
const GitCommandManager_1 = require("./GitCommandManager");
const GitLsRemoteParser_1 = require("./GitLsRemoteParser");
const GitLsRemoteOutputCmp_1 = require("./GitLsRemoteOutputCmp");
class GitRemoteRefsCmp {
    git;
    parser;
    lsRemoteCmp;
    constructor() {
        this.git = new GitCommandManager_1.GitCommandManager();
        this.parser = new GitLsRemoteParser_1.GitLsRemoteParser();
        this.lsRemoteCmp = new GitLsRemoteOutputCmp_1.GitLsRemoteOutputCmp();
    }
    async init() {
        await this.git.init();
    }
    async processRemote(remote) {
        const rawOutput = await this.git.lsRemote({ remote });
        return this.parser.parse(rawOutput, remote);
    }
    async compare(sourceRemote, targetRemote) {
        console.assert(this.git.isInitialized());
        const promises = [sourceRemote, targetRemote].map(this.processRemote);
        const [source, target] = await Promise.all(promises);
        return this.lsRemoteCmp.compare(source, target);
    }
}
exports.GitRemoteRefsCmp = GitRemoteRefsCmp;
//# sourceMappingURL=GitRemoteRefsCmp.js.map