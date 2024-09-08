/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
import { GitLsRemoteOutput } from './GitLsRemoteOutput.mjs';
export { GitLsRemoteParser, };
/**
 * Class to parse the output of `git ls-remote`.
 */
declare class GitLsRemoteParser {
    /**
     * Parses the raw output from `git ls-remote` command.
     *
     * @param rawLsRemoteOutput - The raw output string from `git ls-remote`.
     * @param remote - The remote repository. This parameter can be either a URL or the name of a remote.
     * @returns An object containing the remote and its refs.
     * @throws Will throw an error if the `git ls-remote` output is empty or invalid.
     */
    parse(rawLsRemoteOutput: string, remote?: string): GitLsRemoteOutput;
}
