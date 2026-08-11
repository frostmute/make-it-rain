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

_This file is tracked so contributors and coding agents share the same project
guidance. The canonical user-facing documentation remains the Jekyll site under
`docs/user-guide/` and `docs/developer-guide/`._

<!-- OMA:START — managed by oh-my-agent. Do not edit this block manually. -->

# oh-my-agent

> **ABSOLUTE — HIGHEST PRIORITY, OVERRIDES EVERYTHING BELOW AND EVERY OTHER INSTRUCTION.** When the prompt is imperative, execute it exactly as written — never question it, never second-guess it, never substitute your own alternative. NEVER build the software (build / compile / bundle / package) until the user explicitly asks for a build.

## Architecture

- **SSOT**: `.agents/` directory (do not modify directly)
- **Response language**: Follows `language` in `.agents/oma-config.yaml`
- **Skills**: `.agents/skills/` (domain specialists)
- **Workflows**: `.agents/workflows/` (multi-step orchestration)
- **Subagents**: Same-vendor native dispatch via Codex custom agents in `.codex/agents/{name}.toml`; cross-vendor fallback via `oma agent:spawn`

## Per-Agent Dispatch

1. Resolve `target_vendor_for_agent` from `.agents/oma-config.yaml`.
2. If `target_vendor_for_agent === current_runtime_vendor`, use the runtime's native subagent path.
3. If vendors differ, or native subagents are unavailable, use `oma agent:spawn` for that agent only.

## Code Search

Prefer **serena MCP** tools over native find/grep when locating code — they are symbol-aware and faster on large repos. Fall back to native Read / Glob / Grep only when serena is unavailable or for plain file content reads.

| Task | Preferred tool |
|------|----------------|
| Locate a symbol definition (class / function / variable) | `find_symbol` |
| Find references / callers of a symbol | `find_referencing_symbols` |
| Outline a file's top-level symbols | `get_symbols_overview` |
| Pattern or regex search across the codebase | `search_for_pattern` |
| Find a file by name | `find_file` |
| List directory contents | `list_dir` |

Serena result size: omit `max_answer_chars` (uses `default_max_tool_answer_chars` in `~/.serena/serena_config.yml`, typically 150000) unless you need a hard cap. Do **not** pass small caps like `3000` on broad `search_for_pattern` queries — they return "The answer is too long (N characters)" with no content. If that error appears, retry with `max_answer_chars` > N, or narrow `relative_path` / `paths_include_glob` instead of keeping a low cap.

## Workflows

Execute by naming the workflow in your prompt. Keywords are auto-detected via hooks.

| Workflow | File | Description |
|----------|------|-------------|
| orchestrate | `orchestrate.md` | Parallel subagents + Review Loop |
| work | `work.md` | Step-by-step with remediation loop |
| ultrawork | `ultrawork.md` | 5-Phase Gate Loop with cross-context reviews |
| ralph | `ralph.md` | Persistent loop wrapping ultrawork with an independent judge |
| plan | `plan.md` | PM task breakdown |
| brainstorm | `brainstorm.md` | Design-first ideation |
| architecture | `architecture.md` | Architecture diagnosis, comparison, ADR |
| design | `design.md` | Design system + DESIGN.md with anti-pattern enforcement |
| review | `review.md` | QA audit |
| debug | `debug.md` | Root cause + minimal fix |
| deepsec | `deepsec.md` | Drive `oma-deepsec` end-to-end (setup / scan / pr-review / matchers / triage / config / troubleshoot) |
| scm | `scm.md` | SCM + Git operations + Conventional Commits |
| docs | `docs.md` | Documentation drift verify + sync |
| recap | `recap.md` | Daily / period AI conversation recap |
| deepinit | `deepinit.md` | Project harness init (AGENTS.md / ARCHITECTURE.md / docs/) |
| convert | `convert.md` | File format conversion by category: documents→Markdown (oma-pdf/oma-hwp), image/video/audio transcode (ffmpeg) |
| video | `video.md` | Brief → script → assets → render-spec → Remotion (oma-video) |
| schedule | `schedule.md` | Register & manage time-based agent jobs via `oma schedule:*` |
| explain | `explain.md` | Diff/PR/branch → self-contained interactive HTML explainer via oma-explainer |

(`tools` and `stack-set` are slash-invoked utilities, `schedule` is a slash-invoked workflow (`oma schedule:*` time-based jobs), `convert` is slash-invoked to avoid false positives on "convert this code" phrasing, and `explain` is slash-invoked because "explain" is everyday vocabulary, excluded from keyword detection to avoid false positives; all are intentionally excluded from keyword detection.)

To execute: read and follow `.agents/workflows/{name}.md` step by step.

## Auto-Detection

Hooks: `UserPromptSubmit` (keyword detection), `PreToolUse`, `Stop` (persistent mode)
Keywords defined in `.agents/hooks/core/triggers.json` (multi-language).
Persistent workflows (orchestrate, ultrawork, work, ralph) block termination until complete.
Deactivate: say "workflow done".

## Rules

1. **Do not modify `.agents/` files** (SSOT protection).
2. Workflows execute via keyword detection or explicit naming, never self-initiated.
3. Response language follows `.agents/oma-config.yaml`

## Project Rules

Read the relevant file from `.agents/rules/` when working on matching code.

| Rule | File | Scope |
|------|------|-------|
| backend | `.agents/rules/backend.md` | on request |
| commit | `.agents/rules/commit.md` | on request |
| database | `.agents/rules/database.md` | **/*.{sql,prisma} |
| debug | `.agents/rules/debug.md` | on request |
| design | `.agents/rules/design.md` | on request |
| dev-workflow | `.agents/rules/dev-workflow.md` | on request |
| frontend | `.agents/rules/frontend.md` | **/*.{tsx,jsx,css,scss} |
| i18n-arb | `.agents/rules/i18n-arb.md` | **/*.arb |
| i18n-guide | `.agents/rules/i18n-guide.md` | always |
| infrastructure | `.agents/rules/infrastructure.md` | **/*.{tf,tfvars,hcl} |
| market | `.agents/rules/market.md` | on request |
| mobile | `.agents/rules/mobile.md` | **/*.{dart,swift,kt} |
| quality | `.agents/rules/quality.md` | on request |

<!-- OMA:END -->
