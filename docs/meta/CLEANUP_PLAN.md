# Repository Cleanup Plan 🧹

This document outlines a comprehensive cleanup strategy to organize the Make It Rain repository.

## 📊 Current State Analysis

### Directory Sizes
- `assets/` - 1.6MB (7 images)
- `docs/` - 157KB (15+ documentation files)
- `src/` - 152KB (source code)
- `tests/` - 84KB (test files)
- `scripts/` - 12KB (build scripts)
- `build/` - 2KB (compiled artifacts)

### Issues Identified
1. **Cluttered Root Directory** - Too many markdown files in root
2. **Duplicate Release Notes** - Same files in root and docs/release-notes/
3. **Temporary Documentation** - Testing setup files meant to be temporary
4. **Potentially Obsolete Files** - Patch files that may be applied already
5. **Unused Assets** - Images not referenced in documentation
6. **Inconsistent Organization** - Mix of user docs, dev docs, and meta docs

---

## 🗂️ Cleanup Actions

### 1️⃣ ROOT DIRECTORY - HIGH PRIORITY ⚠️

#### Files to MOVE

```bash
# Move release notes to docs/release-notes/
mv release-notes-1.7.1.md docs/release-notes/
mv release-notes-1.7.2.md docs/release-notes/
```

**Reasoning:** Release notes should be with other release notes in docs/

#### Files to ARCHIVE (Move to new docs/meta/ folder)

```bash
# Create meta documentation folder
mkdir -p docs/meta

# Move temporary testing documentation
mv FILES_CREATED.md docs/meta/
mv TESTING_SETUP_COMPLETE.md docs/meta/
```

**Reasoning:** These were created to document the testing setup but aren't needed for end users. Keep for reference but move out of root.

#### Files to KEEP in Root ✅

```
✅ README.md              - Main project readme
✅ CHANGELOG.md           - Version history (standard)
✅ LICENSE               - License file (standard)
✅ TESTING_QUICK_START.md - Quick reference for developers
✅ package.json          - NPM config (required)
✅ package-lock.json     - NPM lock file (required)
✅ tsconfig.json         - TypeScript config (required)
✅ jest.config.js        - Jest config (required)
✅ versions.json         - Obsidian versions (required)
✅ styles.css            - Plugin styles (required)
✅ .gitignore            - Git config (required)
✅ .markdownlint.json    - Markdown linting (required)
```

---

### 2️⃣ ASSETS DIRECTORY - MEDIUM PRIORITY

#### Analyze Asset Usage

Current assets:
```
1748151599078.webp              - ✅ USED in README.md (hero image)
Screenshot_20250526_013205.png  - ✅ USED in README.md
makeitrain.png                  - ? Check usage
makeitrain-imported-note.png    - ? Check usage
makeitrain-modal-v150.png       - ? Check usage
makeitrain-note-output.png      - ? Check usage
makeitrain-settings-v150.png    - ? Check usage
```

**Action Required:** Search docs for usage of each image

```bash
# Check which images are actually used
for img in assets/*.{png,webp}; do
  echo "Checking $(basename $img):"
  grep -r "$(basename $img)" . --include="*.md" | wc -l
done
```

#### Recommendation

**If unused:**
```bash
# Create archive folder
mkdir -p assets/archive

# Move unused to archive
mv assets/makeitrain-*.png assets/archive/ 2>/dev/null
```

**If used but outdated:**
- Consider renaming to semantic names (e.g., `hero-banner.webp` instead of `1748151599078.webp`)
- Update references in markdown files

---

### 3️⃣ SCRIPTS DIRECTORY - LOW PRIORITY

#### Files to Review

```
copy-to-vault.mjs          - ✅ KEEP (development utility)
esbuild.config.mjs         - ✅ KEEP (build script)
fix-json-parsing.patch     - ⚠️ REVIEW (may be obsolete)
```

**Action for `fix-json-parsing.patch`:**

