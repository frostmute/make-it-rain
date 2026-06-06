# Tag Management

This guide explains how Make It Rain handles tags from Raindrop.io and integrates them with your Obsidian vault.

## Table of Contents

- [Tag Basics](#tag-basics)
- [Tag Import](#tag-import)
- [Tag Filtering](#tag-filtering)
- [Tag Customization](#tag-customization)
- [Best Practices](#best-practices)

## Tag Basics

### Tag Structure

Tags in Raindrop.io are simple strings that can be:

- Single words: `work`, `research`, `todo`
- Multi-word: `to read`, `in progress`, `needs review`
- Hierarchical: `project/active`, `status/done`

### Tag Properties

Each tag has the following properties:

- `name`: The tag text
- `count`: Number of items with this tag
- `type`: Tag category (if applicable)

## Tag Import

### Basic Import

Tags are automatically imported with your Raindrop items and added to the YAML frontmatter:

```yaml
---
title: My Bookmark
tags:
  - work
  - research
  - to_read
---
```

### Tag Processing

During import, tags are:

1. Sanitized for Obsidian compatibility
2. Converted to lowercase
3. Spaces replaced with underscores
4. Special characters removed

### Import Options

- **Append Tags**: Add custom tags to all imports
- **Prefix Tags**: Add prefix to Raindrop tags
- **Skip Tags**: Don't import certain tags
- **Tag Mapping**: Map Raindrop tags to Obsidian tags

## Tag Filtering

### Basic Filtering

Filter imports by tags using:

- **AND Logic**: Items must have ALL specified tags
- **OR Logic**: Items can have ANY of the specified tags

### Filter Syntax

- **Simple**: `work,research`
- **AND Logic**: `work+research`
- **OR Logic**: `work|research`
- **Exclusion**: `-work`

### Advanced Filtering

- **Tag Patterns**: `work*`, `*research`
- **Tag Groups**: `(work|personal)`
- **Tag Combinations**: `work+research|personal`

## Tag Customization

### Tag Transformation

Customize how tags are processed:

```typescript
interface TagOptions {
    prefix: string;          // Add prefix to all tags
    suffix: string;          // Add suffix to all tags
    transform: (tag: string) => string;  // Custom transformation
    filter: (tag: string) => boolean;    // Filter tags
}
```

### Tag Mapping

Map Raindrop tags to Obsidian tags:

```typescript
interface TagMapping {
    'to read': 'status/to_read';
    'in progress': 'status/in_progress';
    'done': 'status/done';
}
```

### Tag Templates

Use tags in templates:

```handlebars
{{#if tags}}
Tags: {{formatTags tags}}
{{/if}}
```

## Best Practices

### Organization

1. **Tag Structure**
   - Use consistent naming
   - Plan hierarchy
   - Keep it simple

2. **Tag Categories**
   - Status tags
   - Topic tags
   - Project tags
   - Custom tags

3. **Tag Maintenance**
   - Regular cleanup
   - Merge similar tags
   - Archive unused tags

### Performance

1. **Tag Processing**
   - Efficient filtering
   - Optimize mapping
   - Cache results

2. **Large Collections**
   - Batch processing
   - Incremental updates
   - Monitor memory usage

3. **Search Optimization**
   - Use tag patterns
   - Optimize queries
   - Cache results

### Maintenance

1. **Regular Tasks**
   - Check for duplicates
   - Update mappings
   - Clean up tags

2. **Backup Strategy**
   - Export tag list
   - Version control
   - Regular backups

3. **Error Handling**
   - Validate tags
   - Handle errors
   - Log issues

## Troubleshooting

### Common Issues

1. **Missing Tags**
   - Check import settings
   - Verify tag format
   - Check permissions

2. **Tag Formatting**
   - Check sanitization
   - Verify mapping
   - Check templates

3. **Filter Problems**
   - Check syntax
   - Verify logic
   - Test filters

### Solutions

1. **Import Issues**
   - Check settings
   - Verify format
   - Test import

2. **Format Problems**
   - Update mapping
   - Check templates
   - Verify output

3. **Filter Errors**
   - Check syntax
   - Test patterns
   - Verify logic

## Advanced Features

### Tag Analytics

- Tag usage statistics
- Popular tags
- Tag relationships

### Tag Automation

- Automatic tagging
- Tag suggestions
- Tag cleanup

### Tag Integration

- Other plugins
- External tools
- Custom scripts

## API Reference

### Tag Properties

```typescript
interface Tag {
    name: string;
    count: number;
    type?: string;
}
```

### Tag Options

```typescript
interface TagOptions {
    prefix?: string;
    suffix?: string;
    transform?: (tag: string) => string;
    filter?: (tag: string) => boolean;
    mapping?: Record<string, string>;
}
```

### Filter Options

```typescript
interface TagFilterOptions {
    tags: string[];
    logic: 'AND' | 'OR';
    exclude: string[];
    patterns: string[];
}
```

## Examples

### Basic Tag Import

```yaml
---
title: My Bookmark
tags:
  - work
  - research
  - to_read
---
```

### Tag Filtering

```typescript
// AND Logic
const andFilter = 'work+research';

// OR Logic
const orFilter = 'work|research';

// Complex Filter
const complexFilter = '(work|personal)+research';
```

### Tag Mapping

```typescript
const tagMapping = {
    'to read': 'status/to_read',
    'in progress': 'status/in_progress',
    'done': 'status/done'
};
```

### Tag Templates

```handlebars
{{#if tags}}
## Tags
{{#each tags}}
- [[{{this}}]]
{{/each}}
{{/if}}
```
