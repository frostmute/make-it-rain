# Template System for Make It Rain

The Make It Rain plugin now includes a powerful template system that gives you complete control over how your Raindrop.io bookmarks are formatted in Obsidian notes. This guide will walk you through using and customizing templates to suit your specific needs.

## Table of Contents

- [Enabling the Template System](#enabling-the-template-system)
- [Template Basics](#template-basics)
- [Available Variables](#available-variables)
- [Pre-calculated Variables (Formerly Helpers)](#pre-calculated-variables-formerly-helpers)
- [Template Features](#template-features)
  - [Simple Variables](#simple-variables)
  - [Conditional Content](#conditional-content)
  - [Loops](#loops)
- [Content-Specific Templates](#content-specific-templates)
- [Selecting Templates When Fetching](#selecting-templates-when-fetching)
- [Default Template Structure](#default-template-structure)
- [Example Templates](#example-templates)
  - [Minimal Template](#minimal-template)
  - [Academic Template](#academic-template)
  - [Image Gallery Template](#image-gallery-template)

## Enabling the Template System

1. Go to the Make It Rain settings in Obsidian (Settings → Community plugins → Make It Rain → Settings)
2. Scroll down to the "Template System" section
3. Toggle "Enable Template System" to ON
4. The template editor will appear, allowing you to customize your templates

## Template Basics

Templates use a simple syntax similar to Handlebars. You can include variables from your Raindrop bookmarks by wrapping them in double curly braces: `{{variable}}`.

The default template maintains compatibility with the existing note format, so your notes will look familiar even after enabling templates.

## Available Variables

You can use the following variables in your templates. Note that string values intended for YAML frontmatter (like `title`, `excerpt`, `note`, `collectionTitle`, `collectionPath`, and individual `tags`) are pre-escaped for YAML compatibility.

| Variable               | Description                                                                 | Example (in template)                     |
| ---------------------- | --------------------------------------------------------------------------- | ----------------------------------------- |
| `id`                   | Raindrop ID                                                                 | `{{id}}`                                  |
| `title`                | Raindrop title (pre-escaped for YAML)                                       | `\"{{title}}\"`                           |
| `excerpt`              | Description/excerpt (pre-escaped for YAML)                                  | `\"{{excerpt}}\"`                         |
| `note`                 | Notes (pre-escaped for YAML)                                                | `\"{{note}}\"`                            |
| `link`                 | URL of the bookmark                                                         | `{{link}}`                                |
| `cover`                | Cover image URL                                                             | `{{cover}}`                               |
| `created`              | Creation date (ISO 8601 format)                                             | `{{created}}`                             |
| `lastupdate`           | Last update date (ISO 8601 format)                                          | `{{lastupdate}}`                          |
| `type`                 | Raw content type (e.g., `link`, `article`)                                  | `{{type}}`                                |
| `collectionId`         | Collection ID                                                               | `{{collectionId}}`                        |
| `collectionTitle`      | Collection title (pre-escaped for YAML)                                     | `\"{{collectionTitle}}\"`                 |
| `collectionPath`       | Full collection path (pre-escaped for YAML)                                 | `\"{{collectionPath}}\"`                  |
| `collectionParentId`   | ID of the parent collection (if it exists)                                  | `{{collectionParentId}}` (use with `if`)  |
| `tags`                 | Array of tag strings (each pre-escaped for YAML)                            | `{{#each tags}}- {{this}}{{/each}}`       |
| `highlights`           | Array of highlight objects (`text` and `note` fields are pre-escaped YAML)  | `{{#each highlights}}- {{text}}{{/each}}` |
| `bannerFieldName`      | The field name for banner images (from settings, default: `banner`)         | `{{bannerFieldName}}`                     |

## Pre-calculated Variables (Formerly Helpers)

For convenience and robustness, several commonly needed formatted values are pre-calculated and available as direct variables. This replaces the previous Handlebars helper syntax (e.g., `{{formatDate created}}`).

| Variable                 | Description                                                                | Example (in template)        |
| ------------------------ | -------------------------------------------------------------------------- | ---------------------------- |
| `url`                    | Alias for `link` (the URL of the raindrop)                                 | `{{url}}`                    |
| `domain`                 | The domain name from the `link` (e.g., `example.com`)                      | `{{domain}}`                 |
| `renderedType`           | User-friendly display name for the Raindrop type (e.g., "Web Link")        | `{{renderedType}}`           |
| `formattedCreatedDate`   | Locale-formatted created date string (e.g., "5/27/2024")                   | `{{formattedCreatedDate}}`   |
| `formattedUpdatedDate`   | Locale-formatted last update date string (e.g., "5/27/2024")               | `{{formattedUpdatedDate}}`   |
| `formattedTags`          | A single string of all tags, space-separated with `#` prefix (e.g., "#tag1 #tag2") | `{{formattedTags}}`          |

## Template Features

### Simple Variables

To include a variable's value in your template, simply wrap the variable name in double curly braces:

```handlebars
# {{title}}

{{excerpt}}
```

For pre-calculated formatted values:

```markdown
- **Type**: {{renderedType}}
- **Created**: {{formattedCreatedDate}}
```

### Conditional Content

You can include content conditionally based on whether a variable exists or has a value. This is useful for optional fields like `cover`, `note`, `excerpt`, `highlights`, or `collectionParentId`.

```handlebars
{{#if cover}}
![{{title}}]({{cover}})
{{/if}}

{{#if note}}
## Notes
{{note}}
{{/if}}

{{#if collectionParentId}}
Parent Collection ID: {{collectionParentId}}
{{/if}}
```

You can also include an `{{else}}` clause:

```handlebars
{{#if excerpt}}
## Description
{{excerpt}}
{{else}}
*No description available.*
{{/if}}
```

### Loops

You can loop through arrays like `tags` and `highlights`:

**Tags Example (for YAML frontmatter):**
```handlebars
tags:
{{#each tags}}
  - {{this}}
{{/each}}
```

**Tags Example (for inline display in note body):**
```markdown
**Tags**: {{formattedTags}}
```
Or, if you need more custom formatting for inline tags:
```handlebars
{{#each tags}}
#{{this}}&nbsp;
{{/each}}
```

**Highlights Example:**
```handlebars
{{#if highlights}}
## Highlights
{{#each highlights}}
- {{text}}
  {{#if note}}*Note:* {{note}}{{/if}}
{{/each}}
{{/if}}
```

## Content-Specific Templates

You can create different templates for different types of content (link, article, image, video, document, audio):

1. In the Make It Rain plugin settings, scroll down to "Template System".
2. Ensure "Enable Template System" is ON.
3. Under "Content Type Templates", find the content type you wish to customize.
4. Enable the toggle next to that content type (e.g., "Use Custom Article Template").
5. Edit the template in the text area provided for that content type.
6. If a content type's specific template is disabled or empty, the "Default Template" will be used for it.

## Selecting Templates When Fetching

When fetching raindrops via the modal:

1. Open the Make It Rain fetch modal (ribbon icon or command).
2. If the template system is enabled in settings, you'll see "Template Options".
3. **Use Default Template Only**: Ignores content-type specific templates.
4. **Override Disabled Templates**: Uses content-type specific templates even if their individual toggles in settings are off (but the main template system must be enabled).
5. If neither of these modal options is checked, the behavior defined in the plugin settings (Default Template vs. enabled Content Type Templates) will apply.

## Default Template Structure

This is the structure of the built-in default template. It's used if the template system is enabled but no specific content-type template is active for an item, or if "Use Default Template Only" is selected in the fetch modal.

```handlebars
---
title: "{{title}}"
source: {{link}}
type: {{type}}
created: {{created}}
lastupdate: {{lastupdate}}
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

---
## Details
- **Type**: {{renderedType}}
- **Domain**: {{domain}}
- **Created**: {{formattedCreatedDate}}
- **Updated**: {{formattedUpdatedDate}}
- **Tags**: {{formattedTags}}
```

## Example Templates

Here are some example templates you can use or modify.

### Minimal Template

A simple template with just the essential information:

```handlebars
---
id: {{id}}
title: "{{title}}"
lastupdate: {{lastupdate}}
source: {{link}}
---

# {{title}}

[Visit Source]({{link}})

{{#if excerpt}}
{{excerpt}}
{{/if}}
```

### Academic Template

Designed for research and academic content:

```handlebars
---
id: {{id}}
title: "{{title}}"
source: {{link}}
type: {{type}}
created: {{created}}
lastupdate: {{lastupdate}}
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

# {{title}}

{{#if excerpt}}
## Summary
{{excerpt}}
{{/if}}

{{#if note}}
## Notes
{{note}}
{{else}}
*No notes yet*
{{/if}}

{{#if highlights}}
## Highlights
{{#each highlights}}
> {{text}}
{{#if note}}
**Comment:** {{note}}
{{/if}}
{{/each}}
{{/if}}

---
## Metadata
- **Source**: [{{domain}}]({{link}})
- **Type**: {{renderedType}}
- **Added**: {{formattedCreatedDate}}
- **Last Modified**: {{formattedUpdatedDate}}
- **Tags**: {{formattedTags}}
- **Collection**: {{collectionTitle}} (Path: {{collectionPath}})
```

### Image Gallery Template
(Assuming you want a simple Markdown gallery or list of images if a Raindrop item represented a collection of images; this is a conceptual example as Raindrop items are singular.)

This example is more conceptual. If you tag multiple image-type Raindrops with a common project tag, you might create a separate summary note. The template for individual image notes could be:

```handlebars
---
id: {{id}}
title: "{{title}}"
source: {{link}}
type: {{type}}
created: {{created}}
lastupdate: {{lastupdate}}
collectionId: {{collectionId}}
collectionTitle: "{{collectionTitle}}"
collectionPath: "{{collectionPath}}"
{{#if collectionParentId}}collectionParentId: {{collectionParentId}}{{/if}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
{{bannerFieldName}}: {{cover}} 
---

![{{title}}]({{cover}})

{{#if excerpt}}
*{{excerpt}}*
{{/if}}

Notes: {{note}}

Details: Added {{formattedCreatedDate}}, Type {{renderedType}}
```
