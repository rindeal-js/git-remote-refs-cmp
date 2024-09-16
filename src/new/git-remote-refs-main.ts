import { GitRemoteRefs } from './git-remote-refs';

async function main() {
  const repoUrl1 = 'https://git.launchpad.net/beautifulsoup'
  // const repoUrl2 = 'https://github.com/facsimiles/beautifulsoup.git'
  const repoUrl2 = 'https://github.com/git/git.git'

  try {
    const remoteRefs = new GitRemoteRefs()
    const diff = await remoteRefs.compare(repoUrl1, repoUrl2);
    
    
    if ( diff ) {
      console.log('Detailed comparison:');
      console.log('In-sync refs:', diff.inSyncRefs);
      console.log('Out-of-sync refs:', diff.outOfSyncRefs);
      console.log('Missing refs:', diff.missingRefs);
    } else {
	    console.log('Repositories are in sync');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
