/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
import { GitCommandManager, } from './GitCommandManager.mjs';
import { GitLsRemoteParser, } from './GitLsRemoteParser.mjs';
import { GitLsRemoteOutputCmp, } from './GitLsRemoteOutputCmp.mjs';
export { GitRemoteRefsCmp, };
class GitRemoteRefsCmp {
    git;
    parser;
    lsRemoteCmp;
    constructor() {
        this.git = new GitCommandManager();
        this.parser = new GitLsRemoteParser();
        this.lsRemoteCmp = new GitLsRemoteOutputCmp();
    }
    async init() {
        await this.git.init();
    }
    isInitialized() {
        return this.git.isInitialized();
    }
    async ensureIsInitialized() {
        if (!this.isInitialized()) {
            await this.init();
        }
    }
    async processRemote(remote) {
        const rawOutput = await this.git.lsRemote({ remote });
        return this.parser.parse(rawOutput, remote);
    }
    async compare(sourceRemote, targetRemote) {
        await this.ensureIsInitialized();
        const [source, target] = await Promise.all([sourceRemote, targetRemote].map(this.processRemote));
        return this.lsRemoteCmp.compare(source, target);
    }
}
//# sourceMappingURL=GitRemoteRefsCmp.mjs.map