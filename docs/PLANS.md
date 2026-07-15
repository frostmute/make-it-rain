# Planning Conventions

> How plans, designs, and tech debt are tracked in this repository.

## Two Kinds of Plans

| Kind | Lives in | Lifecycle | Audience |
| --- | --- | --- | --- |
| **Designs** | `docs/plans/designs/NNN-name.md` | `Draft` → `Approved` (kept) | Future contributors reasoning about *why* |
| **Work** | `docs/plans/work/NNN-name.md` | `Active` → `Completed` (kept briefly, then summarized) | Anyone executing or tracking the work |

A **Design** captures a decision: context, options, the call, the consequences.
A **Work plan** captures a unit of execution: what we're doing, why, the steps,
the decision log, and the outcome.

Both use a 3-digit zero-padded numeric prefix per folder (sequential, not
date-based — numbers stay stable across renames).

## Tech Debt

Known debt is tracked in [`docs/plans/work/tech-debt-tracker.md`](plans/work/tech-debt-tracker.md).
Each entry has a priority (P1 / P2 / P3) and a status. Update the file when
debt is added, resolved, or re-prioritized. Do **not** open a dedicated
"debt plan" file for each item — they belong in the tracker, not as
first-class plans.

## When to Write a Plan

- A change that touches more than one of: an architectural invariant,
  a public surface (template DSL, settings schema), or a critical user
  flow (bulk import, safe sync).
- A new feature that will take more than a couple of hours and benefits
  from a shared checklist.
- A migration that has a non-trivial rollback story.

When in doubt: write a one-paragraph design note, not a full plan. A full
plan earns its weight when the work is genuinely multi-step or has real
risks.

## When to Skip a Plan

- Single-file bug fixes.
- Pure refactors that don't change observable behavior.
- Documentation-only changes.

## Plan Template

A work plan (`docs/plans/work/NNN-name.md`) typically has:

```markdown
# NNN — Short Title

Status: Active | Completed
Date: YYYY-MM-DD
Owner: <name or "unassigned">
Related: [issue #N](https://...), `designs/NNN-name.md`

## Goal
One or two sentences.

## Steps
- [ ] step one
- [ ] step two
- [ ] step three

## Decision Log
- YYYY-MM-DD — chose X over Y because Z.

## Outcome
(filled in when Status flips to Completed)
```

A design (`docs/plans/designs/NNN-name.md`) typically has:

```markdown
# NNN — Short Title

Status: Draft | Approved | Superseded
Date: YYYY-MM-DD

## Context
What's the situation?

## Options Considered
1. Option A — pros / cons.
2. Option B — pros / cons.

## Decision
We chose A because …

## Consequences
- We will need to …
- We give up …
```

## Naming the Plans Folder

The folder is `docs/plans/`. The Jekyll site is configured to **exclude
this folder** (see `docs/_config.yml` `exclude:`); the folder is also
gitignored. Plans are working notes, not public documentation.
