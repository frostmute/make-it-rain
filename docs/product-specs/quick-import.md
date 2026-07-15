# Quick Import

**Status:** Shipped.

## User Story

> As a user who just saved a single bookmark in Raindrop, I want to
> pull it into my Obsidian vault immediately by entering its ID
> (or by right-clicking the file), without going through the bulk
> import flow.

## Acceptance Criteria

- [x] "Quick import" command is available from the command palette.
- [x] Modal accepts a Raindrop ID and (optionally) lets the user
      override the destination collection/folder and template.
- [x] The note is rendered using the same template engine as bulk
      import.
- [x] Errors (bad ID, network failure) are surfaced to the user.
- [x] On success, the new note is opened in the editor.

## Out of Scope

- Pulling multiple items in one go (use Bulk import for that).
