import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const packageJson = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8'));
const cleanEnv = {
  ...process.env,
  EXPECTED_VERSION: '',
  INPUT_VERSION: '',
  GITHUB_REF: '',
  GITHUB_REF_TYPE: '',
  GITHUB_REF_NAME: '',
};

function writeJson(dir, file, data) {
  writeFileSync(join(dir, file), JSON.stringify(data, null, 2) + '\n');
}

function readJson(dir, file) {
  return JSON.parse(readFileSync(join(dir, file), 'utf8'));
}

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'make-it-rain-release-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, 'scripts'));
  for (const script of ['prepare-release.mjs', 'verify-release.mjs', 'version-bump.mjs']) {
    copyFileSync(join(repo, 'scripts', script), join(dir, 'scripts', script));
  }
  writeJson(dir, 'package.json', {
    name: 'make-it-rain',
    version: '2.1.2',
    scripts: { version: packageJson.scripts.version },
  });
  writeJson(dir, 'package-lock.json', {
    name: 'make-it-rain',
    version: '2.1.2',
    lockfileVersion: 3,
    packages: { '': { name: 'make-it-rain', version: '2.1.2' } },
  });
  writeJson(dir, 'manifest.json', { id: 'make-it-rain', version: '2.1.2', minAppVersion: '1.13.0' });
  writeJson(dir, 'versions.json', { '2.1.1': '1.13.0', '2.1.2': '1.13.0' });
  const initialized = spawnSync('git', ['init', '--quiet'], { cwd: dir, encoding: 'utf8' });
  assert.equal(initialized.status, 0, initialized.stderr);
  return dir;
}

function run(dir, script, args = [], env = {}) {
  return spawnSync(process.execPath, [join(dir, 'scripts', script), ...args], {
    cwd: dir,
    encoding: 'utf8',
    env: { ...cleanEnv, ...env },
  });
}

function succeeds(result) {
  assert.equal(result.status, 0, result.stdout + result.stderr);
}

function fails(result, message) {
  assert.notEqual(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stderr, message);
}

test('repository metadata is consistent before any release transition', () => {
  succeeds(run(repo, 'verify-release.mjs'));
});

test('npm version advances all metadata from 2.1.2 to 2.1.5 without creating a tag', (t) => {
  const dir = fixture(t);
  succeeds(run(dir, 'prepare-release.mjs', ['2.1.5']));
  succeeds(run(dir, 'verify-release.mjs', ['--expected-version=2.1.5']));
  const lock = readJson(dir, 'package-lock.json');
  assert.equal(lock.version, '2.1.5');
  assert.equal(lock.packages[''].version, '2.1.5');
  assert.deepEqual(readJson(dir, 'versions.json'), {
    '2.1.1': '1.13.0', '2.1.2': '1.13.0', '2.1.5': '1.13.0',
  });
  const tags = spawnSync('git', ['tag', '--list'], { cwd: dir, encoding: 'utf8' });
  assert.equal(tags.status, 0, tags.stderr);
  assert.equal(tags.stdout, '');
});

for (const requested of ['2.1.2', '2.1.1', '2.0.9']) {
  test(`rejects unchanged/older release ${requested} without mutating metadata`, (t) => {
    const dir = fixture(t);
    const files = ['package.json', 'package-lock.json', 'manifest.json', 'versions.json'];
    const before = files.map((file) => readFileSync(join(dir, file), 'utf8'));
    fails(run(dir, 'prepare-release.mjs', [requested]), /must be newer than source version/);
    assert.deepEqual(files.map((file) => readFileSync(join(dir, file), 'utf8')), before);
  });
}

for (const requested of ['2.1.5;echo unsafe', 'v2.1.5', '02.1.5', '2.1.5-beta.1']) {
  test(`rejects invalid stable release version ${requested}`, (t) => {
    fails(run(fixture(t), 'prepare-release.mjs', [requested]), /Expected stable x.y.z/);
  });
}

