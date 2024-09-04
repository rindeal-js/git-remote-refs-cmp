/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import { Logger } from './logger'

import { execFile } from 'child_process'


export interface Ref {
  name: string
  hash: string
}


const gitOidRegExp = /^[0-9a-f]{40}$/
const gitRefRegExp = /^(?:refs\/(?:heads|tags|remotes)\/|HEAD$)/


export class RefDiff {
  type: string = 'NO_TYPE'
  sourceRepo: Repo
  targetRepo: Repo
  sourceRef?: Ref
  targetRef?: Ref

  constructor(init: {sourceRepo: Repo, targetRepo: Repo, sourceRef?: Ref, targetRef?: Ref}) {
    this.sourceRepo = init.sourceRepo
    this.targetRepo = init.targetRepo
    this.sourceRef = init.sourceRef
    this.targetRef = init.targetRef
  }

  getMessage(): Promise<string> { throw new Error("Method not implemented.") }
}

export class ZeroRefs extends RefDiff {
  type: string = 'ZERO_REFS'

  async getMessage(): Promise<string> {
    const srcUrl = this.sourceRepo.url
    const dstUrl = this.targetRepo.url
    const srcRefsLen = (await this.sourceRepo.getRefs()).length
    const dstRefsLen = (await this.targetRepo.getRefs()).length
    return `Zero refs: \`${srcUrl}\` has \`${srcRefsLen}\` refs, \`${dstUrl}\` has \`${dstRefsLen}\` refs.`
  }
}

export class RefCountMismatch extends RefDiff {
  type: string = 'REF_COUNT_MISMATCH'

  async getMessage(): Promise<string> {
    const srcUrl = this.sourceRepo.url
    const dstUrl = this.targetRepo.url
    const srcRefsLen = (await this.sourceRepo.getRefs()).length
    const dstRefsLen = (await this.targetRepo.getRefs()).length
    return `Ref count mismatch: \`${srcUrl}\` has \`${srcRefsLen}\` refs, \`${dstUrl}\` has \`${dstRefsLen}\` refs.`
  }
}

export class RefNotFound extends RefDiff {
  type: string = 'REF_NOT_FOUND'

  async getMessage(): Promise<string> {
    if ( ! this.sourceRef ) {
      throw new Error('sourceRef is not initialized');
    }
    return `Ref not found: \`${this.sourceRef.name}\` is missing in \`${this.targetRepo.url}\`.`
  }
}

export class HashMismatch extends RefDiff {
  type: string = 'HASH_MISMATCH'

  async getMessage(): Promise<string> {
    const srcRef = this.sourceRef
    const dstRef = this.targetRef
    if ( ! srcRef || ! dstRef ) {
      throw new Error('sourceRef or targetRef is not initialized');
    }
    return `Hash mismatch for ref \`${srcRef.name}\`: source repo has \`${srcRef.hash}\`, target repo has \`${dstRef.hash}\`.`
  }
}


export class Repo {
  url: string
  private _refs?: Ref[]
  private _refNameIndex?: Map<string, Ref>
  private _refHashIndex?: Map<string, Ref>

  constructor(repoUrl: string) {
    this.url = repoUrl
    Logger.info(`GitLsRemote.Repo instance created for \`${repoUrl}\``)
  }

  async getRefs(): Promise<Ref[]> {
    if ( this._refs ) {
      Logger.debug(`Returning cached refs for \`${this.url}\``)
      return this._refs
    } else {
      Logger.debug(`Fetching refs for \`${this.url}\``)
      return await this.fetchRefs()
    }
  }

