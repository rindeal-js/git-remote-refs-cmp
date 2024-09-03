/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import { RefDiff, RefDiffTypes } from '../index';

describe('RefDiff', () => {
  test('should create a RefDiff instance', () => {
    const refDiff = new RefDiff();
    expect(refDiff.message).toBe('');
    expect(refDiff.type).toBe('');
    expect(refDiff.sourceRefs).toEqual([]);
    expect(refDiff.targetRefs).toEqual([]);
    expect(refDiff.sourceRef).toBeNull();
    expect(refDiff.targetRef).toBeNull();
  });

  test('should set RefDiff type correctly', () => {
    const refDiff = new RefDiff();
    refDiff.type = RefDiffTypes.hashMismatch;
    expect(refDiff.type).toBe(RefDiffTypes.hashMismatch);
  });

  // Add more tests as needed
});
