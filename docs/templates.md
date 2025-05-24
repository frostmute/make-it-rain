# Template System Documentation

The Make It Rain plugin includes a powerful template system that allows you to customize how your Raindrop.io bookmarks are imported into Obsidian. This document provides a comprehensive guide to using and customizing templates.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Template Variables](#template-variables)
- [Built-in Helpers](#built-in-helpers)
- [Template Validation](#template-validation)
- [Example Templates](#example-templates)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Template Gallery](#template-gallery)
- [Helper Function Examples](#helper-function-examples)
- [Advanced Usage](#advanced-usage)

## Basic Usage

Templates use the Handlebars templating language and can be customized in the plugin settings. You can create:

- A default template for all bookmarks
- Type-specific templates for different content types
- Custom templates for specific use cases

### Template Structure

A basic template looks like this:

```handlebars
---
title: {{title}}
url: {{url}}
created: {{created}}
updated: {{updated}}
type: {{type}}
{{#if cover}}banner: {{cover}}{{/if}}
{{#if tags}}tags:
{{#each tags}}  - {{this}}
{{/each}}{{/if}}
---

{{#if excerpt}}{{excerpt}}

{{/if}}{{#if note}}{{note}}

{{/if}}{{#if highlights}}## Highlights
{{#each highlights}}> {{text}}
{{#if note}}> {{note}}
{{/if}}
{{/each}}{{/if}}
```

### Template Types

1. **Default Template**: Used when no specific type template is defined
2. **Type-specific Templates**: Custom templates for different content types:
   - `link`: Basic web links
   - `article`: Articles and blog posts
   - `image`: Image collections
   - `video`: Video content
   - `document`: PDFs and documents
   - `audio`: Audio files
3. **Custom Templates**: User-defined templates for specific use cases

## Template Variables

The following variables are available in templates:

| Variable | Description | Example |
|----------|-------------|---------|
| `title` | The title of the raindrop | "My Bookmark" |
| `url` | The URL of the raindrop | "<https://example.com>" |
| `created` | Creation date in ISO format | "2024-05-24T12:00:00Z" |
| `updated` | Last update date in ISO format | "2024-05-24T12:00:00Z" |
| `type` | Type of the raindrop | "article" |
| `cover` | Cover image URL if available | "<https://example.com/image.jpg>" |
| `excerpt` | Excerpt from the webpage | "This is a summary..." |
| `note` | Your personal note | "This is my note" |
| `tags` | Array of tags | ["tag1", "tag2"] |
| `highlights` | Array of highlights | [{"text": "Highlighted text", "note": "My note"}] |
| `collection` | Collection information | {"id": 123, "title": "My Collection"} |

## Built-in Helpers

### Date Formatting

- `{{formatDate date}}` - Formats date to locale string
- `{{formatDateTime date}}` - Formats date and time to locale string
- `{{formatDateISO date}}` - Formats date to ISO format (YYYY-MM-DD)
- `{{formatTime date}}` - Formats time to locale string
- `{{relativeTime date}}` - Shows relative time (e.g., "2 days ago")

### Text Manipulation

- `{{sanitize text}}` - Removes invalid characters
- `{{truncate text length}}` - Truncates text to specified length
- `{{json context}}` - Formats object as JSON

### Array Operations

- `{{join array separator}}` - Joins array elements with separator
- `{{formatTags tags}}` - Formats tags as hashtags
- `{{formatHighlights highlights}}` - Formats highlights with notes

### Conditional Helpers

- `{{hasHighlights raindrop}}` - Checks if raindrop has highlights
- `{{hasTags raindrop}}` - Checks if raindrop has tags
- `{{hasNote raindrop}}` - Checks if raindrop has a note
- `{{hasExcerpt raindrop}}` - Checks if raindrop has an excerpt
- `{{hasCover raindrop}}` - Checks if raindrop has a cover image

### Counting Helpers

- `{{highlightCount raindrop}}` - Returns number of highlights
- `{{tagCount raindrop}}` - Returns number of tags

### Comparison Helpers

- `{{eq a b}}` - Checks if a equals b
- `{{neq a b}}` - Checks if a does not equal b
- `{{gt a b}}` - Checks if a is greater than b
- `{{gte a b}}` - Checks if a is greater than or equal to b
- `{{lt a b}}` - Checks if a is less than b
- `{{lte a b}}` - Checks if a is less than or equal to b

### Default Value

- `{{default value defaultValue}}` - Returns defaultValue if value is falsy

## Template Validation

The template system includes comprehensive validation that checks for:

- Syntax errors
- Unclosed blocks
- Invalid variable names
- Common template issues

Validation errors include:

- Line number
- Column number
- Error message
- Code snippet

## Example Templates

### Basic Article Template

```handlebars
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
updated: {{formatDateISO updated}}
type: {{raindropType type}}
{{#if cover}}banner: {{cover}}{{/if}}
{{#if tags}}tags: {{formatTags tags}}{{/if}}
---

{{#if excerpt}}{{excerpt}}

{{/if}}{{#if note}}{{note}}

{{/if}}{{#if hasHighlights}}## Highlights ({{highlightCount this}})
{{formatHighlights highlights}}{{/if}}
```

### Reading List Template

```handlebars
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
status: unread
{{#if tags}}categories: {{join tags ", "}}{{/if}}
---

{{#if excerpt}}## Summary
{{excerpt}}

{{/if}}{{#if note}}## Notes
{{note}}

{{/if}}{{#if hasHighlights}}## Key Points
{{#each highlights}}- {{text}}
{{#if note}}  - Note: {{note}}{{/if}}
{{/each}}{{/if}}
```

### Research Template

```handlebars
---
title: {{title}}
source: {{url}}
date: {{formatDateISO created}}
{{#if tags}}keywords: {{join tags ", "}}{{/if}}
---

## Source Information
- URL: {{url}}
- Type: {{raindropType type}}
- Added: {{relativeTime created}}
- Last Updated: {{relativeTime updated}}

{{#if excerpt}}## Abstract
{{excerpt}}

{{/if}}{{#if note}}## Research Notes
{{note}}

{{/if}}{{#if hasHighlights}}## Important Excerpts
{{#each highlights}}### Excerpt {{@index}}
> {{text}}
{{#if note}}> Note: {{note}}{{/if}}

{{/each}}{{/if}}
```

### Zettelkasten Template

```handlebars
---
title: {{title}}
source: {{url}}
created: {{formatDateISO created}}
updated: {{formatDateISO updated}}
type: {{raindropType type}}
{{#if tags}}tags: {{formatTags tags}}{{/if}}
---

## Source
- URL: {{url}}
- Type: {{raindropType type}}
- Added: {{relativeTime created}}

{{#if excerpt}}## Summary
{{excerpt}}

{{/if}}{{#if note}}## Notes
{{note}}

{{/if}}{{#if hasHighlights}}## Highlights
{{#each highlights}}### {{@index}}
> {{text}}
{{#if note}}> Note: {{note}}{{/if}}

{{/each}}{{/if}}

## Connections
- 

## Questions
- 

## Ideas
- 
```

### Project Management Template

```handlebars
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
status: new
priority: medium
{{#if tags}}categories: {{join tags ", "}}{{/if}}
---

## Overview
{{#if excerpt}}{{excerpt}}

{{/if}}

## Tasks
- [ ] Review content
- [ ] Add to project documentation
- [ ] Share with team

{{#if note}}## Notes
{{note}}

{{/if}}{{#if hasHighlights}}## Key Points
{{#each highlights}}- {{text}}
{{#if note}}  - Note: {{note}}{{/if}}
{{/each}}{{/if}}

## Next Steps
- 

## Resources
- Source: {{url}}
- Type: {{raindropType type}}
- Added: {{relativeTime created}}
```

### Learning Template

```handlebars
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
status: learning
{{#if tags}}topics: {{join tags ", "}}{{/if}}
---

## Learning Objectives
- 

## Key Concepts
{{#if hasHighlights}}{{#each highlights}}- {{text}}
{{#if note}}  - Note: {{note}}{{/if}}
{{/each}}{{/if}}

## Summary
{{#if excerpt}}{{excerpt}}

{{/if}}

## Questions
- 

## Practice Exercises
- 

## Resources
- Source: {{url}}
- Type: {{raindropType type}}
- Added: {{relativeTime created}}

{{#if note}}## Personal Notes
{{note}}{{/if}}
```

## Best Practices

1. **Use Conditional Blocks**
   - Always wrap optional content in `{{#if}}` blocks
   - Prevents empty sections in your notes

2. **Format Dates Consistently**
   - Use `formatDateISO` for frontmatter dates
   - Use `relativeTime` for display purposes

3. **Handle Arrays Properly**
   - Use `{{#each}}` for iterating over arrays
   - Include proper spacing and formatting

4. **Validate Templates**
   - Test templates with different content types
   - Check for proper error handling

5. **Use Helper Functions**
   - Leverage built-in helpers for common operations
   - Keep templates clean and maintainable

## Troubleshooting

### Common Issues

1. **Empty Sections**
   - Problem: Empty sections appear in notes
   - Solution: Use `{{#if}}` blocks to check for content

2. **Date Formatting**
   - Problem: Dates appear in wrong format
   - Solution: Use appropriate date helpers

3. **Missing Content**
   - Problem: Some content doesn't appear
   - Solution: Check variable names and conditions

4. **Template Errors**
   - Problem: Template validation fails
   - Solution: Check for unclosed blocks and invalid variables

### Debugging Tips

1. Use the template preview feature
2. Check the validation results
3. Test with sample data
4. Review the error messages
5. Check the console for detailed logs

## Template Gallery

### Note-Taking Methods

#### Cornell Method Template

```handlebars
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
type: {{raindropType type}}
{{#if tags}}tags: {{formatTags tags}}{{/if}}
---

## Notes
{{#if excerpt}}{{excerpt}}

{{/if}}{{#if note}}{{note}}

{{/if}}{{#if hasHighlights}}{{#each highlights}}> {{text}}
{{#if note}}> {{note}}{{/if}}
{{/each}}{{/if}}

## Keywords
{{#if tags}}{{#each tags}}- {{this}}
{{/each}}{{/if}}

## Summary
- 

## Questions
- 

## Review Notes
- 
```

#### PARA Method Template

```handlebars
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
type: {{raindropType type}}
status: new
{{#if tags}}tags: {{formatTags tags}}{{/if}}
---

## Project/Area
- 

## Resources
- Source: {{url}}
- Type: {{raindropType type}}
- Added: {{relativeTime created}}

## Content
{{#if excerpt}}{{excerpt}}

{{/if}}{{#if note}}{{note}}

{{/if}}{{#if hasHighlights}}## Key Points
{{#each highlights}}- {{text}}
{{#if note}}  - Note: {{note}}{{/if}}
{{/each}}{{/if}}

## Archive
- Status: 
- Date: 
```

#### MOC (Map of Content) Template

```handlebars
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
type: {{raindropType type}}
{{#if tags}}tags: {{formatTags tags}}{{/if}}
---

## Overview
{{#if excerpt}}{{excerpt}}

{{/if}}

## Related Notes
- 

## Topics
{{#if tags}}{{#each tags}}- [[{{this}}]]
{{/each}}{{/if}}

## Highlights
{{#if hasHighlights}}{{#each highlights}}- {{text}}
{{#if note}}  - Note: {{note}}{{/if}}
{{/each}}{{/if}}

## References
- Source: {{url}}
- Type: {{raindropType type}}
- Added: {{relativeTime created}}
```

### Content Types

#### Video Template

```handlebars
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
type: {{raindropType type}}
{{#if tags}}tags: {{formatTags tags}}{{/if}}
---

## Video Information
- Source: {{url}}
- Type: {{raindropType type}}
- Added: {{relativeTime created}}

## Summary
{{#if excerpt}}{{excerpt}}

{{/if}}

## Timestamps
{{#if hasHighlights}}{{#each highlights}}- {{text}}
{{#if note}}  - Note: {{note}}{{/if}}
{{/each}}{{/if}}

## Notes
{{#if note}}{{note}}{{/if}}
```

#### Image Collection Template

```handlebars
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
type: {{raindropType type}}
{{#if tags}}tags: {{formatTags tags}}{{/if}}
---

## Image Collection
- Source: {{url}}
- Type: {{raindropType type}}
- Added: {{relativeTime created}}

## Description
{{#if excerpt}}{{excerpt}}

{{/if}}

## Notes
{{#if note}}{{note}}{{/if}}

## Image Details
{{#if hasHighlights}}{{#each highlights}}- {{text}}
{{#if note}}  - Note: {{note}}{{/if}}
{{/each}}{{/if}}
```

#### Document Template

```handlebars
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
type: {{raindropType type}}
{{#if tags}}tags: {{formatTags tags}}{{/if}}
---

## Document Information
- Source: {{url}}
- Type: {{raindropType type}}
- Added: {{relativeTime created}}

## Summary
{{#if excerpt}}{{excerpt}}

{{/if}}

## Key Points
{{#if hasHighlights}}{{#each highlights}}- {{text}}
{{#if note}}  - Note: {{note}}{{/if}}
{{/each}}{{/if}}

## Notes
{{#if note}}{{note}}{{/if}}

## References
- 
```

## Helper Function Examples

### Date Formatting

```handlebars
{{formatDate created}}              // "May 24, 2024"
{{formatDateTime created}}          // "May 24, 2024, 12:00 PM"
{{formatDateISO created}}           // "2024-05-24"
{{formatTime created}}              // "12:00 PM"
{{relativeTime created}}            // "2 days ago"
```

### Text Manipulation

```handlebars
{{sanitize "file/name:with*chars"}} // "filenamewithchars"
{{truncate excerpt 100}}            // Truncates to 100 characters
{{json collection}}                 // Pretty-prints collection object
```

### Array Operations

```handlebars
{{join tags ", "}}                  // "tag1, tag2, tag3"
{{formatTags tags}}                 // "#tag1 #tag2 #tag3"
{{formatHighlights highlights}}     // Formats highlights with notes
```

### Conditional Examples

```handlebars
{{#if hasHighlights}}
  Found {{highlightCount this}} highlights
{{else}}
  No highlights found
{{/if}}

{{#if hasTags}}
  Tags: {{join tags ", "}}
{{else}}
  No tags
{{/if}}
```

### Comparison Examples

```handlebars
{{#if (eq type "article")}}
  This is an article
{{else}}
  This is not an article
{{/if}}

{{#if (gt highlightCount 5)}}
  Many highlights found
{{else}}
  Few highlights found
{{/if}}
```

## Advanced Usage

### Nested Conditionals

```handlebars
{{#if hasHighlights}}
  {{#if (gt highlightCount 5)}}
    Many highlights found:
    {{#each highlights}}
      - {{text}}
    {{/each}}
  {{else}}
    Few highlights found
  {{/if}}
{{else}}
  No highlights
{{/if}}
```

### Complex Date Formatting

```handlebars
{{#if (gt (formatDateISO updated) (formatDateISO created))}}
  Updated: {{relativeTime updated}}
{{else}}
  Created: {{relativeTime created}}
{{/if}}
```

### Custom Section Organization

```handlebars
{{#if hasHighlights}}
  ## Key Points ({{highlightCount this}})
  {{#each highlights}}
    ### Point {{@index}}
    > {{text}}
    {{#if note}}
    > Note: {{note}}
    {{/if}}
  {{/each}}
{{/if}}
```

### Dynamic Frontmatter

```handlebars
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
{{#if (eq type "article")}}
status: unread
{{else}}
status: reviewed
{{/if}}
{{#if hasHighlights}}
highlight_count: {{highlightCount this}}
{{/if}}
---
```

### Template Composition

```handlebars
{{! Base template }}
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
{{! Type-specific additions }}
{{#if (eq type "article")}}
  {{> article-frontmatter}}
{{else if (eq type "video")}}
  {{> video-frontmatter}}
{{else}}
  {{> default-frontmatter}}
{{/if}}
---

{{! Content sections }}
{{> common-content}}
{{#if (eq type "article")}}
  {{> article-content}}
{{else if (eq type "video")}}
  {{> video-content}}
{{else}}
  {{> default-content}}
{{/if}}
```

### Error Handling

```handlebars
{{#if title}}
  {{title}}
{{else}}
  [Untitled]
{{/if}}

{{#if url}}
  [Source]({{url}})
{{else}}
  [No source available]
{{/if}}
```

### Performance Optimization

1. Use cached templates when possible
2. Minimize nested conditionals
3. Use efficient helper functions
4. Validate templates before use
5. Handle edge cases gracefully

### Best Practices for Large Templates

1. Break down into smaller components
2. Use consistent formatting
3. Document complex logic
4. Test with various content types
5. Validate all edge cases
