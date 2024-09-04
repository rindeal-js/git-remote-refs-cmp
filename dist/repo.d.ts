/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
export interface Ref {
    name: string;
    hash: string;
}
export declare class RefDiff {
    type: string;
    sourceRepo: Repo;
    targetRepo: Repo;
    sourceRef?: Ref;
    targetRef?: Ref;
    constructor(init: {
        sourceRepo: Repo;
        targetRepo: Repo;
        sourceRef?: Ref;
        targetRef?: Ref;
    });
    getMessage(): Promise<string>;
}
export declare class ZeroRefs extends RefDiff {
    type: string;
    getMessage(): Promise<string>;
}
export declare class RefCountMismatch extends RefDiff {
    type: string;
    getMessage(): Promise<string>;
}
export declare class RefNotFound extends RefDiff {
    type: string;
    getMessage(): Promise<string>;
}
export declare class HashMismatch extends RefDiff {
    type: string;
    getMessage(): Promise<string>;
}
export declare class Repo {
    url: string;
    private _refs?;
    private _refNameIndex?;
    private _refHashIndex?;
    constructor(repoUrl: string);
    getRefs(): Promise<Ref[]>;
    fetchRefs(): Promise<Ref[]>;
    _buildRefIndexes(): Promise<void>;
    getRefByName(name: string): Promise<Ref | undefined>;
    getRefByHash(hash: string): Promise<Ref | undefined>;
    refsDiffer(targetRepo: Repo): Promise<RefDiff | null>;
}
