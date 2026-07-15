# References

> LLM-formatted documentation for the external libraries and APIs that
> Make It Rain relies on heavily. This directory is for synthesized
> references optimized for agent consumption — not a replacement for
> the upstream docs.

## Convention

Filenames: `{library-or-api}-llms.txt` (plain text or Markdown, no
front matter needed). Each file should:

- Cover the **API surface we actually use** in this project, with
  concrete code examples.
- Note **gotchas** we've hit in production (303 redirects, content-type
  quirks, etc.).
- Be **dated** at the top of the file with the version of the
  upstream it was synthesized from. If the upstream changes, re-synthesize.

## Catalogue

The following external surfaces are load-bearing for this project and
would each benefit from a synthesized reference. **None have been
written yet** — this list exists so future agents (or a maintenance
pass) know what to prioritize.

| Reference | Why we need it | Status | Notes |
| --- | --- | --- | --- |
| `obsidian-plugin-api-llms.txt` | We use `app.vault`, `app.vault.adapter`, `Notice`, `Plugin`, `normalizePath`, modals, setting tab. ~30% of `main.ts` is Obsidian-API calls. | TODO | Synthesize from the Obsidian API repo. Prioritize: `TFile`, `TFolder`, `TAbstractFile`, `Plugin`, `App`, `Setting`, `SettingTab`, `PluginSettingTab`, `Modal`, `FuzzySuggestModal`, `Notice`, `requestUrl`. |
| `raindrop-api-llms.txt` | All our data comes from this API. The quirks around `/v2/file` vs `link`, the auth header, the 303 redirect, the `expanded=tops` flag — all need to be documented in one place. | TODO | Synthesize from `developer.raindrop.io`. Prioritize: auth, collections, raindrops, file download, search filters, group hierarchy. |
| `esbuild-llms.txt` | We use a custom config (`scripts/esbuild.config.mjs`) with externals, watch mode, and a post-build deploy step. A short reference saves re-deriving this. | TODO | Synthesize from `esbuild.github.io`. Prioritize: `context`, `onEnd` plugin hook, externals, banner, sourcemap. |

## What Belongs Here vs. Where

- **In this file or its siblings:** external library / API surface,
  gotchas, code examples. The thing an agent reads *before* writing
  code that touches the external surface.
- **In `docs/developer-guide/`:** how *we* use the external surface
  inside this project (project-specific patterns, layer assignment).
- **In `docs/SECURITY.md`:** threat-model implications of the
  external surface (auth, redirects, content handling).

## Synthesis Note

The `llms.txt` format originated as a way to make web content more
LLM-friendly. For our purposes the convention is just: "one plain
text or Markdown file per external surface, structured for an agent
that needs to make a code change in the next 10 minutes." If you find
yourself opening a browser tab to read the upstream docs, that's a
signal the reference should be synthesized and committed here.
