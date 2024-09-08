/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
import { GitCommandManager, } from './GitCommandManager.mjs';
import { GitLsRemoteParser, } from './GitLsRemoteParser.mjs';
import { GitLsRemoteOutputCmp, } from './GitLsRemoteOutputCmp.mjs';
// import {
// Logger as libLogger,
// LogLevel,
// } from './Logger.mjs'
import { GitRemoteRefMap, } from './GitRemoteRefMap.mjs';
// import { Logger as TsLogger } from 'tslog'
// if (require.main === module) {
(async () => {
    // libLogger.settings.minLevel = LogLevel.Silly
    // const logger = new TsLogger({name: "main", minLevel: LogLevel.Silly})
    const logger = console;
    // Logger.logLevel = 'silly'
    const git = new GitCommandManager();
    await git.init();
    const parser = new GitLsRemoteParser();
    const lsRemoteCmp = new GitLsRemoteOutputCmp();
    // Smoke test real mirrored repository, should not differ
    const sourceRemote = 'https://git.launchpad.net/beautifulsoup';
    const targetRemote = 'https://github.com/facsimiles/beautifulsoup.git';
    const [source, target] = await Promise.all([sourceRemote, targetRemote].map(async (remote) => parser.parse(await git.lsRemote({ remote }), remote)));
    const diff = await lsRemoteCmp.compare(source, target);
    if (diff) {
        logger.info('The repositories differ:');
        logger.info(diff);
        logger.info(diff.type.toString());
    }
    else {
        logger.info('The repositories are exact clones.');
    }
    const runSmokeTest = async (testName, output1, output2) => {
        logger.debug(''.padStart(79, '-'));
        logger.warn(`Smoke test: ${testName}`);
        const diff = await lsRemoteCmp.compare(output1, output2);
        if (diff) {
            logger.info('The repositories differ:');
            logger.info(diff);
            logger.info(diff.type.toString());
        }
        else {
            logger.info('The repositories are exact clones.');
        }
    };
    // REF_COUNT_MISMATCH
    const oneRefOutput = { remote: 'one-ref-remote', refMap: new GitRemoteRefMap([{ refname: 'one', oid: ''.padStart(40, '0') }]) };
    const twoRefOutput = { remote: 'two-ref-remote', refMap: new GitRemoteRefMap([{ refname: 'one', oid: ''.padStart(40, '0') }, { refname: 'two', oid: ''.padStart(40, '0') }]) };
    await runSmokeTest('REF_COUNT_MISMATCH', oneRefOutput, twoRefOutput);
    // ZERO_REFS
    const emptyOutput = { remote: 'empty-remote', refMap: new GitRemoteRefMap() };
    await runSmokeTest('ZERO_REFS', emptyOutput, emptyOutput);
    // REF_NOT_FOUND
    const fooOutput = { remote: 'foo-remote', refMap: new GitRemoteRefMap([{ refname: 'foo', oid: ''.padStart(40, '0') }]) };
    const barOutput = { remote: 'bar-remote', refMap: new GitRemoteRefMap([{ refname: 'bar', oid: ''.padStart(40, '0') }]) };
    await runSmokeTest('REF_NOT_FOUND', fooOutput, barOutput);
    // OID_MISMATCH
    const fooZeroOutput = { remote: 'foo-zero-remote', refMap: new GitRemoteRefMap([{ refname: 'foo', oid: ''.padStart(40, '0') }]) };
    const fooOneOutput = { remote: 'foo-one-remote', refMap: new GitRemoteRefMap([{ refname: 'foo', oid: ''.padStart(40, '1') }]) };
    await runSmokeTest('OID_MISMATCH', fooZeroOutput, fooOneOutput);
})();
// }
//# sourceMappingURL=main.mjs.map