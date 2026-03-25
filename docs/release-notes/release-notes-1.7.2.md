# Release v1.7.2

## 🐛 Bug Fixes

### Fixed Release Packaging (Issue #6)
- **Problem:** Users downloading "Source code (zip)" didn't receive the compiled plugin files (`main.js`, `manifest.json`, `styles.css`)
- **Solution:** Release workflow now creates `make-it-rain.zip` containing all required plugin files
- **Documentation:** Updated README with clearer installation instructions and warning about which file to download

## 📝 Documentation

- Clarified manual installation steps in README
- Added prominent warning to download `make-it-rain.zip` instead of "Source code (zip)"

## 🔧 Maintenance

- Added issue templates for bug reports and feature requests
- General repository cleanup

## 👋 Community

Thanks to @haranrk and @timebinder for reporting the confusion around release downloads. Your feedback helps improve the project!

**Note to users:** If you previously had trouble installing the plugin from the release page, please try again with the new `make-it-rain.zip` file in this release.
