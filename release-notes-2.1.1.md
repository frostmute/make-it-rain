# Make It Rain 2.1.1

This maintenance release completes the three outstanding GitHub issues and improves the template settings experience.

## Highlights

- **Aggregate highlights by tag (Issue #10).** Run **Aggregate highlights by tag** from Obsidian's Command Palette to collect highlights for a tag into one note. It searches all collections, handles pagination, groups entries under linked sources, includes highlight notes, accepts tags with or without `#`, and preserves existing output by creating a timestamped note when necessary.
- **Settings pane reliability (Issue #87).** Template preview rendering now runs in an explicit preview modal with correct component lifecycle management. This fixes the blank Settings pane reported on Obsidian 1.13.4 and surfaces preview-rendering failures instead of leaving the pane unusable.
- **Safe Sync compatibility (Issue #88).** Safe Sync now recognizes the `id` field emitted by the default template when it is paired with Raindrop metadata. It still supports `raindrop_id` and `raindropId`, while avoiding unrelated notes that only happen to have a generic `id` field.

## Also improved

- Template settings now use full-width editors, per-content-type cards, dedicated Preview actions, and clearer labels for reusable partials.

## Upgrade notes

- No migration is required. Update the plugin files in your vault, then restart Obsidian if it is already running.
