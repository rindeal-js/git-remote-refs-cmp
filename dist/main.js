"use strict";
/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
Object.defineProperty(exports, "__esModule", { value: true });
const GitCommandManager_1 = require("./GitCommandManager");
const GitLsRemoteParser_1 = require("./GitLsRemoteParser");
const GitLsRemoteOutputCmp_1 = require("./GitLsRemoteOutputCmp");
const Logger_1 = require("./Logger");
const GitRemoteRefMap_1 = require("./GitRemoteRefMap");
if (require.main === module) {
    (async () => {
        Logger_1.Logger.logLevel = 'silly';
        const git = new GitCommandManager_1.GitCommandManager();
        await git.init();
        const parser = new GitLsRemoteParser_1.GitLsRemoteParser();
        const lsRemoteCmp = new GitLsRemoteOutputCmp_1.GitLsRemoteOutputCmp();
        // Smoke test real mirrored repository, should not differ
        const sourceRemote = 'https://git.launchpad.net/beautifulsoup';
        const targetRemote = 'https://github.com/facsimiles/beautifulsoup.git';
        const [source, target] = await Promise.all([sourceRemote, targetRemote].map(async (remote) => parser.parse(await git.lsRemote({ remote }), remote)));
        const diff = await lsRemoteCmp.compare(source, target);
        if (diff) {
            Logger_1.Logger.info('The repositories differ:');
            Logger_1.Logger.info(diff);
            Logger_1.Logger.info(diff.type.toString());
        }
        else {
            Logger_1.Logger.info('The repositories are exact clones.');
        }
        const runSmokeTest = async (testName, output1, output2) => {
            Logger_1.Logger.silly(''.padStart(79, '-'));
            Logger_1.Logger.warn(`Smoke test: ${testName}`);
            const diff = await lsRemoteCmp.compare(output1, output2);
            if (diff) {
                Logger_1.Logger.info('The repositories differ:');
                Logger_1.Logger.info(diff);
                Logger_1.Logger.info(diff.type.toString());
            }
            else {
                Logger_1.Logger.info('The repositories are exact clones.');
            }
        };
        // REF_COUNT_MISMATCH
        const oneRefOutput = { remote: 'one-ref-remote', refMap: new GitRemoteRefMap_1.GitRemoteRefMap([{ refname: 'one', oid: ''.padStart(40, '0') }]) };
        const twoRefOutput = { remote: 'two-ref-remote', refMap: new GitRemoteRefMap_1.GitRemoteRefMap([{ refname: 'one', oid: ''.padStart(40, '0') }, { refname: 'two', oid: ''.padStart(40, '0') }]) };
        await runSmokeTest('REF_COUNT_MISMATCH', oneRefOutput, twoRefOutput);
        // ZERO_REFS
        const emptyOutput = { remote: 'empty-remote', refMap: new GitRemoteRefMap_1.GitRemoteRefMap() };
        await runSmokeTest('ZERO_REFS', emptyOutput, emptyOutput);
        // REF_NOT_FOUND
        const fooOutput = { remote: 'foo-remote', refMap: new GitRemoteRefMap_1.GitRemoteRefMap([{ refname: 'foo', oid: ''.padStart(40, '0') }]) };
        const barOutput = { remote: 'bar-remote', refMap: new GitRemoteRefMap_1.GitRemoteRefMap([{ refname: 'bar', oid: ''.padStart(40, '0') }]) };
        await runSmokeTest('REF_NOT_FOUND', fooOutput, barOutput);
        // OID_MISMATCH
        const fooZeroOutput = { remote: 'foo-zero-remote', refMap: new GitRemoteRefMap_1.GitRemoteRefMap([{ refname: 'foo', oid: ''.padStart(40, '0') }]) };
        const fooOneOutput = { remote: 'foo-one-remote', refMap: new GitRemoteRefMap_1.GitRemoteRefMap([{ refname: 'foo', oid: ''.padStart(40, '1') }]) };
        await runSmokeTest('OID_MISMATCH', fooZeroOutput, fooOneOutput);
    })();
}
//# sourceMappingURL=main.js.map