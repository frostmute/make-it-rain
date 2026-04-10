# Repository Cleanup Checklist ✅

Quick reference checklist for cleaning up the repository.

## Before You Start

- [x] Read `CLEANUP_PLAN.md` (5 min overview)
- [x] Create backup: `git checkout -b cleanup-repo`
- [x] Ensure working directory is clean: `git status`

## Phase 1: Quick Wins (5 minutes) ⭐

### Automated Approach (Recommended)

- [x] Test cleanup: `bash cleanup.sh --dry-run`
- [x] Review what will be done
- [x] Execute cleanup: `bash cleanup.sh`
- [x] Verify changes: `git status`

### Manual Approach

- [ ] Move `release-notes-1.7.1.md` to `docs/release-notes/`
- [ ] Move `release-notes-1.7.2.md` to `docs/release-notes/`
- [ ] Create `docs/meta/` directory
- [ ] Move `FILES_CREATED.md` to `docs/meta/`
- [ ] Move `TESTING_SETUP_COMPLETE.md` to `docs/meta/`
- [ ] Check if patch is applied: `grep "as CollectionResponse" src/main.ts`
- [ ] If applied, delete `scripts/fix-json-parsing.patch`
- [ ] Create `tests/integration/README.md`

### Verification

- [x] Build still works: `npm run build`
- [x] Tests still pass: `npm test`
- [x] Git status shows expected changes

### Commit

- [ ] Review changes: `git diff`
- [ ] Stage files: `git add -A`
- [ ] Commit: `git commit -m "chore: cleanup repository structure"`

**Result:** Root directory reduced from 14 → 10 files ✨

---

## Phase 2: Asset Cleanup (10 minutes) - Optional

### Audit Assets

- [ ] Run asset audit: See CLEANUP_PLAN.md Section 2
- [ ] List all images: `ls -lh assets/`
- [ ] Check each image usage:

  ```bash
  grep -r "1748151599078.webp" . --include="*.md"
  grep -r "Screenshot_20250526" . --include="*.md"
  grep -r "makeitrain.png" . --include="*.md"
  grep -r "makeitrain-imported-note.png" . --include="*.md"
  grep -r "makeitrain-modal-v150.png" . --include="*.md"
  grep -r "makeitrain-note-output.png" . --include="*.md"
  grep -r "makeitrain-settings-v150.png" . --include="*.md"
  ```

### Archive Unused

- [ ] Create archive: `mkdir -p assets/archive`
- [ ] Move unused images to archive
- [ ] Note which images were archived

### Rename Cryptic Files (Optional)

- [ ] Rename `1748151599078.webp` → `hero-banner.webp`
- [ ] Update README.md reference
- [ ] Rename `Screenshot_20250526_013205.png` → `imported-note-example.png`
- [ ] Update README.md reference
- [ ] Test that all images still display

### Commit

- [ ] `git add assets/`
- [ ] `git commit -m "chore: cleanup and organize assets"`

---

## Phase 3: Docs Restructure (30 minutes) - Optional

⚠️ **Warning:** This is a breaking change for documentation links!

### Create New Structure

- [ ] Create `docs/user-guide/`
- [ ] Create `docs/developer-guide/`
- [ ] Review current docs structure

### Move User Documentation

- [ ] Move `docs/installation.md` → `docs/user-guide/`
- [ ] Move `docs/configuration.md` → `docs/user-guide/`
- [ ] Move `docs/usage.md` → `docs/user-guide/`
- [ ] Move `docs/collections.md` → `docs/user-guide/`
- [ ] Move `docs/tags.md` → `docs/user-guide/`
- [ ] Move `docs/note-structure.md` → `docs/user-guide/`
- [ ] Move `docs/template-system.md` → `docs/user-guide/`
- [ ] Move `docs/template-gallery.md` → `docs/user-guide/`
- [ ] Move `docs/troubleshooting.md` → `docs/user-guide/`
- [ ] Move `docs/faq.md` → `docs/user-guide/`
- [ ] Move `docs/known-issues.md` → `docs/user-guide/`

### Move Developer Documentation

- [ ] Move `docs/developer-guide.md` → `docs/developer-guide/index.md`
- [ ] Move `docs/api-reference.md` → `docs/developer-guide/`
- [ ] Move `docs/testing-guide.md` → `docs/developer-guide/`

### Update Links

- [ ] Update `docs/index.md` with new structure
- [ ] Search for internal links: `grep -r "docs/" . --include="*.md"`
- [ ] Update all broken links
- [ ] Add redirects in `docs/_config.yml` if using GitHub Pages

### Commit

- [ ] `git add docs/`
- [ ] `git commit -m "chore: restructure documentation"`

---

## Additional Improvements - Optional

### Add Missing Files

- [ ] Create `.editorconfig`
- [ ] Create `.gitattributes`
- [ ] Create `CONTRIBUTING.md`
- [ ] Create `docs/developer-guide/contributing.md`

### Update Documentation

- [ ] Add repository structure to README.md
- [ ] Update links in README if docs were restructured
- [ ] Verify GitHub Pages build (if applicable)

### Commit

- [ ] `git add .`
- [ ] `git commit -m "chore: add missing config files and update docs"`

---

## Final Steps

### Testing

- [ ] Full build: `npm run build`
- [ ] Run tests: `npm test`
- [ ] Check coverage: `npm run test:coverage`
- [ ] Verify all assets load in README
- [ ] Check GitHub Pages build (if applicable)

### Review

- [ ] Review all commits: `git log --oneline`
- [ ] Check final structure: `tree -L 2 -I 'node_modules|coverage'`
- [ ] Verify root directory is cleaner: `ls -la *.md`

### Merge

- [ ] Switch to main: `git checkout main`
- [ ] Merge cleanup: `git merge cleanup-repo`
- [ ] Push changes: `git push origin main`
- [ ] Delete cleanup branch: `git branch -d cleanup-repo`

---

## Success Criteria ✨

After cleanup, you should have:

✅ Cleaner root directory (3 markdown files instead of 7)
✅ No duplicate files
✅ Organized documentation structure
✅ Only used assets
✅ All tests passing
✅ All builds successful
✅ Professional repository appearance

---

## Rollback Plan

If something goes wrong:

```bash
# If you haven't committed yet
git checkout .
git clean -fd

# If you've committed but not pushed
git reset --hard HEAD~1

# If you've pushed
git revert HEAD
```

---

## Questions?

- 📖 Full details: `CLEANUP_PLAN.md`
- 🤖 Automated: `bash cleanup.sh --dry-run`
- 💬 Issues: Open a GitHub discussion

---

**Start with Phase 1 and see immediate results!** 🚀
