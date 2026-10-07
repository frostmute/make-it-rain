import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const version = process.argv[2];
const prepare = fileURLToPath(new URL('./prepare-release.mjs', import.meta.url));
function git(args, cwd = process.cwd()) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

try {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version || '')) {
    throw new Error('Expected a stable x.y.z release version.');
  }

  // An empty successful response means no tag; transport failures must abort.
  const remoteTag = git(['ls-remote', 'origin', `refs/tags/${version}`]);
  let resume = false;
  if (remoteTag) {
    git(['fetch', '--no-tags', 'origin', 'refs/heads/main:refs/remotes/origin/main']);
    git(['fetch', '--no-tags', 'origin', `refs/tags/${version}`]);
    const sha = git(['rev-parse', 'FETCH_HEAD^{commit}']);
    try {
      git(['merge-base', '--is-ancestor', sha, 'origin/main']);
    } catch {
      throw new Error(`Tag ${version} is not part of published main history.`);
    }
    const parents = git(['rev-list', '--parents', '-n', '1', sha]).split(' ').slice(1);
    if (parents.length !== 1) {
      throw new Error(`Tag ${version} must point to a release commit with one parent.`);
    }

    // Recreate the version transition from its parent. This rejects a tag on
    // unrelated source changes, incorrect metadata, or an unchanged version.
    const temp = mkdtempSync(join(tmpdir(), 'make-it-rain-resume-'));
    const worktree = join(temp, 'source');
    try {
      git(['worktree', 'add', '--detach', worktree, parents[0]]);
      execFileSync(process.execPath, [prepare, version], { cwd: worktree, stdio: 'inherit' });
      try {
        git(['diff', '--quiet', sha, '--'], worktree);
      } catch {
        throw new Error(`Tag ${version} does not match the expected release tree.`);
      }
    } finally {
      git(['worktree', 'remove', '--force', worktree]);
      rmSync(temp, { recursive: true, force: true });
    }
    git(['checkout', '--detach', sha]);
    console.log(`Resuming release ${version} from ${sha}.`);
    resume = true;
  }

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `resume=${resume}\n`);
  }
} catch (error) {
  console.error(`select-release-source: ${error.message}`);
  process.exit(1);
}
