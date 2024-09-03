/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import { execFile } from 'child_process'

import { Logger } from './logger'


interface Ref {
  name: string
  hash: string
}

class RefDiffTypes extends String {
  static refCountMismatch = new RefDiffTypes('REF_COUNT_MISMATCH')
  static refNotFound      = new RefDiffTypes('REF_NOT_FOUND')
  static hashMismatch     = new RefDiffTypes('HASH_MISMATCH')
  static criticalError    = new RefDiffTypes('CRITICAL_ERROR')
}

class RefDiff {
  message: string = ''
  type: RefDiffTypes = ''
  sourceRefs: Ref[] = []
  targetRefs: Ref[] = []
  sourceRef: Ref | null = null
  targetRef: Ref | null = null
}

class GitRepo {
  repoUrl: string
  private _refs: Ref[] | null = null
  private refNameIndex: Map<string, Ref> | null = null
  private refHashIndex: Map<string, Ref> | null = null

  constructor(repoUrl: string) {
    this.repoUrl = repoUrl
    Logger.info(`GitRepo instance created for \`${repoUrl}\``)
  }

  async getRefs(): Promise<Ref[]> {
    if ( this._refs ) {
      Logger.debug(`Returning cached refs for \`${this.repoUrl}\``)
      return this._refs
    } else {
      Logger.debug(`Fetching refs for \`${this.repoUrl}\``)
      return await this.fetchRefs()
    }
  }

  async fetchRefs(): Promise<Ref[]> {
    Logger.trace(`fetchRefs() called for \`${this.repoUrl}\``)
    const result = await new Promise<string>((resolve, reject) => {
      if ( ! this.repoUrl.startsWith("https://") ) {
        const errorMsg = `URL doesn't start with https://: \`${this.repoUrl}\``
        Logger.error(errorMsg)
        throw new Error(errorMsg)
      }
      execFile('git', ['ls-remote', this.repoUrl], {}, (error, stdout/*, stderr*/) => {
        if ( error ) {
          Logger.error(`Error fetching refs for \`${this.repoUrl}\`: \`${error.message}\``)
          reject(error)
        } else {
          Logger.info(`Successfully fetched refs for \`${this.repoUrl}\``)
          resolve(stdout)
        }
      })
    })
    const refs = result.split('\n')
      .filter(line => line)
      .map(line => {
        const [hash, name] = line.split('\t')
        Logger.silly(`Parsed ref: \`${name}\` with hash: \`${hash}\``)
        return {name, hash}
      })
    this._refs = refs
    Logger.debug(`Fetched \`${refs.length}\` refs for \`${this.repoUrl}\``)
    return refs
  }

  async _buildRefIndexes() {
    Logger.trace(`_buildRefIndexes() called for \`${this.repoUrl}\``)
    if ( ! this._refs ) {
      Logger.debug(`No cached refs found, fetching refs for \`${this.repoUrl}\``)
      await this.fetchRefs()
    }
    this.refNameIndex = new Map()
    this.refHashIndex = new Map()
    for (const ref of this._refs!) {
      this.refNameIndex.set(ref.name, ref)
      this.refHashIndex.set(ref.hash, ref)
      Logger.silly(`Indexed ref: \`${ref.name}\` with hash: \`${ref.hash}\``)
    }
    Logger.info(`Built ref indexes for \`${this.repoUrl}\``)
  }

  async getRefByName(name: string): Promise<Ref | undefined> {
    Logger.trace(`getRefByName() called with name: \`${name}\``)
    if ( ! this.refNameIndex ) {
      Logger.debug(`Ref name index not built, building now for \`${this.repoUrl}\``)
      await this._buildRefIndexes()
    }
    const ref = this.refNameIndex!.get(name)
    if (ref) {
      Logger.info(`Found ref by name: \`${name}\``)
    } else {
      Logger.warn(`Ref not found by name: \`${name}\``)
    }
    return ref
  }

  async getRefByHash(hash: string): Promise<Ref | undefined> {
    Logger.trace(`getRefByHash() called with hash: \`${hash}\``)
    if ( ! this.refHashIndex ) {
      Logger.debug(`Ref hash index not built, building now for \`${this.repoUrl}\``)
      await this._buildRefIndexes()
    }
    const ref = this.refHashIndex!.get(hash)
    if (ref) {
      Logger.info(`Found ref by hash: \`${hash}\``)
    } else {
      Logger.warn(`Ref not found by hash: \`${hash}\``)
    }
    return ref
  }

  async refsDiffer(targetRepo: GitRepo): Promise<RefDiff | null> {
    Logger.trace(`refsDiffer() called between \`${this.repoUrl}\` and \`${targetRepo.repoUrl}\``)
    const [sourceRefs, targetRefs] = await Promise.all([
      this.getRefs(),
      targetRepo.getRefs(),
    ])

    const refDiff = new RefDiff()
    refDiff.sourceRefs = sourceRefs
    refDiff.targetRefs = targetRefs

    if ( sourceRefs.length === 0 || targetRefs.length === 0 ) {
      refDiff.message = `Critical error: One or both repositories have zero refs.`
      refDiff.type = RefDiffTypes.criticalError
      Logger.fatal(refDiff.message)
      return refDiff
    }

    if ( sourceRefs.length !== targetRefs.length ) {
      refDiff.message = `Ref count mismatch: source repo has \`${sourceRefs.length}\` refs, target repo has \`${targetRefs.length}\` refs.`
      refDiff.type = RefDiffTypes.refCountMismatch
      Logger.warn(refDiff.message)
      return refDiff
    }

    for (const sourceRef of sourceRefs) {
      const targetRef = await targetRepo.getRefByName(sourceRef.name)
      if ( ! targetRef ) {
        refDiff.message = `Ref not found: \`${sourceRef.name}\` is missing in the target repo.`
        refDiff.type = RefDiffTypes.refNotFound
        refDiff.sourceRef = sourceRef
        Logger.error(refDiff.message)
        return refDiff
      }
      if ( sourceRef.hash !== targetRef.hash ) {
        refDiff.message = `Hash mismatch for ref \`${sourceRef.name}\`: source repo has \`${sourceRef.hash}\`, target repo has \`${targetRef.hash}\`.`
        refDiff.type = RefDiffTypes.hashMismatch
        refDiff.sourceRef = sourceRef
        refDiff.targetRef = targetRef
        Logger.error(refDiff.message)
        return refDiff
      }
    }
    Logger.info(`No differences found between \`${this.repoUrl}\` and \`${targetRepo.repoUrl}\``)
    return null
  }
}


export { Ref, RefDiffTypes, RefDiff, GitRepo, Logger }


if ( require.main === module ) {
  (async () => {
    Logger.logLevel = 'silly'

    const sourceRepo = new GitRepo('https://git.launchpad.net/beautifulsoup')
    const targetRepo = new GitRepo('https://github.com/facsimiles/beautifulsoup.git')

    // inject count mismatch fault
    const sourceRefs = await sourceRepo.getRefs()
    Logger.debug(`Injected fault by removing ref: \`${sourceRefs.pop()?.name}\``)

    const diffResult = await sourceRepo.refsDiffer(targetRepo)
    if ( diffResult ) {
      Logger.info('The repositories differ:')
      Logger.info(diffResult)
      Logger.info(diffResult.type.toString())
    } else {
      Logger.info('The repositories are exact clones.')
    }
  })()
}
