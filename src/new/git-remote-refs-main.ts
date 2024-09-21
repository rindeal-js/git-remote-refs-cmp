import { GitSmartHttpRefsFetcher, gitRemoteRefsDiff } from './git-remote-refs';

async function main() {
  // const repoUrl1 = 'https://git.launchpad.net/beautifulsoup'
  const baseUrl = 'https://github.com/torvalds/linux'
  // const repoUrl2 = 'https://github.com/facsimiles/beautifulsoup.git'
  const otherUrl = 'https://github.com/git/git.git'

  try {
    const fetcher = new GitSmartHttpRefsFetcher()
    const [ baseRefs, otherRefs ] = await fetcher.multiFetchRefsAsMap([
      {url: baseUrl}, {url: otherUrl},
    ])

    const excludes = [
      /^refs\/pull\//
    ]

    const diff = gitRemoteRefsDiff(baseRefs, otherRefs, { excludes })

    if ( diff ) {
      console.log('Detailed comparison:')
      console.log('In-sync refs:', diff.unchanged)
      console.log('Out-of-sync refs:', diff.changed)
      console.log('Removed refs:', diff.removed)
      console.log('Added refs:', diff.added)
    } else {
	    console.log('Repositories are in sync')
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

main();
