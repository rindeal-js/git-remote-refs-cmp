/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import { GitRepo } from '../index';
import { execFile } from 'child_process';

jest.mock('child_process');

describe('GitRepo', () => {
  const repoUrl = 'https://example.com/repo.git';
  let gitRepo: GitRepo;
  
  beforeEach(() => {
    gitRepo = new GitRepo(repoUrl);
  });
  
  test('fetchRefs should fetch and parse refs', async () => {
    const mockExecFile = execFile as jest.MockedFunction<typeof execFile>;
    mockExecFile.mockImplementation((file, args, options, callback) => {
      if ( callback ) {
        callback(null, 'hash1\tref1\nhash2\tref2\n', '')
      }
      return {} as never; // Mocking the ChildProcess return
    });
    
    const refs = await gitRepo.fetchRefs();
    expect(refs).toEqual([{name: 'ref1', hash: 'hash1'}, {name: 'ref2', hash: 'hash2'}]);
  });
  
  test('getRefByName should return correct ref', async () => {
    const mockExecFile = execFile as jest.MockedFunction<typeof execFile>;
    mockExecFile.mockImplementation((file, args, options, callback) => {
      if ( callback ) {
        callback(null, 'hash1\tref1\nhash2\tref2\n', '')
      }
      return {} as never; // Mocking the ChildProcess return
    });
    
    await gitRepo.fetchRefs();
    const ref = await gitRepo.getRefByName('ref1');
    expect(ref).toEqual({name: 'ref1', hash: 'hash1'});
  });
  
  // Add more tests as needed
});
