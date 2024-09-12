/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
import { GitCommand } from '../GitCommand.mjs';
export { GitLsRemoteCommand, GitLsRemoteCommandOptions, };
interface GitLsRemoteCommandOptions {
    branches?: boolean;
    exitCode?: boolean;
    getUrl?: boolean;
    patterns?: string[];
    refs?: boolean;
    remote?: string;
    tags?: boolean;
}
declare class GitLsRemoteCommand extends GitCommand {
    private options;
    constructor(gitPath: string, options: GitLsRemoteCommandOptions);
    execute(): Promise<string>;
}
