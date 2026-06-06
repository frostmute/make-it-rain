# Note Structure in Make It Rain

This guide explains the structure of notes created by the Make It Rain plugin, both with the default (fallback) mechanism and when using the template system.

## Default Note Structure (Fallback - Templates Disabled)

When the template system is **disabled** in the plugin settings, Make It Rain creates notes with a basic, hardcoded structure. The frontmatter and body are generated as follows:

```markdown
---
id: 12345678
title: "Example Raindrop Title"
description: "This is the description or excerpt of the raindrop"
source: https://example.com
type: article
created: 2023-10-27T14:30:00Z
lastupdate: 2023-10-28T10:20:00Z
collectionId: 98765
collectionTitle: "My Collection"
collectionPath: "Research/My Collection"
collectionGroup: "CORE KNOWLEDGE"
collectionParentId: 12345 # Only if a parent exists
tags:
  - example-tag
  - another_tag
banner: https://example.com/cover-image.jpg # Field name from settings
---

![Example Raindrop Title](https://example.com/cover-image.jpg)

# Example Raindrop Title

## Description
This is the description or excerpt of the raindrop

## Article Content
This is where the full article content appears if Archive Scraping is enabled.

## Notes
These are notes added to the raindrop in Raindrop.io

## Highlights
- This is a highlighted text from the raindrop.
  *Note:* This is a note attached to the highlight.
- Another highlighted text from the raindrop.
```

**Note:** When the template system is disabled, local file attachments (PDFs, EPUBs, etc.) are downloaded to your vault but are **not** automatically linked within the note. Use the [Template System](template-system.md) to include `{{localFile}}` or `{{localEmbed}}` for automatic linking.

## Template-Based Note Structure

When the **Template System** is enabled, the structure is entirely defined by your templates. The plugin provides a comprehensive default template that mirrors and improves upon the fallback structure.

Key advantages of using templates:
1. **Custom Frontmatter**: Add any fields you need for your Obsidian workflow (e.g., `status`, `rating`).
2. **Automatic File Links**: Use `{{localEmbed}}` to show downloaded PDFs or images directly in your note.
3. **Flexible Formatting**: Use helper functions like `{{uppercase}}` or `{{truncate}}`.
4. **Conditional Content**: Only show sections (like Highlights or Notes) if they actually contain data.

For a full list of available variables and how to use them, see the [Template System Guide](template-system.md).
