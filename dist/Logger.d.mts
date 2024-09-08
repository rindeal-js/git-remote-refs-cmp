/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
import { Logger as PinoLogger } from 'pino';
declare let Logger: PinoLogger<never, boolean>;
declare function setLogger(logger: PinoLogger): void;
export { Logger, setLogger, };
