"use strict";
/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
const repo_1 = require("./repo");
if (require.main === module) {
    (async () => {
        logger_1.Logger.logLevel = 'silly';
        const sourceRepo = new repo_1.Repo('https://git.launchpad.net/beautifulsoup');
        const targetRepo = new repo_1.Repo('https://github.com/facsimiles/beautifulsoup.git');
        // inject count mismatch fault
        const sourceRefs = await sourceRepo.getRefs();
        logger_1.Logger.debug(`Injected fault by removing ref: \`${sourceRefs.pop()?.name}\``);
        const diffResult = await sourceRepo.refsDiffer(targetRepo);
        if (diffResult) {
            logger_1.Logger.info('The repositories differ:');
            logger_1.Logger.info(diffResult);
            logger_1.Logger.info(diffResult.type.toString());
        }
        else {
            logger_1.Logger.info('The repositories are exact clones.');
        }
    })();
}
//# sourceMappingURL=main.js.map