1. Check if the patch has been applied to `src/main.ts`
2. If applied: DELETE (no longer needed)
3. If not applied: Either apply it or document why it exists

```bash
# Check if patch is already applied
grep -n "as CollectionResponse" src/main.ts
# If found multiple times, patch is likely applied - DELETE the .patch file
```

---

### 4️⃣ DOCS DIRECTORY - LOW PRIORITY

#### Current Structure
```
docs/
├── _config.yml                  - Jekyll config
├── *.md                        - 13 documentation files
└── release-notes/              - 9 release note files
```

#### Recommended Structure

```
docs/
├── _config.yml
├── index.md                    - Main documentation hub
├── user-guide/                 - ⬅️ NEW: User documentation
│   ├── installation.md
│   ├── configuration.md
│   ├── usage.md
│   ├── collections.md
│   ├── tags.md
│   ├── note-structure.md
│   ├── template-system.md
│   ├── template-gallery.md
│   ├── troubleshooting.md
│   ├── faq.md
│   └── known-issues.md
├── developer-guide/            - ⬅️ NEW: Developer documentation
│   ├── index.md               (current developer-guide.md)
│   ├── api-reference.md
│   ├── testing-guide.md
│   └── contributing.md        (create new)
├── release-notes/
│   └── *.md                   (11 files after moving root files)
└── meta/                       - ⬅️ NEW: Meta documentation
    ├── FILES_CREATED.md
    └── TESTING_SETUP_COMPLETE.md
```

**Benefits:**
- Clear separation of user vs developer docs
- Better navigation
- Scalable structure

---

### 5️⃣ BUILD DIRECTORY - KEEP AS IS ✅

```
build/
├── manifest.json  - ✅ Generated by build script
└── styles.css     - ✅ Generated by build script
```

**Action:** None - these are build artifacts (already in .gitignore via `main.js`)

---

### 6️⃣ TESTS DIRECTORY - ADD MISSING FILES

#### Current Structure
```
tests/
├── setup.ts
├── README.md
├── unit/
│   └── utils/
│       ├── apiUtils.test.ts
│       ├── fileUtils.test.ts
│       └── yamlUtils.test.ts
├── integration/                - EMPTY
└── mocks/
    └── raindropData.ts
```

#### Add Placeholder Files

```bash
# Add .gitkeep to preserve empty directories
touch tests/integration/.gitkeep

# Or add a README
cat > tests/integration/README.md << 'EOF'
# Integration Tests

This directory will contain integration tests for the Make It Rain plugin.

## Planned Tests

- [ ] Full raindrop import workflow
- [ ] Template processing end-to-end
- [ ] Settings management
- [ ] Modal interactions

## Running Integration Tests

```bash
npm run test:integration
```

Integration tests are not yet implemented. Contributions welcome!
EOF
```

---

## 🎯 Prioritized Action Plan

### Phase 1: Quick Wins (5 minutes)

```bash
# 1. Move duplicate release notes
mv release-notes-1.7.1.md docs/release-notes/
mv release-notes-1.7.2.md docs/release-notes/

# 2. Create meta docs folder and move temporary docs
mkdir -p docs/meta
mv FILES_CREATED.md docs/meta/
mv TESTING_SETUP_COMPLETE.md docs/meta/

# 3. Check and remove obsolete patch if applied
# (Manual check required - see section 3)

# 4. Add integration test placeholder
touch tests/integration/.gitkeep
```

**Result:** Root directory cleaned up from 7 markdown files to 3

### Phase 2: Asset Cleanup (10 minutes)

```bash
# 1. Audit asset usage
for img in assets/*; do
  echo "=== $(basename $img) ==="
  grep -r "$(basename $img)" . --include="*.md" 2>/dev/null || echo "  NOT FOUND"
done

# 2. Based on results, move unused to archive
mkdir -p assets/archive
# mv assets/unused-file.png assets/archive/

# 3. Consider renaming cryptic filenames
# git mv assets/1748151599078.webp assets/hero-banner.webp
# Then update README.md reference
```

