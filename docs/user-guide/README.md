# User Guide

Welcome to the Make It Rain user guide! This documentation will help you get the most out of the plugin.

## Getting Started

New to Make It Rain? Start here:

1. **[Installation](installation.md)** - Install the plugin and set up your API token
2. **[Configuration](configuration.md)** - Configure settings to match your workflow
3. **[Usage](usage.md)** - Learn how to fetch and organize your bookmarks

## Core Documentation

### Setup & Configuration

- **[Installation](installation.md)** - Step-by-step installation guide
  - Installing from Community Plugins
  - Manual installation
  - Getting your Raindrop.io API token
  - Initial setup

- **[Configuration](configuration.md)** - Plugin settings and customization
  - API token configuration
  - Default folder settings
  - Filename templates
  - Banner field customization
  - Template system settings

### Using the Plugin

- **[Usage](usage.md)** - How to import your bookmarks
  - Fetching raindrops (bulk import)
  - Quick import by URL/ID
  - Filtering options
  - Collection selection
  - Tag filtering
  - Content type filtering

- **[Collections](collections.md)** - Working with collections
  - Collection hierarchy
  - Filtering by collection
  - Folder structure replication

- **[Tags](tags.md)** - Managing tags
  - Tag filtering (AND/OR logic)
  - Appending custom tags
  - Tag organization

### Customization

- **[Note Structure](note-structure.md)** - Understanding note format
  - YAML frontmatter
  - Note sections
  - Default structure
  - Metadata fields

- **[Template System](template-system.md)** - Customize your notes
  - Template syntax
  - Available variables
  - Content-type specific templates
  - Custom formatting
  - Template helpers

- **[Template Gallery](template-gallery.md)** - Example templates
  - Pre-built templates
  - Community examples
  - Use case scenarios

### Help & Support

- **[Troubleshooting](troubleshooting.md)** - Solutions to common issues
  - API token errors
  - Import problems
  - Template issues
  - General troubleshooting

- **[FAQ](faq.md)** - Frequently Asked Questions
  - Common questions
  - Quick answers
  - Tips and tricks

- **[Known Issues](known-issues.md)** - Current limitations
  - Known bugs
  - Workarounds
  - Planned fixes

## Quick Reference

### Common Tasks

| I want to... | See... |
|-------------|--------|
| Install the plugin | [Installation Guide](installation.md) |
| Set up my API token | [Installation - API Token](installation.md#getting-your-raindrop-io-api-token) |
| Import all my bookmarks | [Usage - Fetch Raindrops](usage.md#fetch-raindrops) |
| Import a specific bookmark | [Usage - Quick Import](usage.md#quick-import) |
| Customize note format | [Template System](template-system.md) |
| Filter by collection | [Collections Guide](collections.md) |
| Filter by tags | [Tags Guide](tags.md) |
| Fix import errors | [Troubleshooting](troubleshooting.md) |

### Workflow Examples

**First Time Setup:**
1. [Install the plugin](installation.md)
2. [Configure your API token](configuration.md#api-token)
3. [Set your default folder](configuration.md#default-vault-location)
4. [Do a test import](usage.md)

**Daily Workflow:**
1. Add bookmarks to Raindrop.io throughout the day
2. Use "Fetch Raindrops" to import new items
3. Organize in your Obsidian vault

**Advanced Customization:**
1. [Design custom templates](template-system.md)
2. [Set up content-type specific templates](template-system.md#content-type-templates)
3. [Test with a small batch](usage.md)
4. [Import your full collection](usage.md)

## Features Overview

### Import Options

- **Bulk Import**: Fetch multiple bookmarks with filtering
- **Quick Import**: Import single bookmarks by URL or ID
- **Selective Sync**: Import only new items or update existing
- **Filtered Import**: By collection, tags, or content type

### Organization

- **Automatic Folders**: Replicates your Raindrop collection hierarchy
- **Rich Metadata**: YAML frontmatter with comprehensive details
- **Smart Filenames**: Customizable filename templates
- **Tag Integration**: Automatic tag import with custom additions

### Customization

- **Template System**: Full control over note structure
- **Content-Type Templates**: Different formats for different content
- **Banner Images**: Display cover images in your notes
- **Flexible Formatting**: Handlebars-based template syntax

## Getting Help

If you can't find what you're looking for:

1. Check the [FAQ](faq.md) for quick answers
2. Review [Troubleshooting](troubleshooting.md) for common issues
3. Check [Known Issues](known-issues.md) for current limitations
4. Visit the [GitHub Discussions](https://github.com/frostmute/make-it-rain/discussions)
5. Report bugs via [GitHub Issues](https://github.com/frostmute/make-it-rain/issues)

## Additional Resources

### For Developers

Looking to contribute or understand the plugin internals?
- [Developer Guide](../developer-guide/index.md)
- [API Reference](../developer-guide/api-reference.md)
- [Testing Guide](../developer-guide/testing-guide.md)

### Meta Documentation

- [Troubleshooting Common Issues](troubleshooting.md)
- [Release Notes](../release-notes/)

## Contributing to Documentation

Found an error or want to improve the docs?

1. Documentation source is on [GitHub](https://github.com/frostmute/make-it-rain)
2. Submit corrections via pull requests
3. Suggest improvements in discussions

---

**Ready to get started?** Head to the [Installation Guide](installation.md)!