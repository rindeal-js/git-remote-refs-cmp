<h1 align=center>📊🔍 git-remote-refs-cmp</h1>
<p align=center>
  <strong>
    🚀 Efficient Git Reference Comparison with ES2023 TypeScript Library 🚀
  </strong>
</p>


## ✨ Features
- **Robust Git Commands**: Execute Git commands seamlessly.
- **Structured Data Parsing**: Convert `git ls-remote` outputs into concrete objects.
- **Remote Comparison**: Compare Git references across different remotes.
- **Detailed Output**: Get comprehensive reports on differences.

## 👥 Who Should Use This?

Perfect for developers and DevOps engineers managing git mirrors, this tool offers a fast and efficient way to check your mirrors are up-to-date.

Ready to streamline your Git workflows? 🌟

## 📦 Installation

Install via npm:

```bash
npm install https://github.com/rindeal-js/git-remote-refs-cmp
```

## 🚀 Quick Start

```ts
import { gitRemoteRefsCmp } from 'git-remote-refs-cmp'

async function compareRemotes() {
  const sourceRemote = 'https://github.com/source-repo.git'
  const targetRemote = 'https://github.com/target-repo.git'
  const diff = await gitRemoteRefsCmp(sourceRemote, targetRemote)
  if ( diff ) {
    console.log('Difference found:', diff.message)
  } else {
    console.log('No differences found.')
  }
}

compareRemotes()
```

## ⚠️ Limitations

- Only remote Git repositories are supported.
- No extra credentials handling.
  - You need to use native Git authentication methods if you want to compare private repos.
- Only equality comparison, it cannot tell you which one is older/newer etc.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📜 License

This project is licensed under the _GPL-3.0-only OR GPL-2.0-only_ License. See the [LICENSE.md](./LICENSE.md) file for details.
