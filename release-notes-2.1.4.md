# Make It Rain 2.1.4

This hotfix restores the Make It Rain Settings pane on Obsidian 1.13+ (including current/latest builds). Version 2.1.3 removed the deprecated `PluginSettingTab.display()` override while keeping `getSettingDefinitions()` returning an empty array; Obsidian 1.13+ falls back to `display()` to render the tab imperatively in that case, so its absence produced a completely blank pane.

## Highlights

- **Settings pane renders on Obsidian 1.13+ (Issue #87 regression).** `RaindropToObsidianSettingTab` now overrides `display()` as a thin bridge to the existing imperative renderer. The Obsidian plugin review bot still expects a future migration to the declarative `getSettingDefinitions()` API; `display()` is kept intentionally as the documented bridging pattern until that migration lands.
- **Refresh path unchanged.** Existing `update()` call sites (template import, preset rename/delete, etc.) continue to work without modification.
- **Destructive button styling.** The preset delete button continues to use `.setDestructive()` from 2.1.3.

## Upgrade notes

- No migration is required. Replace the plugin files (`main.js`, `manifest.json`, `styles.css`) in your vault, then restart Obsidian if it is already running.
- If you previously hid the settings pane by toggling Obsidian's "Community plugins" switch to hide Make It Rain because of the blank-page symptom, re-enable the plugin after updating.
