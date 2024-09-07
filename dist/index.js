"use strict";
/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.gitRemoteRefsCmp = gitRemoteRefsCmp;
const GitRemoteRefsCmp_1 = require("./GitRemoteRefsCmp");
async function gitRemoteRefsCmp(sourceRemote, targetRemote) {
    const cmp = new GitRemoteRefsCmp_1.GitRemoteRefsCmp();
    await cmp.init();
    return cmp.compare(sourceRemote, targetRemote);
}
//# sourceMappingURL=index.js.map