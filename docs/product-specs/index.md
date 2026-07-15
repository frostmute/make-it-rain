# Product Specs

> Feature specifications for Make It Rain's user-facing functionality.
> These describe **what** the user can do and **what "done" looks like**
> from the user's perspective — not how it's implemented. Implementation
> details belong in [ARCHITECTURE.md](../../ARCHITECTURE.md) and
> [developer-guide](../developer-guide/).

## Catalogue

| Feature | Status | Summary |
| --- | --- | --- |
| [Bulk import](bulk-import.md) | Shipped | Pull many bookmarks from a chosen collection/folder into structured notes |
| [Quick import](quick-import.md) | Shipped | Pull a single bookmark by Raindrop ID into a note |
| [Highlights aggregate](highlights-aggregate.md) | Shipped | Collect a user's highlights into a single roll-up note |
| [Safe sync](safe-sync.md) | Shipped (Issue #9) | Detect remote deletions and reconcile against the local vault with human review |
| [Per-content-type templates](per-content-type-templates.md) | Shipped | Configure Markdown output per Raindrop content type (link, article, image, video, document, audio, book) |
| [Folder notes](folder-notes.md) | Shipped | Auto-generate index notes for each collection folder |
| [Binary attachment download](binary-attachment-download.md) | Shipped | Download native Raindrop file attachments (PDF, EPUB, image, video, audio) |

## Conventions

- Each spec lives in a sibling `.md` file. Filename uses kebab-case.
- Each spec has: **User story**, **Acceptance criteria**, **Out of scope**,
  **Open questions** (if any).
- Specs marked **Draft** are not yet implemented; **Shipped** are in
  current releases; **Deprecated** stay for historical context.

## Out-of-Scope (intentional)

These are explicitly **not** product goals — see
[core-beliefs.md](../design-docs/core-beliefs.md) for the rationale.

- Live two-way sync between Obsidian and Raindrop.
- Automatic re-curation, re-tagging, or AI-summarization of imported notes.
- A public API or third-party integration surface.
