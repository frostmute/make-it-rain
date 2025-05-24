# Configuration Guide

This guide covers all the configuration options available in the Make It Rain plugin.

## Table of Contents

- [Accessing the Settings](#accessing-the-settings)
- [API Configuration](#api-configuration)
- [General Settings](#general-settings)
- [Template System](#template-system)
- [Configuration Tips](#configuration-tips)
- [Advanced Configuration](#advanced-configuration)
- [Next Steps](#next-steps)

## Accessing the Settings

1. Open Obsidian and navigate to **Settings** (gear icon in the bottom-left corner)
2. Go to **Community plugins**
3. Find "Make It Rain" in your list of installed plugins
4. Click the **Settings** button

## API Configuration

### Raindrop.io API Token

This is the most important setting required for the plugin to function.

- **Setting**: Raindrop.io API Token
- **Description**: Your personal access token from Raindrop.io
- **How to get it**: See the [Installation Guide](installation.md#getting-a-raindropio-api-token)
- **Verification**: Use the "Verify Token" button to test if your token is valid

## General Settings

### Default Raindrop Location

- **Setting**: Default Raindrop Location
- **Description**: The default folder where your Raindrop bookmarks will be saved
- **Format**: Path relative to your vault root (e.g., "Raindrops" or "References/Web")
- **Note**: You can override this setting every time you fetch raindrops, giving you the flexibility to save them in different locations and keep them synchronized (or not) separately from other collections.

### Filename Template

- **Setting**: Filename Template
- **Description**: Determines how filenames are generated for your notes
- **Default**: `{{title}}`
- **Variables**: You can use any variable available in the [template system](template-system.md#available-variables)
- **Example**: `{{created:YYYY-MM-DD}}-{{title}}` would create files like "2025-05-16-Article Title.md"
- **Note**: During the fetch process, a linting process will be performed to ensure that the filename is formatted correctly and does not contain any invalid characters, using the default Obsidian filename linting rules. This means that any invalid characters will be removed, changing the filename if necessary.

### Show Ribbon Icon

- **Setting**: Show Ribbon Icon
- **Description**: Toggles visibility of the Make It Rain icon in the Obsidian ribbon (left sidebar)
- **Default**: Enabled
- **Note**: Even when disabled, you can still access the plugin via the Command Palette

### Banner Field Name

- **Setting**: Banner Field Name
- **Description**: Customizes the frontmatter field name used for the banner image
- **Default**: `banner`
- **Usage**: Some Obsidian themes and plugins look for specific banner/image field names in frontmatter. If you use a different theme or plugin that expects a different field name, you can customize it here. By default this field is populated with the cover image URL from Raindrop.io.

## Template System

The template system allows you to customize how your Raindrop bookmarks are formatted in Obsidian notes.

### Enable Template System

- **Setting**: Enable Template System
- **Description**: Toggles the template system on/off
- **Default**: Disabled (for backward compatibility)

### Default Template

When the template system is enabled, you'll see a text editor for customizing the default template.

For detailed information on the template system, including syntax, available variables, and examples, see the [Template System documentation](template-system.md).

### Content Type Templates

You can create specific templates for different types of content:

- Link templates
- Article templates
- Image templates
- Video templates
- Document templates
- Audio templates

Each content type can have its own custom template, or fall back to the default template if none is specified.

## Configuration Tips

- **API Token Security**: Your API token gives access to your Raindrop.io account. Never share it with others.
- **Folder Structure**: Choose a default vault location that fits your knowledge management system.
- **Filename Conflicts**: If you encounter filename conflicts, consider using unique identifiers in your filename template, such as `{{id}}-{{title}}`.
- **Template Testing**: After creating custom templates, test them with a small batch of raindrops before importing your entire collection.

## Advanced Configuration

For advanced users who want to modify the plugin beyond the provided settings, you can:

1. Access the plugin's data file at `.obsidian/plugins/make-it-rain/data.json` in your vault
2. Edit the JSON configuration directly (make a backup first!)
3. Restart Obsidian for changes to take effect

## Next Steps

After configuring the plugin:

1. Learn how to [use the plugin](usage.md) to fetch your bookmarks
2. Understand the [note structure and template system](template-system.md)
3. Check the [troubleshooting guide](troubleshooting.md) if you encounter issues
