"use strict";
/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License: GPL-3.0-only OR GPL-2.0-only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitRefDiffBase = void 0;
const GitRefDiffType_1 = require("./GitRefDiffType");
class GitRefDiffBase {
    type = GitRefDiffType_1.GitRefDiffType.UNKNOWN;
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
exports.GitRefDiffBase = GitRefDiffBase;
//# sourceMappingURL=GitRefDiff.js.map