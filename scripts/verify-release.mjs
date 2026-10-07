import { readFileSync } from 'fs';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function fail(message) {
  console.error(`❌ verify-release: ${message}`);
  process.exit(1);
}

const packageJson = readJson('package.json');
const lockJson = readJson('package-lock.json');
const manifestJson = readJson('manifest.json');
const versionsJson = readJson('versions.json');

const argExpected = process.argv.find((arg) => arg.startsWith('--expected-version='));
const expectedVersion = argExpected
  ? argExpected.split('=')[1]
  : process.env.EXPECTED_VERSION || process.env.INPUT_VERSION || '';

if (packageJson.version !== manifestJson.version) {
  fail(`package.json version (${packageJson.version}) does not match manifest.json version (${manifestJson.version}).`);
}

if (lockJson.version !== packageJson.version) {
  fail(`package-lock.json version (${String(lockJson.version)}) does not match package.json version (${packageJson.version}).`);
}

// Lockfiles v2/v3 represent the root package twice; both must agree.
if (lockJson.packages !== undefined || lockJson.lockfileVersion >= 2) {
  const rootVersion = lockJson.packages?.['']?.version;
  if (rootVersion !== packageJson.version) {
    fail(`package-lock.json packages[""].version (${String(rootVersion)}) does not match package.json version (${packageJson.version}).`);
  }
}

const mappedMinAppVersion = versionsJson[manifestJson.version];
if (mappedMinAppVersion !== manifestJson.minAppVersion) {
  fail(
    `versions.json["${manifestJson.version}"] (${String(mappedMinAppVersion)}) does not match manifest minAppVersion (${manifestJson.minAppVersion}).`
  );
}

if (expectedVersion) {
  if (packageJson.version !== expectedVersion) {
    fail(`package.json version (${packageJson.version}) does not match expected version (${expectedVersion}).`);
  }
  if (manifestJson.version !== expectedVersion) {
    fail(`manifest.json version (${manifestJson.version}) does not match expected version (${expectedVersion}).`);
  }
}

const tagRefName = process.env.GITHUB_REF_TYPE === 'tag'
  ? process.env.GITHUB_REF_NAME
  : (process.env.GITHUB_REF || '').startsWith('refs/tags/')
    ? (process.env.GITHUB_REF || '').slice('refs/tags/'.length)
    : '';

if (tagRefName && tagRefName !== manifestJson.version) {
  fail(`tag version (${tagRefName}) does not match manifest version (${manifestJson.version}).`);
}

console.log(`✅ verify-release: metadata is consistent for version ${manifestJson.version}.`);
