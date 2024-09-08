/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
export { GitCommand, };
declare abstract class GitCommand {
    protected gitPath: string;
    constructor(gitPath: string);
    abstract execute(): Promise<string>;
    protected execGit(args: string[]): Promise<string>;
}
