"use strict";
/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitLsRemoteParser = void 0;
const Logger_1 = require("./Logger");
const GitRemoteRef_1 = require("./GitRemoteRef");
const GitRemoteRefMap_1 = require("./GitRemoteRefMap");
/**
 * Class to parse the output of `git ls-remote`.
 */
class GitLsRemoteParser {
    /**
     * Parses the raw output from `git ls-remote` command.
     *
     * @param rawLsRemoteOutput - The raw output string from `git ls-remote`.
     * @param remote - The remote repository. This parameter can be either a URL or the name of a remote.
     * @returns An object containing the remote and its refs.
     * @throws Will throw an error if the `git ls-remote` output is empty or invalid.
     */
    parse(rawLsRemoteOutput, remote = '') {
        if (!rawLsRemoteOutput) {
            const errorMsg = "The `git ls-remote` output cannot be empty.";
            Logger_1.Logger.error(remote ? `${errorMsg} Remote: \`${remote}\`` : errorMsg);
            throw new Error(errorMsg);
        }
        const refMap = new GitRemoteRefMap_1.GitRemoteRefMap();
        Logger_1.Logger.info(remote ? `Parsing refs for remote: \`${remote}\`` : 'Parsing refs');
        for (const line of rawLsRemoteOutput.split('\n')) {
            if (!line)
                break; // EOF
            const [oid, refname, extraFieldCanary] = line.split('\t');
            if (extraFieldCanary || !oid || !refname) {
                const errorMsg = `Invalid \`git ls-remote\` output line: \`${line}\``;
                Logger_1.Logger.error(remote ? `${errorMsg} Remote: \`${remote}\`` : errorMsg);
                throw new Error(errorMsg);
            }
            let ref;
            try {
                ref = new GitRemoteRef_1.SimpleGitRemoteRef({ refname, oid });
            }
            catch (err) {
                Logger_1.Logger.error(remote ? `${err} Remote: \`${remote}\`` : err);
                throw err;
            }
            Logger_1.Logger.silly(`Parsed ref: \`${ref.refname}\` with oid: \`${ref.oid}\``);
            refMap.setRef(ref);
        }
        const parsedOutput = { remote, refMap };
        Logger_1.Logger.debug(remote ? `Parsed output for remote: \`${remote}\`` : 'Parsed output');
        return parsedOutput;
    }
}
exports.GitLsRemoteParser = GitLsRemoteParser;
//# sourceMappingURL=GitLsRemoteParser.js.map