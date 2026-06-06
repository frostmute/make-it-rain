# Frequently Asked Questions

This document answers common questions about the Make It Rain plugin.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Templates](#templates)
- [Troubleshooting](#troubleshooting)
- [Advanced Topics](#advanced-topics)

## Installation

### How do I install the plugin?

1. Open Obsidian Settings
2. Go to Community Plugins
3. Search for "Make It Rain"
4. Click Install
5. Enable the plugin

### Is the plugin available in the Community Plugins browser?

Yes, the plugin is available in the Obsidian Community Plugins browser.

### Do I need a Raindrop.io account?

Yes, you need a Raindrop.io account to use the plugin. You can create one at [raindrop.io](https://raindrop.io).

### How do I get a Raindrop.io API token?

1. Go to [Raindrop.io Apps settings](https://app.raindrop.io/settings/integrations)
2. Click "+ Create new app"
3. Give it a name (e.g., "MakeItRain")
4. Click the app, then "Create test token"
5. Copy the token to the plugin settings

## Configuration

### Where are the plugin settings?

1. Open Obsidian Settings
2. Go to Community Plugins
3. Find "Make It Rain"
4. Click the gear icon

### What settings are available?

- API Token
- Default Vault Location
- File Name Template
- Ribbon Icon Visibility
- Banner Field Name
- Template Settings

### How do I configure the default vault location?

1. Open plugin settings
2. Enter the folder path in "Default Vault Location"
3. Use forward slashes (/) for paths
4. Leave blank for vault root

### Can I customize the file naming?

Yes, you can customize file names using templates with placeholders:

- `{{title}}`: Bookmark title
- `{{id}}`: Raindrop ID
- `{{collectionTitle}}`: Collection name
- `{{date}}`: Creation date

## Usage

### How do I import bookmarks?

1. Click the Raindrop icon in the ribbon
2. Or use Command Palette: "Fetch Raindrops"
3. Choose your import options
4. Click "Fetch Raindrops"

### Can I filter what I import?

Yes, you can filter by:

- Collections (ID or name)
- Tags (AND/OR logic)
- Content types
- Date ranges

### How do I update existing notes?

1. Open the import modal
2. Enable "Update existing notes"
3. Choose your filters
4. Click "Fetch Raindrops"

### Can I import highlights?

Yes, highlights are automatically imported with their notes.

## Templates

### What is the template system?

The template system allows you to customize how your notes are formatted using Handlebars-like syntax.

### How do I create a custom template?

1. Open plugin settings
2. Go to Templates tab
3. Click "Add Template"
4. Enter name and content
5. Save changes

### What variables can I use in templates?

- `title`: Bookmark title
- `url`: Source URL
- `created`: Creation date
- `updated`: Last update date
- `type`: Content type
- `cover`: Cover image URL
- `excerpt`: Webpage excerpt
- `note`: Your note
- `tags`: Array of tags
- `highlights`: Array of highlights
- `collection`: Collection info

### Are there built-in helpers?

Yes, including:

- Date formatting
- Text manipulation
- Array operations
- Conditional checks
- Comparison helpers

## Troubleshooting

### The plugin isn't working

1. Check your API token
2. Verify Raindrop.io connection
3. Check the console for errors
4. Restart Obsidian

### Import is slow

1. Check your internet connection
2. Reduce batch size
3. Use more specific filters
4. Check rate limits

### Notes aren't formatted correctly

1. Check your template
2. Verify variable names
3. Check helper syntax
4. Validate template

### API errors

1. Check token validity
2. Verify permissions
3. Check rate limits
4. Try again later

## Advanced Topics

### Can I automate imports?

Yes, you can:

- Use the API directly
- Create custom scripts
- Use other plugins
- Set up scheduled tasks

### How do I handle large collections?

1. Use filters
2. Import in batches
3. Use update mode
4. Monitor progress

### Can I customize the note structure?

Yes, using:

- Custom templates
- Helper functions
- Conditional blocks
- Custom formatting

### How do I backup my settings?

1. Export settings
2. Save templates
3. Backup vault
4. Version control

### Can I use multiple templates?

Yes, you can have:

- Default template
- Type-specific templates
- Custom templates
- Collection templates

### How do I handle special characters?

1. Use sanitization
2. Check encoding
3. Use proper escaping
4. Test output

### Can I integrate with other plugins?

Yes, the plugin can work with:

- Templater
- Dataview
- Calendar
- Other plugins

### How do I report issues?

1. Check existing issues
2. Create new issue
3. Include details
4. Provide logs

### Can I contribute?

Yes! You can:

- Report bugs
- Suggest features
- Improve documentation
- Submit code

### Where can I get help?

- GitHub Issues
- Discord Community
- Documentation
- Community Forums
