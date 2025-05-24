# Make It Rain

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/frostmute/make-it-rain)](https://github.com/frostmute/make-it-rain/releases/latest)
![License](https://img.shields.io/github/license/frostmute/make-it-rain)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Z8Z7RYUWN)

Import your Raindrop.io bookmarks into your Obsidian vault with ease.

## Table of Contents

- [What's New](#whats-new)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Created Note Structure](#created-note-structure)
- [Documentation](#documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## What's New

### Improved (v1.6.0)

- **Major Code Refactoring**: Implemented functional programming patterns for better maintainability and performance.
- **Enhanced Modularity**: Separated code into dedicated utility modules for file operations and API interactions.
- **Improved Error Handling**: More robust error recovery and user feedback during API operations.
- **Better Rate Limiting**: Refined rate limiting strategy with more intelligent retry logic for API requests.
- **TypeScript Improvements**: Fixed type definitions and eliminated compiler warnings for more reliable operation.

### Fixed (v1.5.1)

- Fixed collection hierarchy to properly maintain nested folder structure when no filter options are selected.
- Improved rate limiting logic with more conservative limits and longer delays between retries.
- Added small delays between consecutive API calls to reduce rate limit issues.
- Added user-visible notices during rate limit waiting periods.
- Fixed JSON parsing issues with API responses.

For a complete list of changes, see the [CHANGELOG.md](CHANGELOG.md).

![Plugin Header Image](https://i.ibb.co/HTx7TnbN/makeitrain.png)

## Raindrop.io Import\Sync for Obsidian

A LIGHTWEIGHT and BLAZING FAST plugin that enables you to fetch bookmarks, highlights, notes, and other content types from your [Raindrop.io](https://raindrop.io) collections into your [Obsidian](https://obsidian.md/) vault with maximum flexibility. Seamlessly integrate your web clippings, articles, and references into your Obsidian knowledge base!

I will be continually developing this plugin to further streamline user expierience and extend functionality. Please do not hesitate to leave feedback, submit feature requests, or ask for assisstance with anything; I intend to adress every inquiry to the best of my abilities... I am new to public development and have never shared anything I've made with anyone else, so if I'm overlooking something, or have made an error in etiquette, please let me know. I value and appreciate all forms of feedback and it helps immensely in my learning process.

## Features

- **On-Demand Fetching:** Import Raindrops using a Command Palette action.
- **Flexible Filtering:** Control which bookmarks to fetch per session via an interactive modal:
  - Filter by specific Raindrop.io Collection IDs or Names (comma-separated). Leave blank to fetch from all collections (unless tags below are specified).
  - Filter by specific Raindrop.io Tags with two matching modes:
    - AND logic: Find items with ALL specified tags
    - OR logic: Find items with ANY of the specified tags
  - Optionally include items from subcollections when filtering by Collection ID or Name.
  - **New:** Filter by the type of raindrop (Link, Article, Image, Video, Document, Audio).
- **Reliable API Handling:**
  - Smart rate limiting (120 requests/minute)
  - Automatic retry on temporary failures
  - Detailed logging for troubleshooting
- **Comprehensive Note Generation:** Created notes include:
  - **YAML Frontmatter:** Includes Raindrop `id`, `title`, `description` (from Raindrop excerpt), `source` (original URL), `type`, `created`, `last_update`, collection details (`id`, `title`, `path`, `parent_id` if applicable), `tags` (combining Raindrop tags and any appended tags), and a customizable banner field (using the Raindrop cover image URL).
  - **Note Body:** Cover image (if available), H1 Title, H2 section for your Raindrop Note/Annotation, the Raindrop Excerpt (if not multiline and included in frontmatter), and a list of Highlights (including any notes on highlights).
- **Configurable Filenames:**
  - Choose between using the Raindrop title (processed via template) or the Raindrop ID for filenames.
  - Customize the filename format with placeholders: `{{title}}`, `{{id}}`, `{{collectionTitle}}`, `{{date}}`.
- **Tag Management:** Automatically append custom tags to the frontmatter of every imported note.
- **Safe Import:** Prevents overwriting by checking if a note with the target filename already exists. **New:** Added options to either skip existing files or update them based on Raindrop ID and `last_update` timestamp.
- **Handles Pagination:** Reliably fetches all matching bookmarks from Raindrop.io, respecting API rate limits.
- **Persistent Settings:** Configure and save your API key, default note save location, filename template, **ribbon icon visibility, and banner frontmatter field name**.

### In the pipe for future releases:

- **Enhanced Testing & Reliability**: Comprehensive unit tests for core utility functions.
- **Better Documentation**: More detailed documentation and usage examples for both users and contributors.
- **Fix YAML/JSON render issues**: Improved handling of frontmatter templates.
- **Easy Template System**: Customizable templates with curly bracket syntax, defined per raindrop type. Integration with existing Obsidian or Templater template functions.
- **UI Improvements**: Selectable raindrop collections by name or ID from multi-select or drop-down in the import modal.
- **Streamlined versioning workflow**: Bi-directional synchronization with Raindrop.
- **Enhanced highlight handling**: Improved highlight/raindrop-specific note handling and UI within Obsidian notes.
- **Extended content scraping**: Options similar to Raindrop's archive link content copy functionality.
- **Documentation**: Demo videos, tutorials, and use-case examples of plugin workflow and features.
- **Quick Import feature**: Import specific raindrops by ID/Link to specific vault locations.
- **Undo functionality**: Recovery options when operations don't go as planned.
- **Saved fetch settings**: Preserve or save frequently used fetch configurations.
- **Performance optimization**: Further API/rate limiting improvements and better handling of large Raindrop collections.

## Installation

<!-- Reminder: Update this link when releases are available -->
### Manual Installation
(Only option at the moment; you are welcome to inspect the source if you have any doubts about safety. After I get the plugin's features mostly intact and fully functioning I will submit a request for inclusion in the Community Plugin Repo.) 

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [RELEASE](https://github.com/frostmute/make-it-rain/releases/latest) on GitHub.
2. In your Obsidian vault, navigate to the `.obsidian/plugins/` directory.
3. Create a new folder named `make-it-rain`.
4. Copy the downloaded `main.js`, `manifest.json`, and `styles.css` into this new folder.
5. Restart Obsidian.
6. Go to `Settings` -> `Community Plugins`, find "Make It Rain", and enable it.
7. Configure the required API Token in the plugin settings (see Configuration section).

### Using BRAT

1. Install the [BRAT (Beta Reviewer's Auto-update Tester)](https://github.com/TfTHacker/obsidian42-brat) plugin from the Community Plugins browser in Obsidian.
2. Enable BRAT in Obsidian's settings.
3. In BRAT's settings, click "Add Beta plugin" and enter this GitHub repository URL: `https://github.com/frostmute/make-it-rain`
4. Choose an available pre-release version
5. Enable the "Make It Rain" plugin under `Settings` -> `Community Plugins`.
6. Configure the required API Token in the plugin settings.

### Community Plugins Store

*(Once accepted)* This plugin aims to be available directly in the Obsidian Community Plugins store.

## Configuration

![Settings Dialog](https://github.com/frostmute/make-it-rain/blob/main/makeitrain-settings-v150.png)

Before the first use, configure the plugin via Obsidian's settings panel (`Settings` -> `Community Plugins` -> `Make It Rain` -> `Options` (cog icon)).

1. **Raindrop.io API Token (Required):**
    - You must provide a "Test Token" from Raindrop.io.
    - To generate one:
        1. Go to your [Raindrop.io Apps settings page](https://app.raindrop.io/settings/integrations).
        2. Click "+ Create new app".
        3. Give it a name (e.g., "MakeItRain").
        4. Click the newly created app, then click "Create test token".
    - Copy this token and paste it into the plugin's API Token settings field. A **"Verify Token" button** is available to test your connection.
2. **Default Vault Location for Notes:**
    - Specify the default folder path within your vault where imported notes should be saved (e.g., `Imports/Raindrops`).
    - If left blank, notes will be saved in the root of your vault.
    - This location can be overridden during each fetch operation, providing maximum flexibility for many different use cases.
3. **File Name Template:**
    - Define the filename structure when the "Use Raindrop Title for File Name" option is enabled in the fetch modal.
    - Uses Handlebars-like syntax: `{{placeholder}}`.
    - Available placeholders:
        - `{{title}}`: The Raindrop bookmark title.
        - `{{id}}`: The unique Raindrop bookmark ID.
        - `{{collectionTitle}}`: The title of the collection the bookmark belongs to (if any).
        - `{{date}}`: The creation date of the bookmark (format: `YYYY-MM-DD`).
    - Default value: `{{title}}`
4. **Show Ribbon Icon:**
    - Toggle to show or hide the Make It Rain ribbon icon in the Obsidian sidebar.
5. **Banner Frontmatter Field Name:**
    - Customize the frontmatter field name used for the banner image (default is `banner`). Useful if you use plugins that expect a different field name.

## Usage

![Import Modal](https://github.com/frostmute/make-it-rain/blob/main/makeitrain-modal-v150.png)

1. Open the Obsidian **Command Palette** (`Ctrl+P` or `Cmd+P`).
2. Search for and select the command: **"Fetch Raindrops"**.
3. An **options modal** will appear, allowing you to configure the current fetch operation:
    - **Fetch Criteria:**
        - **Vault Folder (Optional):** Override the default save location for this specific fetch.
        - **Collections:** Enter comma-separated Raindrop.io Collection *IDs or Names* to fetch from specific collections.
        - **Filter by Tags:** Enter comma-separated Raindrop.io tag names. Choose your tag matching mode (AND/OR).
        - **Include Subcollections:** If filtering by Collections, toggle this on to also fetch from any collections nested within the specified ones.
        - **Filter by Type:** Select the type of raindrops to fetch (All Types, Links, Articles, Images, Videos, Documents, Audio).
    - **Note Options:**
        - **Append Tags to Note Frontmatter:** Enter comma-separated tags to add to the `tags` list in the YAML frontmatter.
        - **Use Raindrop Title for File Name:** Toggle on (default) to use the File Name Template. If off, the Raindrop bookmark ID will be used as the filename.
        - **Fetch only new items:** If enabled, existing notes will be skipped.
        - **Update existing notes:** If enabled, existing notes will be updated if the source raindrop has changed (based on `last_update`). This option disables "Fetch only new items".
4. Click the **"Fetch Raindrops"** button in the modal.
5. The plugin will display notices for progress and a final summary. Check the Obsidian Developer Console for detailed logs.

## Created Note Structure

![Imported Note Example](https://github.com/frostmute/make-it-rain/blob/main/makeitrain-imported-note.png)

Each successfully imported Raindrop bookmark generates a new Markdown note with the following structure. Placeholders like `<Raindrop Title>` indicate where Raindrop.io data will be inserted.

```markdown
---
id: <Raindrop ID>
title: "<Raindrop Title>"
description: "<Raindrop Excerpt (summary from the webpage)>" # Multiline excerpts are added as a YAML block
source: <Raindrop URL (link)>
type: <Raindrop Type, e.g., link, article>
created: <Raindrop Creation Date>
last_update: <Raindrop Last Update Date>
collection:
  id: <Raindrop Collection ID>
  title: "<Raindrop Collection Title>"
  path: "<Full Raindrop Collection Path relative to Raindrop root>" # e.g., "My Collections/Category/Subcategory"
  parent_id: <Raindrop Parent Collection ID (if not top level)>
tags:
  - <raindrop_tag_1_sanitized>
  - <raindrop_tag_2_sanitized>
  - <appended_tag_1_sanitized> # If you added tags via the modal
<banner_field_name>: <Raindrop Cover Image URL (if available)> # Configurable in settings (default: banner)
---

![<Sanitized Title or 'Cover Image'>](<Raindrop Cover Image URL (if available)>)

# <Raindrop Title>

## <Raindrop Note (your personal annotation, if any)>

<Raindrop Excerpt (summary from the webpage)> # Included here if not multiline (multiline goes in frontmatter description)

### Highlights
- Highlight text 1 (newlines are replaced with spaces)
  *Note:* Optional note for highlight 1 (newlines are replaced with spaces)
- Highlight text 2 (newlines are replaced with spaces)
  *Note:* Optional note for highlight 2 (newlines are replaced with spaces)

```

**Note on Tags:** Tags in the frontmatter are automatically sanitized for Obsidian compatibility: spaces are replaced with underscores (`_`), and special characters are removed.

## Documentation

Comprehensive documentation for the Make It Rain plugin is available in multiple formats:

- **[GitHub Wiki](https://github.com/frostmute/make-it-rain/wiki)**: Detailed guides, tutorials, and examples
- **[Developer Documentation](https://github.com/frostmute/make-it-rain/wiki/Developer-Guide)**: Information for developers interested in contributing to the project
- **[API Documentation](https://github.com/frostmute/make-it-rain/wiki/API-Reference)**: Documentation for the Raindrop.io API integration
- **[Code Documentation](https://github.com/frostmute/make-it-rain/wiki/Code-Structure)**: Overview of the codebase structure and architecture

In-code documentation is also available via JSDoc comments throughout the codebase, particularly in the utility modules:

- `src/utils/fileUtils.ts`: Utilities for file operations
- `src/utils/apiUtils.ts`: Utilities for API interactions

## Troubleshooting

### "API token is not set" Error

Ensure you have correctly copied your Raindrop.io Test Token and pasted it into the plugin's settings.

### Check Console for Errors

For any issues, open the Developer Console (`Ctrl+Shift+I` or `Cmd+Option+I` -> `Console` tab) for detailed error messages and plugin logs.

## Contributing

Contributions are welcome! Here's how you can help:

### Feedback and Feature Requests

- Open an [issue](https://github.com/frostmute/make-it-rain/issues) for bugs or feature requests
- Join the discussions in existing issues
- Share your use cases and suggestions

### Development

1. Clone this repository
2. Install dependencies: `npm install`
3. Build: `npm run build`
4. For development: `npm run dev`

### Testing

Before submitting a pull request:

1. Test your changes thoroughly
2. Update documentation as needed
3. Add your changes to CHANGELOG.md
4. Ensure code style consistency

### Pull Requests

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
