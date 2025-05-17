# Note Structure

This guide explains the standard structure of notes created by the Make It Rain plugin and how they relate to the template system.

## Default Note Structure

By default, Make It Rain creates notes with the following structure:

```markdown
---

id: 12345678
title: "Example Raindrop Title"
description: "This is the description or excerpt of the raindrop"
source: https://example.com
type: article
created: 2025-05-16T12:34:56Z
last.update: 2025-05-16T12:34:56Z
collection:
  id: 87654321
  title: "Example Collection"
  path: "Parent Collection/Example Collection"
tags:
  - example
  - raindrop
  - tags
banner: https://example.com/image.jpg

---

![Example Raindrop Title](https://example.com/image.jpg)

# Example Raindrop Title

## Description
This is the description or excerpt of the raindrop

## Notes
These are notes added to the raindrop in Raindrop.io

## Highlights
- This is a highlighted text from the raindrop
  *Note:* This is a note attached to the highlight
- Another highlighted text
```

## Understanding the Note Components

### YAML Frontmatter

The frontmatter section (between the `---` markers) contains metadata about the raindrop:

- **id**: The unique Raindrop.io ID (used for updates)
- **title**: The title of the raindrop
- **description**: The excerpt or description
- **source**: The URL of the bookmarked content
- **type**: The content type (link, article, image, video, document, audio)
- **created**: When the raindrop was created
- **last.update**: When the raindrop was last updated
- **collection**: Information about the collection the raindrop belongs to
  - **id**: Collection ID
  - **title**: Collection name
  - **path**: Full path including parent collections
- **tags**: Tags from Raindrop.io
- **banner**: Cover image URL (if available)

### Note Body

The body of the note typically includes:

1. **Cover Image**: If available, displayed at the top of the note
2. **Title**: The main heading using the raindrop title
3. **Description**: The excerpt or description from Raindrop.io
4. **Notes**: Any notes added to the raindrop in Raindrop.io
5. **Highlights**: Text highlights from the original content with optional notes

## Customizing Note Structure with Templates

When you enable the [template system](template-system.md), you can fully customize how your notes are structured. The template system allows you to:

- Rearrange elements in your notes
- Add or remove sections
- Format content differently based on content type
- Include conditional content
- Create specialized templates for different purposes

### Required Fields

When creating custom templates, certain fields are required for the plugin to function properly:

- **id**: Required for identifying raindrops
- **last.update**: Required for the update functionality

If these fields are missing from your template, the plugin will add them automatically.

## Content Type-Specific Structures

Different content types may benefit from different note structures:

### Articles

Articles typically include highlights and notes, so sections for these are important.

### Images

Image notes often focus on the visual content with minimal text.

### Videos

Video notes may include timestamps as highlights and benefit from a more structured format.

### Documents

Document notes often include highlights and may need more detailed metadata.

### Audio

Audio notes may include timestamps and track information.

## Examples

For detailed examples of different note structures, see the [Template System](template-system.md#examples) documentation.

## Tips for Effective Note Structures

1. **Consistent Frontmatter**: Keep frontmatter fields consistent across templates for easier filtering in Obsidian
2. **Meaningful Headings**: Use clear headings to organize content
3. **Visual Hierarchy**: Create a visual hierarchy that makes notes easy to scan
4. **Link Back to Source**: Always include a link back to the original content
5. **Utilize Obsidian Features**: Structure notes to take advantage of Obsidian features like backlinks and embeds

## Migrating Existing Notes

If you've been using Make It Rain without templates and want to update your existing notes:

1. Create a template that matches your current note structure
2. Enable the template system and select your template
3. Use the "Update Existing Notes" option when fetching raindrops

This will update your notes while maintaining your preferred structure.

## Related Documentation

- [Template System](template-system.md): Learn how to customize your note structure with templates
- [Configuration](configuration.md): Configure default settings for note generation
- [Usage](usage.md): Learn how to use the plugin to fetch and update notes
