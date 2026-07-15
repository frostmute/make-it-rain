# Security

> Threat model, auth patterns, content-handling rules, and incident
> response for Make It Rain.

## Threat Model

Make It Rain is a client-side Obsidian plugin. It runs inside the user's
Obsidian app (Electron) with the user's full vault access. The threats
worth caring about:

### T1 — Token exfiltration

The plugin holds a **Raindrop.io developer token** in plain text in the
user's settings (Obsidian's plugin-data JSON). If the user's vault is
synced to a public location, or if a malicious note is rendered with
`app.vault.adapter` access, the token could leak.

**Mitigations:**

- Never log the token. (The `secret-scanner.mjs` script greps the
  codebase; CI runs it.)
- Never include the token in error messages, Notices, or rendered note
  bodies.
- The token is used only in `Authorization: Bearer <token>` headers
  inside `apiUtils`. Don't construct auth headers anywhere else.

### T2 — Note-body code injection

Imported content comes from Raindrop (titles, tags, excerpts, highlights,
archive HTML, attachments). A malicious bookmark could include HTML,
JavaScript, or `data:` URLs.

**Mitigations:**

- All remote-source content passes through
  `securityUtils.sanitizeMarkdownContent` before being rendered into the
  note body.
- `securityUtils` defangs executable code constructs (script tags,
  inline event handlers, `javascript:` URIs, etc.).
- The Obsidian renderer is itself Markdown-only and ignores most HTML,
  but defense in depth: don't rely on Obsidian's renderer to keep the
  user safe.

### T3 — Path traversal via user-derived names

Raindrop titles, tag names, and collection names are used in file and
folder paths. A malicious or malformed name could escape the intended
folder.

**Mitigations:**

- `fileUtils.sanitizeFileName` is the single chokepoint for
  user-derived names before any `app.vault` call. (See
  [architecture invariants](../ARCHITECTURE.md#architecture-invariants).)
- Hard rule: never construct a vault path by string concatenation
  outside `fileUtils`.

### T4 — SSRF / unexpected network egress

The plugin talks to two domains: the Raindrop.io API and S3 (for binary
downloads). Anything else is unexpected.

**Mitigations:**

- All network calls go through `apiUtils`, which restricts to the
  configured base URL.
- The S3 303-redirect follow strips the `Authorization` header on the
  second hop, so a redirect to an attacker-controlled host cannot
  replay the token.
- A new outbound domain is a security-relevant change; flag in review.

### T5 — Binary file content surprises

Downloaded attachments are written to disk as binary. A malformed file
with a misleading extension or content-type could cause the user's
reader to misbehave.

**Mitigations:**

- `downloadUtils.validateBinaryMagicBytes` checks the file's actual
  magic bytes against the extension derived from the HTTP
  `Content-Type`.
- A mismatch is logged; the file is still written (the user can
  decide what to do) but a debug file is left next to the note.

## Auth Patterns

- **Storage:** the Raindrop token lives in the user's plugin data
  (Obsidian's `loadData` / `saveData`). It is **not** committed to
  the repo.
- **Transport:** Bearer token in the `Authorization` header. HTTPS only.
- **Header stripping on redirect:** the `Authorization` header is set
  per-request and not carried over to a 303 redirect (Obsidian's
  `requestUrl` follows the redirect with a fresh header set; verify
  this in `downloadUtils`).
- **Rotation:** users can rotate the token in Raindrop's settings at
  any time; the plugin reads the latest value at call time.

## Content Handling Rules

The rule is simple: **anything from outside our codebase that ends up
in a note body is untrusted**. New remote-source fields must be added
to the sanitization pass before they're written.

| Source | Trusted? | Sanitized? | Where |
| --- | --- | --- | --- |
| Raindrop `title` | No | Yes | `securityUtils` |
| Raindrop `excerpt` | No | Yes | `securityUtils` |
| Raindrop `note` | No | Yes | `securityUtils` |
| Raindrop `tags` (user-input) | No | Yes (format-level) | `formatUtils.formatTags` + `securityUtils` |
| Raindrop `highlights[].text` | No | Yes | `securityUtils` |
| Archive HTML (`scrapingUtils`) | No | Yes | `htmlToMarkdown` + `securityUtils` |
| Static template fragments (in `settings.ts` defaults) | Yes | No | N/A — these are the user's own templates, but see T2 |
| User-authored YAML keys | No | Yes (format-level) | `yamlUtils.escapeYamlString` |

## Supply-Chain

- Dependencies are pinned in `package-lock.json` (commit it).
- `handlebars` is currently in `package.json` but unused — see
  [tech-debt-tracker P1](plans/work/tech-debt-tracker.md). Remove it.
- New dependencies are reviewed for: maintenance status, transitive
  dependencies, and any post-install scripts.

## Incident Response

If a security issue is found:

1. Open a **private** issue or contact the maintainer directly (do not
   open a public PR with a fix before disclosure).
2. Cut a patch release as soon as a fix is verified.
3. Note the CVE or advisory reference in `CHANGELOG.md`.
4. If the issue involves the token or the sanitization pass, audit
   recent imports for signs of compromise (no automated signal for
   this today — a gap worth tracking).

## Reporting

- **GitHub:** open a security advisory via the repository's
  Security tab.
- **Maintainer:** see `package.json` → `author`.
