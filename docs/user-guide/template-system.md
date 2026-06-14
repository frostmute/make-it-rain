---
layout: page
title: "Template System for Make It Rain"
parent: "User Guide"
nav_order: 7
---

# Template System for Make It Rain

The Make It Rain plugin includes a powerful template system that gives you complete control over how your Raindrop.io bookmarks are formatted in Obsidian notes. This guide will walk you through using and customizing templates to suit your specific needs.

## Table of Contents

- [Enabling & Managing Templates](#enabling--managing-templates)
- [Available Template Variables](#available-template-variables)
  - [Core Raindrop Data](#core-raindrop-data)
  - [Collection Information](#collection-information)
  - [Formatted & Pre-calculated Variables](#formatted--pre-calculated-variables)
  - [Lists & Loops](#lists--loops)
  - [Attachments & Scraping](#attachments--scraping)
- [Essential Template Features (Handlebars-like Syntax)](#essential-template-features)
  - [Displaying Variables](#displaying-variables)
  - [Helper Functions](#helper-functions)
  - [Conditional Blocks (`if`)](#conditional-blocks-if)
  - [Looping Through Arrays (`each`)](#looping-through-arrays-each)
- [Default Template Structure](#default-template-structure)
- [Example Templates](#example-templates)
- [Best Practices](#best-practices)
- [Troubleshooting Common Issues](#troubleshooting)

## Enabling & Managing Templates

### Enabling the Template System

1. Navigate to Obsidian Settings → Community Plugins → Make It Rain.
2. Toggle **Enable Template System** to ON.
    - This reveals options for the "Default Template" and "Content Type Templates".

### Default Template

- Located in the plugin settings under "Template System".
- This template is used for any Raindrop item if its specific content type template is disabled or empty.
- You can revert to the original system default template using the **Reset to Default** button.

### Content-Type Specific Templates

- Enable and define custom templates for each Raindrop type (`link`, `article`, `image`, `video`, `document`, `audio`, `book`).
- If enabled, these take precedence over the default template for that specific type.

## Available Template Variables

### Core Raindrop Data

| Variable | Type | Description |
| --- | --- | --- |
| `id` | `number` | Unique Raindrop.io ID (Alias for `_id`). |
| `title` | `string` | Title of the bookmark (YAML-escaped). |
| `link` | `string` | The primary URL of the bookmark. |
| `excerpt` | `string` | Summary or excerpt (YAML-escaped). |
| `note` | `string` | Your personal notes on the bookmark (YAML-escaped). |
| `type` | `string` | Raw Raindrop type (e.g., `article`, `link`). |
| `created` | `string` | Creation timestamp (ISO 8601). |
| `lastupdate` | `string` | Last update timestamp (ISO 8601). |
| `cover` | `string` | URL of the cover image. |
| `url` | `string` | Alias for `link`. |

### Collection Information

| Variable | Type | Description |
| --- | --- | --- |
| `collectionId` | `number` | ID of the parent collection. |
| `collectionTitle` | `string` | Name of the collection (YAML-escaped). |
| `collectionPath` | `string` | Full folder path (e.g., `Group / Parent / Child`). |
| `collectionGroup` | `string` | Name of the sidebar Group. |
| `collectionParentId` | `number` | ID of the parent collection (if any). |

### Formatted & Pre-calculated Variables

| Variable | Type | Description |
| --- | --- | --- |
| `formattedCreatedDate` | `string` | Created date in local format (e.g., `10/27/2023`). |
| `formattedUpdatedDate` | `string` | Updated date in local format. |
| `renderedType` | `string` | Human-friendly type (e.g., `web link` instead of `link`). |
| `domain` | `string` | Website domain (e.g., `google.com`). |
| `formattedTags` | `string` | Tags as space-separated hashtags (e.g., `#tag1 #tag2`). |

### Lists & Loops

| Variable | Type | Description |
| --- | --- | --- |
| `tags` | `string[]` | Array of tags. Use with `{{#each tags}}`. |
| `highlights` | `object[]` | Array of highlights. Each has `text`, `note`, and `created`. |

### Attachments & Scraping

| Variable | Type | Description |
| --- | --- | --- |
| `scrapedContent` | `string` | Full article content (if Archive Scraping is enabled). |
| `localFile` | `string` | Wiki-link to downloaded file (e.g., `[[document.pdf]]`). |
| `localEmbed` | `string` | Wiki-embed for downloaded file (e.g., `![[image.png]]`). |

## Essential Template Features

### Displaying Variables

Use double curly braces: `{{title}}`.

### Helper Functions

The template system supports basic text transformation helpers:

- `{{uppercase title}}`: TITLE OF THE BOOKMARK
- `{{lowercase type}}`: article
- `{{titlecase collectionTitle}}`: My Collection Name
- `{{truncate excerpt 100}}`: Truncates text to 100 characters and adds `...` if needed.

### Conditional Blocks (`if`)

```handlebars
{{#if excerpt}}
## Description
{{excerpt}}
{{/if}}
```

### Looping Through Arrays (`each`)

```handlebars
## Tags
{{#each tags}}
- {{this}}
{{/each}}

## Highlights
{{#each highlights}}
- {{text}}
{{#if note}}  *Note:* {{note}}{{/if}}
{{/each}}
```

## Default Template Structure

The built-in default template is designed to be a comprehensive starting point, including frontmatter for Obsidian properties and a structured body.

```markdown
---
title: "{{title}}"
source: {{link}}
type: {{type}}
created: {{created}}
lastupdate: {{lastupdate}}
id: {{id}}
collectionId: {{collectionId}}
collectionTitle: "{{collectionTitle}}"
collectionPath: "{{collectionPath}}"
{{#if collectionParentId}}collectionParentId: {{collectionParentId}}{{/if}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
{{#if cover}}
{{bannerFieldName}}: {{cover}}
{{/if}}
---

{{#if cover}}
![{{title}}]({{cover}})
{{/if}}

# {{title}}

{{#if excerpt}}
## Description
{{excerpt}}
{{/if}}

{{#if note}}
## Notes
{{note}}
{{/if}}

{{#if highlights}}
## Highlights
{{#each highlights}}
- {{text}}
{{#if note}}  *Note:* {{note}}{{/if}}
{{/each}}
{{/if}}
```

## Best Practices

1. **YAML Quotes**: Always wrap string variables in double quotes in the frontmatter: `title: "{{title}}"`.
2. **Handlebars Spacing**: Use single spaces within tags: `{{#if condition}}`, not `{{#ifcondition}}`.
3. **Escaping**: The plugin automatically escapes special YAML characters in `title`, `excerpt`, and `note`.

## Troubleshooting

- **Variables not rendering**: Check for typos in variable names. Use the **Template Variable Browser** in settings to verify names.
- **Empty values**: Some variables (like `scrapedContent`) require specific settings to be enabled.
- **Looping issues**: Ensure you use `{{this}}` for simple arrays like `tags`, and specific property names (like `text`) for object arrays like `highlights`.
