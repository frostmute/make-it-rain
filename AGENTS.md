# Make It Rain — Agent Guide

> Pull Raindrop.io bookmarks, highlights, and attachments into Markdown
> notes inside Obsidian. TypeScript + esbuild + Jest. Single package,
> not a monorepo.
>
> Version: 1.11.0 · Last harness refresh: 2026-07-14

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full domain map:
layering, invariants, data flow, and the template engine sub-system.

## Documentation

### Agent Harness (this folder + `docs/`)

- **[design-docs/](docs/design-docs/index.md)** — architectural decisions and operating principles
  - **[core-beliefs.md](docs/design-docs/core-beliefs.md)** — read this first; it's the rules of the road
- **[plans/](docs/plans/)** — design references (`designs/`) and execution plans (`work/`)
  - **[tech-debt-tracker.md](docs/plans/work/tech-debt-tracker.md)** — known debt, prioritized
- **[product-specs/](docs/product-specs/index.md)** — user-facing feature specs
- **[references/](docs/references/index.md)** — TODO: LLM-formatted external API/library docs

### Domain Guides (root of `docs/`)

- **[PLANS.md](docs/PLANS.md)** — how to write plans
- **[QUALITY-SCORE.md](docs/QUALITY-SCORE.md)** — per-domain quality grades
- **[CODE-REVIEW.md](docs/CODE-REVIEW.md)** — review checklist and severity levels
- **[SECURITY.md](docs/SECURITY.md)** — threat model and content-handling rules
- **[PRODUCT-SENSE.md](docs/PRODUCT-SENSE.md)** — who the user is, what we optimize for

### User / Developer Docs (Jekyll site at `docs/user-guide/`, `docs/developer-guide/`)

These are the public documentation, served to humans on GitHub Pages.
**Agent harness files are excluded from that site** via
`docs/_config.yml` — do not write user-facing prose in agent docs.

## Project Layout

```
src/
  main.ts            # RaindropToObsidian class — orchestration + lifecycle
  modals.ts          # UI: bulk / quick / highlights / safe-sync
  settings.ts        # SettingTab + DEFAULT_SETTINGS
  template-validator.ts  # AST validator for the template DSL
  types.ts           # central TypeScript interfaces
  utils/             # 11 modules — see ARCHITECTURE.md for layering
tests/
  unit/utils/        # per-utility unit tests
  integration/       # end-to-end flow tests
  performance/       # securityUtils benchmark
  setup.ts           # Obsidian + Raindrop mocks
  KNOWN_ISSUES.md    # 9 known failing tests (see tech-debt-tracker P1)
scripts/             # esbuild config, secret scanner, copy-to-vault, version bump
docs/                # Jekyll site (user/developer docs) + agent harness subdirs
.github/workflows/   # ci.yml, jekyll-gh-pages.yml, release.yml
```

## Quick Rules

These are the non-negotiables. Full reasoning in
[core-beliefs.md](docs/design-docs/core-beliefs.md) and
[CODE-REVIEW.md](docs/CODE-REVIEW.md).

1. **Rate-limit all API calls** through `apiUtils.fetchWithRetry`.
2. **Sanitize all file/folder names** from user content via `fileUtils.sanitizeFileName`.
3. **Sanitize all remote content** that lands in a note body via `securityUtils.sanitizeMarkdownContent`.
4. **Build YAML frontmatter** via `yamlUtils`, not by hand.
5. **Per-item errors in batch imports** must be caught and logged; the batch continues.
6. **No live two-way sync** with Raindrop. The plugin is a one-way import tool by design.

## Commands

```bash
npm run dev            # esbuild watch mode (auto-copies to local vaults)
npm run build          # tsc -noEmit -skipLibCheck && esbuild production
npm run copy-to-vault  # copy built files to hardcoded local vaults
npm test               # Jest
npm run test:coverage  # Jest with coverage
npm run lint           # ESLint on src/
npm run lint:md        # markdownlint
npm run scan-secrets   # block on hardcoded secrets
npm run version        # bump manifest.json + versions.json
```

## Submitting Work

- `npm test` + `npm run lint` + `npm run build` must all pass.
- Open a PR to `main`. Do not push directly to `main`.
- New architectural decision → add to `docs/design-docs/`.
- New tech debt → add to `docs/plans/work/tech-debt-tracker.md`.
- New user-facing feature → add a spec to `docs/product-specs/`.

<!-- MANUAL: Notes below this line are preserved on regeneration -->

_This file is gitignored (see `.gitignore` → "Tooling"). The agent harness is
intentionally local; the canonical project docs are the Jekyll site under
`docs/user-guide/` and `docs/developer-guide/`._
