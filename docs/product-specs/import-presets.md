# Import Presets

**Status:** Shipped.

## User Story

> As a user who repeats the same bulk imports (a reading backlog, a
> research collection, a tag-filtered slice), I want to save a fetch
> configuration under a name and re-run it in one click, instead of
> re-entering collections, tag filters, destination folder, and toggles
> every time.

## Acceptance Criteria

- [x] The bulk import modal has a **Presets** section with a preset
      chooser, **Save current as preset**, and **Delete preset**.
- [x] Saving prompts for a name; saving with an existing name updates
      that preset and keeps its identity (its command palette entry
      stays bound).
- [x] Selecting a preset applies every captured option and redraws the
      modal: collections, tag filter and match mode (AND/OR), content
      type filter, include subcollections, save destination, append
      tags, use Raindrop title for filename, fetch-only-new,
      update-existing, and both template overrides.
- [x] Selecting the blank "no preset" entry restores the modal defaults
      and disables the Delete button — no values from the previously
      loaded preset remain in effect.
- [x] Each saved preset registers a `Fetch: {preset name}` command in
      the command palette, running the import with no further prompts.
      Commands are re-registered when presets are created, renamed,
      updated, or deleted.
- [x] The plugin settings screen has an **Import Presets** section that
      lists every saved preset with a summary of its options, and lets
      the user rename or delete it. Renaming rejects a name already
      used by another preset.
- [x] Settings saved before this feature (no `importPresets` field)
      load as an empty preset list; modal defaults are unchanged.

## Out of Scope

- Scheduled or automatic execution of presets.
- Sharing/exporting presets between vaults (template import/export is a
  separate feature).
- Presets for quick import or highlights aggregation.
