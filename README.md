# 🌟 git-remote-ref-compare 🌟

An efficient TypeScript micro library for comparing remote Git repositories for equality by their references.<br>
Useful to quickly check (1-2s) if a repository mirror is up to date.

## 🚀 Features

- 🔍 Fetch and compare Git references from remote repositories asynchronously.
- 📊 Identify differences in reference counts, names, and hashes, with detailed messages when encountering differences.
- ⚠️ Robust input validation.
- No runtime dependencies

## 📦 Installation

Install via npm:

```bash
npm install https://github.com/rindeal-js/git-remote-ref-compare
```

## 🛠️ Quick Start

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

## 📚 API

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
interface Ref {
  name: string
  hash: string
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
```

## Limitations

- Only remote Git repositories are supported.
- Only `https://` protocol is supported.
- No extra credentials handling.
  - You need to use native Git HTTPS authentication methods if you want to compare private repos.
- Only equality comparison, it cannot tell you which one is older/newer.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📜 License

This project is licensed under the _GPL-3.0-only OR GPL-2.0-only_ License. See the [LICENSE.md](./LICENSE.md) file for details.
