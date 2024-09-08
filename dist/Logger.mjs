/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
import { pino } from 'pino';
let Logger = pino({ level: 'silent' });
function setLogger(logger) {
    Logger = logger;
}
// const Logger = console
export { Logger, setLogger, };
//# sourceMappingURL=Logger.mjs.map