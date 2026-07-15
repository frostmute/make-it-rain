# Bulk Import

**Status:** Shipped (since v1.0).

## User Story

> As an Obsidian user with a Raindrop account, I want to import all the
> bookmarks in a chosen collection (and its sub-structure) into my
> vault as structured Markdown notes, so I can read, search, and link
> them locally without depending on Raindrop's web app.

## Acceptance Criteria

- [x] User can launch "Bulk import" from the ribbon icon or command palette.
- [x] A modal shows the user's Raindrop Groups and Collections as a tree.
- [x] User can select a Group, a single Collection, or a sub-tree.
- [x] User can filter by content type (`link | article | image | … | all`),
      tag match mode (`all | any`), date range, and search keyword.
- [x] For each selected raindrop, the plugin writes:
      - A Markdown note with YAML frontmatter (id, title, source, type,
        created, lastupdate, collection, tags, cover, excerpt, note,
        highlights, etc.).
      - File and folder path derived from the Group → Collection hierarchy.
      - Optional binary file (PDF, EPUB, image, video, etc.) when the
        raindrop has a `file` link.
      - Optional folder note (`FOLDER.md`) summarizing the collection.
- [x] Per-item errors (network, sanitize, write) are surfaced via
      `Notice`; the batch continues.
- [x] Progress is shown to the user during long imports.
- [x] User can cancel mid-import.

## Out of Scope

- Modifying the raindrop on Raindrop's side after import.
- Live sync (see [core-beliefs](../design-docs/core-beliefs.md)).

## Open Questions

None currently.
