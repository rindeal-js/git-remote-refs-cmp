/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
import { GitRefDiffType, } from './GitRefDiffType.mjs';
export { GitRefDiffBase, };
class GitRefDiffBase {
    type = GitRefDiffType.UNKNOWN;
    message = '';
    sourceRefMap;
    targetRefMap;
    sourceRef;
    targetRef;
    constructor(init) {
        this.sourceRefMap = init.sourceRefMap;
        this.targetRefMap = init.targetRefMap;
        this.sourceRef = init.sourceRef;
        this.targetRef = init.targetRef;
    }
}
//# sourceMappingURL=GitRefDiff.mjs.map