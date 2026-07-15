# Design Docs

> Indexed, verified architectural decisions and operating principles for Make It Rain.
> Each doc captures a single decision: context, options considered, rationale,
> consequences. New decisions get a new file; superseded ones stay in place with
> a `Status: Superseded` header.

## Operating Principles

- **[core-beliefs.md](core-beliefs.md)** — agent-first operating principles: the
  invariants and working agreements that apply across all work in this repo.
  Read this first.

## Catalogue

| Decision | Status | Summary |
| --- | --- | --- |
| _none yet_ | — | _Add the first design doc with `NNN-short-name.md` and a row here._ |

## How to Add a Design Doc

1. Pick a 3-digit zero-padded number (`001`, `002`, …) — sequential per folder.
2. Filename: `NNN-short-kebab-case-name.md`.
3. Front matter:
   ```markdown
   Status: Draft | Verified | Superseded
   Date: YYYY-MM-DD
   ```
4. Sections: **Context** → **Options considered** → **Decision** → **Consequences**.
5. Mark the doc `Verified` only after the code it describes has shipped to `main`
   and at least one release has been cut with the change in place.
6. Add a row to the catalogue above.

## How to Supersede

1. Do **not** edit a verified doc in place to reverse it.
2. Mark the old doc `Status: Superseded` and link to the new one at the top.
3. Write the new doc with its own `NNN` and add a new catalogue row.
