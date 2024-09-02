/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import { execFile } from 'child_process'


class Ref {
  name: string
  hash: string

  constructor(name: string, hash: string) {
    this.name = name
    this.hash = hash
  }
}

class RefDiffTypes {
  static refCountMismatch = new RefDiffTypes('REF_COUNT_MISMATCH')
  static refNotFound      = new RefDiffTypes('REF_NOT_FOUND')
  static hashMismatch     = new RefDiffTypes('HASH_MISMATCH')
  static criticalError    = new RefDiffTypes('CRITICAL_ERROR')

  name: string

  constructor(name: string) {
    this.name = name
  }

  toString() {
    return this.name
  }
}

class RefDiff {
  message: string
  type: RefDiffTypes
  sourceRefs: Ref[]
  targetRefs: Ref[]
  sourceRef: Ref | null
  targetRef: Ref | null

  constructor(
    message: string,
    type: RefDiffTypes,
    sourceRefs: Ref[],
    targetRefs: Ref[],
    sourceRef: Ref | null,
    targetRef: Ref | null,
  ) {
    this.message  = message
    this.type     = type
    this.sourceRefs = sourceRefs
    this.targetRefs = targetRefs
    this.sourceRef  = sourceRef
    this.targetRef = targetRef
  }
}

class GitRepo {
  repoUrl: string
  private _refs: Ref[] | null = null
  private refNameIndex: Map<string, Ref> | null = null
  private refHashIndex: Map<string, Ref> | null = null

  constructor(repoUrl: string) {
    this.repoUrl = repoUrl
  }

  async getRefs(): Promise<Ref[]> {
    if ( this._refs ) {
      return this._refs
    } else {
      return await this.fetchRefs()
    }
  }

  async fetchRefs(): Promise<Ref[]> {
    // console.log(`fetchRefs() for \`${this.repoUrl}\``)
    const result = await new Promise<string>((resolve, reject) => {
      execFile('git', ['ls-remote', this.repoUrl], (error, stdout, stderr) => {
        if ( error ) {
          // console.error(`Error fetching refs for \`${this.repoUrl}\``)
          reject(error)
        } else {
          resolve(stdout)
        }
      })
    })
    const refs = result.split('\n')
      .filter(line => line)
      .map(line => {
        const [hash, name] = line.split('\t')
        return new Ref(name, hash)
      })
    this._refs = refs
    return refs
  }

  async _buildRefIndexes() {
    if ( ! this._refs ) {
      await this.fetchRefs()
    }
    this.refNameIndex = new Map()
    this.refHashIndex = new Map()
    for (const ref of this._refs!) {
      this.refNameIndex.set(ref.name, ref)
      this.refHashIndex.set(ref.hash, ref)
    }
  }

  async getRefByName(name: string): Promise<Ref | undefined> {
    if ( ! this.refNameIndex ) {
      await this._buildRefIndexes()
    }
    return this.refNameIndex!.get(name)
  }

  async getRefByHash(hash: string): Promise<Ref | undefined> {
    if ( ! this.refHashIndex ) {
      await this._buildRefIndexes()
    }
    return this.refHashIndex!.get(hash)
  }

  async refsDiffer(targetRepo: GitRepo): Promise<RefDiff | null> {
    const [sourceRefs, targetRefs] = await Promise.all([
      this.getRefs(),
      targetRepo.getRefs(),
    ])

    if ( sourceRefs.length === 0 || targetRefs.length === 0 ) {
      return new RefDiff(
        `Critical error: One or both repositories have zero refs.`,
        RefDiffTypes.criticalError,
        sourceRefs,
        targetRefs,
        null,
        null,
      )
    }

    if ( sourceRefs.length !== targetRefs.length ) {
      return new RefDiff(
        `Ref count mismatch: source repo has \`${sourceRefs.length}\` refs, target repo has \`${targetRefs.length}\` refs.`,
        RefDiffTypes.refCountMismatch,
        sourceRefs,
        targetRefs,
        null,
        null,
      )
    }

    for (const sourceRef of sourceRefs) {
      const targetRef = await targetRepo.getRefByName(sourceRef.name)
      if ( ! targetRef ) {
        return new RefDiff(
          `Ref not found: \`${sourceRef.name}\` is missing in the target repo.`,
          RefDiffTypes.refNotFound,
          sourceRefs,
          targetRefs,
          sourceRef,
          null,
        )
      }
      if ( sourceRef.hash !== targetRef.hash ) {
        return new RefDiff(
          `Hash mismatch for ref \`${sourceRef.name}\`: source repo has \`${sourceRef.hash}\`, target repo has \`${targetRef.hash}\`.`,
          RefDiffTypes.hashMismatch,
          sourceRefs,
          targetRefs,
          sourceRef,
          targetRef,
        )
      }
    }

    return null
  }
}


export { Ref, RefDiffTypes, RefDiff, GitRepo }


if ( require.main === module ) {
  (async () => {
    const sourceRepo = new GitRepo('https://git.launchpad.net/beautifulsoup')
    const targetRepo = new GitRepo('https://github.com/facsimiles/beautifulsoup.git')

    // inject count mismatch fault
    const sourceRefs = await sourceRepo.getRefs()
    console.log(sourceRefs.pop())

    const diffResult = await sourceRepo.refsDiffer(targetRepo)
    if ( diffResult ) {
      console.log('The repositories differ:')
      console.log(diffResult)
    } else {
      console.log('The repositories are exact clones.')
    }
  })()
}
