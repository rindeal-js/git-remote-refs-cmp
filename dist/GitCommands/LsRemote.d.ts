/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
import { GitCommand } from '../GitCommand';
export { GitLsRemoteCommand, };
declare class GitLsRemoteCommand extends GitCommand {
    private options;
    constructor(gitPath: string, options: {
        remote?: string;
        branches?: boolean;
        tags?: boolean;
        exitCode?: boolean;
        patterns?: string[];
    });
    execute(): Promise<string>;
}
