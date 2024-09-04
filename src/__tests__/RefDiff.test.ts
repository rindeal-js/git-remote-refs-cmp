/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import { ZeroRefs, RefCountMismatch, RefNotFound, HashMismatch, Repo, Ref } from '../repo';


describe('RefDiff', () => {
  let sourceRepo: Repo;
  let targetRepo: Repo;

  beforeEach(() => {
    sourceRepo = new Repo('https://source.repo.url');
    targetRepo = new Repo('https://target.repo.url');
  });

  test('ZeroRefs getMessage', async () => {
    const zeroRefs = new ZeroRefs({ sourceRepo, targetRepo });
    jest.spyOn(sourceRepo, 'getRefs').mockResolvedValue([]);
    jest.spyOn(targetRepo, 'getRefs').mockResolvedValue([]);
    const message = await zeroRefs.getMessage();
    expect(message).toBe('Zero refs: `https://source.repo.url` has `0` refs, `https://target.repo.url` has `0` refs.');
  });

  test('RefCountMismatch getMessage', async () => {
    const refCountMismatch = new RefCountMismatch({ sourceRepo, targetRepo });
    jest.spyOn(sourceRepo, 'getRefs').mockResolvedValue([{ name: 'ref1', hash: 'hash1' }]);
    jest.spyOn(targetRepo, 'getRefs').mockResolvedValue([]);
    const message = await refCountMismatch.getMessage();
    expect(message).toBe('Ref count mismatch: `https://source.repo.url` has `1` refs, `https://target.repo.url` has `0` refs.');
  });

  test('RefNotFound getMessage', async () => {
    const sourceRef: Ref = { name: 'ref1', hash: 'hash1' };
    const refNotFound = new RefNotFound({ sourceRepo, targetRepo, sourceRef });
    const message = await refNotFound.getMessage();
    expect(message).toBe('Ref not found: `ref1` is missing in `https://target.repo.url`.');
  });

  test('HashMismatch getMessage', async () => {
    const sourceRef: Ref = { name: 'ref1', hash: 'hash1' };
    const targetRef: Ref = { name: 'ref1', hash: 'hash2' };
    const hashMismatch = new HashMismatch({ sourceRepo, targetRepo, sourceRef, targetRef });
    const message = await hashMismatch.getMessage();
    expect(message).toBe('Hash mismatch for ref `ref1`: source repo has `hash1`, target repo has `hash2`.');
  });
});
