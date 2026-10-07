import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Ordinary source retains its existing version. Only release preparation
// advances it, using npm's version lifecycle to update the lockfile and manifest.
const requested = process.argv[2];
const current = JSON.parse(readFileSync('package.json', 'utf8')).version;
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function fail(message) {
  console.error(`prepare-release: ${message}`);
  process.exit(1);
}

if (!versionPattern.test(requested || '') || !versionPattern.test(current || '')) {
  fail(`Expected stable x.y.z versions; source=${current}, requested=${requested}.`);
}

const from = current.split('.').map(BigInt);
const to = requested.split('.').map(BigInt);
const differing = to.findIndex((value, index) => value !== from[index]);
if (differing === -1 || to[differing] < from[differing]) {
  fail(`Requested version ${requested} must be newer than source version ${current}. The release workflow owns the version transition; do not pre-version source.`);
}

// Refuse inconsistent input before npm can conceal stale metadata.
const verifier = fileURLToPath(new URL('./verify-release.mjs', import.meta.url));
execFileSync(process.execPath, [verifier], { stdio: 'inherit' });
execFileSync('npm', ['version', requested, '--no-git-tag-version'], { stdio: 'inherit' });
execFileSync(process.execPath, [verifier, `--expected-version=${requested}`], { stdio: 'inherit' });
