/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import { Repo , RefDiff } from './Repo'


export { Logger } from './Logger'
export { Repo , RefDiff , ZeroRefs , RefCountMismatch , RefNotFound , HashMismatch } from './Repo'


export async function refsDiffer(sourceUrl: string, targetUrl: string): Promise<RefDiff | null> {
  const sourceRepo = new Repo(sourceUrl)
  const targetRepo = new Repo(targetUrl)
  return await sourceRepo.refsDiffer(targetRepo)
}
