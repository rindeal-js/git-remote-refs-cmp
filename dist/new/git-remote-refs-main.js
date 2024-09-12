"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const git_remote_refs_1 = require("./git-remote-refs");
async function main() {
    const repoUrl1 = 'https://git.launchpad.net/beautifulsoup';
    const repoUrl2 = 'https://github.com/facsimiles/beautifulsoup.git';
    try {
        const remoteRefs = new git_remote_refs_1.GitRemoteRefs();
        const diff = await remoteRefs.compare(repoUrl1, repoUrl2);
        if (diff) {
            console.log('Detailed comparison:');
            console.log('In-sync refs:', diff.inSyncRefs);
            console.log('Out-of-sync refs:', diff.outOfSyncRefs);
            console.log('Missing refs:', diff.missingRefs);
        }
        else {
            console.log('Repositories are in sync');
        }
    }
    catch (error) {
        console.error('Error:', error);
    }
}
main();
//# sourceMappingURL=git-remote-refs-main.js.map