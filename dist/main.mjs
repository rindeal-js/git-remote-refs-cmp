/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
import { GitCommandManager, } from './GitCommandManager.mjs';
import { GitLsRemoteParser, } from './GitLsRemoteParser.mjs';
import { GitLsRemoteOutputCmp, } from './GitLsRemoteOutputCmp.mjs';
import { setLogger as setGitRemoteRefsLogger, } from './Logger.mjs';
import { GitRemoteRefMap, } from './GitRemoteRefMap.mjs';
import { colorize as jsonColorize } from 'json-colorizer';
import { pino } from 'pino';
import { PinoPretty } from 'pino-pretty';
const createFormatter = (hex, bold = false) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const colorCode = `\x1b[38;2;${r};${g};${b}m`;
    const boldCode = bold ? '\x1b[1m' : '';
    const resetCode = '\x1b[0m';
    return (str) => `${boldCode}${colorCode}${str}${resetCode}`;
};
const JSON_THEME = {
    Whitespace: (str) => str,
    Brace: createFormatter('#ADD8E6'), // Light Blue
    Bracket: createFormatter('#ADD8E6'), // Light Blue
    Colon: createFormatter('#FF69B4'), // Hot Pink
    Comma: createFormatter('#FF69B4'), // Hot Pink
    StringKey: createFormatter('#FFA500', true), // Bold Orange
    StringLiteral: createFormatter('#00BFFF'), // Deep Sky Blue
    NumberLiteral: createFormatter('#FF4500'), // Orange Red
    BooleanLiteral: createFormatter('#FF4500', true), // Bold Orange Red
    NullLiteral: createFormatter('#FF4500', true), // Bold Orange Red
};
(async () => {
    const startTime = performance.now();
    const LEVELS = {
        default: { label: 'USERLVL', emoji: ' ', colorizer: 'white' },
        60: { label: 'FATAL', emoji: '💀', colorizer: 'magenta' },
        50: { label: 'ERROR', emoji: '❌', colorizer: 'red' },
        40: { label: 'WARN', emoji: '⚠️', colorizer: 'yellow' },
        30: { label: 'INFO', emoji: 'ℹ️', colorizer: 'green' },
        20: { label: 'DEBUG', emoji: '🐛', colorizer: 'blue' },
        10: { label: 'TRACE', emoji: '🔍', colorizer: 'gray' },
    };
    const jsonColorizeOptions = {
        colors: JSON_THEME
    };
    // type Values<T> = T[keyof T];
    // type Values<T> = T[keyof T] extends infer U ? U : never;
    const pretty = PinoPretty({
        colorize: true,
        colorizeObjects: true,
        ignore: [
            'pid',
            'hostname',
            'module',
        ].join(),
        // @no-ts-expect-error The custom prettifier extras, currently define only `colors`, not eg. `label` etc.
        customPrettifiers: {
            time: () => `+${((performance.now() - startTime) / 1000).toFixed(3)}s`,
            // @ts-expect-error Throws an error for some reason
            level: (_logLevel, _k, log) => LEVELS[log.level].emoji || '❓',
            // @ts-expect-error dsfsdf
            diff: (diff) => jsonColorize(diff, jsonColorizeOptions)
        },
        messageFormat: (log, messageKey, _lL, { colors }) => {
            // @ts-expect-error sdfsd
            const color = LEVELS[log.level].colorizer || 'white';
            // @ts-expect-error sdfsd
            return colors[color](log[messageKey]);
        }
    });
    const logger = pino({
        level: 'trace',
    }, pretty);
    const childLogger = logger.child({ module: '@foo/bar' });
    setGitRemoteRefsLogger(childLogger);
    const git = new GitCommandManager();
    await git.init();
    const parser = new GitLsRemoteParser();
    const lsRemoteCmp = new GitLsRemoteOutputCmp();
    // Smoke test real mirrored repository, should not differ
    const sourceRemote = 'https://git.launchpad.net/beautifulsoup';
    const targetRemote = 'https://github.com/facsimiles/beautifulsoup.git';
    const [source, target] = await Promise.all([sourceRemote, targetRemote].map(async (remote) => parser.parse(await git.lsRemote({ remote }), remote)));
    const logDiff = (diff) => {
        if (diff) {
            logger.info('The repositories differ:');
            logger.info({ diff });
            logger.info(diff.type.toString());
        }
        else {
            logger.info('The repositories are exact clones.');
        }
    };
    const diff = await lsRemoteCmp.compare(source, target);
    logDiff(diff);
    const runSmokeTest = async (testName, output1, output2) => {
        logger.debug(''.padStart(79, '-'));
        logger.warn(`Smoke test: ${testName}`);
        const diff = await lsRemoteCmp.compare(output1, output2);
        logDiff(diff);
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
//# sourceMappingURL=main.mjs.map