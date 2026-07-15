# Safe Sync (Issue #9)

**Status:** Shipped.

## User Story

> As a user whose Raindrop library changes over time (items deleted
> on the web, renamed, moved between collections), I want the plugin
> to detect when a local note's source raindrop no longer exists
> remotely, and let me decide — explicitly — what to do with the
> orphaned note (archive, delete, or keep).

## Acceptance Criteria

- [x] A command runs a scan: for each note in the vault that has a
      `raindropId` in its YAML frontmatter, the plugin fetches the
      current state from the Raindrop API.
- [x] Outcomes are bucketed:
      - **Deleted on remote** — the raindrop ID returns 404.
      - **Missing locally** — the raindrop exists remotely but has
        no local note.
      - **Unknown** — network error, ambiguous state, etc.
- [x] A review modal lists the **Deleted** bucket with three actions
      per item: archive, remove, skip. **Unknown** items are not
      actionable in this pass; the user is told to retry.
- [x] No auto-action runs without explicit user confirmation in the
      review modal.
- [x] Decisions are batch-applied; a summary is shown at the end.

## Out of Scope

- Auto-archiving / auto-deleting without a review step.
- Renaming or moving local notes when the remote changes (intentional —
  see [core-beliefs](../design-docs/core-beliefs.md), the user owns
  the local structure).
