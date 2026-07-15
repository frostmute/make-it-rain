# Code Review Standards

> What every reviewer (human or agent) should check on every PR for Make It Rain.
> Severity levels and anti-patterns below are project-specific; they reflect
> the [architecture invariants](../ARCHITECTURE.md#architecture-invariants) and
> [core beliefs](design-docs/core-beliefs.md).

## Severity Levels

- **Blocker** — merge is wrong. Breaks an invariant, a security boundary, or
  the quality gate. Must be fixed before merge.
- **Major** — merge is acceptable but should be fixed before the next release.
  Worth opening a follow-up issue.
- **Minor** — nit, style, or a small clarity improvement. Author can choose
  to address in this PR or a follow-up.
- **Nit** — non-actionable preference. Use sparingly; reviewers should
  self-check whether the comment is really worth the author's time.

## Review Checklist (Every PR)

### 1. Architecture invariants

- [ ] All new API calls go through `apiUtils.fetchWithRetry` and respect the
      rate limiter. (Blocker if bypassed.)
- [ ] All new file/folder names from user content pass through
      `fileUtils.sanitizeFileName`. (Blocker if bypassed.)
- [ ] All new remote-source fields that land in a note body pass through
      `securityUtils.sanitizeMarkdownContent`. (Blocker if bypassed.)
- [ ] All new YAML frontmatter generation goes through `yamlUtils`. (Major if
      rolled by hand.)
- [ ] No new module violates the layering in
      [ARCHITECTURE.md](../ARCHITECTURE.md#module-boundaries-layering) — lower
      layers must not import from upper layers. (Blocker if violated.)

### 2. Failsafe behavior

- [ ] Per-item loops in `main.ts` catch and log errors; one bad item does
      not abort the batch. (Blocker if not.)
- [ ] Network errors trigger retry; permanent errors are surfaced via
      `Notice`, not silently dropped.
- [ ] No unhandled promise rejections in the import path.

### 3. Tests

- [ ] New utility → at least one unit test in `tests/unit/utils/<name>.test.ts`.
- [ ] New workflow or modal flow → at least one integration test in
      `tests/integration/`.
- [ ] Tests don't depend on real network or real filesystem state.
- [ ] Fake timers used appropriately; if mixing with `async/await`, see
      [tech-debt-tracker P1](plans/work/tech-debt-tracker.md) for the known
      failure mode.
- [ ] Coverage of the changed lines is measured (not just a test that
      happens to touch them).

### 4. Template engine

- [ ] Any change to the AST grammar is documented; the existing template
      DSL is a user-facing surface — changes are breaking.
- [ ] New template helpers are pre-computed (not lazily evaluated per
      render) and listed in the user-facing docs.

### 5. Settings

- [ ] New settings have a default in `DEFAULT_SETTINGS`.
- [ ] New settings have a UI control in `RaindropSettingTab`.
- [ ] Settings migration: if a default shape changes, old saved settings
      must still load (defensive defaults).

### 6. Security

- [ ] No new third-party network calls without going through `apiUtils`.
- [ ] No new file-system write paths that bypass `fileUtils`.
- [ ] No hardcoded secrets, tokens, or API keys. (CI runs `npm run
      scan-secrets`.)
- [ ] HTML / Markdown content from remote sources is sanitized before
      being written to the note body.

### 7. Build & types

- [ ] `npm test` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes (strict `tsc -noEmit -skipLibCheck`).
- [ ] No new `any` in `src/` (use `unknown` + narrowing, or a proper
      type).
- [ ] No removed exports without a CHANGELOG entry.

### 8. Documentation

- [ ] New user-facing feature → entry in `docs/product-specs/index.md`
      and a sibling spec file.
- [ ] New architectural decision → entry in
      [`docs/design-docs/index.md`](design-docs/index.md) and a design
      doc file.
- [ ] New tech debt found during the PR → entry in
      [`docs/plans/work/tech-debt-tracker.md`](plans/work/tech-debt-tracker.md).
- [ ] User-guide updates are scoped to user-facing prose only — no
      architectural decisions in `docs/user-guide/`.
- [ ] `CHANGELOG.md` updated under the `Unreleased` section.

## Anti-Patterns to Flag

- **String concatenation for vault paths** outside `fileUtils`. (Blocker.)
- **`fetch` directly** in `main.ts` or `modals.ts`. Use `apiUtils`. (Blocker.)
- **Per-item `throw` without outer catch** in a batch loop. (Blocker.)
- **YAML built by template strings** instead of `yamlUtils`. (Major.)
- **Skipping `sanitizeMarkdownContent`** for any new remote field. (Blocker.)
- **Hardcoded vault paths** in scripts (other than the well-known local
  default). (Major — use config.)
- **Commented-out code** in `src/`. (Minor — remove it; git has history.)
- **New `console.log`** left in `src/`. (Minor — use `Notice` for user-visible
  messages, or `console.debug` for diagnostics.)

## When to Request Human Review

Even with these guidelines, certain changes warrant a human maintainer's
eye before merge:

- Anything that changes the YAML frontmatter schema (a breaking change for
  downstream tooling that reads these notes).
- Anything that changes the template DSL grammar.
- Anything that touches auth / token handling.
- Anything that changes the rate-limit or retry defaults.
- Anything that introduces a new external dependency (and especially a new
  network egress surface).

## Reviewer Etiquette

- Be specific. "This could be cleaner" is a nit at best. "This violates the
  failsafe invariant — the loop should wrap the call in try/catch and continue"
  is actionable.
- Distinguish severity. A blocker and a nit are not the same comment.
- If you're unsure whether something is wrong, ask a question rather than
  asserting. The author may know the context.
- Praise the good. A note that "this matches the pattern in `yamlUtils.ts`,
  nice" is welcome and helps future readers.
