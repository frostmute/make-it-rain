# Troubleshooting Guide

Common issues and solutions for the Make It Rain plugin development.

## Table of Contents

- [Line Ending Issues (CRLF vs LF)](#line-ending-issues-crlf-vs-lf)
- [Build Issues](#build-issues)
- [Test Issues](#test-issues)
- [Git Issues](#git-issues)

---

## Line Ending Issues (CRLF vs LF)

### Symptoms

When running bash scripts (like `cleanup.sh`), you see errors like:

```
cleanup.sh: line 2: $'\r': command not found
bash: syntax error near unexpected token
```

### Cause

The script files have Windows-style line endings (CRLF: `\r\n`) instead of Unix-style line endings (LF: `\n`). This happens when:

- Files are created on Windows
- Git is configured to auto-convert line endings
- Editor is set to use CRLF

### Quick Fix

**Option 1: Using sed (recommended)**

```bash
sed -i 's/\r$//' cleanup.sh
```

**Option 2: Using dos2unix (if available)**

```bash
dos2unix cleanup.sh
```

**Option 3: Using Git**

```bash
# Convert line endings for a single file
git add --renormalize cleanup.sh

# Or for all files
git add --renormalize .
```

### Verify the Fix

Check that line endings are corrected:

```bash
file cleanup.sh
```

Should show:

```
cleanup.sh: Bourne-Again shell script, Unicode text, UTF-8 text executable
```

NOT:

```
cleanup.sh: ... with CRLF line terminators  ❌
```

### Permanent Solution

Add `.gitattributes` to force LF line endings:

```bash
cat > .gitattributes << 'EOF'
# Auto detect text files and normalize line endings
* text=auto

# Force LF for shell scripts
*.sh text eol=lf

# Force LF for common text files
*.ts text eol=lf
*.js text eol=lf
*.json text eol=lf
*.md text eol=lf
*.yml text eol=lf
*.yaml text eol=lf

# Binary files
*.png binary
*.jpg binary
*.webp binary
*.gif binary
EOF
```

Then renormalize the repository:

```bash
git add --renormalize .
git commit -m "chore: normalize line endings"
```

### Configure Git Globally

**For WSL/Linux/macOS:**

```bash
git config --global core.autocrlf input
```

This converts CRLF to LF on commit, but doesn't convert on checkout.

**For Windows (if not using WSL):**

```bash
git config --global core.autocrlf true
```

This converts LF to CRLF on checkout, and CRLF to LF on commit.

### Configure Your Editor

**VS Code:**

Add to `.vscode/settings.json`:

```json
{
  "files.eol": "\n"
}
```

Or set globally: File → Preferences → Settings → search for "eol" → set to `\n`

**Other Editors:**

- **Sublime Text**: View → Line Endings → Unix
- **Atom**: Settings → Line Ending Selector → LF
- **Vim**: `:set ff=unix`
- **Nano**: Should use LF by default on Unix systems

---

## Build Issues

### Error: Cannot find module 'obsidian'

**Cause:** Dependencies not installed or corrupted.

**Solution:**

```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: Build fails with TypeScript errors

**Cause:** TypeScript version mismatch or configuration issue.

**Solution:**

```bash
# Check TypeScript version
npx tsc --version

# Rebuild
npm run build
```

### Error: esbuild not found

**Cause:** Dev dependencies not installed.

**Solution:**

```bash
npm install --save-dev esbuild
npm run build
```

---

## Test Issues

### Tests won't run

**Symptoms:**

```
jest: command not found
```

**Solution:**

```bash
# Install dependencies
npm install

# Clear cache and retry
npm test -- --clearCache
npm test
```

### Module resolution errors

**Symptoms:**

```
Cannot find module '../../../src/utils/fileUtils'
```

**Solution:**

1. Check `jest.config.js` module mapper
2. Verify file paths are correct
3. Clear Jest cache:

```bash
npm test -- --clearCache
```

### Mock not working

**Solution:**

```typescript
// Always clear mocks in beforeEach
beforeEach(() => {
    jest.clearAllMocks();
});

// Verify mock is configured
mockFunction.mockReturnValue('value');
expect(mockFunction()).toBe('value');
```

---

## Git Issues

### Large files in repository

**Cause:** Accidentally committed `node_modules/` or `coverage/`.

**Solution:**

```bash
# Remove from Git but keep locally
git rm -r --cached node_modules coverage

# Ensure .gitignore is correct
echo "node_modules/" >> .gitignore
echo "coverage/" >> .gitignore

# Commit the changes
git add .gitignore
git commit -m "chore: remove large files from git"
```

### Accidental commit to main

**Solution:**

```bash
# Undo the last commit (keep changes)
git reset --soft HEAD~1

# Create a new branch
git checkout -b feature-branch

# Commit on the new branch
git commit -m "feat: your feature"
```

### Merge conflicts

**Solution:**

```bash
# Update your branch with latest main
git checkout your-branch
git fetch origin
git rebase origin/main

# Resolve conflicts in your editor
# Then:
git add .
git rebase --continue
```

---

## WSL-Specific Issues

### Permission denied errors

**Cause:** File permissions not set correctly.

**Solution:**

```bash
# Make scripts executable
chmod +x cleanup.sh
chmod +x scripts/*.mjs

# Verify
ls -l cleanup.sh
```

### "wsl: The wsl2.localhostForwarding setting has no effect"

**This is just a warning and can be safely ignored.** It doesn't affect functionality.

To disable the warning, add to `~/.wslconfig`:

```ini
[wsl2]
localhostForwarding=false
```

### Files created in WSL not visible in Windows

**Cause:** Using different filesystem locations.

**Solution:**

Work in `/mnt/c/Users/YourName/Projects/` for cross-compatibility, or use the Windows filesystem path.

---

## NPM Issues

### Package-lock.json conflicts

**Solution:**

```bash
# Delete lock file and reinstall
rm package-lock.json
npm install
```

### Outdated dependencies

**Check for updates:**

```bash
npm outdated
```

**Update all dependencies:**

```bash
npm update
```

**Update to latest (breaking changes possible):**

```bash
npx npm-check-updates -u
npm install
```

---

## Documentation Build Issues

### Jekyll build fails

**Cause:** GitHub Pages configuration issue.

**Solution:**

1. Check `docs/_config.yml` is valid YAML
2. Ensure all required frontmatter is present
3. Check GitHub Actions logs for specific errors

### Links broken after reorganization

**Solution:**

```bash
# Find all markdown links
grep -r "](docs/" . --include="*.md"

# Update broken links
# Consider adding redirects in docs/_config.yml
```

---

## Performance Issues

### Slow tests

**Solution:**

```bash
# Run specific tests
npm test -- fileUtils.test.ts

# Run in parallel (if not already)
npm test -- --maxWorkers=4

# Run only changed tests
npm test -- --onlyChanged
```

### Slow builds

**Solution:**

```bash
# Use watch mode for development
npm run dev

# Clear build cache
rm -rf build/
npm run build
```

---

## Getting Help

If you encounter an issue not listed here:

1. **Check existing issues:** [GitHub Issues](https://github.com/frostmute/make-it-rain/issues)
2. **Search discussions:** [GitHub Discussions](https://github.com/frostmute/make-it-rain/discussions)
3. **Ask for help:** Open a new issue with:
   - Error message (full output)
   - Steps to reproduce
   - Environment info (OS, Node version, etc.)
   - What you've tried

### Useful Debug Commands

```bash
# Check Node/NPM versions
node --version
npm --version

# Check Git config
git config --list

# Check file line endings
file cleanup.sh

# Verify build output
ls -lh build/

# Check test coverage
npm run test:coverage
```

---

## Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| CRLF errors | `sed -i 's/\r$//' cleanup.sh` |
| Build fails | `rm -rf node_modules && npm install && npm run build` |
| Tests fail | `npm test -- --clearCache && npm test` |
| Permission denied | `chmod +x cleanup.sh` |
| Merge conflicts | `git rebase origin/main` |

---

**Still stuck?** Don't hesitate to open an issue on GitHub! 🚀
