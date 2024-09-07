"use strict";
/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
// Logger.silly(), Logger.trace(), Logger.debug(), Logger.info(), Logger.warn(), Logger.error(), Logger.fatal()
class Logger {
    static logLevel = process.env['RUNNER_DEBUG'] === '1' ? 'silly' : 'fatal';
    static log(level, message) {
        if (!Logger.shouldLog(level))
            return;
        const color = Logger.getColor(level);
        const emoji = Logger.getEmoji(level);
        const levelStr = `[${level.toUpperCase()}]`;
        const isString = typeof message === 'string';
        const logFunction = ['error', 'fatal'].includes(level) ? console.error : console.log;
        logFunction(`${color}${emoji} ${levelStr} %s${Logger.getColor('')}`, isString ? message : '', isString ? '' : message);
    }
    static silly(message) {
        Logger.log('silly', message);
    }
    static trace(message) {
        Logger.log('trace', message);
    }
    static debug(message) {
        Logger.log('debug', message);
    }
    static info(message) {
        Logger.log('info', message);
    }
    static warn(message) {
        Logger.log('warn', message);
    }
    static error(message) {
        Logger.log('error', message);
    }
    static fatal(message) {
        Logger.log('fatal', message);
    }
    static shouldLog(level) {
        const levels = ['silly', 'trace', 'debug', 'info', 'warn', 'error', 'fatal'];
        return levels.indexOf(level) >= levels.indexOf(Logger.logLevel);
    }
    static getColor(level) {
        switch (level) {
            case 'silly': return '\x1b[35m'; // Magenta
            case 'trace': return '\x1b[34m'; // Blue
            case 'debug': return '\x1b[36m'; // Cyan
            case 'info': return '\x1b[32m'; // Green
            case 'warn': return '\x1b[33m'; // Yellow
            case 'error': return '\x1b[31m'; // Red
            case 'fatal': return '\x1b[41m'; // Red background
            default: return '\x1b[0m'; // Reset
        }
    }
    static getEmoji(level) {
        switch (level) {
            case 'silly': return '🤪';
            case 'trace': return '🔍';
            case 'debug': return '🐛';
            case 'info': return 'ℹ️ ';
            case 'warn': return '⚠️ ';
            case 'error': return '❌';
            case 'fatal': return '💀';
            default: return '';
        }
    }
}
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map