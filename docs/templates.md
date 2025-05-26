# Template System Documentation

Make It Rain uses a Handlebars-based template system to give you full control over how your Raindrop.io bookmarks are imported into Obsidian notes. This guide covers the variables, features, and best practices for creating and using templates.

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
- [Best Practices for Templates](#best-practices-for-templates)
- [Troubleshooting Common Issues](#troubleshooting-common-issues)
- [Further Examples](#further-examples)

## Enabling & Managing Templates

### Enabling the Template System

1.  Navigate to Obsidian Settings → Community Plugins → Make It Rain.
2.  Toggle "Enable Template System" to ON.
    - This reveals options for the "Default Template" and "Content Type Templates".

### Default Template

-   Located in the plugin settings under "Template System".
-   This template is used for any Raindrop item if:
    1.  Its specific content type template (e.g., for `article`) is disabled or empty.
    2.  The "Use Default Template Only" option is checked in the fetch modal.
-   The plugin comes with a comprehensive [built-in default template structure](#default-template-structure-built-in).

### Content-Type Specific Templates

-   In plugin settings, under "Content Type Templates", you can enable and define custom templates for each Raindrop type (`link`, `article`, `image`, `video`, `document`, `audio`).
-   If a specific content type template is enabled and has content, it will be used for items of that type, unless overridden by modal options.

### Modal Fetch Options for Templates

When you trigger a fetch, the modal provides these choices if the template system is enabled:

-   **Use Default Template Only**: If checked, forces all items to use the "Default Template" from settings, ignoring any content-type specific templates.
-   **Override Disabled Templates**: If checked, uses any defined content-type specific templates *even if their toggle in settings is off*. The main "Enable Template System" toggle must still be on.
-   If neither is checked, behavior follows standard settings: enabled content-type templates are used for their respective types, and the default template is used for others.

## Available Template Variables

These variables can be used within your templates by wrapping them in double curly braces, e.g., `{{title}}`.

### Core Raindrop Data

String values marked with `(YAML-escaped)` are pre-processed to be safe for direct use in YAML frontmatter (e.g., quotes are escaped). For body content, they render as normal strings.

| Variable             | Type                     | Description                                                                                                |
| -------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `id`                 | `number`                 | Unique Raindrop.io ID. **Required in frontmatter for updates to work.**                                  |
| `title`              | `string (YAML-escaped)`  | Title of the Raindrop.                                                                                     |
| `excerpt`            | `string (YAML-escaped)`  | Description or summary of the Raindrop.                                                                    |
| `note`               | `string (YAML-escaped)`  | Your personal notes on the Raindrop.                                                                       |
| `link`               | `string`                 | The primary URL of the bookmark.                                                                           |
| `cover`              | `string`                 | URL of the cover image, if available.                                                                      |
| `created`            | `string`                 | Creation timestamp in ISO 8601 format (e.g., `2023-10-27T14:30:00Z`).                                      |
| `lastupdate`         | `string`                 | Last update timestamp in ISO 8601 format. **Required in frontmatter for updates to work.**                 |
| `type`               | `string`                 | The raw Raindrop type (e.g., `link`, `article`, `image`, `video`, `document`, `audio`).                      |
| `collectionId`       | `number`                 | ID of the Raindrop's collection.                                                                          |
| `collectionTitle`    | `string (YAML-escaped)`  | Title of the Raindrop's collection.                                                                       |
| `collectionPath`     | `string (YAML-escaped)`  | Full path of the collection, including parent folders (e.g., `Work/Projects/Active`).                      |
| `collectionParentId` | `number`                 | ID of the parent collection, if it exists. Use `{{#if collectionParentId}}...{{/if}}` to check.         |
| `tags`               | `string[] (YAML-escaped)`| Array of tag strings. Each tag string is individually pre-escaped for YAML.                              |
| `highlights`         | `object[]`               | Array of highlight objects. Each object has `text (YAML-escaped)`, `note (YAML-escaped)`, `color`, `created`. |
| `bannerFieldName`    | `string`                 | The user-defined frontmatter field name for banner images (from plugin settings, defaults to `banner`).    |

### Pre-calculated & Formatting Variables

These variables provide commonly used formatted values derived from the core data. Using these is generally preferred over trying to replicate formatting with complex Handlebars logic.

| Variable               | Type     | Description                                                                                             |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `url`                  | `string` | Alias for `link`. Provided for convenience.                                                             |
| `domain`               | `string` | The domain name extracted from the `link` (e.g., `raindrop.io`).                                          |
| `renderedType`         | `string` | A user-friendly, displayable version of the Raindrop `type` (e.g., "Web Link", "Article", "Image").        |
| `formattedCreatedDate` | `string` | Locale-formatted created date string (e.g., `10/27/2023` or `Oct 27, 2023` depending on system locale). |
| `formattedUpdatedDate` | `string` | Locale-formatted last update date string.                                                                 |
| `formattedTags`        | `string` | A single string of all tags, prefixed with `#` and space-separated (e.g., `#programming #tools`).        |

## Essential Template Features (Handlebars Syntax)

### Displaying Variables

Place the variable name in double curly braces:

```handlebars
# {{title}}

Link: {{link}}
Added on: {{formattedCreatedDate}}
```

### Conditional Blocks (`if`)

Show content only if a variable exists and has a non-empty/non-false value. Especially useful for optional fields like `cover`, `excerpt`, `note`, `highlights`, and `collectionParentId`.

```handlebars
{{#if cover}}
![Cover Image]({{cover}})
{{/if}}

{{#if note}}
## My Notes
{{note}}
{{else}}
*No personal notes for this item.*
{{/if}}
```

### Looping Through Arrays (`each`)

Iterate over arrays like `tags` and `highlights`.

**For YAML frontmatter tags:**
```handlebars
frontmatterKey:
{{#each arrayVariable}}
  - {{this}} {{! 'this' refers to the current item in the array }}
{{/each}}
```
Example:
```handlebars
tags:
{{#each tags}}
  - {{this}}
{{/each}}
```

**For `highlights` (accessing properties of objects in an array):**
```handlebars
{{#if highlights}}
## Highlights
{{#each highlights}}
- **{{text}}**
  {{#if note}}*User note on highlight: {{note}}*{{/if}}
  Created: {{created}} / Color: {{color}}
{{/each}}
{{/if}}
```

**For inline display of tags in the note body:**
Use the pre-calculated `{{formattedTags}}` variable:
```markdown
**Topics:** {{formattedTags}}
```
Or, for more custom inline formatting:
```handlebars
{{#each tags}}<span class="custom-tag">#{{this}}</span> {{/each}}
```

## Default Template Structure (Built-in)

This is the template used by default if the template system is enabled. It aims for comprehensive output and compatibility with features like Dataview.

```handlebars
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
{{#if tags}}tags:
{{#each tags}}  - {{this}}
{{/each}}{{/if}}
{{#if cover}}{{bannerFieldName}}: {{cover}}{{/if}}
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

**Important Note on Required Frontmatter Fields:**
For the "Update existing notes" functionality to reliably identify and update notes, your frontmatter **must** include:
- `id: {{id}}`
- `lastupdate: {{lastupdate}}`

If these are missing from your custom template's frontmatter, the plugin may not be able to update notes correctly.

## Best Practices for Templates

1.  **Start Simple:** Begin with the default template or a minimal version and add complexity gradually.
2.  **Test Often:** After making changes, fetch a few sample Raindrops to see the output.
3.  **YAML Validity:** Pay close attention to YAML syntax in the frontmatter, especially indentation and quoting for strings that might contain special characters (though many core fields are pre-escaped).
4.  **Consistent Naming:** If you use custom frontmatter fields, try to be consistent for easier searching and Dataview querying in Obsidian.
5.  **Consult `template-gallery.md`:** Check the [Template Gallery](template-gallery.md) for more examples and ideas.
6.  **Backup Your Templates:** Keep a copy of your complex custom templates outside of Obsidian settings, just in case.

## Troubleshooting Common Issues

-   **Broken Frontmatter:** Usually due to incorrect YAML syntax. Check for missing quotes around strings, improper indentation, or special characters that weren't escaped. Using the pre-escaped variables like `"{{title}}"` for string fields in YAML is recommended.
-   **Variable Not Appearing:**
    -   Check for typos in the variable name: `{{titl}}` vs `{{title}}`.
    -   Ensure the variable actually exists for that Raindrop item (e.g., not all items have a `cover` or `excerpt`). Use `{{#if variable}}` to handle optional data.
-   **Content Not Displaying as Expected:** Review your `{{#if}}` or `{{#each}}` blocks for correct logic.

## Further Examples

For a variety of ready-to-use and adaptable templates, please see the [Template Gallery](template-gallery.md) document.
