# Template System for Make It Rain

The Make It Rain plugin now includes a powerful template system that gives you complete control over how your Raindrop.io bookmarks are formatted in Obsidian notes. This guide will walk you through using and customizing templates to suit your specific needs.

## Table of Contents

- [Enabling the Template System](#enabling-the-template-system)
- [Template Basics](#template-basics)
- [Available Variables](#available-variables)
- [Template Features](#template-features)
  - [Simple Variables](#simple-variables)
  - [Conditional Content](#conditional-content)
  - [Loops](#loops)
  - [Nested Properties](#nested-properties)
- [Content-Specific Templates](#content-specific-templates)
- [Selecting Templates When Fetching](#selecting-templates-when-fetching)
- [Example Templates](#example-templates)
  - [Default Template](#default-template)
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

You can use the following variables in your templates:

| Variable | Description |
|----------|-------------|
| `{{id}}` | Raindrop ID |
| `{{title}}` | Raindrop title |
| `{{excerpt}}` | Description/excerpt |
| `{{note}}` | Notes |
| `{{link}}` | URL of the bookmark |
| `{{cover}}` | Cover image URL |
| `{{created}}` | Creation date |
| `{{lastUpdate}}` | Last update date |
| `{{type}}` | Content type (link, article, image, etc.) |
| `{{collection.id}}` | Collection ID |
| `{{collection.title}}` | Collection title |
| `{{collection.path}}` | Full collection path |
| `{{bannerFieldName}}` | The field name for banner images (from settings) |

## Template Features

### Simple Variables

To include a variable's value in your template, simply wrap the variable name in double curly braces:

```handlebars
# {{title}}

{{excerpt}}
```

### Conditional Content

You can include content conditionally based on whether a variable exists or has a value:

```handlebars
{{#if cover}}
![{{title}}]({{cover}})
{{/if}}

{{#if note}}
## Notes
{{note}}
{{/if}}
```

You can also include an else clause:

```handlebars
{{#if excerpt}}
## Description
{{excerpt}}
{{else}}
*No description available*
{{/if}}
```

### Loops

You can loop through arrays like tags:

```handlebars
## Tags
{{#each tags}}
- {{this}}
{{/each}}
```

### Nested Properties

Access nested properties using dot notation:

```handlebars
## Collection
{{collection.title}} (ID: {{collection.id}})
Path: {{collection.path}}
```

## Content-Specific Templates

You can create different templates for different types of content:

1. In the Template System section, scroll down to "Content Type Templates"
2. Check the box next to the content type you want to customize (link, article, image, video, document, audio)
3. Edit the template for that content type
4. Save your changes

Each content type will now use its specific template when creating notes.

## Selecting Templates When Fetching

When fetching raindrops, you can choose which template to use:

1. Click the ribbon icon or use the command to open the Make It Rain fetch modal
2. If templates are enabled, you'll see a "Template Options" section
3. Select a template from the dropdown or choose "Auto (based on content type)" to use content-specific templates
4. Click "Fetch Raindrops" to create notes using the selected template

## Default Templates

Here are the default templates for each content type. These templates are used when you enable the template system but haven't created custom templates yet.

### Default Template

This is the standard template used for all content types by default.

```handlebars
---
id: {{id}}
title: "{{title}}"
description: "{{excerpt}}"
source: {{link}}
type: {{type}}
created: {{created}}
last_update: {{lastUpdate}}
collection:
  id: {{collection.id}}
  title: "{{collection.title}}"
  path: "{{collection.path}}"
tags:
{{#each tags}}
  - {{this}}
{{/each}}
{{#if cover}}
banner: {{cover}}
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

## Example Templates

Here are some example templates you can use or modify for different purposes:

### Minimal Template

A simple template with just the essential information:

```handlebars
---
id: {{id}}
last_update: {{lastUpdate}}
---

# {{title}}

[Visit Source]({{link}})

{{#if excerpt}}{{excerpt}}{{/if}}
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
last_update: {{lastUpdate}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
---

# {{title}}

## Summary
{{excerpt}}

## Notes
{{#if note}}
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

## Reference
- Source: [{{title}}]({{link}})
- Added: {{created}}
- Collection: {{collection.title}}
```

### Image Gallery Template

Optimized for image content:

```handlebars
---
id: {{id}}
title: "{{title}}"
source: {{link}}
type: {{type}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
---

# {{title}}

{{#if cover}}
![[{{cover}}]]
{{/if}}

{{#if excerpt}}
{{excerpt}}
{{/if}}

Source: [Original Image]({{link}})
```

### Video Notes Template

Designed for video content with timestamp support:

```handlebars
---
id: {{id}}
title: "{{title}}"
source: {{link}}
type: {{type}}
created: {{created}}
last_update: {{lastUpdate}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
---

# {{title}}

{{#if cover}}
![{{title}}]({{cover}})
{{/if}}

## Video Notes

{{#if note}}
{{note}}
{{else}}
*No notes yet*
{{/if}}

{{#if highlights}}
## Timestamps & Highlights
{{#each highlights}}
- {{text}}
{{#if note}}  *Comment:* {{note}}{{/if}}
{{/each}}
{{/if}}

## Source
[Watch Video]({{link}})
```

### Article Summary Template

Focused on article summaries and key points:

```handlebars
---
id: {{id}}
title: "{{title}}"
source: {{link}}
type: {{type}}
created: {{created}}
last_update: {{lastUpdate}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
---

# {{title}}

## Summary
{{excerpt}}

{{#if highlights}}
## Key Points
{{#each highlights}}
- {{text}}
{{/each}}
{{/if}}

{{#if note}}
## Personal Notes
{{note}}
{{/if}}

## Source
[Read Article]({{link}})
Added: {{created}}
```

### Documentation Template

Ideal for technical documentation and code references:

```handlebars
---
id: {{id}}
title: "{{title}}"
source: {{link}}
type: {{type}}
created: {{created}}
last_update: {{lastUpdate}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
---

# {{title}}

## Overview
{{excerpt}}

{{#if highlights}}
## Code Examples
{{#each highlights}}
````code
{{text}}

{{#if note}}**Note:** {{note}}{{/if}}

{{/each}}
{{/if}}

{{#if note}}
## Additional Notes
{{note}}
{{/if}}

## Reference
- Documentation: [{{title}}]({{link}})
- Collection: {{collection.title}}
```

### Recipe Template

Formatted for food recipes and cooking instructions:

```handlebars
---
id: {{id}}
title: "{{title}}"
source: {{link}}
type: {{type}}
created: {{created}}
last_update: {{lastUpdate}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
---

# {{title}}

{{#if cover}}
![{{title}}]({{cover}})
{{/if}}

## Description
{{excerpt}}

{{#if highlights}}
## Ingredients
{{#each highlights}}
- {{text}}
{{/each}}
{{/if}}

{{#if note}}
## Instructions
{{note}}
{{/if}}

## Source
[Original Recipe]({{link}})
```

### Content-Specific Default Templates

Here are recommended templates for specific content types:

#### Link Template

```handlebars
---
id: {{id}}
title: "{{title}}"
source: {{link}}
type: {{type}}
created: {{created}}
last_update: {{lastUpdate}}
collection:
  id: {{collection.id}}
  title: "{{collection.title}}"
tags:
{{#each tags}}
  - {{this}}
{{/each}}
---

# {{title}}

{{#if excerpt}}
{{excerpt}}
{{/if}}

{{#if note}}
## Notes
{{note}}
{{/if}}

[Visit Link]({{link}})
```

#### Article Template

```handlebars
---
id: {{id}}
title: "{{title}}"
source: {{link}}
type: {{type}}
created: {{created}}
last_update: {{lastUpdate}}
collection:
  id: {{collection.id}}
  title: "{{collection.title}}"
tags:
{{#each tags}}
  - {{this}}
{{/each}}
---

# {{title}}

{{#if cover}}
![{{title}}]({{cover}})
{{/if}}

## Summary
{{excerpt}}

{{#if highlights}}
## Highlights
{{#each highlights}}
> {{text}}
{{#if note}}  *Note:* {{note}}{{/if}}
{{/each}}
{{/if}}

{{#if note}}
## Notes
{{note}}
{{/if}}

[Read Article]({{link}})
```

#### Image Template

```handlebars
---
id: {{id}}
title: "{{title}}"
source: {{link}}
type: {{type}}
created: {{created}}
last_update: {{lastUpdate}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
---

# {{title}}

{{#if cover}}
![[{{cover}}]]
{{/if}}

{{#if excerpt}}
{{excerpt}}
{{/if}}

{{#if note}}
## Notes
{{note}}
{{/if}}

[View Original]({{link}})
```

#### Video Template

```handlebars
---
id: {{id}}
title: "{{title}}"
source: {{link}}
type: {{type}}
created: {{created}}
last_update: {{lastUpdate}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
---

# {{title}}

{{#if cover}}
![{{title}}]({{cover}})
{{/if}}

{{#if excerpt}}
## Description
{{excerpt}}
{{/if}}

{{#if highlights}}
## Timestamps
{{#each highlights}}
- {{text}}
{{#if note}}  *Comment:* {{note}}{{/if}}
{{/each}}
{{/if}}

{{#if note}}
## Notes
{{note}}
{{/if}}

[Watch Video]({{link}})
```

#### Document Template

```handlebars
---
id: {{id}}
title: "{{title}}"
source: {{link}}
type: {{type}}
created: {{created}}
last_update: {{lastUpdate}}
collection:
  id: {{collection.id}}
  title: "{{collection.title}}"
tags:
{{#each tags}}
  - {{this}}
{{/each}}
---

# {{title}}

## Summary
{{excerpt}}

{{#if highlights}}
## Highlights
{{#each highlights}}
- {{text}}
{{#if note}}  *Note:* {{note}}{{/if}}
{{/each}}
{{/if}}

{{#if note}}
## Notes
{{note}}
{{/if}}

[Open Document]({{link}})
```

#### Audio Template

```handlebars
---
id: {{id}}
title: "{{title}}"
source: {{link}}
type: {{type}}
created: {{created}}
last_update: {{lastUpdate}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
---

# {{title}}

{{#if cover}}
![{{title}}]({{cover}})
{{/if}}

{{#if excerpt}}
## Description
{{excerpt}}
{{/if}}

{{#if highlights}}
## Timestamps
{{#each highlights}}
- {{text}}
{{#if note}}  *Comment:* {{note}}{{/if}}
{{/each}}
{{/if}}

{{#if note}}
## Notes
{{note}}
{{/if}}

[Listen to Audio]({{link}})
```

---

Remember that templates must include at least the `id` and `last_update` fields in the frontmatter for the plugin's update functionality to work correctly. If these fields are missing, the plugin will add them automatically.

Happy templating!
