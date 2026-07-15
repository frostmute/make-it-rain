# Per-Content-Type Templates

**Status:** Shipped.

## User Story

> As a power user, I want different Markdown templates for different
> kinds of bookmarks (an article has a different structure from an
> image or a video), and I want to be able to opt in to content-type
> templates per-import via the modal.

## Acceptance Criteria

- [x] Settings tab exposes a separate template editor for each
      content type: `link | article | image | video | document | audio | book`.
- [x] Each template has an on/off toggle in settings.
- [x] The bulk-import modal offers a "use per-content-type templates"
      checkbox that overrides the default for that run.
- [x] When a content type is toggled off (or the override is off), the
      default template is used.
- [x] A template-rendering error surfaces to the user and the affected
      item is skipped (not silently fall back to a broken render).

## Implementation Notes

- Engine: see [ARCHITECTURE.md](../../ARCHITECTURE.md) → Sub-System: Template Engine.
- Pre-computed helpers: `{{domain}}`, `{{renderedType}}`,
  `{{formattedCreatedDate}}`, `{{formattedUpdatedDate}}`, `{{formattedTags}}`.
- DSL: `{{var}}`, `{{#if cond}}…{{else}}…{{/if}}`, `{{#each arr}}…{{/each}}`.
