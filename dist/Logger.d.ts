/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
export { Logger, };
declare class Logger {
    static logLevel: string;
    static log(level: string, message: unknown): void;
    static silly(message: unknown): void;
    static trace(message: unknown): void;
    static debug(message: unknown): void;
    static info(message: unknown): void;
    static warn(message: unknown): void;
    static error(message: unknown): void;
    static fatal(message: unknown): void;
    static shouldLog(level: string): boolean;
    static getColor(level: string): string;
    static getEmoji(level: string): string;
}
