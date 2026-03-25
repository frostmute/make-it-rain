# Template System for Make It Rain

The Make It Rain plugin includes a powerful template system that gives you complete control over how your Raindrop.io bookmarks are formatted in Obsidian notes. This guide will walk you through using and customizing templates to suit your specific needs.

## Table of Contents

- [Enabling & Managing Templates](#enabling--managing-templates)
- [Enabling the Template System](#enabling-the-template-system)
  - [Default Template](#default-template)
  - [Content-Type Specific Templates](#content-type-specific-templates)
  - [Modal Fetch Options for Templates](#modal-fetch-options-for-templates)
- [Available Template Variables](#available-template-variables)
  - [Core Raindrop Data](#core-raindrop-data)
  - [Pre-calculated & Formatting Variables](#pre-calculated--formatting-variables)
- [Essential Template Features (Handlebars Syntax)](#essential-template-features-handlebars-syntax)
  - [Displaying Variables](#displaying-variables)
  - [Conditional Blocks (`if`)](#conditional-blocks-if)
  - [Looping Through Arrays (`each`)](#looping-through-arrays-each)
- [Default Template Structure (Built-in)](#default-template-structure-built-in)
- [Example Templates](#example-templates)
  - [Minimal Template Example](#minimal-template-example)
  - [Link to Full Template Gallery](#link-to-full-template-gallery)
- [Best Practices for Templates](#best-practices-for-templates)
- [Troubleshooting Common Issues](#troubleshooting-common-issues)

## Enabling & Managing Templates

### Enabling the Template System

1. Navigate to Obsidian Settings → Community Plugins → Make It Rain.
2. Toggle "Enable Template System" to ON.
    - This reveals options for the "Default Template" and "Content Type Templates".

### Default Template

- Located in the plugin settings under "Template System".
- This template is used for any Raindrop item if:
    1. Its specific content type template (e.g., for `article`) is disabled or empty.
    2. The "Use Default Template Only" option is checked in the fetch modal.
- The plugin comes with a comprehensive [built-in default template structure](#default-template-structure-built-in).
- You can easily revert to the original system default template using the **"Reset to Default"** button next to the template editor in the settings.

### Content-Type Specific Templates

- In plugin settings, under "Content Type Templates", you can enable and define custom templates for each Raindrop type (`link`, `article`, `image`, `video`, `document`, `audio`).
- If a specific content type template is enabled and has content, it will be used for items of that type, unless overridden by modal options. Each specific content-type template can also be individually reset to its original system default using its own **"Reset"** button next to its editor in the settings.

### Modal Fetch Options for Templates

When you trigger a fetch, the modal provides these choices if the template system is enabled:

- **Use Default Template Only**: If checked, forces all items to use the "Default Template" from settings, ignoring any content-type specific templates.
- **Override Disabled Templates**: If checked, uses any defined content-type specific templates *even if their toggle in settings is off*. The main "Enable Template System" toggle must still be on.
- If neither is checked, behavior follows standard settings: enabled content-type templates are used for their respective types, and the default template is used for others.

## Available Template Variables

These variables can be used within your templates by wrapping them in double curly braces, e.g., `{{title}}`.

### Core Raindrop Data

String values marked with `(YAML-escaped)` are pre-processed to be safe for direct use in YAML frontmatter (e.g., quotes are escaped). For body content, they render as normal strings.

| Variable             | Type                     | Description                                                                                                | Example (in template)                     |
| -------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `id`                 | `number`                 | Unique Raindrop.io ID. **Required in frontmatter for updates to work.**                                  | `{{id}}`                                  |
| `title`              | `string (YAML-escaped)`  | Title of the Raindrop.                                                                                     | `\"{{title}}\"`                           |
| `excerpt`            | `string (YAML-escaped)`  | Description or summary of the Raindrop.                                                                    | `\"{{excerpt}}\"`                         |
| `note`               | `string (YAML-escaped)`  | Your personal notes on the Raindrop.                                                                       | `\"{{note}}\"`                            |
| `link`               | `string`                 | The primary URL of the bookmark.                                                                           | `{{link}}`                                |
| `cover`              | `string`                 | URL of the cover image, if available.                                                                      | `{{cover}}`                               |
| `created`            | `string`                 | Creation timestamp in ISO 8601 format (e.g., `2023-10-27T14:30:00Z`).                                      | `{{created}}`                             |
| `lastupdate`         | `string`                 | Last update timestamp in ISO 8601 format. **Required in frontmatter for updates to work.**                 | `{{lastupdate}}`                          |
| `type`               | `string`                 | The raw Raindrop type (e.g., `link`, `article`, `image`, `video`, `document`, `audio`).                      | `{{type}}`                                |
| `collectionId`       | `number`                 | ID of the Raindrop\'s collection.                                                                          | `{{collectionId}}`                        |
| `collectionTitle`    | `string (YAML-escaped)`  | Title of the Raindrop\'s collection.                                                                       | `\"{{collectionTitle}}\"`                 |
| `collectionPath`     | `string (YAML-escaped)`  | Full path of the collection, including parent folders (e.g., `Work/Projects/Active`).                      | `\"{{collectionPath}}\"`                  |
| `collectionParentId` | `number`                 | ID of the parent collection, if it exists. Use `{{#if collectionParentId}}...{{/if}}` to check.         | `{{collectionParentId}}`                  |
| `tags`               | `string[] (YAML-escaped)`| Array of tag strings. Each tag string is individually pre-escaped for YAML.                              | `{{#each tags}}- {{this}}{{/each}}`       |
| `highlights`         | `object[]`               | Array of highlight objects. Each object has `text (YAML-escaped)`, `note (YAML-escaped)`, `color`, `created`. | `{{#each highlights}}- {{text}}{{/each}}` |
| `bannerFieldName`    | `string`                 | The user-defined frontmatter field name for banner images (from plugin settings, defaults to `banner`