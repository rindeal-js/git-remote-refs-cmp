# git-remote-ref-compare

A modern and efficient library for comparing Git repositories by their references.

## Features

- Fetch and compare Git references from remote repositories.
- Identify differences in reference counts, names, and hashes.
- Handle critical errors gracefully.

## Installation

```bash
npm install git-remote-ref-compare
```

## Usage

```ts
import { GitRepo, RefDiffTypes } from 'git-remote-ref-compare'

const sourceRepo = new GitRepo('https://git.launchpad.net/beautifulsoup')
const targetRepo = new GitRepo('https://github.com/facsimiles/beautifulsoup.git')

(async () => {
  const diffResult = await sourceRepo.refsDiffer(targetRepo)
  if (diffResult) {
    console.log('The repositories differ:')
    console.log({ message: diffResult.message })
    console.log({ type: diffResult.type.toString() })
    // diffResult.sourceRefs
    // diffResult.targetRefs
    // diffResult.sourceRef
    // diffResult.targetRef
    if (diffResult.type === RefDiffTypes.hashMismatch) {
      // ...
    }
  } else {
    console.log('The repositories are exact clones.')
  }
})()
```

## API

```ts
// Represents a Git repository
class GitRepo {
  constructor(repoUrl: string)
  getRefs(): Promise<Ref[]>
  fetchRefs(): Promise<Ref[]>  // Explicitly fetches references from the remote repository, otherwise lazy load
  getRefByName(name: string): Promise<Ref | undefined>
  getRefByHash(hash: string): Promise<Ref | undefined>
  refsDiffer(targetRepo: GitRepo): Promise<RefDiff | null>  // Return null if refs in both repos are equal, RefDiff instance otherwise
}

// Represents a Git reference
class Ref {
  name: string
  hash: string
  constructor(name: string, hash: string)
}

// Types of reference differences
class RefDiffTypes {
  static refCountMismatch: RefDiffTypes  // A mismatch in the number of references
  static refNotFound:      RefDiffTypes  // A reference not found in the target repository
  static hashMismatch:     RefDiffTypes  // A hash mismatch for a reference
  static criticalError:    RefDiffTypes  // A critical error during comparison
  name: string
  constructor(name: string)
  toString(): string  // Returns the name of the RefDiffTypes instance, eg. `REF_NOT_FOUND`
}

// Represents the difference between references
class RefDiff {
  message: string
  type: RefDiffTypes
  sourceRefs: Ref[]
  targetRefs: Ref[]
  sourceRef: Ref | null
  targetRef: Ref | null
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the _GPL-3.0-only OR GPL-2.0-only_ License. See the [LICENSE.md](./LICENSE.md) file for details.
