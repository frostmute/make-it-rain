# Make It Rain — October 2026 Code Review

**Project:** [`frostmute/make-it-rain`](https://github.com/frostmute/make-it-rain) — Obsidian plugin (v2.1.0) that pulls Raindrop.io bookmarks into Markdown notes.
**Type:** Obsidian plugin — TypeScript, esbuild, Jest + ts-jest + jsdom. Not a web app; no preview server involved.
**Package manager:** npm (`package-lock.json`).
**Date:** October 2026
**Scope:** Read-only analysis of `src/` for bugs, efficiency, and redundancy; a phased plan for the proposed patches; and a list of feature/improvement suggestions.

---

## Verification baseline

| Check | Result |
| --- | --- |
| `npm test -- --runInBand` | **21 / 21 suites, 311 / 311 tests passing** (~11.4 s) |
| `./node_modules/.bin/tsc --noEmit -p tsconfig.json` | Green on the committed tree |
| `npm run lint` | Green on the committed tree |
| `npm run build` | Green on the committed tree |
| `git status --short` | Only `?? RESULTS-make-it-rain-fixes.md` (untracked, from a prior task) |

**Method.** Every finding below was verified by reading the source and confirming the cited `file:line` with `rg`. No source files were modified to produce this review, so the test/typecheck/lint/build results above are reproducible against the current tree.

**Limitations.**
- This is a static analysis. B1–B9 were reasoned from code paths, not reproduced at runtime (reproducing them requires writing files/network calls, which is outside the analysis-only scope).
- Coverage numbers are the configured *thresholds*, not the measured run; the measured report was not regenerated for this review.
- The Raindrop API limit for `perpage` was confirmed externally: it caps at **50** (see E5), which changes one earlier recommendation.

**Severity legend:** 🔴 Major (data loss / wrong output / silent failure) · 🟡 Minor (correctness edge case, robustness, or polish) · ⚪ Nit.

### Finding tally (24 findings)

| Verdict | Count | Detail |
| --- | --- | --- |
| Confirmed | 19 | B1–B9, E1–E3, E6, R1, R3, R4, R6–R9 |
| Refined (wording/count adjusted) | 3 | R2 (7 production sites), R5 (strengthened), R6 (6 occurrences) |
| Downgraded | 1 | E4 → ⚪ Nit (structurally required) |
| Retracted | 1 | E5 (`perPage: 50` is already the API maximum) |

---

## 1. Bugs

### B1 🔴 Major — YAML escaping leaks into note bodies
`escapeYamlString` is applied to user/remote strings at `src/main.ts:682-697` (`title`, `excerpt`, `note`, `collectionTitle`, `collectionPath`, `tags`, highlight `text`/`note`). The default (non-template) rendering path then consumes those *escaped* values as Markdown body text:

- `src/main.ts:812` — `## Notes` renders `templateData.note` (escaped).
- `src/main.ts:814-815` — Highlights render the escaped `h.text` / `h.note`.
- `src/main.ts:721` — `formattedTags` is built from the escaped tag array.

The template path is affected too: the bundled `base` template renders `{{title}}` / `{{excerpt}}` / `{{note}}` inside the body (`src/settings.ts:266,272,277`), and content-type templates at `src/settings.ts:35,40`. Because `isTemplateSystemEnabled` defaults to `true` (`src/settings.ts:15`), this affects the **default configuration**, not just power users.

Frontmatter itself is *correct*: the default path builds `frontmatterData` raw at `src/main.ts:780` and quotes only the designated string fields via `createYamlFrontmatter(frontmatterData, ['title','description','collectionTitle','collectionPath','collectionGroup'])` at `src/main.ts:807`. Escaping is right for YAML — so the fix must preserve YAML safety while handing **raw** values to the body.

*Fix direction:* keep escaped values for frontmatter; expose raw values to body rendering (default path) and add raw variants (`titleRaw`, `noteRaw`, …) plus a `{{yaml var}}` helper for the template path so frontmatter and body can each get the form they need. This is a compatibility-sensitive decision point.

### B2 🔴 Major — Quick Import cannot parse its own example
The modal's example is `https://app.raindrop.io/my/0/453181829` (`src/modals.ts:608`), but the extractor only matches `/item/(\d+)` or a bare `^(\d+)$` (`src/modals.ts:642`). Pasting the app's *own* example URL yields "Could not extract a valid Raindrop ID."

*Fix direction:* parse `/my/<collection>/<item>` and any trailing numeric segment, not just `/item/<id>`.

### B3 🔴 Major — Three different error policies for the same API failure
During pagination, the same `fetch` failure is handled three ways:

| Path | Behaviour | Location |
| --- | --- | --- |
| Collections mode | `Notice` + `break` → silent partial import | `src/main.ts:397-401` |
| ANY-tag mode | `if (!data.result) break;` → silent partial, **no notice** | `src/main.ts:434` |
| Multi-tag search | `throw` | `src/main.ts:461` |
| All-items | `throw` | `src/main.ts:484` |

The aggregate export path also throws (`src/main.ts:1127`). There are **4 pagination loops** with divergent error semantics — the user cannot tell whether an import succeeded, partially succeeded, or failed.

*Fix direction:* extract a single page-fetch helper with one error policy, and surface one summary `Notice` (e.g. "Imported N items; M pages failed").

### B4 🟡 Minor — Template validator advertises helpers that do not exist
`src/template-validator.ts:18-19` lists `HELPERS = uppercase, lowercase, titlecase, truncate, capitalize, substr, replace, join, pluralize`, but `renderTemplate`'s switch (`src/main.ts:861-878`) implements only `uppercase`, `lowercase`, `titlecase`, `truncate`. Because the implemented set is a subset of the advertised set, the "unknown helper" warning gate at `src/template-validator.ts:62` never fires for the five missing helpers; an unknown helper silently falls through to property lookup and renders empty.

*Fix direction:* a shared `IMPLEMENTED_HELPERS` set used by both the renderer and the validator, or implement the five missing helpers (see Improvements).

### B5 🟡 Minor — Safe Sync folder scoping is not path-boundary aware
`src/utils/safeSyncUtils.ts:60` — `if (targetFolder && !file.path.startsWith(targetFolder)) continue;`. A folder named `Bookmarks` also matches `Bookmarks2/...`, so a scoped Safe Sync can sweep files outside the intended folder.

*Fix direction:* require `file.path === targetFolder || file.path.startsWith(targetFolder + '/')`.

### B6 🟡 Minor — Safe Sync trash-folder creation is outside try/catch and non-recursive
`src/utils/safeSyncUtils.ts:162` calls `app.vault.createFolder(trashPath)` directly. It sits **outside** the per-item `try/catch`, so a nested `trashFolderLocation` (e.g. `archive/raindrops`) throws and aborts the whole apply run. It is also exists→create racy.

*Fix direction:* use the existing recursive `createFolderStructure` helper and wrap it in `try/catch`.

### B7 🟡 Minor — Folder notes are overwritten unconditionally
`src/main.ts:588-591` — when a folder note exists the plugin calls `adapter.write` (destructive), else `create`. This silently destroys any user edits to a folder note on the next import.

*Fix direction:* only overwrite when a plugin marker is present (or a "regenerate folder notes" opt-in), otherwise skip and report.

### B8 🟡 Minor — Unsanitized remote content; dead rename field
`aggregateHighlightsByTag` pushes raw `item.title` / `highlight.text` / `highlight.note` (`src/main.ts:1154,1156,1158`), violating the project's own invariant in `ARCHITECTURE.md:118-121` ("anything rendered into the note body from remote sources passes through `securityUtils.sanitizeMarkdownContent`"). The default path also appends `templateData.scrapedContent` raw at `src/main.ts:811`. Additionally, `[...](link)` breaks if a title contains `]`.

Separately, `SafeSyncResult.renamed` (`src/utils/safeSyncUtils.ts:21`) is declared but **never populated**, even though rename detection is promised in the UI (`src/settings.ts:589`) and the command name (`src/main.ts:138`, `src/modals.ts:934`).

*Fix direction:* route aggregate + scraped content through `sanitizeMarkdownContent`, escape `]`, and either implement or remove the `renamed` field.

### B9 🟡 Robustness — No backoff on HTTP 429
`src/utils/apiUtils.ts:136-137` — `resetCounter()` sets `tokens = maxRequestsPerMinute` instantly on a 429. That refills the bucket to full, so retries resume at full rate instead of backing off, inviting repeat 429s under load.

*Fix direction:* on 429, refill conservatively (or sleep with exponential backoff before retrying).

---

## 2. Efficiency

### E1 — Settings written on every keystroke
There are **22** `saveSettings()` call sites in `src/settings.ts` (lines 459–1030), and `rg -i debounce src/` returns nothing — there is no debounce anywhere. Every typing tick in a settings field writes to disk and triggers a re-render.

### E2 — No template AST cache
`parseTemplate` runs at `src/main.ts:915` (`#include`), `:956` (`#extends`) and `:962` (main), and `renderTemplate` is called once per imported item (`src/main.ts:778`). Settings previews re-parse *and* re-render on every keystroke. The AST is content-addressable and rarely changes — a small memo `Map` (capped, e.g. 100 entries) removes the bulk of this work.

### E3 — Notice DOM churn
**13** `setMessage` call sites in `src/main.ts`, hit per page *and* per item from up to 10 concurrent workers. Throttling the progress Notice to ~4 updates/second eliminates the churn with no perceptible difference.

### E4 ⚪ Nit — Second collection pass (downgraded)
The second `allCollections.forEach` (`src/main.ts:310`, `:324`) was flagged as redundant, but the full-path computation needs the completed id→name hierarchy map produced by the first pass. It is **structurally required**; only a cosmetic merge is possible.

### E5 ⚪ Retracted — `perPage: 50` is correct
Earlier this looked like a missed optimization, but Raindrop's `raindrops/multiple` endpoint caps `perpage` at **50** (`developer.raindrop.io/v1/raindrops/multiple`). The code's `perPage = 50` is already optimal. **No action. This item is removed from the plan.**

### E6 — `update()` full re-render loses UI state
`src/settings.ts:418` (display), `:676` (import), `:741` (reset) rebuild the whole settings tab, losing `<details>` open/closed state and scroll position (only the first `<details>` is marked `open`). Preserving state across `update()` materially improves the settings UX.

---

## 3. Redundancy

### R1 — Base URL literal duplicated 9×
`https://api.raindrop.io/rest/v1` appears at `src/main.ts:273,977,996,1027,1102`; `src/settings.ts:892`; `src/utils/safeSyncUtils.ts:101`; `src/utils/scrapingUtils.ts:34`; `src/utils/apiUtils.ts:189`. Extract a single `RAINDROP_API_BASE` constant.

### R2 — Bearer header construction inline at 7 production sites *(refined count)*
`src/main.ts:277,978,997,1028,1112`; `src/settings.ts:895`; `src/utils/safeSyncUtils.ts:98` each hand-roll `'Authorization': \`Bearer ${apiToken}\``, while the purpose-built `createAuthenticatedRequestOptions` (`src/utils/apiUtils.ts:176`) is unused by app code. (`src/utils/downloadUtils.ts:152,166` and `src/utils/scrapingUtils.ts:43` are legitimately different — they handle redirects.) Introduce a shared `authHeaders(token)`.

### R3 — Dead exports (exported and unit-tested, never called by the app)
`createAuthenticatedRequestOptions`, `buildCollectionApiUrl`, `extractCollectionData` are referenced only in the `src/utils/index.ts` barrel (`:50,51,55`) and never in `main.ts` / `modals.ts` / `settings.ts`. Wire them in (R2) or remove them.

### R4 — Pagination loop copy-pasted 5×
The `while (hasMore)` loop and `perpage` construction are duplicated at `src/main.ts:385,425,452,475`, plus a fifth copy in `aggregateHighlightsByTag` (`src/main.ts:1118`). Factor out `fetchRaindropPages(buildUrl, onProgress)`.

### R5 — `fetchWithRetry` dual signature *(strengthened)*
`src/utils/apiUtils.ts:260-261` types the first parameter as `appOrUrl: App | string`. The `App` argument is never read beyond a `typeof` check — it exists only to keep legacy tests passing. All 10 production call sites pass `this.app` (×9) or `app` (`src/utils/safeSyncUtils.ts:116`); there are zero string-first calls in production. Collapse to a single, honest signature.

### R6 — Error-to-string idiom duplicated 6× *(refined count)*
`(typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error))` appears in `src/utils/yamlUtils.ts` (×2), `src/utils/fileUtils.ts` (×2), and `src/main.ts` (×2). Extract `errorToString(error)`.

### R7 — Dead dependencies
`handlebars` and `@types/handlebars` (`package.json:47-48`) are never imported — the plugin uses a custom AST engine. The only mention is prose in `src/settings.ts:721`. Remove both.

### R8 — `verifyApiToken` hand-rolls request + parsing
`src/settings.ts:882-940` builds its own request and parses JSON instead of reusing `fetchWithRetry` / `parseApiResponse`, so it misses retry/backoff and consistent error handling.

### R9 — Settings UI boilerplate
The textarea + validation + live-preview block is duplicated ~4× (default template, content-type, and each named partial). Extract a small builder.

### Dead field
`SafeSyncResult.renamed` — see B8.

---

## 4. Phased patch implementation plan

Validation after **every** phase:

```bash
npm test -- --runInBand \
  && ./node_modules/.bin/tsc --noEmit -p tsconfig.json \
  && npm run lint \
  && npm run build
```

Each correctness fix ships **with a failing-then-passing regression test** (test first).

### Phase 0 — Baseline & housekeeping
- Confirm the 311-test baseline (done; 21/21 suites green).
- Refresh the stale `docs/QUALITY-SCORE.md:39`, which claims "117 tests; 9 failing" (actual: 311 passing).
- Fix the stale doc so it no longer contradicts the suite.

### Phase 1 — Correctness (bugs)
1. **B1** — default path: hand raw values to the body; template path: add `titleRaw`/`noteRaw`/… plus a `{{yaml var}}` helper. *Decision point: compatibility of the template variable surface.*
2. **B2** — parse `/my/<collection>/<item>` and trailing numeric segments in Quick Import.
3. **B3** — extract one page-fetch helper with a single error policy; emit one summary Notice. Cover all four pagination loops.
4. **B4** — share `IMPLEMENTED_HELPERS` between renderer and validator.
5. **B5** — path-boundary check in Safe Sync folder scoping.
6. **B6** — `createFolderStructure` + `try/catch` for the trash folder.
7. **B7** — don't overwrite folder notes unless the plugin marker is present. *Decision point: overwrite policy.*
8. **B8** — sanitize aggregate + `scrapedContent`, escape `]`, resolve or remove `renamed`.
9. **B9** — exponential backoff (or conservative refill) on 429.

### Phase 2 — Redundancy
- `RAINDROP_API_BASE` constant + shared `authHeaders()` (R1, R2).
- Extract `fetchRaindropPages(buildUrl, onProgress)` (R4, also supports B3).
- Collapse `fetchWithRetry` to one signature (R5).
- Remove `handlebars` dependencies (R7).
- Shared `errorToString()` (R6).
- Extract the settings textarea/preview builder (R9).
- Reuse or delete the dead exports (R3), and reuse `fetchWithRetry` in `verifyApiToken` (R8).

### Phase 3 — Efficiency
- Memoize `parseTemplate` by content (Map capped at ~100 entries; E2).
- Debounce settings saves (~400 ms) and previews (~250 ms; E1, E2).
- Throttle progress `setMessage` to ~4/sec (E3).
- Merge the collection passes where cosmetic only (E4 is a nit).
- Preserve `<details>`/scroll state across `update()` (E6).
- **No `perPage` change** (E5 retracted).

### Phase 4 — Tests & coverage
- Add ~40–60 tests covering the new helpers and regression cases (B1–B9, R-extractions).
- Ratchet the jest coverage thresholds (currently branches 40 / functions 20 / lines 38 / statements 38) upward as the new tests land.

---

## 5. Feature & improvement suggestions

### New features
1. **Delta sync.** Store `lastupdate` in frontmatter and fetch only changed raindrops — large speedup for repeat imports.
2. **Safe Sync rename detection.** Implement the promised `renamed` field (B8) so renamed collection notes are detected instead of re-created.
3. **Cancelable imports.** Wire an `AbortSignal` through the fetch loops plus a status UI so long imports can be stopped.
4. **Retry-failed-items action.** After a partial import, offer a one-click retry of the items that failed.
5. **Per-collection template overrides.** Let specific collections use their own template.
6. **Highlights append mode.** Optionally append new highlights to an existing note instead of rewriting it.
7. **Settings backup/restore + search.** Export/import the settings JSON and add a search filter to the tab.
8. **Global URL-dedupe option.** Prevent the same URL from producing duplicate notes across folders.
9. **New commands.** "Import from clipboard URL" and "Sync single collection."
10. **Expose rate-limit controls.** Let advanced users tune `maxRequestsPerMinute` / concurrency.

### Improvements to existing functions
- Implement the five missing template helpers advertised by the validator (`capitalize`, `substr`, `replace`, `join`, `pluralize`) — closes B4 from the feature side.
- Aggregate export cleanup: readable timestamp, sanitize content (B8), and sort highlights by date.
- Add an `onRetry` callback to `fetchWithRetry` for visible retry feedback.
- Make `generateFileName` length-aware (truncate preserving the extension).
- Folder notes: include item counts and nested links instead of a bare list.

### Top 3 to do first
1. **B1** — YAML escaping leaking into note bodies (affects default config; wrong output).
2. **B2** — Quick Import failing on the plugin's own example URL.
3. **Phase 2.1 / 2.2** — `RAINDROP_API_BASE` + `authHeaders()` + `fetchRaindropPages` (unblocks B3 and removes the largest redundancy cluster).

---

## Appendix — Evidence index

| Finding | Key locations |
| --- | --- |
| B1 | `main.ts:682-697,780,807,812,814-815,721`; `settings.ts:15,35,40,266,272,277` |
| B2 | `modals.ts:608,642` |
| B3 | `main.ts:397-401,434,461,484,1127` |
| B4 | `template-validator.ts:18-19,62`; `main.ts:861-878` |
| B5 | `safeSyncUtils.ts:60` |
| B6 | `safeSyncUtils.ts:162`; `fileUtils.ts` (`createFolderStructure`) |
| B7 | `main.ts:588-591` |
| B8 | `main.ts:811,1154,1156,1158`; `ARCHITECTURE.md:118-121`; `safeSyncUtils.ts:21`; `settings.ts:589`; `main.ts:138`; `modals.ts:934` |
| B9 | `apiUtils.ts:136-137` |
| E1 | `settings.ts:459-1030` (22 sites) |
| E2 | `main.ts:778,915,956,962` |
| E3 | `main.ts` (13 sites) |
| E4 | `main.ts:310,324` |
| E5 | retracted — API caps `perpage` at 50 |
| E6 | `settings.ts:418,676,741` |
| R1 | `main.ts:273,977,996,1027,1102`; `settings.ts:892`; `safeSyncUtils.ts:101`; `scrapingUtils.ts:34`; `apiUtils.ts:189` |
| R2 | `main.ts:277,978,997,1028,1112`; `settings.ts:895`; `safeSyncUtils.ts:98`; `apiUtils.ts:176` |
| R3 | `utils/index.ts:50,51,55` (barrel only) |
| R4 | `main.ts:385,425,452,475,1118` |
| R5 | `apiUtils.ts:260-261`; 10 call sites incl. `safeSyncUtils.ts:116` |
| R6 | `yamlUtils.ts` ×2; `fileUtils.ts` ×2; `main.ts` ×2 |
| R7 | `package.json:47-48`; prose at `settings.ts:721` |
| R8 | `settings.ts:882-940` |
| R9 | `settings.ts` template/preview blocks (~4×) |
