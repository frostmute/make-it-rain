---
Status: Verified
Date: 2026-07-14
---

# Core Beliefs — Make It Rain

> Operating principles for any agent or human working in this repository.
> These are not aspirational; they are the rules of the road. If a change
> violates one, that's a flag — not a casual decision.

## 1. Local-first, user-owned data

The user owns their vault. Imported notes are written to disk, in plain
Markdown + YAML, in folders the user chose. We never introduce a sync layer
that re-couples notes to Raindrop without explicit opt-in. The plugin is a
**one-way import tool**, not a live mirror.

**Implication:** no background poller, no auto-rewrite, no "live link back
to Raindrop" without a user-facing setting.

## 2. Failsafe by default

A batch import touching thousands of bookmarks must not collapse on the
first error. Per-item failures are caught, logged via `Notice`, and the
batch continues. Network errors trigger retry with backoff; permanent
errors are surfaced — not silently dropped.

**Implication:** never `throw` from inside a per-item loop in
`main.ts` without an outer catch. Never abort a batch on a single
malformed item.

## 3. Decouple data, render, and persist

- `apiUtils` fetches.
- `templateUtils` renders.
- `fileUtils` + `safeSyncUtils` persist.

These three layers must not reach into each other's internals. A new render
feature is a change to `templateUtils` (and possibly the template), not a
new branch in the API client.

## 4. Templates are the user-facing API

The Markdown output is configurable. Templates live in user settings and
are content-type-aware. The default templates must be correct and
useful; the engine must never silently fall back to a broken render
when a template has a syntax error — surface it.

**Implication:** any change to `templateUtils` AST grammar is a breaking
change for users with saved templates; document and version it.

## 5. Safe by construction, sanitized at the boundary

Anything that crosses from "remote" → "rendered note body" passes through
`securityUtils.sanitizeMarkdownContent`. Executable code is defanged. We
do not trust Raindrop titles, tags, highlights, archive content, or
excerpts to be safe. We **do** trust our own template engine output for
static fragments.

**Implication:** new remote-source fields must be added to the
sanitization pass. Skipping this is a security regression, not a
refactor.

## 6. Path safety is non-negotiable

Every file and folder name derived from user content (titles, tags,
collection names) goes through `fileUtils.sanitizeFileName` before
touching the vault adapter. Cross-platform compatibility is a hard
constraint, not a nice-to-have.

**Implication:** never construct a vault path by string concatenation
outside `fileUtils`.

## 7. Tests, lint, and build are the merge bar

`npm test`, `npm run lint`, and `npm run build` must all pass before
work lands on `main` (or before a PR is opened). Coverage thresholds in
`jest.config.js` are the floor, not the goal. New utilities ship with
unit tests; new workflows ship with at least one integration test.

## 8. User docs and agent docs are different things

`docs/user-guide/` and `docs/developer-guide/` are the **Jekyll site**
served to humans on GitHub Pages. `AGENTS.md`, `ARCHITECTURE.md`, and
`docs/design-docs/`, `docs/plans/`, `docs/product-specs/`,
`docs/references/`, root-level `docs/*.md` (PLANS, QUALITY-SCORE, etc.)
are the **agent harness** — meant for AI agents and future contributors
working on the codebase. Do not write user-facing prose in agent docs;
do not write architectural decisions in user docs.

## What this is **not**

- Not a live two-way sync. We will not become that plugin.
- Not a "smart" curator. The user decides what to import and where it
  goes; we don't reorder, retag, or summarize for them.
- Not a public API. There's no third-party integration surface; this is
  a single Obsidian plugin.
