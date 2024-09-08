/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
import { GitCommand } from '../GitCommand.mjs';
export { GitVersionCommand, };
declare class GitVersionCommand extends GitCommand {
    private static readonly versionRegex;
    execute(): Promise<string>;
}
