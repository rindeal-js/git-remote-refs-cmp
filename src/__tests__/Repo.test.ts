/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import { Repo, Ref, ZeroRefs, RefCountMismatch, RefNotFound, HashMismatch } from '../repo'
import { execFile } from 'child_process'

jest.mock('child_process')

describe('GitRepo', () => {
  const sourceRepoUrl = 'https://example.com/repo.git'
  const targetRepoUrl = 'https://example.com/target-repo.git'
  let sourceRepo: Repo
  let targetRepo: Repo
  const mockExecFile = execFile as jest.MockedFunction<typeof execFile>

  beforeEach(() => {
    sourceRepo = new Repo(sourceRepoUrl)
    targetRepo = new Repo(targetRepoUrl)
  })

  const mockLsRemoteRaw = (output: string) => {
    mockExecFile.mockImplementationOnce((file, args, options, callback) => {
      if (!callback) throw new Error("no callback")
      callback(null, output, '')
      return {} as never
    })
  }

  const mockLsRemote = (refs: Ref[]) => {
    mockLsRemoteRaw(refs.map(ref => `${ref.hash}\t${ref.name}\n`).join(''))
  }

  const mockFetchRefs = async (repo: Repo, refs: Ref[]): Promise<Ref[]> => {
    mockLsRemote(refs)
    return await repo.fetchRefs()
  }

  test('fetchRefs should fetch and parse refs', async () => {
    const sourceRefs = await mockFetchRefs(sourceRepo, [{name: 'ref1', hash: 'hash1'}, {name: 'ref2', hash: 'hash2'}])

    expect(sourceRefs).toEqual([{ name: 'ref1', hash: 'hash1' }, { name: 'ref2', hash: 'hash2' }])
  })

  test('getRefByName should return correct ref', async () => {
    await mockFetchRefs(sourceRepo, [{name: 'ref1', hash: 'hash1'}, {name: 'ref2', hash: 'hash2'}])
    const ref = await sourceRepo.getRefByName('ref1')

    expect(ref).toEqual({ name: 'ref1', hash: 'hash1' })
  })

  test('getRefByHash should return correct ref', async () => {
    await mockFetchRefs(sourceRepo, [{name: 'ref1', hash: 'hash1'}, {name: 'ref2', hash: 'hash2'}])
    const ref = await sourceRepo.getRefByHash('hash1')

    expect(ref).toEqual({ name: 'ref1', hash: 'hash1' })
  })

  test('refsDiffer should return ZeroRefs if either repo has zero refs', async () => {
    await mockFetchRefs(sourceRepo, [{name: 'ref1', hash: 'hash1'}])
    await mockFetchRefs(targetRepo, [])

    const refDiff = await sourceRepo.refsDiffer(targetRepo)

    expect(refDiff).toBeInstanceOf(ZeroRefs)
  })

  test('refsDiffer should return RefCountMismatch if ref counts differ', async () => {
    await mockFetchRefs(sourceRepo, [{name: 'ref1', hash: 'hash1'}])
    await mockFetchRefs(targetRepo, [{name: 'ref1', hash: 'hash1'}, {name: 'ref2', hash: 'hash2'}])

    const refDiff = await sourceRepo.refsDiffer(targetRepo)

    expect(refDiff).toBeInstanceOf(RefCountMismatch)
  })

  test('refsDiffer should return RefNotFound if a ref is missing in target repo', async () => {
    await mockFetchRefs(sourceRepo, [{name: 'ref1', hash: 'hash1'}])
    await mockFetchRefs(targetRepo, [{name: 'ref2', hash: 'hash1'}])

    const refDiff = await sourceRepo.refsDiffer(targetRepo)

    expect(refDiff).toBeInstanceOf(RefNotFound)
  })

  test('refsDiffer should return HashMismatch if ref hashes differ', async () => {
    await mockFetchRefs(sourceRepo, [{name: 'ref1', hash: 'hash1'}])
    await mockFetchRefs(targetRepo, [{name: 'ref1', hash: 'hash2'}])

    const refDiff = await sourceRepo.refsDiffer(targetRepo)

    expect(refDiff).toBeInstanceOf(HashMismatch)
  })

  test('getMessage should return correct message for ZeroRefs', async () => {
    await mockFetchRefs(sourceRepo, [])
    await mockFetchRefs(targetRepo, [])

    const zeroRefs = new ZeroRefs({ sourceRepo, targetRepo })
    const message = await zeroRefs.getMessage()

    expect(message).toBe(`Zero refs: \`${sourceRepo.url}\` has \`0\` refs, \`${targetRepo.url}\` has \`0\` refs.`)
  })

  test('getMessage should return correct message for RefCountMismatch', async () => {
    await mockFetchRefs(sourceRepo, [{name: 'ref1', hash: 'hash1'}])
    await mockFetchRefs(targetRepo, [{name: 'ref1', hash: 'hash1'}, {name: 'ref2', hash: 'hash2'}])

    const refCountMismatch = new RefCountMismatch({ sourceRepo, targetRepo })
    const message = await refCountMismatch.getMessage()
    expect(message).toBe(`Ref count mismatch: \`${sourceRepo.url}\` has \`1\` refs, \`${targetRepo.url}\` has \`2\` refs.`)
  })

  test('getMessage should return correct message for RefNotFound', async () => {
    const refNotFound = new RefNotFound({ sourceRepo, targetRepo, sourceRef: { name: 'ref1', hash: 'hash1' } })
    const message = await refNotFound.getMessage()
    expect(message).toBe(`Ref not found: \`ref1\` is missing in \`${targetRepo.url}\`.`)
  })

  test('getMessage should return correct message for HashMismatch', async () => {
    const hashMismatch = new HashMismatch({ sourceRepo, targetRepo, sourceRef: { name: 'ref1', hash: 'hash1' }, targetRef: { name: 'ref1', hash: 'hash2' } })
    const message = await hashMismatch.getMessage()
    expect(message).toBe(`Hash mismatch for ref \`ref1\`: source repo has \`hash1\`, target repo has \`hash2\`.`)
  })

  // Edge Cases and Error Handling

  test('fetchRefs should throw error for invalid URL', async () => {
    sourceRepo = new Repo('invalid-url')
    await expect(sourceRepo.fetchRefs()).rejects.toThrow('URL doesn\'t start with https://: `invalid-url`')
  })

  test('getRefByName should return undefined for non-existent ref', async () => {
    await mockFetchRefs(sourceRepo, [{name: 'ref1', hash: 'hash1'}])
    const ref = await sourceRepo.getRefByName('non-existent-ref')
    expect(ref).toBeUndefined()
  })

  test('getRefByHash should return undefined for non-existent hash', async () => {
    await mockFetchRefs(sourceRepo, [{name: 'ref1', hash: 'hash1'}])
    const ref = await sourceRepo.getRefByHash('non-existent-hash')
    expect(ref).toBeUndefined()
  })

  test('refsDiffer should handle large number of refs efficiently', async () => {
    const largeNumberOfRefs = Array.from({ length: 1000 }, (_, i) => ({ name: `ref${i}`, hash: `hash${i}` }))
    await mockFetchRefs(sourceRepo, largeNumberOfRefs)
    await mockFetchRefs(targetRepo, largeNumberOfRefs)

    const refDiff = await sourceRepo.refsDiffer(targetRepo)
    expect(refDiff).toBeNull()
  })

  test('refsDiffer should handle refs with special characters', async () => {
    await mockFetchRefs(sourceRepo, [{name: 'ref@#$', hash: 'hash1'}])
    await mockFetchRefs(targetRepo, [{name: 'ref@#$', hash: 'hash1'}])

    const refDiff = await sourceRepo.refsDiffer(targetRepo)
    expect(refDiff).toBeNull()
  })

  test('fetchRefs should handle git command errors gracefully', async () => {
    mockExecFile.mockImplementationOnce((file, args, options, callback) => {
      if (!callback) throw new Error("no callback")
      callback(new Error('git command failed'), '', '')
      return {} as never
    })

    await expect(sourceRepo.fetchRefs()).rejects.toThrow('git command failed')
  })
})
