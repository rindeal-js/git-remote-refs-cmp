"use strict";
/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitRepo = exports.RefDiff = exports.RefDiffTypes = void 0;
const child_process_1 = require("child_process");
class RefDiffTypes extends String {
    static refCountMismatch = new RefDiffTypes('REF_COUNT_MISMATCH');
    static refNotFound = new RefDiffTypes('REF_NOT_FOUND');
    static hashMismatch = new RefDiffTypes('HASH_MISMATCH');
    static criticalError = new RefDiffTypes('CRITICAL_ERROR');
}
exports.RefDiffTypes = RefDiffTypes;
class RefDiff {
    message = '';
    type = '';
    sourceRefs = [];
    targetRefs = [];
    sourceRef = null;
    targetRef = null;
}
exports.RefDiff = RefDiff;
class GitRepo {
    repoUrl;
    _refs = null;
    refNameIndex = null;
    refHashIndex = null;
    constructor(repoUrl) {
        this.repoUrl = repoUrl;
    }
    async getRefs() {
        if (this._refs) {
            return this._refs;
        }
        else {
            return await this.fetchRefs();
        }
    }
    async fetchRefs() {
        // console.log(`fetchRefs() for \`${this.repoUrl}\``)
        const result = await new Promise((resolve, reject) => {
            if (!this.repoUrl.startsWith("https://")) {
                throw new Error("URL doesn't start with https://: " + this.repoUrl);
            }
            (0, child_process_1.execFile)('git', ['ls-remote', this.repoUrl], {}, (error, stdout /*, stderr*/) => {
                if (error) {
                    // console.error(`Error fetching refs for \`${this.repoUrl}\``)
                    reject(error);
                }
                else {
                    resolve(stdout);
                }
            });
        });
        const refs = result.split('\n')
            .filter(line => line)
            .map(line => {
            const [hash, name] = line.split('\t');
            return { name, hash };
        });
        this._refs = refs;
        return refs;
    }
    async _buildRefIndexes() {
        if (!this._refs) {
            await this.fetchRefs();
        }
        this.refNameIndex = new Map();
        this.refHashIndex = new Map();
        for (const ref of this._refs) {
            this.refNameIndex.set(ref.name, ref);
            this.refHashIndex.set(ref.hash, ref);
        }
    }
    async getRefByName(name) {
        if (!this.refNameIndex) {
            await this._buildRefIndexes();
        }
        return this.refNameIndex.get(name);
    }
    async getRefByHash(hash) {
        if (!this.refHashIndex) {
            await this._buildRefIndexes();
        }
        return this.refHashIndex.get(hash);
    }
    async refsDiffer(targetRepo) {
        const [sourceRefs, targetRefs] = await Promise.all([
            this.getRefs(),
            targetRepo.getRefs(),
        ]);
        const refDiff = new RefDiff();
        refDiff.sourceRefs = sourceRefs;
        refDiff.targetRefs = targetRefs;
        if (sourceRefs.length === 0 || targetRefs.length === 0) {
            refDiff.message = `Critical error: One or both repositories have zero refs.`;
            refDiff.type = RefDiffTypes.criticalError;
            return refDiff;
        }
        if (sourceRefs.length !== targetRefs.length) {
            refDiff.message = `Ref count mismatch: source repo has \`${sourceRefs.length}\` refs, target repo has \`${targetRefs.length}\` refs.`;
            refDiff.type = RefDiffTypes.refCountMismatch;
            return refDiff;
        }
        for (const sourceRef of sourceRefs) {
            const targetRef = await targetRepo.getRefByName(sourceRef.name);
            if (!targetRef) {
                refDiff.message = `Ref not found: \`${sourceRef.name}\` is missing in the target repo.`;
                refDiff.type = RefDiffTypes.refNotFound;
                refDiff.sourceRef = sourceRef;
                return refDiff;
            }
            if (sourceRef.hash !== targetRef.hash) {
                refDiff.message = `Hash mismatch for ref \`${sourceRef.name}\`: source repo has \`${sourceRef.hash}\`, target repo has \`${targetRef.hash}\`.`;
                refDiff.type = RefDiffTypes.hashMismatch;
                refDiff.sourceRef = sourceRef;
                refDiff.targetRef = targetRef;
                return refDiff;
            }
        }
        return null;
    }
}
exports.GitRepo = GitRepo;
if (require.main === module) {
    (async () => {
        const sourceRepo = new GitRepo('https://git.launchpad.net/beautifulsoup');
        const targetRepo = new GitRepo('https://github.com/facsimiles/beautifulsoup.git');
        // inject count mismatch fault
        const sourceRefs = await sourceRepo.getRefs();
        console.log(sourceRefs.pop());
        const diffResult = await sourceRepo.refsDiffer(targetRepo);
        if (diffResult) {
            console.log('The repositories differ:');
            console.log(diffResult);
            console.log(diffResult.type.toString());
        }
        else {
            console.log('The repositories are exact clones.');
        }
    })();
}
//# sourceMappingURL=index.js.map