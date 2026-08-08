# Safe Sync (Issue #9)

**Status:** Shipped.

## User Story

> As a user whose Raindrop library changes over time (items deleted
> on the web, renamed, or moved between collections), I want the plugin
> to detect when a local note's source Raindrop no longer exists remotely,
> and let me decide — explicitly — what to do with the orphaned note
> (archive, delete, or keep).

## Frontmatter compatibility

Safe Sync recognizes the following frontmatter keys:

1. `raindrop_id` — supported for notes created from the original Safe Sync
   documentation and older user templates. Honored on its own.
2. `raindropId` — supported for user-authored templates using camelCase.
   Honored on its own.
3. `id` — the key emitted by the current default template and fallback note
   generator. Because `id` is also a common generic frontmatter key used by
   other plugins, it is only honored when the note also carries a
   Raindrop-emitted field (`source`, `link`, `collectionId`, or `type`). This
   prevents unrelated notes from being captured for destructive actions.

The scanner prefers an explicit `raindrop_id`/`raindropId` over a bare `id`
when more than one recognized key is present. It validates that the selected
value is a positive integer and never rewrites frontmatter during scanning.

## Acceptance Criteria

- [x] A command scans Markdown notes under the selected vault path for a
      recognized Raindrop ID field and checks each ID against the Raindrop API.
- [x] Outcomes are bucketed:
      - **Deleted on remote** — the API explicitly returns `result: false`.
      - **Still present** — the API returns a matching item.
      - **Unknown** — network error, missing item, or unexpected response shape.
- [x] A review modal lists confirmed deletions with archive, delete, and ignore
      actions.
- [x] Unknown items default to ignore and require an explicit user choice before
      any destructive action.
- [x] No auto-action runs without explicit user confirmation in the review modal.
- [x] Decisions are batch-applied and summarized at the end.

## Out of Scope

- Auto-archiving or auto-deleting without a review step.
- Renaming or moving local notes when the remote changes (intentional — see
  [core-beliefs](../design-docs/core-beliefs.md), the user owns the local
  structure).
