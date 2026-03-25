# Template Gallery

This document provides a collection of pre-built templates for various use cases with the Make It Rain plugin. Adapt them to your needs or use them as inspiration for your own creations!

**Key Changes to Note (Recent Updates):**

- Collection data is now flattened: use `{{collectionId}}`, `{{collectionTitle}}`, `{{collectionPath}}`, and `{{#if collectionParentId}}{{collectionParentId}}{{/if}}` instead of `{{collection.id}}`, etc.
- The last update field is now `{{lastupdate}}` (previously `last_update` or `lastUpdate`).
- Helper functions like `formatDate` or `raindropType` are now pre-calculated variables: `{{formattedCreatedDate}}`, `{{formattedUpdatedDate}}`, `{{renderedType}}`, `{{domain}}`, `{{formattedTags}}`.

## Table of Contents

- [Basic Templates](#basic-templates)
  - [Simple Article](#simple-article)
  - [Enhanced Article with Details](#enhanced-article-with-details)
- [Academic & Research Templates](#academic--research-templates)
  - [Research Paper Outline](#research-paper-outline)
  - [Literature Review Note](#literature-review-note)
- [Project & Task Management Templates](#project--task-management-templates)
  - [Project Reference](#project-reference)
  - [Task-Specific Bookmark](#task-specific-bookmark)
- [Media Consumption Templates](#media-consumption-templates)
  - [Video Summary](#video-summary)
  - [Image Note](#image-note)
- [Learning & Study Templates](#learning--study-templates)
  - [Study Resource](#study-resource)
- [Minimalist Templates](#minimalist-templates)
  - [Ultra-Minimal](#ultra-minimal)

## Basic Templates

### Simple Article

Good for general articles and blog posts when you want a clean, straightforward note.

```handlebars
---
title: "{{title}}"
source: {{link}} 
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
## Summary
{{excerpt}}
{{/if}}

{{#if note}}
## My Notes
{{note}}
{{/if}}

{{#if highlights}}
## Highlights
{{#each highlights}}
- {{text}}
{{#if note}}  *Note from highlight:* {{note}}{{/if}}
{{/each}}
{{/if}}

---
[Source]({{link}})
```

### Enhanced Article with Details

Similar to the simple article, but includes the pre-calculated "Details" block.

```handlebars
---
title: "{{title}}"
source: {{link}}
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
## Summary
{{excerpt}}
{{/if}}

{{#if note}}
## My Notes
{{note}}
{{/if}}

{{#if highlights}}
## Highlights
{{#each highlights}}
- {{text}}
{{#if note}}  *Note from highlight:* {{note}}{{/if}}
{{/each}}
{{/if}}

---
## Details
- **Type**: {{renderedType}}
- **Domain**: {{domain}}
- **Created**: {{formattedCreatedDate}}
- **Updated**: {{formattedUpdatedDate}}
- **Tags**: {{formattedTags}}
- **Collection**: {{collectionTitle}} (Path: {{collectionPath}})

[Source]({{link}})
```

## Academic & Research Templates

### Research Paper Outline

Useful for academic papers, with fields for authors, publication, etc. (assumes you might add these manually or if Raindrop provides them via API in the future – currently `authors`, `published_date`, `journal` are placeholders for custom data you might manage or expect).

```handlebars
---
id: {{id}}
title: "{{title}}"
source: {{link}}
created: {{created}}
lastupdate: {{lastupdate}}
collectionId: {{collectionId}}
collectionTitle: "{{collectionTitle}}"
collectionPath: "{{collectionPath}}"
{{#if collectionParentId}}collectionParentId: {{collectionParentId}}{{/if}}
status: to-read # Example custom status
{{#if tags}}keywords:
{{#each tags}}  - {{this}}
{{/each}}{{/if}}
authors: [] # Placeholder for manual input
published_date: # Placeholder
journal: # Placeholder
{{#if cover}}{{bannerFieldName}}: {{cover}}{{/if}}
---

# {{title}}

{{#if excerpt}}
## Abstract / Summary
{{excerpt}}
{{/if}}

{{#if note}}
## My Research Notes
{{note}}
{{/if}}

{{#if highlights}}
## Key Points & Quotes
{{#each highlights}}
> {{text}}
{{#if note}}
  *Comment:* {{note}}
{{/if}}
{{/each}}
{{/if}}

---
## Bibliographic Details
- **Paper Type**: {{renderedType}}
- **Domain/Publisher**: {{domain}}
- **Saved**: {{formattedCreatedDate}}
- **Last Raindrop Update**: {{formattedUpdatedDate}}
- **Keywords**: {{formattedTags}}
- **Collection**: {{collectionTitle}}

[Access Paper]({{link}})
```

### Literature Review Note

Tailored for summarizing and analyzing literature.

```handlebars
---
id: {{id}}
title: "{{title}}"
source: {{link}}
created: {{created}}
lastupdate: {{lastupdate}}
collectionId: {{collectionId}}
collectionTitle: "{{collectionTitle}}"
collectionPath: "{{collectionPath}}"
{{#if collectionParentId}}collectionParentId: {{collectionParentId}}{{/if}}
area: # Placeholder for research area
{{#if tags}}themes:
{{#each tags}}  - {{this}}
{{/each}}{{/if}}
{{#if cover}}{{bannerFieldName}}: {{cover}}{{/if}}
---

# {{title}}

{{#if excerpt}}
## Core Argument / Summary
{{excerpt}}
{{/if}}

{{#if note}}
## My Analysis & Connections
{{note}}
{{/if}}

{{#if highlights}}
## Significant Findings / Quotes
{{#each highlights}}
- "{{text}}" ({{note}})
{{/each}}
{{/if}}

---
## Source Context
- **Type**: {{renderedType}}
- **Source Name**: {{domain}}
- **Date Added**: {{formattedCreatedDate}}
- **Themes**: {{formattedTags}}

[View Source]({{link}})
```

## Project & Task Management Templates

### Project Reference

For bookmarks that are references for a specific project.

```handlebars
---
id: {{id}}
title: "{{title}}"
source: {{link}}
created: {{created}}
lastupdate: {{lastupdate}}
collectionId: {{collectionId}}
collectionTitle: "{{collectionTitle}}"
collectionPath: "{{collectionPath}}"
{{#if collectionParentId}}collectionParentId: {{collectionParentId}}{{/if}}
project: # Placeholder for project name
status: reference
{{#if tags}}relevant_tags:
{{#each tags}}  - {{this}}
{{/each}}{{/if}}
{{#if cover}}{{bannerFieldName}}: {{cover}}{{/if}}
---

# Reference: {{title}}

{{#if excerpt}}
## Overview / Relevance
{{excerpt}}
{{/if}}

{{#if note}}
## Project-Specific Notes
{{note}}
{{/if}}

{{#if highlights}}
## Key Takeaways for Project
{{#each highlights}}
- {{text}} {{#if note}}*({{note}})*{{/if}}
{{/each}}
{{/if}}

---
## Link Details
- **Type**: {{renderedType}}
- **Domain**: {{domain}}
- **Added**: {{formattedCreatedDate}}

[Access Resource]({{link}})
```

### Task-Specific Bookmark

When a bookmark is tied to a particular task or to-do item.

```handlebars
---
id: {{id}}
title: "{{title}}"
source: {{link}}
created: {{created}}
lastupdate: {{lastupdate}}
collectionId: {{collectionId}}
collectionTitle: "{{collectionTitle}}"
collectionPath: "{{collectionPath}}"
{{#if collectionParentId}}collectionParentId: {{collectionParentId}}{{/if}}
task_id: # Placeholder for related task ID
actionable: true
{{#if tags}}context_tags:
{{#each tags}}  - {{this}}
{{/each}}{{/if}}
---

# Task Resource: {{title}}

{{#if excerpt}}
## Quick Summary
{{excerpt}}
{{/if}}

{{#if note}}
## Action Items / Notes
{{note}}
{{/if}}

---
[Open Link]({{link}})

**Details**
- Added: {{formattedCreatedDate}}
- Type: {{renderedType}}
```

## Media Consumption Templates

### Video Summary

Good for YouTube videos or other video content, focusing on highlights as timestamps/key moments.

```handlebars
---
id: {{id}}
title: "{{title}}"
source: {{link}}
channel: {{domain}} # Or a custom field if you add it
created: {{created}}
lastupdate: {{lastupdate}}
collectionId: {{collectionId}}
collectionTitle: "{{collectionTitle}}"
collectionPath: "{{collectionPath}}"
{{#if collectionParentId}}collectionParentId: {{collectionParentId}}{{/if}}
watched: false # Example custom status
{{#if tags}}video_tags:
{{#each tags}}  - {{this}}
{{/each}}{{/if}}
{{#if cover}}{{bannerFieldName}}: {{cover}}{{/if}}
---

# {{title}}

{{#if cover}}
[![{{title}}]({{cover}})]({{link}})
{{/if}}

{{#if excerpt}}
## Video Description
{{excerpt}}
{{/if}}

{{#if note}}
## My Thoughts / Summary
{{note}}
{{/if}}

{{#if highlights}}
## Key Moments / Timestamps
{{#each highlights}}
- **{{text}}** {{#if note}}*(Comment: {{note}})*{{/if}}
{{/each}}
{{/if}}

---
## Video Info
- **Platform**: {{domain}}
- **Type**: {{renderedType}}
- **Saved On**: {{formattedCreatedDate}}
- **Tags**: {{formattedTags}}

[Watch Video]({{link}})
```

### Image Note

Simple template for bookmarked images.

```handlebars
---
id: {{id}}
title: "{{title}}"
source: {{link}}
created: {{created}}
lastupdate: {{lastupdate}}
collectionId: {{collectionId}}
collectionTitle: "{{collectionTitle}}"
collectionPath: "{{collectionPath}}"
{{#if collectionParentId}}collectionParentId: {{collectionParentId}}{{/if}}
{{#if tags}}tags:
{{#each tags}}  - {{this}}
{{/each}}{{/if}}
{{bannerFieldName}}: {{cover}} # Assuming cover is the main image for type:image
---

# {{title}}

![{{title}}]({{cover}})

{{#if excerpt}}
*{{excerpt}}*
{{/if}}

{{#if note}}
## Notes
{{note}}
{{/if}}

---
[View Image Source]({{link}})
- Added: {{formattedCreatedDate}}
- Type: {{renderedType}}
```

## Learning & Study Templates

### Study Resource

For notes related to courses, tutorials, or general learning.

```handlebars
---
id: {{id}}
title: "{{title}}"
source: {{link}}
created: {{created}}
lastupdate: {{lastupdate}}
collectionId: {{collectionId}}
collectionTitle: "{{collectionTitle}}"
collectionPath: "{{collectionPath}}"
{{#if collectionParentId}}collectionParentId: {{collectionParentId}}{{/if}}
course: # Placeholder for course name
module: # Placeholder for module/topic
status: studying
{{#if tags}}concepts:
{{#each tags}}  - {{this}}
{{/each}}{{/if}}
{{#if cover}}{{bannerFieldName}}: {{cover}}{{/if}}
---

# Learning: {{title}}

{{#if excerpt}}
## Overview / Abstract
{{excerpt}}
{{/if}}

{{#if note}}
## Key Learnings & Study Notes
{{note}}
{{/if}}

{{#if highlights}}
## Important Sections / Definitions
{{#each highlights}}
- **{{text}}**
{{#if note}}  *Annotation:* {{note}}
{{/if}}
{{/each}}
{{/if}}

---
## Resource Details
- **Platform**: {{domain}}
- **Format**: {{renderedType}}
- **Bookmarked**: {{formattedCreatedDate}}
- **Concepts**: {{formattedTags}}

[Access Learning Material]({{link}})
```

## Minimalist Templates

### Ultra-Minimal

For when you want almost nothing but the link and title.

```handlebars
---
title: "{{title}}"
url: {{link}} # Using url as an alias for link
---

# {{title}}

[Link]({{link}})
```
