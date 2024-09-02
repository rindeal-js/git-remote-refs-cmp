"use strict";
/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitRepo = exports.RefDiff = exports.RefDiffTypes = exports.Ref = void 0;
const child_process_1 = require("child_process");
class Ref {
    name;
    hash;
    constructor(name, hash) {
        this.name = name;
        this.hash = hash;
    }
}
exports.Ref = Ref;
class RefDiffTypes {
    static refCountMismatch = new RefDiffTypes('REF_COUNT_MISMATCH');
    static refNotFound = new RefDiffTypes('REF_NOT_FOUND');
    static hashMismatch = new RefDiffTypes('HASH_MISMATCH');
    static criticalError = new RefDiffTypes('CRITICAL_ERROR');
    name;
    constructor(name) {
        this.name = name;
    }
    toString() {
        return this.name;
    }
}
exports.RefDiffTypes = RefDiffTypes;
class RefDiff {
    message;
    type;
    sourceRefs;
    targetRefs;
    sourceRef;
    targetRef;
    constructor(message, type, sourceRefs, targetRefs, sourceRef, targetRef) {
        this.message = message;
        this.type = type;
        this.sourceRefs = sourceRefs;
        this.targetRefs = targetRefs;
        this.sourceRef = sourceRef;
        this.targetRef = targetRef;
    }
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
            (0, child_process_1.execFile)('git', ['ls-remote', this.repoUrl], (error, stdout, stderr) => {
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
            return new Ref(name, hash);
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
        if (sourceRefs.length === 0 || targetRefs.length === 0) {
            return new RefDiff(`Critical error: One or both repositories have zero refs.`, RefDiffTypes.criticalError, sourceRefs, targetRefs, null, null);
        }
        if (sourceRefs.length !== targetRefs.length) {
            return new RefDiff(`Ref count mismatch: source repo has \`${sourceRefs.length}\` refs, target repo has \`${targetRefs.length}\` refs.`, RefDiffTypes.refCountMismatch, sourceRefs, targetRefs, null, null);
        }
        for (const sourceRef of sourceRefs) {
            const targetRef = await targetRepo.getRefByName(sourceRef.name);
            if (!targetRef) {
                return new RefDiff(`Ref not found: \`${sourceRef.name}\` is missing in the target repo.`, RefDiffTypes.refNotFound, sourceRefs, targetRefs, sourceRef, null);
            }
            if (sourceRef.hash !== targetRef.hash) {
                return new RefDiff(`Hash mismatch for ref \`${sourceRef.name}\`: source repo has \`${sourceRef.hash}\`, target repo has \`${targetRef.hash}\`.`, RefDiffTypes.hashMismatch, sourceRefs, targetRefs, sourceRef, targetRef);
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
        }
        else {
            console.log('The repositories are exact clones.');
        }
    })();
}
//# sourceMappingURL=index.js.map