  async fetchRefs(): Promise<Ref[]> {
    Logger.trace(`fetchRefs() called for \`${this.url}\``)
    const result = await new Promise<string>((resolve, reject) => {
      if ( ! this.url.startsWith("https://") ) {
        const errorMsg = `URL doesn't start with https://: \`${this.url}\``
        Logger.error(errorMsg)
        throw new Error(errorMsg)
      }
      Logger.debug(`Executing \`git ls-remote\` for \`${this.url}\``)
      execFile('git', ['ls-remote', '--quiet', '--exit-code', '--', this.url], {}, (error, stdout/*, stderr*/) => {
        if ( error ) {
          Logger.error(`Error fetching refs for \`${this.url}\`: \`${error.message}\``)
          reject(error)
        } else {
          Logger.info(`Successfully fetched refs for \`${this.url}\``)
          resolve(stdout)
        }
      })
    })
  
    const refs = result.split('\n')
      .map(line => {
        const [hash, name] = line.split('\t')
        if ( ! hash || ! name ) {
          const errorMsg = `Invalid \`git ls-remote\` output line: \`${line}\``
          Logger.error(errorMsg)
          throw new Error(errorMsg)
        }
        if ( ! gitOidRegExp.test(hash) ) {
          const errorMsg = `Invalid Git OID hash: \`${hash}\``
          Logger.error(errorMsg)
          throw new Error(errorMsg)
        }
        if ( ! gitRefRegExp.test(name) ) {
          const errorMsg = `Invalid Git ref name: \`${name}\``
          Logger.error(errorMsg)
          throw new Error(errorMsg)
        }
        Logger.silly(`Parsed ref: \`${name}\` with hash: \`${hash}\` from \`${this.url}\``)
        return { name, hash }
      })
  
    this._refs = refs
    Logger.debug(`Fetched \`${refs.length}\` refs for \`${this.url}\``)
    return refs
  }


  async _buildRefIndexes() {
    Logger.trace(`GitLsRemote.Repo._buildRefIndexes() called for \`${this.url}\``)
    if ( ! this._refs ) {
      Logger.debug(`No cached refs found, fetching refs for \`${this.url}\``)
      await this.fetchRefs()
    }
    this._refNameIndex = new Map()
    this._refHashIndex = new Map()
    for (const ref of this._refs!) {
      this._refNameIndex.set(ref.name, ref)
      this._refHashIndex.set(ref.hash, ref)
      Logger.silly(`Indexed ref: \`${ref.name}\` with hash: \`${ref.hash}\``)
    }
    Logger.info(`Built ref indexes for \`${this.url}\``)
  }

  async getRefByName(name: string): Promise<Ref | undefined> {
    Logger.trace(`getRefByName() called with name: \`${name}\``)
    if ( ! this._refNameIndex ) {
      Logger.debug(`Ref name index not built, building now for \`${this.url}\``)
      await this._buildRefIndexes()
    }
    const ref = this._refNameIndex!.get(name)
    if (ref) {
      Logger.info(`Found ref \`${ref.hash}\` by name \`${name}\` in \`${this.url}\``)
    } else {
      Logger.warn(`No ref found with name \`${name}\` in \`${this.url}\``)
    }
    return ref
  }

  async getRefByHash(hash: string): Promise<Ref | undefined> {
    Logger.trace(`getRefByHash() called with hash: \`${hash}\``)
    if ( ! this._refHashIndex ) {
      Logger.debug(`Ref hash index not built, building now for \`${this.url}\``)
      await this._buildRefIndexes()
    }
    const ref = this._refHashIndex!.get(hash)
    if ( ref ) {
      Logger.info(`Found ref \`${ref.name}\` by hash: \`${hash}\` in \`${this.url}\``)
    } else {
      Logger.warn(`No ref found with hash: \`${hash}\` in \`${this.url}\``)
    }
    return ref
  }

  async refsDiffer(targetRepo: Repo): Promise<RefDiff | null> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const sourceRepo = this
    Logger.trace(`refsDiffer() called between \`${sourceRepo.url}\` and \`${targetRepo.url}\``)
    const [sourceRefs, targetRefs] = await Promise.all([
      sourceRepo.getRefs(),
      targetRepo.getRefs(),
    ])

    if ( sourceRefs.length === 0 || targetRefs.length === 0 ) {
      const refDiff = new ZeroRefs({sourceRepo, targetRepo})
      Logger.error(await refDiff.getMessage())
      return refDiff
    }

    if ( sourceRefs.length !== targetRefs.length ) {
      const refDiff = new RefCountMismatch({sourceRepo, targetRepo})
      Logger.warn(await refDiff.getMessage())
      return refDiff
    }

    for (const sourceRef of sourceRefs) {
      const targetRef = await targetRepo.getRefByName(sourceRef.name)
      if ( ! targetRef ) {
        const refDiff = new RefNotFound({sourceRepo, targetRepo, sourceRef})
        Logger.warn(await refDiff.getMessage())
        return refDiff
      }
      if ( sourceRef.hash !== targetRef.hash ) {
        const refDiff = new HashMismatch({sourceRepo, targetRepo, sourceRef, targetRef})
        Logger.warn(await refDiff.getMessage())
        return refDiff
      }
    }
    Logger.info(`No differences found between \`${sourceRepo.url}\` and \`${targetRepo.url}\``)
    return null
  }
}
