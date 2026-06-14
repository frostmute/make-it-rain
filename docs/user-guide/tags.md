---
layout: page
title: "Tag Management"
parent: "User Guide"
nav_order: 5
---

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

Tags are automatically imported with your Raindrop items and added to the YAML frontmatter.

### Tag Processing

During import, tags undergo a rigorous sanitization process to ensure Obsidian compatibility:

1. **Native Sanitization**: Special characters (except underscores) are removed.
2. **Space Handling**: Spaces are replaced with underscores.
3. **Normalization**: Tags are trimmed and converted to lowercase.
4. **Collision Prevention**: Duplicate tags after sanitization are filtered out.

### Settings-based Global Tags

A new feature allows you to define global tags in the plugin settings that are appended to **every** imported note. These tags follow the same sanitization rules as native Raindrop tags.

### Import Options

- **Default Metadata Tags**: Define a list of tags in settings to be applied globally.
- **Append Tags**: Add custom tags to specific import sessions.
- **Tag Match Type**: Filter Raindrops by "All" (AND) or "Any" (OR) tags during fetching.

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

### Tag Combinations: `work+research|personal`

## Tag Consolidation

### Aggregate Highlights by Tag

The **Aggregate Highlights by Tag** feature allows you to gather all highlights from notes that share a specific tag into a single document. This is particularly useful for synthesizing research across multiple sources.

1. Open the Command Palette (`Ctrl/Cmd+P`).
2. Run **"Aggregate highlights by tag"**.
3. Enter the tag name (e.g., `research`).
4. A new note `Highlights for research.md` will be created with all extracted highlights.

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
