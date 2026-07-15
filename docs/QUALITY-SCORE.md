# Quality Score

> Snapshot of code quality per domain/layer. Updated when a meaningful
> change lands (a feature ships, a refactor lands, a debt item is
> resolved). The "Target" column is the floor we hold ourselves to,
> not the ceiling.

## Scoring Rubric

- **A** — production-grade, well-tested, no notable debt.
- **B** — solid, minor known issues, all documented.
- **C** — works, but has gaps (coverage, edge cases, or clarity).
- **D** — functional but fragile or unclear; needs attention.
- **F** — broken, untested, or actively causing user issues.

## Domain Grades

| Domain | Files | Current | Target | Last update | Notes |
| --- | --- | --- | --- | --- | --- |
| **API / Network** | `src/utils/apiUtils.ts` | B | A | 2026-07-14 | Rate limiting + retry work; 9 tests fail due to fake-timer interaction (see [tech-debt-tracker](plans/work/tech-debt-tracker.md)) |
| **Template engine** | `src/template-validator.ts`, `src/utils/templateUtils.ts` | A | A | 2026-07-14 | Custom AST; well-tested; per-content-type templates work; `template-validator.ts` split is small but undocumented (P3) |
| **File / vault** | `src/utils/fileUtils.ts` | A | A | 2026-07-14 | Path safety, folder creation all covered |
| **YAML frontmatter** | `src/utils/yamlUtils.ts` | A | A | 2026-07-14 | Reserved-word + null-keyword handling; type-coercion-safe |
| **Security / sanitization** | `src/utils/securityUtils.ts` | A | A | 2026-07-14 | `sanitizeMarkdownContent` covers executable code defanging; perf benchmark exists |
| **Scraping / archive** | `src/utils/scrapingUtils.ts` | B | A | 2026-07-14 | 303-redirect handling correct; could use more fixture diversity in tests |
| **Binary downloads** | `src/utils/downloadUtils.ts` | B | A | 2026-07-14 | Magic-byte validation + extension derivation; real S3 coverage would be ideal but is hard in CI |
| **Safe sync** | `src/utils/safeSyncUtils.ts` | B | A | 2026-07-14 | Newest feature (Issue #9); split `{deleted, unknown}` is sound; sparse edge-case coverage (P3) |
| **Settings** | `src/settings.ts` (1011 LOC) | B | B | 2026-07-14 | Large but cohesive; excluded from coverage gate, tested via integration only |
| **Modals / UI** | `src/modals.ts` (1035 LOC) | B | B | 2026-07-14 | Excluded from coverage gate; user-facing, harder to unit test |
| **Orchestration** | `src/main.ts` (1328 LOC) | B | A | 2026-07-14 | Excluded from coverage gate; critical error-handling boundaries need focused tests (P2) |
| **Types** | `src/types.ts` | A | A | 2026-07-14 | Centralized, no `any`-leaks observed |
| **Build / tooling** | `scripts/*`, `scripts/esbuild.config.mjs` | B | A | 2026-07-14 | esbuild + secret scanner; `copy-to-vault.mjs` is hardcoded (P2) |
| **CI** | `.github/workflows/ci.yml` | A | A | 2026-07-14 | Node 24, secret scan, tests + coverage, build verification |
| **Documentation (agent)** | `AGENTS.md`, `ARCHITECTURE.md`, `docs/design-docs/`, `docs/plans/`, `docs/product-specs/`, `docs/*.md` | A | A | 2026-07-14 | This harness — initialized 2026-07-14 |
| **Documentation (user)** | `docs/user-guide/`, `docs/developer-guide/`, `docs/documentation.md` | A | A | 2026-07-14 | Jekyll site, kept in sync with release notes |

## Process Signals

- **Test count:** 117 tests; 9 failing (see [tech-debt-tracker](plans/work/tech-debt-tracker.md) P1).
- **Coverage thresholds (current):** branches 40% / functions 20% / lines 38% / statements 38% — floor is too low; targets above should be the real bar.
- **Build:** green on `main` per CI.
- **Lint:** green on `main` per CI.

## How to Update This File

- When a feature ships, raise or hold the grade for the relevant domain.
- When a debt item is resolved, raise the grade; add a brief note with the date.
- When new debt is found, lower the grade or add a debt entry to the tracker.
- Quarterly review: re-evaluate the "Notes" column, retire stale observations.
