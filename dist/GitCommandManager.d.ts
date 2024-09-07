/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */
export { GitCommandManager, };
declare class GitCommandManager {
    protected gitVersion: string;
    protected gitPath: string;
    init(): Promise<void>;
    isInitialized(): boolean;
    lsRemote(options: {
        remote?: string;
        branches?: boolean;
        tags?: boolean;
        exitCode?: boolean;
        patterns?: string[];
    }): Promise<string>;
}
