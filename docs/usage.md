# Usage Guide

This guide explains how to use the Make It Rain plugin to fetch your Raindrop.io bookmarks into Obsidian.

## Getting Started

Before using the plugin, ensure you have:

1. [Installed the plugin](installation.md)
2. [Configured your API token](configuration.md#raindropio-api-token)
3. Set your [default raindrop location](configuration.md#default-raindrop-location) (optional)

## Opening the Fetch Modal

There are three ways to open the fetch modal:

1. **Command Palette**: Press `Ctrl+P` (or `Cmd+P` on Mac) and search for "Make It Rain: Fetch Raindrops"
2. **Ribbon Icon**: Click the raindrop icon in the left sidebar (if enabled in settings)
3. **Hotkey**: Set up a custom hotkey in Obsidian settings under "Hotkeys"

## Fetch Modal Options

The fetch modal provides several options for filtering and organizing your raindrops:

### Target Location

- **Raindrop Path**: Choose where in your vault to save the imported raindrops
  - Default is the path specified in your plugin settings
  - You can change this for each import session

### Filter Options

- **Collections**: Enter collection names or IDs (comma-separated, case sensitive)
  - Leave empty to fetch from all collections
  - Example: `Articles, RESEARCH, 12345678`

- **Include Subcollections**: Toggle to include raindrops from subcollections
  - When enabled, fetches raindrops from all nested collections, for all selected filters
  - Maintains proper folder hierarchy in your vault

- **Filter by Tags**: Enter tags to filter by (comma-separated, case sensitive)
  - Example: `research, important, to-read`

- **Tag Match Type**: Choose between:
  - **All**: Raindrops must have all specified tags (AND logic)
  - **Any**: Raindrops can have any of the specified tags (OR logic)

- **Filter by Type**: Select a specific content type
  - Options: All, Link, Article, Image, Video, Document, Audio
  - Useful for importing only specific types of content

  **Note**: If NO filters are selected, all raindrops will be fetched. For large collections, this can take a while... The plugin will show a progress bar and rate limit warnings, if any are encountered. This is normal behavior and the plugin will continue to fetch raindrops until all are fetched. The length of time it takes to fetch all raindrops depends on the number of raindrops in your collection, the size of each raindrop's content, and your internet connection speed.

### Import Options

- **Use Raindrop Title for File Name**: Toggle to use raindrop titles as filenames
  - When enabled: Uses the title (via template) for filenames
  - When disabled: Uses the raindrop ID for filenames (avoids conflicts)

- **Append Tags to Note Frontmatter**: Add custom tags to all imported notes
  - Example: `#imported/raindrop, #web-content`
  - These tags are added in addition to any tags from Raindrop.io

- **Fetch Only New Items**: Only import raindrops that don't exist in the target folder
  - Useful for incremental imports without duplicates

- **Update Existing Notes**: Update notes if the source raindrop has changed
  - Compares the `last_update` timestamp from Raindrop.io
  - Only updates if the raindrop is newer than the existing note

### Template Options

If you have enabled the [template system](template-system.md), you'll see additional options:

- **Select Template**: Choose which template to use for generating notes
  - Options include "Auto (based on content type)" and any custom templates you've created
  - This selection overrides the content-type specific templates for this import session

## Fetching Process

After configuring your options:

1. Click the **Fetch Raindrops** button
2. A loading notice will appear showing progress
3. The plugin will:
   - Fetch collections data from Raindrop.io
   - Fetch raindrops based on your filters
   - Create the necessary folder structure in your vault
   - Generate notes for each raindrop
4. When complete, a notice will show the number of notes created, updated, or skipped

## Understanding the Results

After fetching, you'll see a summary of the operation:

- **Created**: New notes that were created
- **Updated**: Existing notes that were updated
- **Skipped**: Raindrops that were skipped (due to "Fetch Only New" or no changes)
- **Errors**: Any errors that occurred during the process

## Folder Organization

The plugin organizes your notes based on your Raindrop.io collection hierarchy:

1. **Root Folder**: The vault path you specified
2. **Collection Folders**: Subfolders created for each collection
3. **Nested Collections**: Maintains the same hierarchy as in Raindrop.io

For example, if you have:

- A collection "Research" with a subcollection "AI"
- And you set your vault path to "Raindrops"

The resulting structure will be:

```
Raindrops/
├── Research/
│   └── AI/
│       ├── Article1.md
│       └── Article2.md
└── Other collections...
```

## Advanced Usage

### Rate Limiting

The plugin includes smart rate limiting to avoid hitting Raindrop.io API limits:

- Limits requests to 60 per minute (conservative approach)
- Automatically waits when rate limits are reached
- Shows notifications during rate limit delays
- Retries failed requests with exponential backoff

### Working with Large Collections

When working with large collections:

1. **Use Specific Filters**: Target specific collections or tags
2. **Incremental Imports**: Use "Fetch Only New" to add items gradually

## Next Steps

- Learn about [note structure and the template system](template-system.md)
- Check the [troubleshooting guide](troubleshooting.md) if you encounter issues
- Explore [configuration options](configuration.md) to customize the plugin
