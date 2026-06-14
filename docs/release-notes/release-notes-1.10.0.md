# Release v1.10.0

## ✨ New Features

### Raindrop Group Hierarchy Support

The plugin now integrates Raindrop.io sidebar "Groups" into the collection hierarchy. Groups appear as the root level of your folder structure, giving you a vault layout that mirrors your Raindrop sidebar.

- **New Template Variable**: `{{collectionGroup}}` — access the name of the top-level sidebar Group a collection belongs to.
- **Improved Path Construction**: `{{collectionPath}}` now includes the Group name as the root of the path (e.g., `GROUP / Parent / Child`).
- **Group Caching**: Efficient caching for Raindrop Groups ensures fast performance and minimal API impact.

### Archive Scraping Overhaul (Issue #58)

Rewrote the archive scraping pipeline to use Obsidian's native `htmlToMarkdown()` for HTML-to-Markdown conversion. Scraped content now produces structured Markdown with headings, paragraphs, and lists instead of a flat text blob.

## 🐛 Bug Fixes

- **Raindrop Cache 303 Redirect (Issue #58)**: `fetchArchiveContent` now manually follows the `/cache` endpoint's HTTP 303 redirect to S3, stripping the Authorization header on the second hop. Fixes empty `{{scrapedContent}}` on platforms where Obsidian's `requestUrl` doesn't follow redirects automatically.
- **Nesting-Aware Template Engine (Issue #59)**: Replaced the regex-based template rendering logic with a robust, nesting-aware AST parser and evaluator.
- **YAML Null Keyword Quoting**: `formatYamlValue` now quotes YAML null-like strings (`null`, `Null`, `NULL`, `~`) and short boolean strings (`y`, `Y`, `n`, `N`) to prevent type coercion in frontmatter.
- **YAML Reserved-Word Force-Quoting**: Added `formatYamlString` utility to force-quote string fields that could be misinterpreted as dates, nulls, or booleans.
- **formatYamlString Null Serialization**: `formatYamlString` now serializes explicit `null`/`undefined` as unquoted `null` keyword.
- **Double-Escaping in Frontmatter**: Fixed double-escaping of collectionTitle/collectionPath when passed through `createYamlFrontmatter`.
- **Leading-Quote Data Loss**: Strings starting with `"` or `'` in frontmatter are now properly escaped.
- **Stale Closure in Template Rename**: Fixed stale closure bug in named template rename handler.
- **Frontmatter Injection in Folder Notes**: Folder note generation now uses `createYamlFrontmatter`.
- **ESLint & Tooling Configuration**: Downgraded `eslint-plugin-obsidianmd` to `0.0.1` for ESLint 8 compatibility; disabled buggy obsidian/settings-tab rule; fixed `no-case-declarations` and deprecated `substr` usage.

## 🔧 Changed

- Removed unused `RaindropType` import from [`apiUtils.ts`](../../src/utils/apiUtils.ts).
- Optimized array concatenation in [`main.ts`](../../src/main.ts).
- Eliminated redundant type guard in [`main.ts`](../../src/main.ts).
- Removed dead assignment in `processRaindrop`.
- Removed unused `col` variable in [`main.ts`](../../src/main.ts).
- Performance: split var node name once during template validation.
