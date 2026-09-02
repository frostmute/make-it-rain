# Make It Rain 2.1.3

This release addresses the four Obsidian plugin review findings from PR #95 and updates the test suite to match the corrected settings-tab lifecycle.

## Highlights

- **Settings tab lifecycle (PR #95).** The settings tab now renders imperatively through `update()` instead of the deprecated `display()` method, with updated documentation explaining the Obsidian 1.13+ declarative API integration.
- **Promise-safe callbacks (PR #95).** `forEach` loops that call Obsidian fluent-component builders now use block-body callbacks to avoid misreported promise-returning handlers.
- **Class-based visibility (PR #95).** Error-element visibility in the preset modal now uses Obsidian's `is-hidden` class instead of `style.display` assignments.
- **Destructive action styling (PR #95).** The preset-delete button now uses `.setDestructive()` to match Obsidian's styling guidelines for destructive actions.

## Upgrade notes

- No migration is required. Update the plugin files (`main.js`, `manifest.json`, `styles.css`) in your vault, then restart Obsidian if it is already running.