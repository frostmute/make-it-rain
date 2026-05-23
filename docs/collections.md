# Collection Management

This guide explains how Make It Rain handles Raindrop.io collections and their integration with your Obsidian vault.

## Table of Contents

- [Collection Structure](#collection-structure)
- [Importing Collections](#importing-collections)
- [Collection Hierarchy](#collection-hierarchy)
- [Filtering Collections](#filtering-collections)
- [Best Practices](#best-practices)

## Collection Structure

Raindrop.io collections can be organized in a hierarchical structure:

- **Root Collections**: Top-level collections
- **Nested Collections**: Collections within other collections
- **Smart Collections**: Automatically organized collections based on rules

### Collection Properties

Each collection has the following properties:

- `id`: Unique identifier
- `title`: Collection name
- `parent_id`: ID of parent collection (if nested)
- `path`: Full path from root to collection
- `count`: Number of items in collection

## Importing Collections

### Basic Import

1. Open the Command Palette (`Ctrl+P` or `Cmd+P`)
2. Select "Fetch Raindrops"
3. Choose your import options
4. Click "Fetch Raindrops"

### Collection Selection

You can import from:

- All collections
- Specific collections by ID
- Specific collections by name
- Collections matching patterns

### Import Options

- **Include Subcollections**: Import items from nested collections
- **Create Folders**: Create Obsidian folders matching collection structure
- **Update Existing**: Update notes for existing items
- **Skip Existing**: Skip notes that already exist

## Collection Hierarchy

### Folder Structure

The plugin can create a folder structure in your vault that mirrors your Raindrop.io collections:

```plaintext
Vault Root/
├── Collection 1/
│   ├── Subcollection 1.1/
│   │   └── Note 1.1.1.md
│   └── Note 1.1.md
├── Collection 2/
│   └── Note 2.1.md
└── Note 1.md
```

### Hierarchy Options

- **Flat Structure**: All notes in one folder
- **Collection-Based**: Notes in collection folders
- **Full Hierarchy**: Complete collection structure
- **Custom Structure**: User-defined organization

## Filtering Collections

### Collection Filters

- **By ID**: `123,456,789`
- **By Name**: `Work,Personal,Research`
- **By Path**: `Work/Projects/*`
- **By Pattern**: `Work*`

### Filter Combinations

- **AND Logic**: Items must match all filters
- **OR Logic**: Items can match any filter
- **Exclusion**: Items matching certain patterns are excluded

### Advanced Filtering

- **Smart Collections**: Import from smart collections
- **Tag-Based**: Filter by collection tags
- **Date-Based**: Filter by collection creation/update date
- **Size-Based**: Filter by collection size

## Best Practices

### Organization

1. **Plan Your Structure**
   - Design your collection hierarchy
   - Consider your workflow
   - Plan for future growth

2. **Naming Conventions**
   - Use consistent naming
   - Avoid special characters
   - Keep names descriptive

3. **Folder Management**
   - Regular cleanup
   - Archive old collections
   - Maintain hierarchy

### Performance

1. **Large Collections**
   - Import in batches
   - Use filters
   - Monitor progress

2. **Frequent Updates**
   - Use update mode
   - Track changes
   - Backup regularly

3. **Resource Usage**
   - Monitor API limits
   - Optimize imports
   - Handle errors gracefully

### Maintenance

1. **Regular Tasks**
   - Check for updates
   - Clean up old notes
   - Update templates

2. **Backup Strategy**
   - Regular backups
   - Version control
   - Export important data

3. **Error Handling**
   - Monitor logs
   - Check for issues
   - Report problems

## Troubleshooting

### Common Issues

1. **Missing Collections**
   - Check API token
   - Verify permissions
   - Check collection IDs

2. **Import Errors**
   - Check rate limits
   - Verify folder structure
   - Check file permissions

3. **Hierarchy Problems**
   - Verify collection structure
   - Check parent IDs
   - Validate paths

### Solutions

1. **API Issues**
   - Refresh token
   - Check limits
   - Verify connection

2. **Folder Issues**
   - Check permissions
   - Verify paths
   - Create missing folders

3. **Import Problems**
   - Use smaller batches
   - Check filters
   - Verify settings

## Advanced Features

### Collection Templates

- Type-specific templates
- Collection-based templates
- Custom templates

### Automation

- Scheduled imports
- Automatic updates
- Batch processing

### Integration

- Other plugins
- External tools
- Custom scripts

## API Reference

### Collection Properties

```typescript
interface Collection {
    id: number;
    title: string;
    parent_id?: number;
    path: string;
    count: number;
    created: string;
    updated: string;
}
```

### Import Options

```typescript
interface ImportOptions {
    collections: string[];
    includeSubcollections: boolean;
    createFolders: boolean;
    updateExisting: boolean;
    skipExisting: boolean;
}
```

### Filter Options

```typescript
interface FilterOptions {
    collections: string[];
    tags: string[];
    types: string[];
    dateRange: DateRange;
    excludePatterns: string[];
}
```
