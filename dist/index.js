"use strict";
/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashMismatch = exports.RefNotFound = exports.RefCountMismatch = exports.ZeroRefs = exports.RefDiff = exports.Repo = exports.Logger = void 0;
exports.refsDiffer = refsDiffer;
const repo_1 = require("./repo");
var logger_1 = require("./logger");
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return logger_1.Logger; } });
var repo_2 = require("./repo");
Object.defineProperty(exports, "Repo", { enumerable: true, get: function () { return repo_2.Repo; } });
Object.defineProperty(exports, "RefDiff", { enumerable: true, get: function () { return repo_2.RefDiff; } });
Object.defineProperty(exports, "ZeroRefs", { enumerable: true, get: function () { return repo_2.ZeroRefs; } });
Object.defineProperty(exports, "RefCountMismatch", { enumerable: true, get: function () { return repo_2.RefCountMismatch; } });
Object.defineProperty(exports, "RefNotFound", { enumerable: true, get: function () { return repo_2.RefNotFound; } });
Object.defineProperty(exports, "HashMismatch", { enumerable: true, get: function () { return repo_2.HashMismatch; } });
async function refsDiffer(sourceUrl, targetUrl) {
    const sourceRepo = new repo_1.Repo(sourceUrl);
    const targetRepo = new repo_1.Repo(targetUrl);
    return await sourceRepo.refsDiffer(targetRepo);
}
//# sourceMappingURL=index.js.map