/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
import * as path from 'path';
import * as fs from 'fs/promises';
export { which, };
async function which(executable) {
    const dirs = process.env.PATH?.split(path.delimiter) || [];
    const checks = dirs.map(async (dir) => {
        const fullPath = path.join(dir, executable);
        try {
            await fs.access(fullPath, fs.constants.X_OK);
            return fullPath;
        }
        catch {
            return '';
        }
    });
    const results = await Promise.all(checks);
    return results.find(result => result) ?? '';
}
//# sourceMappingURL=Utils.mjs.map