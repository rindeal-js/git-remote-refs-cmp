/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
declare class Ref {
    name: string;
    hash: string;
    constructor(name: string, hash: string);
}
declare class RefDiffTypes extends String {
    static refCountMismatch: RefDiffTypes;
    static refNotFound: RefDiffTypes;
    static hashMismatch: RefDiffTypes;
    static criticalError: RefDiffTypes;
}
declare class RefDiff {
    message: string;
    type: RefDiffTypes;
    sourceRefs: Ref[];
    targetRefs: Ref[];
    sourceRef: Ref | null;
    targetRef: Ref | null;
}
declare class GitRepo {
    repoUrl: string;
    private _refs;
    private refNameIndex;
    private refHashIndex;
    constructor(repoUrl: string);
    getRefs(): Promise<Ref[]>;
    fetchRefs(): Promise<Ref[]>;
    _buildRefIndexes(): Promise<void>;
    getRefByName(name: string): Promise<Ref | undefined>;
    getRefByHash(hash: string): Promise<Ref | undefined>;
    refsDiffer(targetRepo: GitRepo): Promise<RefDiff | null>;
}
export { Ref, RefDiffTypes, RefDiff, GitRepo };
