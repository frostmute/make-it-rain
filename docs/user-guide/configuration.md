# Configuration Guide

This guide covers all the configuration options available in the Make It Rain plugin.

## Accessing the Settings

1. Open Obsidian and navigate to **Settings** (gear icon in the bottom-left corner)
2. Go to **Community plugins**
3. Find "Make It Rain" in your list of installed plugins
4. Click the **Settings** button

<!-- TODO: Need a v1.7.1 screenshot for the Settings page (stacked inputs, help icons, reset buttons). Please upload it and update the reference here. -->

## API Configuration

### Raindrop.io API Token

This is the most important setting required for the plugin to function.

- **Setting**: Raindrop.io API Token
- **Description**: Your personal access token from Raindrop.io
- **How to get it**: See the [Installation Guide](installation.md#getting-a-raindropio-api-token)
- **Verification**: Use the "Verify Token" button to test if your token is valid
- **Help**: A `(?)` help icon next to this setting in the plugin provides a direct link to this documentation section for convenience.

## General Settings

### Default vault save location

- **Setting**: Default vault save location
- **Description**: The default folder where your raindrop bookmarks will be saved
- **Format**: Path relative to your vault root (e.g., "Raindrops" or "References/Web")
- **Note**: You can override this setting every time you fetch raindrops.

### Filename template

- **Setting**: Filename template
- **Description**: Determines how filenames are generated for your notes
- **Default**: `{{title}}`
- **Variables**: You can use any variable available in the [template system](template-system.md#available-variables)
- **Example**: `{{created:YYYY-MM-DD}}-{{title}}` would create files like "2025-05-16-Article Title.md"

### Download files locally

- **Setting**: Download files locally
- **Description**: If a raindrop is a document, image, video, or audio file, automatically download the raw file directly into your vault.
- **Default**: Disabled

### Create folder notes

- **Setting**: Create folder notes
- **Description**: Automatically generate an index note matching the name of each collection folder, listing its children.
- **Default**: Disabled

### Show ribbon icon

- **Setting**: Show ribbon icon
- **Description**: Toggles visibility of the Make It Rain icon in the Obsidian ribbon (left sidebar)
- **Default**: Enabled

### Banner field name

- **Setting**: Banner field name
- **Description**: Customizes the frontmatter field name used for the banner image
- **Default**: `banner`

## Template System

The template system allows you to customize how your raindrop bookmarks are formatted in Obsidian notes.

### Enable template system

- **Setting**: Enable template system
- **Description**: Toggles the template system on/off.
- **Default**: Enabled

### Default template

When the template system is enabled, you'll see a text editor for customizing the default template.

### Content-type templates

You can create specific templates for different types of content.

- Link templates
- Article templates
- Image templates
- Video templates
- Document templates
- Audio templates
- Book templates

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