for (const [name, mutate, message] of [
  ['lockfile top-level version', (lock) => { lock.version = '2.1.1'; }, /package-lock.json version/],
  ['lockfile root package version', (lock) => { lock.packages[''].version = '2.1.1'; }, /packages\[""\].version/],
  ['missing lockfile root package', (lock) => { delete lock.packages['']; }, /packages\[""\].version/],
  ['missing v3 packages map', (lock) => { delete lock.packages; }, /packages\[""\].version/],
]) {
  test(`rejects ${name} mismatch both in verification and before versioning`, (t) => {
    const dir = fixture(t);
    const lock = readJson(dir, 'package-lock.json');
    mutate(lock);
    writeJson(dir, 'package-lock.json', lock);
    fails(run(dir, 'verify-release.mjs'), message);
    fails(run(dir, 'prepare-release.mjs', ['2.1.5']), message);
    assert.equal(readJson(dir, 'package.json').version, '2.1.2');
  });
}

test('supports legacy v1 lockfiles without a packages map', (t) => {
  const dir = fixture(t);
  const lock = readJson(dir, 'package-lock.json');
  lock.lockfileVersion = 1;
  delete lock.packages;
  writeJson(dir, 'package-lock.json', lock);
  succeeds(run(dir, 'verify-release.mjs'));
});

test('expected version and tag context must match metadata', (t) => {
  const dir = fixture(t);
  fails(run(dir, 'verify-release.mjs', ['--expected-version=2.1.5']), /expected version/);
  fails(run(dir, 'verify-release.mjs', [], { GITHUB_REF_TYPE: 'tag', GITHUB_REF_NAME: '2.1.5' }), /tag version/);
  succeeds(run(dir, 'verify-release.mjs', ['--expected-version=2.1.2'], {
    GITHUB_REF_TYPE: 'tag', GITHUB_REF_NAME: '2.1.2',
  }));
});

test('manifest version and minimum app version remain verified', (t) => {
  const dir = fixture(t);
  const manifest = readJson(dir, 'manifest.json');
  manifest.version = '2.1.5';
  writeJson(dir, 'manifest.json', manifest);
  fails(run(dir, 'verify-release.mjs'), /manifest.json version/);
  manifest.version = '2.1.2';
  manifest.minAppVersion = '9.0.0';
  writeJson(dir, 'manifest.json', manifest);
  fails(run(dir, 'verify-release.mjs'), /minAppVersion/);
});

test('an atomic publication rejects both refs if the tag is rejected remotely', (t) => {
  const dir = fixture(t);
  const remote = join(dir, 'remote.git');
  function git(args) {
    const result = spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    return result.stdout.trim();
  }
  git(['init', '--bare', '--quiet', remote]);
  git(['config', 'user.name', 'Release test']);
  git(['config', 'user.email', 'release-test@example.invalid']);
  git(['add', 'package.json', 'package-lock.json', 'manifest.json', 'versions.json']);
  git(['commit', '--quiet', '-m', 'source']);
  git(['remote', 'add', 'origin', remote]);
  git(['push', '--quiet', 'origin', 'HEAD:refs/heads/main']);
  const before = git(['rev-parse', 'HEAD']);
  succeeds(run(dir, 'prepare-release.mjs', ['2.1.5']));
  git(['add', 'package.json', 'package-lock.json', 'manifest.json', 'versions.json']);
  git(['commit', '--quiet', '-m', 'release']);
  git(['tag', '2.1.5']);
  const hook = join(remote, 'hooks', 'update');
  writeFileSync(hook, '#!/bin/sh\ncase "$1" in refs/tags/*) exit 1 ;; esac\nexit 0\n', { mode: 0o755 });
  const rejected = spawnSync('git', [
    'push', '--atomic', 'origin', 'HEAD:refs/heads/main', 'refs/tags/2.1.5:refs/tags/2.1.5',
  ], { cwd: dir, encoding: 'utf8' });
  assert.notEqual(rejected.status, 0, rejected.stdout + rejected.stderr);
  assert.equal(git(['ls-remote', 'origin', 'refs/heads/main']), before + '\trefs/heads/main');
  assert.equal(git(['ls-remote', 'origin', 'refs/tags/2.1.5']), '');
});
