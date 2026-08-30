# Group Folder Paths

**Status:** Shipped.

## User Story

> As a user with an established collection-based vault layout, I want to
> choose whether Raindrop sidebar Groups add another folder level so imports
> continue using the structure I expect.

## Acceptance Criteria

- [x] Group folders remain enabled by default to preserve the current layout.
- [x] Users can disable Group folders in Make It Rain's settings without
      leaving Obsidian.
- [x] When enabled, a note uses `Group/Collection/Subcollection` folders.
- [x] When disabled, a note uses `Collection/Subcollection` folders.
- [x] `collectionGroup` remains available in templates and frontmatter in both
      modes.
- [x] The setting explains the effect on existing pre-v1.10 layouts.

## Out of Scope

- Moving or deleting notes previously imported under another hierarchy mode.
- Configuring hierarchy behavior separately for individual imports or presets.
