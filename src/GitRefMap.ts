/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

/**
 * A map that holds the mapping of full reference names (e.g., `refs/heads/master`, `refs/pull/5/head`)
 * to their corresponding oid/commit hash.
 */
export type GitRefMap = Map<string, string>
