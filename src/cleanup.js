const { execSync } = require('child_process');
const { getInput, setFailed } = require('@actions/core');



try {
    // remove incus fingerprints
    const ssh_user = getInput('ssh_user');
    const remote_host = getInput('remote_host');
    const trust_fingerprints = execSync(`ssh -i ~/.ssh/id_rsa ${ssh_user}@${remote_host} "incus config trust list -f json"`, { encoding: 'utf-8', stdio: 'pipe' });
    const fingerprints = JSON.parse(trust_fingerprints).filter(t => t.name === 'gh-action').map(t => t.fingerprint);
    console.log(`fingerprints=${fingerprints}`);
    for (const fingerprint of fingerprints) {
        execSync(`ssh -i ~/.ssh/id_rsa ${ssh_user}@${remote_host} "incus config trust remove ${fingerprint}"`, { encoding: 'utf-8', stdio: 'inherit' });
    }

    // uninstall incus
    execSync('sudo apt remove -y incus-client', { encoding: 'utf-8', stdio: 'inherit' });

    // remove apt repository
    execSync('sudo rm -f /etc/apt/sources.list.d/zabbly-incus-stable.sources', { encoding: 'utf-8', stdio: 'inherit' });
    execSync('sudo rm -f /etc/apt/keyrings/zabbly.asc', { encoding: 'utf-8', stdio: 'inherit' });

} catch (error) {
    // log the error
    setFailed(error.message);
}


// post:
// steps:   
// - name: Remove incus fingerprints
//   env:
//     SSH_PRIVATE_KEY: ${{ secrets.INCUS_CI_KEY }}
//     REMOTE_HOST: ${{ secrets.INCUS_IP }}
//     REMOTE_USER: 'incus-ci'
//   run: |
//     TRUST_FINGERPRINTS=$(ssh -i ~/.ssh/id_rsa ${{ inputs.ssh_user }}@${{ inputs.remote_host }} "incus config trust list -f json")
//     TRUST_FINGERPRINTS=$(echo $TRUST_FINGERPRINTS | jq -r '.[] | select(.name == "incus-ci") | .fingerprint')
//     for fingerprint in $TRUST_FINGERPRINTS; do
//         echo $fingerprint
//         ssh -i ~/.ssh/id_rsa ${{ inputs.ssh_user }}@${{ inputs.remote_host }} "incus config trust remove $fingerprint"
//     done


// - name: Uninstall Incus
//   run: sudo apt remove -y incus-client
//   shell: bash

// - name: Remove apt repository
//   run: |
//     sudo rm -f /etc/apt/sources.list.d/zabbly-incus-stable.sources
//     sudo rm -f /etc/apt/keyrings/zabbly.asc
//   shell: bash
