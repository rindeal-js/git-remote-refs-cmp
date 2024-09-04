/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import { execFile } from 'child_process'
import { Logger } from './logger'

namespace GitLsRemote {
  export interface Ref {
    name: string
    hash: string
  }

  // export class RefDiffTypes extends String {
  //   static refCountMismatch = new RefDiffTypes('REF_COUNT_MISMATCH')
  //   static refNotFound      = new RefDiffTypes('REF_NOT_FOUND')
  //   static hashMismatch     = new RefDiffTypes('HASH_MISMATCH')
  //   static zeroRefs         = new RefDiffTypes('ZERO_REFS')
  // }
  
  export class RefDiff {
    message: string
    type: string
    sourceRepo!: Repo
    targetRepo!: Repo
    sourceRef?: Ref
    targetRef?: Ref
  
    constructor(init: Partial<RefDiff>)) {
      Object.assign(this, init)
      this.message = this._getMessage()
    }

    _getMessage() { throw new Error("Method not implemented.") }
  }
  
  export class ZeroRefs extends RefDiff {
    type: string = 'ZERO_REFS'
  
    _getMessage() {
      const srcUrl = this.sourceRepo.repoUrl
      const dstUrl = this.targetRepo.repoUrl
      const srcRefsLen = this.sourceRepo.getRefs().length
      const dstRefsLen = this.targetRepo.getRefs().length
      return `Zero refs: \`${srcUrl}\` has \`${srcRefsLen}\` refs, \`${dstUrl}\` has \`${dstRefsLen}\` refs.`
    }
  }
  
  export class RefCountMismatch extends RefDiff {
    type: string = 'REF_COUNT_MISMATCH'
  
    _getMessage() {
      const srcUrl = this.sourceRepo.repoUrl
      const dstUrl = this.targetRepo.repoUrl
      const srcRefsLen = this.sourceRepo.getRefs().length
      const dstRefsLen = this.targetRepo.getRefs().length
      return `Ref count mismatch: \`${srcUrl}\` has \`${srcRefsLen}\` refs, \`${dstUrl}\` has \`${dstRefsLen}\` refs.`
    }
  }
  
  export class RefNotFound extends RefDiff {
    type: string = 'REF_NOT_FOUND'
  
    _getMessage() {
      return `Ref not found: \`${this.sourceRef!.name}\` is missing in \`${this.targetRepo.repoUrl}\`.`
    }
  }
  
  export class HashMismatch extends RefDiff {
    type: string = 'HASH_MISMATCH'
  
    _getMessage() {
      const srcRef = this.sourceRef!
      const dstRef = this.targetRef!
      return `Hash mismatch for ref \`${srcRef.name}\`: source repo has \`${srcRef.hash}\`, target repo has \`${dstRef.hash}\`.`
    }
  }

  
  export class Repo {
    repoUrl: string
    private _refs: Ref[] | null = null
    private refNameIndex: Map<string, Ref> | null = null
    private refHashIndex: Map<string, Ref> | null = null

    constructor(repoUrl: string) {
      this.repoUrl = repoUrl
      Logger.info(`GitLsRemote.Repo instance created for \`${repoUrl}\``)
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
        Logger.info(`Executing \`git ls-remote\` for \`${this.repoUrl}\``)
        execFile('git', ['ls-remote', '--quiet' , '--exit-code', '--', this.repoUrl], {}, (error, stdout/*, stderr*/) => {
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
          Logger.silly(`Parsed ref: \`${name}\` with hash: \`${hash}\` from \`${this.repoUrl}\``)
          return {name, hash}
        })
      this._refs = refs
      Logger.debug(`Fetched \`${refs.length}\` refs for \`${this.repoUrl}\``)
      return refs
    }

    async _buildRefIndexes() {
      Logger.trace(`GitLsRemote.Repo._buildRefIndexes() called for \`${this.repoUrl}\``)
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
        Logger.info(`Found ref \`${ref.hash}\` by name \`${name}\` in \`${this.repoUrl}\``)
      } else {
        Logger.warn(`No ref found with name \`${name}\` in \`${this.repoUrl}\``)
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
      if ( ref ) {
        Logger.info(`Found ref \`${ref.name}\` by hash: \`${hash}\` in \`${this.repoUrl}\``)
      } else {
        Logger.warn(`No ref found with hash: \`${hash}\` in \`${this.repoUrl}\``)
      }
      return ref
    }

    async refsDiffer(targetRepo: Repo): Promise<RefDiff | null> {
      const sourceRepo = this
      Logger.trace(`refsDiffer() called between \`${sourceRepo.repoUrl}\` and \`${targetRepo.repoUrl}\``)
      const [sourceRefs, targetRefs] = await Promise.all([
        sourceRepo.getRefs(),
        targetRepo.getRefs(),
      ])

      // const refDiff = new RefDiff()
      // refDiff.sourceRefs = sourceRefs
      // refDiff.targetRefs = targetRefs

      if ( sourceRefs.length === 0 || targetRefs.length === 0 ) {
        const refDiff = new ZeroRefs({sourceRepo, targetRepo})
        // refDiff.message = `Zero refs: \`${this.repoUrl}\` has \`${sourceRefs.length}\` refs, \`${targetRepo.repoUrl}\` has \`${targetRefs.length}\` refs.`
        // refDiff.type = RefDiffTypes.zeroRefs
        Logger.fatal(refDiff.message)
        return refDiff
      }

      if ( sourceRefs.length !== targetRefs.length ) {
        const refDiff = new RefCountMismatch({sourceRepo, targetRepo})
        // refDiff.message = `Ref count mismatch: \`${this.repoUrl}\` has \`${sourceRefs.length}\` refs, \`${targetRepo.repoUrl}\` has \`${targetRefs.length}\` refs.`
        // refDiff.type = RefDiffTypes.refCountMismatch
        Logger.warn(refDiff.message)
        return refDiff
      }

      for (const sourceRef of sourceRefs) {
        const targetRef = await targetRepo.getRefByName(sourceRef.name)
        if ( ! targetRef ) {
          const refDiff = new RefNotFound({sourceRepo, targetRepo, sourceRef})
          // refDiff.message = `Ref not found: \`${sourceRef.name}\` is missing in \`${targetRepo.repoUrl}\`.`
          // refDiff.type = RefDiffTypes.refNotFound
          // refDiff.sourceRef = sourceRef
          Logger.error(refDiff.message)
          return refDiff
        }
        if ( sourceRef.hash !== targetRef.hash ) {
          const refDiff = new HashMismatch({sourceRepo, targetRepo, sourceRef, targetRef})
          // refDiff.message = `Hash mismatch for ref \`${sourceRef.name}\`: source repo has \`${sourceRef.hash}\`, target repo has \`${targetRef.hash}\`.`
          // refDiff.type = RefDiffTypes.hashMismatch
          // refDiff.sourceRef = sourceRef
          // refDiff.targetRef = targetRef
          Logger.error(refDiff.message)
          return refDiff
        }
      }
      Logger.info(`No differences found between \`${sourceRepo.repoUrl}\` and \`${targetRepo.repoUrl}\``)
      return null
    }
  }
}


export { GitLsRemote }


if ( require.main === module ) {
  (async () => {
    Logger.logLevel = 'silly'

    const sourceRepo = new GitLsRemote.Repo('https://git.launchpad.net/beautifulsoup')
    const targetRepo = new GitLsRemote.Repo('https://github.com/facsimiles/beautifulsoup.git')

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
