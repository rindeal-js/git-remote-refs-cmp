/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
// import { Logger as TsLogger } from 'tslog'
// Define the enum for log levels
// enum LogLevel {
//   Silly = 0,
//   Trace = 1,
//   Debug = 2,
//   Info = 3,
//   Warn = 4,
//   Error = 5,
//   Fatal = 6
// }
// Create the logger instance using the enum
// const Logger = new TsLogger({ 
//   name: '@foo/bar', 
//   minLevel: process.env['RUNNER_DEBUG'] === '1' ? LogLevel.Silly : LogLevel.Fatal 
// })
const Logger = console;
export { Logger,
// LogLevel,
 };
//# sourceMappingURL=Logger.mjs.map