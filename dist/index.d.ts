/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
import { RefDiff } from './repo';
export { Logger } from './logger';
export { Repo, RefDiff, ZeroRefs, RefCountMismatch, RefNotFound, HashMismatch } from './repo';
export declare function refsDiffer(sourceUrl: string, targetUrl: string): Promise<RefDiff | null>;
