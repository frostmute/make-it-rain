# Template Gallery

This document provides a collection of pre-built templates for various use cases with the Make It Rain plugin.

## Table of Contents

- [Basic Templates](#basic-templates)
- [Academic Templates](#academic-templates)
- [Project Templates](#project-templates)
- [Research Templates](#research-templates)
- [Reading List Templates](#reading-list-templates)
- [Media Templates](#media-templates)
- [Custom Templates](#custom-templates)

## Basic Templates

### Simple Article

```handlebars
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
updated: {{formatDateISO updated}}
tags: {{formatTags tags}}
---

# {{title}}

{{#if excerpt}}
## Summary
{{excerpt}}
{{/if}}

{{#if note}}
## Notes
{{note}}
{{/if}}

{{#if highlights}}
## Highlights
{{#each highlights}}
- {{this}}
{{/each}}
{{/if}}

[Source]({{url}})
```

### Enhanced Article

```handlebars
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
updated: {{formatDateISO updated}}
tags: {{formatTags tags}}
type: {{raindropType type}}
domain: {{domain}}
---

# {{title}}

{{#if cover}}
![[{{cover}}]]
{{/if}}

{{#if excerpt}}
## Summary
{{excerpt}}
{{/if}}

{{#if note}}
## Notes
{{note}}
{{/if}}

{{#if highlights}}
## Highlights
{{#each highlights}}
- {{this}}
{{/each}}
{{/if}}

## Metadata

- **Type**: {{raindropType type}}
- **Domain**: {{domain}}
- **Created**: {{formatDate created}}
- **Updated**: {{formatDate updated}}
- **Tags**: {{formatTags tags}}

[Source]({{url}})
```

## Academic Templates

### Research Paper

```handlebars
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
updated: {{formatDateISO updated}}
tags: {{formatTags tags}}
type: paper
---

# {{title}}

{{#if excerpt}}
## Abstract
{{excerpt}}
{{/if}}

{{#if note}}
## Notes
{{note}}
{{/if}}

{{#if highlights}}
## Key Points
{{#each highlights}}
- {{this}}
{{/each}}
{{/if}}

## Metadata

- **Authors**: {{#if creatorRef}}{{creatorRef.name}}{{else}}Unknown{{/if}}
- **Publication**: {{domain}}
- **Date**: {{formatDate created}}
- **Tags**: {{formatTags tags}}

## References

[Source]({{url}})
```

### Literature Review

```handlebars
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
updated: {{formatDateISO updated}}
tags: {{formatTags tags}}
type: review
---

# {{title}}

{{#if excerpt}}
## Summary
{{excerpt}}
{{/if}}

{{#if note}}
## Analysis
{{note}}
{{/if}}

{{#if highlights}}
## Key Findings
{{#each highlights}}
- {{this}}
{{/each}}
{{/if}}

## Methodology

- **Type**: {{raindropType type}}
- **Domain**: {{domain}}
- **Date**: {{formatDate created}}

## References

[Source]({{url}})
```

## Project Templates

### Project Reference

```handlebars
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
updated: {{formatDateISO updated}}
tags: {{formatTags tags}}
type: reference
---

# {{title}}

{{#if excerpt}}
## Overview
{{excerpt}}
{{/if}}

{{#if note}}
## Project Notes
{{note}}
{{/if}}

{{#if highlights}}
## Key Points
{{#each highlights}}
- {{this}}
{{/each}}
{{/if}}

## Project Details

- **Type**: {{raindropType type}}
- **Domain**: {{domain}}
- **Created**: {{formatDate created}}
- **Updated**: {{formatDate updated}}
- **Tags**: {{formatTags tags}}

## Resources

[Source]({{url}})
```

### Task Reference

```handlebars
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
updated: {{formatDateISO updated}}
tags: {{formatTags tags}}
type: task
---

# {{title}}

{{#if excerpt}}
## Description
{{excerpt}}
{{/if}}

{{#if note}}
## Task Notes
{{note}}
{{/if}}

{{#if highlights}}
## Key Points
{{#each highlights}}
- {{this}}
{{/each}}
{{/if}}

## Task Details

- **Type**: {{raindropType type}}
- **Domain**: {{domain}}
- **Created**: {{formatDate created}}
- **Updated**: {{formatDate updated}}
- **Tags**: {{formatTags tags}}

## Resources

[Source]({{url}})
```

## Research Templates

### Research Note

```handlebars
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
updated: {{formatDateISO updated}}
tags: {{formatTags tags}}
type: research
---

# {{title}}

{{#if excerpt}}
## Summary
{{excerpt}}
{{/if}}

{{#if note}}
## Research Notes
{{note}}
{{/if}}

{{#if highlights}}
## Key Findings
{{#each highlights}}
- {{this}}
{{/each}}
{{/if}}

## Research Details

- **Type**: {{raindropType type}}
- **Domain**: {{domain}}
- **Created**: {{formatDate created}}
- **Updated**: {{formatDate updated}}
- **Tags**: {{formatTags tags}}

## References

[Source]({{url}})
```

### Case Study

```handlebars
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
updated: {{formatDateISO updated}}
tags: {{formatTags tags}}
type: case-study
---

# {{title}}

{{#if excerpt}}
## Overview
{{excerpt}}
{{/if}}

{{#if note}}
## Analysis
{{note}}
{{/if}}

{{#if highlights}}
## Key Points
{{#each highlights}}
- {{this}}
{{/each}}
{{/if}}

## Case Study Details

- **Type**: {{raindropType type}}
- **Domain**: {{domain}}
- **Created**: {{formatDate created}}
- **Updated**: {{formatDate updated}}
- **Tags**: {{formatTags tags}}

## References

[Source]({{url}})
```

## Reading List Templates

### Book Summary

```handlebars
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
updated: {{formatDateISO updated}}
tags: {{formatTags tags}}
type: book
---

# {{title}}

{{#if excerpt}}
## Summary
{{excerpt}}
{{/if}}

{{#if note}}
## Book Notes
{{note}}
{{/if}}

{{#if highlights}}
## Key Quotes
{{#each highlights}}
- {{this}}
{{/each}}
{{/if}}

## Book Details

- **Type**: {{raindropType type}}
- **Domain**: {{domain}}
- **Created**: {{formatDate created}}
- **Updated**: {{formatDate updated}}
- **Tags**: {{formatTags tags}}

## References

[Source]({{url}})
```

### Article Summary

```handlebars
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
updated: {{formatDateISO updated}}
tags: {{formatTags tags}}
type: article
---

# {{title}}

{{#if excerpt}}
## Summary
{{excerpt}}
{{/if}}

{{#if note}}
## Article Notes
{{note}}
{{/if}}

{{#if highlights}}
## Key Points
{{#each highlights}}
- {{this}}
{{/each}}
{{/if}}

## Article Details

- **Type**: {{raindropType type}}
- **Domain**: {{domain}}
- **Created**: {{formatDate created}}
- **Updated**: {{formatDate updated}}
- **Tags**: {{formatTags tags}}

## References

[Source]({{url}})
```

## Media Templates

### Video Summary

```handlebars
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
updated: {{formatDateISO updated}}
tags: {{formatTags tags}}
type: video
---

# {{title}}

{{#if excerpt}}
## Summary
{{excerpt}}
{{/if}}

{{#if note}}
## Video Notes
{{note}}
{{/if}}

{{#if highlights}}
## Key Moments
{{#each highlights}}
- {{this}}
{{/each}}
{{/if}}

## Video Details

- **Type**: {{raindropType type}}
- **Domain**: {{domain}}
- **Created**: {{formatDate created}}
- **Updated**: {{formatDate updated}}
- **Tags**: {{formatTags tags}}

## References

[Source]({{url}})
```

### Podcast Summary

```handlebars
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
updated: {{formatDateISO updated}}
tags: {{formatTags tags}}
type: podcast
---

# {{title}}

{{#if excerpt}}
## Summary
{{excerpt}}
{{/if}}

{{#if note}}
## Podcast Notes
{{note}}
{{/if}}

{{#if highlights}}
## Key Points
{{#each highlights}}
- {{this}}
{{/each}}
{{/if}}

## Podcast Details

- **Type**: {{raindropType type}}
- **Domain**: {{domain}}
- **Created**: {{formatDate created}}
- **Updated**: {{formatDate updated}}
- **Tags**: {{formatTags tags}}

## References

[Source]({{url}})
```

## Custom Templates

### Custom Template 1

```handlebars
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
updated: {{formatDateISO updated}}
tags: {{formatTags tags}}
type: custom
---

# {{title}}

{{#if excerpt}}
## Summary
{{excerpt}}
{{/if}}

{{#if note}}
## Notes
{{note}}
{{/if}}

{{#if highlights}}
## Key Points
{{#each highlights}}
- {{this}}
{{/each}}
{{/if}}

## Details

- **Type**: {{raindropType type}}
- **Domain**: {{domain}}
- **Created**: {{formatDate created}}
- **Updated**: {{formatDate updated}}
- **Tags**: {{formatTags tags}}

## References

[Source]({{url}})
```

### Custom Template 2

```handlebars
---
title: {{title}}
url: {{url}}
created: {{formatDateISO created}}
updated: {{formatDateISO updated}}
tags: {{formatTags tags}}
type: custom
---

# {{title}}

{{#if excerpt}}
## Summary
{{excerpt}}
{{/if}}

{{#if note}}
## Notes
{{note}}
{{/if}}

{{#if highlights}}
## Key Points
{{#each highlights}}
- {{this}}
{{/each}}
{{/if}}

## Details

- **Type**: {{raindropType type}}
- **Domain**: {{domain}}
- **Created**: {{formatDate created}}
- **Updated**: {{formatDate updated}}
- **Tags**: {{formatTags tags}}

## References

[Source]({{url}})
```

## Template Usage

### How to Use

1. Copy the template
2. Paste into settings
3. Customize as needed
4. Save changes

### Customization

- Modify frontmatter
- Add/remove sections
- Change formatting
- Add custom helpers

### Best Practices

1. Test templates
2. Validate syntax
3. Check output
4. Update regularly

## Template Development

### Creating Templates

1. Start with basic structure
2. Add required fields
3. Include optional sections
4. Test with sample data

### Helper Functions

1. Use built-in helpers
2. Add custom helpers
3. Test helper functions
4. Document usage

### Validation

1. Check syntax
2. Test variables
3. Verify output
4. Handle errors

## Support

### Getting Help

1. Check documentation
2. Search issues
3. Ask community
4. Contact support

### Resources

- [Template Documentation](templates.md)
- [Helper Functions](templates.md#helper-functions)
- [Examples](templates.md#examples)
- [Best Practices](templates.md#best-practices)
