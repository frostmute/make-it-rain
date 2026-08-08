# Highlights Aggregate (Issue #10)

**Status:** Shipped

## User Story

> As a user who highlights frequently in Raindrop, I want a single
> roll-up note that lists all highlights for a tag, grouped by source,
> so I can review and re-surface them with links back to the original items.

## Current workflow

1. Run **Aggregate highlights by tag** from the command palette.
2. Enter a Raindrop tag, with or without a leading `#`.
3. Optionally choose a vault folder for the generated note.
4. The plugin searches all Raindrop collections using `#tag type:highlight`.
5. Results are paginated and each source item becomes a heading linked to its
   original URL.
6. Each highlight is listed below its source, with its optional note.
7. The output is written to `Aggregated Highlights - #tag.md`. If that file
   already exists, a timestamped note is created instead of overwriting it.

The source of truth for this command is the Raindrop API, not existing local
note frontmatter. This keeps aggregation useful even before bookmarks have
been imported into the vault.

## Acceptance Criteria

- [x] A command opens a modal for a tag and optional vault path.
- [x] A leading `#` is accepted and normalized without changing the search.
- [x] The API search includes both the tag and `type:highlight` filter.
- [x] Pagination continues while a page contains the API page size.
- [x] Items without highlights are excluded from the generated note.
- [x] Results are grouped by source title with a source URL link.
- [x] Highlight notes are included when present.
- [x] Existing output is preserved by creating a timestamped note.
- [x] Empty tags and empty highlight results are reported without creating a note.

## Out of Scope

- Live highlight sync.
- Reading local frontmatter as the source for this command.
- Editing highlights from inside Obsidian or round-tripping changes to Raindrop.
