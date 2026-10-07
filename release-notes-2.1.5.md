# Make It Rain 2.1.5

This stabilization release closes the settings-access regression path from #97 and hardens release integrity checks.

## Highlights

- **Settings lifecycle clarified:** `RaindropToObsidianSettingTab` now uses a single imperative entry path (`display()` → `renderSettings()`).
- **Persisted settings hydration hardened:** malformed structured values are normalized defensively during `loadSettings()` so settings rendering does not crash.
- **Regression coverage expanded:** tests now cover malformed persisted settings through full `loadSettings()` + settings-tab `display()` rendering.
- **Release/CI metadata integrity checks added:** release metadata consistency is now verified by script and enforced in CI/release workflows.
- **Release workflow hardened:** versioning now happens before install/test/build, with deterministic installs and tag/artifact/commit verification.
