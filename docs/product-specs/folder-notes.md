# Folder Notes

**Status:** Shipped.

## User Story

> As an Obsidian user who relies on the graph view and backlinks, I
> want each imported collection folder to have an index note that
> describes the folder and links to all its children.

## Acceptance Criteria

- [x] When a collection folder is created, a `FOLDER_NAME.md` note is
      written alongside its contents.
- [x] The note has YAML frontmatter with collection metadata (id,
      title, parent, group).
- [x] The note body lists all imported notes in the folder as
      `[[wiki-links]]`.
- [x] When new items are imported into the folder, the folder note is
      updated to include them.
- [x] The feature is toggleable in settings (off by default for users
      who don't want folder notes).
