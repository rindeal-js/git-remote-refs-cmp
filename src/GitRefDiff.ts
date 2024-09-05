/**
 * SPDX-FileCopyrightText: 2024 Jan Chren ~rindeal
 *
 * SPDX-License-Identifier: GPL-3.0-only OR GPL-2.0-only
 */

import { Repo } from './Repo'


export class GitRefDiff {
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

export class ZeroRefs extends GitRefDiff {
  type: string = 'ZERO_REFS'

  async getMessage(): Promise<string> {
    const srcUrl = this.sourceRepo.url
    const dstUrl = this.targetRepo.url
    const srcRefsLen = (await this.sourceRepo.getRefs()).length
    const dstRefsLen = (await this.targetRepo.getRefs()).length
    return `Zero refs: \`${srcUrl}\` has \`${srcRefsLen}\` refs, \`${dstUrl}\` has \`${dstRefsLen}\` refs.`
  }
}

export class RefCountMismatch extends GitRefDiff {
  type: string = 'REF_COUNT_MISMATCH'

  async getMessage(): Promise<string> {
    const srcUrl = this.sourceRepo.url
    const dstUrl = this.targetRepo.url
    const srcRefsLen = (await this.sourceRepo.getRefs()).length
    const dstRefsLen = (await this.targetRepo.getRefs()).length
    return `Ref count mismatch: \`${srcUrl}\` has \`${srcRefsLen}\` refs, \`${dstUrl}\` has \`${dstRefsLen}\` refs.`
  }
}

export class RefNotFound extends GitRefDiff {
  type: string = 'REF_NOT_FOUND'

  async getMessage(): Promise<string> {
    if ( ! this.sourceRef ) {
      throw new Error('sourceRef is not initialized');
    }
    return `Ref not found: \`${this.sourceRef.name}\` is missing in \`${this.targetRepo.url}\`.`
  }
}

export class HashMismatch extends GitRefDiff {
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