### Phase 3: Documentation Restructure (30 minutes) - OPTIONAL

This is a bigger change but improves long-term maintainability:

```bash
# Create new structure
mkdir -p docs/user-guide
mkdir -p docs/developer-guide

# Move user docs
mv docs/installation.md docs/user-guide/
mv docs/configuration.md docs/user-guide/
mv docs/usage.md docs/user-guide/
mv docs/collections.md docs/user-guide/
mv docs/tags.md docs/user-guide/
mv docs/note-structure.md docs/user-guide/
mv docs/template-system.md docs/user-guide/
mv docs/template-gallery.md docs/user-guide/
mv docs/troubleshooting.md docs/user-guide/
mv docs/faq.md docs/user-guide/
mv docs/known-issues.md docs/user-guide/

# Move developer docs
mv docs/developer-guide.md docs/developer-guide/index.md
mv docs/api-reference.md docs/developer-guide/
mv docs/testing-guide.md docs/developer-guide/

# Update docs/index.md with new structure
```

**⚠️ WARNING:** This will break existing documentation links! Only do this if:
- You're willing to update all internal links
- You can add redirects in Jekyll config
- Or you're okay with a breaking change

---

## 📋 Cleanup Checklist

### Immediate (Do Now)
- [ ] Move `release-notes-1.7.1.md` to `docs/release-notes/`
- [ ] Move `release-notes-1.7.2.md` to `docs/release-notes/`
- [ ] Create `docs/meta/` directory
- [ ] Move `FILES_CREATED.md` to `docs/meta/`
- [ ] Move `TESTING_SETUP_COMPLETE.md` to `docs/meta/`
- [ ] Check if `scripts/fix-json-parsing.patch` is applied
- [ ] Delete `scripts/fix-json-parsing.patch` if obsolete
- [ ] Add `tests/integration/.gitkeep` or README

### Short Term (This Week)
- [ ] Audit asset usage with grep
- [ ] Archive or delete unused assets
- [ ] Consider renaming `1748151599078.webp` to `hero-banner.webp`
- [ ] Consider renaming `Screenshot_20250526_013205.png` to something semantic
- [ ] Update asset references in README if renamed
- [ ] Create CONTRIBUTING.md in docs/developer-guide/

### Long Term (Optional)
- [ ] Restructure docs/ into user-guide/ and developer-guide/
- [ ] Add redirects for old documentation URLs
- [ ] Update all internal documentation links
- [ ] Add docs/README.md navigation guide

---

## 🔍 Commands to Run

### Audit Current State

```bash
# See all markdown files in root
ls -lh *.md

# Find all images and their usage
find assets -type f -name "*.png" -o -name "*.webp" -o -name "*.jpg" | while read img; do
  echo "=== $img ==="
  grep -r "$(basename $img)" . --include="*.md" 2>/dev/null || echo "  NOT REFERENCED"
done

# Check patch file status
grep -c "as CollectionResponse" src/main.ts
# If count > 0, patch is likely applied

# See directory sizes
du -sh assets/ docs/ scripts/ build/ tests/ src/
```

### Execute Phase 1 Cleanup

```bash
# Create backup first (optional but recommended)
git checkout -b cleanup-repo

# Execute moves
mv release-notes-1.7.1.md docs/release-notes/
mv release-notes-1.7.2.md docs/release-notes/
mkdir -p docs/meta
mv FILES_CREATED.md docs/meta/
mv TESTING_SETUP_COMPLETE.md docs/meta/

# Add integration test placeholder
echo "# Integration Tests\n\nComing soon..." > tests/integration/README.md

# Check patch
grep "as CollectionResponse" src/main.ts
# If found, delete patch:
# rm scripts/fix-json-parsing.patch

# Commit changes
git add -A
git commit -m "chore: cleanup repository structure

- Move release notes to docs/release-notes/
- Archive temporary testing docs to docs/meta/
- Add integration test placeholder
- Remove obsolete patch file (if applicable)
"
```

