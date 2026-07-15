# Highlights Aggregate

**Status:** Shipped.

## User Story

> As a user who highlights frequently in Raindrop, I want a single
> roll-up note that lists all highlights across my vault (or a
> subset), grouped by source, so I can review and re-surface them.

## Acceptance Criteria

- [x] A command opens a modal letting the user pick a scope
      (whole vault, current folder, or specific collection).
- [x] The plugin reads the YAML frontmatter of each note, finds the
      `highlights` array, and groups by source URL or title.
- [x] A roll-up note is created (or updated, if the user chose to
      refresh) with each highlight listed under its source heading.
- [x] The roll-up respects the user's template settings (i.e. uses
      the configured template for the chosen content type).

## Out of Scope

- Live highlight sync (see [core-beliefs](../design-docs/core-beliefs.md)).
- Editing highlights from inside Obsidian (round-tripping back to
  Raindrop is not a goal).
