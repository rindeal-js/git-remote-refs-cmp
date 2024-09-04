"use strict";
/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Repo = exports.HashMismatch = exports.RefNotFound = exports.RefCountMismatch = exports.ZeroRefs = exports.RefDiff = void 0;
const logger_1 = require("./logger");
const child_process_1 = require("child_process");
class RefDiff {
    type = 'NO_TYPE';
    sourceRepo;
    targetRepo;
    sourceRef;
    targetRef;
    constructor(init) {
        this.sourceRepo = init.sourceRepo;
        this.targetRepo = init.targetRepo;
        this.sourceRef = init.sourceRef;
        this.targetRef = init.targetRef;
    }
    getMessage() { throw new Error("Method not implemented."); }
}
exports.RefDiff = RefDiff;
class ZeroRefs extends RefDiff {
    type = 'ZERO_REFS';
    async getMessage() {
        const srcUrl = this.sourceRepo.url;
        const dstUrl = this.targetRepo.url;
        const srcRefsLen = (await this.sourceRepo.getRefs()).length;
        const dstRefsLen = (await this.targetRepo.getRefs()).length;
        return `Zero refs: \`${srcUrl}\` has \`${srcRefsLen}\` refs, \`${dstUrl}\` has \`${dstRefsLen}\` refs.`;
    }
}
exports.ZeroRefs = ZeroRefs;
class RefCountMismatch extends RefDiff {
    type = 'REF_COUNT_MISMATCH';
    async getMessage() {
        const srcUrl = this.sourceRepo.url;
        const dstUrl = this.targetRepo.url;
        const srcRefsLen = (await this.sourceRepo.getRefs()).length;
        const dstRefsLen = (await this.targetRepo.getRefs()).length;
        return `Ref count mismatch: \`${srcUrl}\` has \`${srcRefsLen}\` refs, \`${dstUrl}\` has \`${dstRefsLen}\` refs.`;
    }
}
exports.RefCountMismatch = RefCountMismatch;
class RefNotFound extends RefDiff {
    type = 'REF_NOT_FOUND';
    async getMessage() {
        if (!this.sourceRef) {
            throw new Error('sourceRef is not initialized');
        }
        return `Ref not found: \`${this.sourceRef.name}\` is missing in \`${this.targetRepo.url}\`.`;
    }
}
exports.RefNotFound = RefNotFound;
class HashMismatch extends RefDiff {
    type = 'HASH_MISMATCH';
    async getMessage() {
        const srcRef = this.sourceRef;
        const dstRef = this.targetRef;
        if (!srcRef || !dstRef) {
            throw new Error('sourceRef or targetRef is not initialized');
        }
        return `Hash mismatch for ref \`${srcRef.name}\`: source repo has \`${srcRef.hash}\`, target repo has \`${dstRef.hash}\`.`;
    }
}
exports.HashMismatch = HashMismatch;
class Repo {
    url;
    _refs;
    _refNameIndex;
    _refHashIndex;
    constructor(repoUrl) {
        this.url = repoUrl;
        logger_1.Logger.info(`GitLsRemote.Repo instance created for \`${repoUrl}\``);
    }
    async getRefs() {
        if (this._refs) {
            logger_1.Logger.debug(`Returning cached refs for \`${this.url}\``);
            return this._refs;
        }
        else {
            logger_1.Logger.debug(`Fetching refs for \`${this.url}\``);
            return await this.fetchRefs();
        }
    }
    async fetchRefs() {
        logger_1.Logger.trace(`fetchRefs() called for \`${this.url}\``);
        const result = await new Promise((resolve, reject) => {
            if (!this.url.startsWith("https://")) {
                const errorMsg = `URL doesn't start with https://: \`${this.url}\``;
                logger_1.Logger.error(errorMsg);
                throw new Error(errorMsg);
            }
            logger_1.Logger.debug(`Executing \`git ls-remote\` for \`${this.url}\``);
            (0, child_process_1.execFile)('git', ['ls-remote', '--quiet', '--exit-code', '--', this.url], {}, (error, stdout /*, stderr*/) => {
                if (error) {
                    logger_1.Logger.error(`Error fetching refs for \`${this.url}\`: \`${error.message}\``);
                    reject(error);
                }
                else {
                    logger_1.Logger.info(`Successfully fetched refs for \`${this.url}\``);
                    resolve(stdout);
                }
            });
        });
        const refs = result.split('\n')
            .filter(line => line)
            .map(line => {
            const [hash, name] = line.split('\t');
            logger_1.Logger.silly(`Parsed ref: \`${name}\` with hash: \`${hash}\` from \`${this.url}\``);
            return { name, hash };
        });
        this._refs = refs;
        logger_1.Logger.debug(`Fetched \`${refs.length}\` refs for \`${this.url}\``);
        return refs;
    }
    async _buildRefIndexes() {
        logger_1.Logger.trace(`GitLsRemote.Repo._buildRefIndexes() called for \`${this.url}\``);
        if (!this._refs) {
            logger_1.Logger.debug(`No cached refs found, fetching refs for \`${this.url}\``);
            await this.fetchRefs();
        }
        this._refNameIndex = new Map();
        this._refHashIndex = new Map();
        for (const ref of this._refs) {
            this._refNameIndex.set(ref.name, ref);
            this._refHashIndex.set(ref.hash, ref);
            logger_1.Logger.silly(`Indexed ref: \`${ref.name}\` with hash: \`${ref.hash}\``);
        }
        logger_1.Logger.info(`Built ref indexes for \`${this.url}\``);
    }
    async getRefByName(name) {
        logger_1.Logger.trace(`getRefByName() called with name: \`${name}\``);
        if (!this._refNameIndex) {
            logger_1.Logger.debug(`Ref name index not built, building now for \`${this.url}\``);
            await this._buildRefIndexes();
        }
        const ref = this._refNameIndex.get(name);
        if (ref) {
            logger_1.Logger.info(`Found ref \`${ref.hash}\` by name \`${name}\` in \`${this.url}\``);
        }
        else {
            logger_1.Logger.warn(`No ref found with name \`${name}\` in \`${this.url}\``);
        }
        return ref;
    }
    async getRefByHash(hash) {
        logger_1.Logger.trace(`getRefByHash() called with hash: \`${hash}\``);
        if (!this._refHashIndex) {
            logger_1.Logger.debug(`Ref hash index not built, building now for \`${this.url}\``);
            await this._buildRefIndexes();
        }
        const ref = this._refHashIndex.get(hash);
        if (ref) {
            logger_1.Logger.info(`Found ref \`${ref.name}\` by hash: \`${hash}\` in \`${this.url}\``);
        }
        else {
            logger_1.Logger.warn(`No ref found with hash: \`${hash}\` in \`${this.url}\``);
        }
        return ref;
    }
    async refsDiffer(targetRepo) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const sourceRepo = this;
        logger_1.Logger.trace(`refsDiffer() called between \`${sourceRepo.url}\` and \`${targetRepo.url}\``);
        const [sourceRefs, targetRefs] = await Promise.all([
            sourceRepo.getRefs(),
            targetRepo.getRefs(),
        ]);
        if (sourceRefs.length === 0 || targetRefs.length === 0) {
            const refDiff = new ZeroRefs({ sourceRepo, targetRepo });
            logger_1.Logger.error(await refDiff.getMessage());
            return refDiff;
        }
        if (sourceRefs.length !== targetRefs.length) {
            const refDiff = new RefCountMismatch({ sourceRepo, targetRepo });
            logger_1.Logger.warn(await refDiff.getMessage());
            return refDiff;
        }
        for (const sourceRef of sourceRefs) {
            const targetRef = await targetRepo.getRefByName(sourceRef.name);
            if (!targetRef) {
                const refDiff = new RefNotFound({ sourceRepo, targetRepo, sourceRef });
                logger_1.Logger.warn(await refDiff.getMessage());
                return refDiff;
            }
            if (sourceRef.hash !== targetRef.hash) {
                const refDiff = new HashMismatch({ sourceRepo, targetRepo, sourceRef, targetRef });
                logger_1.Logger.warn(await refDiff.getMessage());
                return refDiff;
            }
        }
        logger_1.Logger.info(`No differences found between \`${sourceRepo.url}\` and \`${targetRepo.url}\``);
        return null;
    }
}
exports.Repo = Repo;
//# sourceMappingURL=repo.js.map