---

## 📊 Before & After

### Before (Root Directory)
```
.
├── CHANGELOG.md
├── FILES_CREATED.md                    ❌ Temporary
├── LICENSE
├── README.md
├── TESTING_QUICK_START.md
├── TESTING_SETUP_COMPLETE.md          ❌ Temporary
├── jest.config.js
├── package.json
├── package-lock.json
├── release-notes-1.7.1.md             ❌ Duplicate
├── release-notes-1.7.2.md             ❌ Duplicate
├── styles.css
├── tsconfig.json
└── versions.json

Total: 14 files (7 markdown)
```

### After (Root Directory)
```
.
├── CHANGELOG.md
├── LICENSE
├── README.md
├── TESTING_QUICK_START.md             ✅ Useful reference
├── jest.config.js
├── package.json
├── package-lock.json
├── styles.css
├── tsconfig.json
└── versions.json

Total: 10 files (3 markdown)
```

**Result:** 4 files moved, root directory 29% smaller and more focused

---

## 💡 Additional Recommendations

### 1. Add .editorconfig

Create `.editorconfig` for consistent formatting:

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

### 2. Add CONTRIBUTING.md

Create `CONTRIBUTING.md` in root or `docs/developer-guide/`:

```markdown
# Contributing to Make It Rain

Thank you for your interest in contributing!

## Quick Links
- [Developer Guide](../developer-guide/index.md)
- [Testing Guide](../developer-guide/testing-guide.md)
- [API Reference](../developer-guide/api-reference.md)

## Getting Started
1. Fork the repository
2. Clone your fork
3. Run `npm install`
4. Run `npm test` to verify setup
5. Make your changes
6. Run tests again
7. Submit a pull request

See [Developer Guide](../developer-guide/index.md) for detailed instructions.
```

### 3. Update README.md

Add a "Repository Structure" section:

```markdown
## 📁 Repository Structure

```
make-it-rain/
├── src/                # Plugin source code
├── tests/              # Test suite
├── docs/               # Documentation
│   ├── user-guide/     # User documentation
│   ├── developer-guide/# Developer docs
│   └── release-notes/  # Version history
├── scripts/            # Build scripts
└── assets/             # Images and media
```
```

### 4. Create .gitattributes

Add `.gitattributes` for consistent line endings:

```
* text=auto
*.ts text eol=lf
*.js text eol=lf
*.md text eol=lf
*.json text eol=lf
```

---

## ⚠️ Important Notes

1. **Backup First**: Create a branch before making changes
   ```bash
   git checkout -b cleanup-repo
   ```

2. **Test After Changes**: Run the build and tests after cleanup
   ```bash
   npm run build
   npm test
   ```

3. **Update Links**: If you restructure docs/, update all internal links

4. **GitHub Pages**: If docs are published, test that pages still build

5. **Commit Incrementally**: Don't do everything in one commit
   ```bash
   git commit -m "chore: move release notes to docs/"
   git commit -m "chore: archive temporary documentation"
   git commit -m "chore: cleanup unused assets"
   ```

---

## 🎉 Expected Outcome

After cleanup:

✅ **Cleaner root directory** - Only essential files in root
✅ **Better organization** - Logical grouping of related files
✅ **Easier navigation** - Clear structure for contributors
✅ **Reduced confusion** - No duplicate or temporary files
✅ **Professional appearance** - Well-maintained repository
✅ **Easier maintenance** - Clear where to add new files

---

## 🤔 Questions?

Before deleting anything:
1. Is this file referenced anywhere?
2. Is this file generated by a build step?
3. Will removing this break anything?
4. Should this be archived instead of deleted?

When in doubt, **move to archive instead of delete**.

---

**Ready to clean up?** Start with Phase 1 (5 minutes) and see immediate results! 🚀