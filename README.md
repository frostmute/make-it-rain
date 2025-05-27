![Make It Rain Hero](https://github.com/frostmute/make-it-rain/blob/main/assets/1748151599078.webp)

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

### v1.7.1 (2024-05-27)
- **Enhanced Fetch Modal & Collection Selection**: Easily select collections from a dynamic, filterable list populated from your Raindrop.io account, in addition to manual ID/name entry.
- **Improved Template Editing**: Reset your main and content-type specific templates to their defaults with new "Reset to Default" buttons in the settings.
- **Better UI Layout**: Input fields in modals and template editing areas are now stacked below their descriptions for more space and better readability.
- **Contextual Help Links**: Look for new `(?)` help icons next to complex settings, linking directly to documentation.
- **Quick Import Enhancements**: The "Quick Import Raindrop by URL/ID" command now more reliably parses item IDs and provides clearer instructions.
- **CI Build Fix**: Resolved a build failure related to ignored scripts.

### v1.7.0 (2025-05-26)

- **All-New Template System**: Major new feature! Gain complete control over note creation with a powerful and flexible template system.
    - Includes a default template and pre-filled, customizable templates for each Raindrop type (Link, Article, Image, Video, Document, Audio).
    - Configure templates via Settings: enable/disable the system, edit the default, and manage content-type specific templates with individual toggles.
    - Override global template settings per-fetch using new modal options.
- **Pre-calculated Template Variables**: Added `formattedCreatedDate`, `formattedUpdatedDate`, `renderedType`, `domain`, `formattedTags` for easier template customization.
- **Default Templates Updated**: All built-in templates now use the new variables, a flattened collection data structure, and consistent field names.
- **Improved Fallback Note Generation**: Better formatting for notes created when the template system is disabled.
- **Fixes**: Addressed type filtering in the modal, ensured correct replication of collection hierarchy as folders, resolved a frontmatter rendering issue, and fixed template helper rendering and fallback note body formatting.

For a complete list of changes, see the [CHANGELOG.md](CHANGELOG.md).

---

# Raindrop.io Import/Sync for Obsidian

A LIGHTWEIGHT and BLAZING FAST plugin that enables you to fetch bookmarks, highlights, notes,
and other content types from your [Raindrop.io](https://raindrop.io) collections into your
[Obsidian](https://obsidian.md/) vault with maximum flexibility. Seamlessly integrate your
web clippings, articles, and references into your Obsidian knowledge base!

I will be continually developing this plugin to further streamline user experience and
extend functionality. Please do not hesitate to leave feedback, submit feature requests, or
ask for assistance with anything; I intend to address every inquiry to the best of my
abilities. I am new to public development and have never shared anything I've made with
anyone else, so if I'm overlooking something, or have made an error in etiquette, please
let me know. I value and appreciate all forms of feedback and it helps immensely in my
learning process.

# Features

Turn your Obsidian vault into a true extension of your digital brain with Make It Rain, the ultimate tool for integrating your Raindrop.io bookmarks. Here's why it's a game-changer for your knowledge management:

- **✨ All-New Template System (v1.7.0): Take Full Control!**
    - **Tailor-Made Notes:** Don't just import bookmarks, transform them! Craft the perfect note structure for every type of content (articles, videos, images, and more).
    - **Pre-filled & Customizable:** Get started instantly with smart default templates for all Raindrop types, or build your own from scratch.
    - **Easy Configuration:** A dedicated settings panel lets you enable/disable the system, tweak the global default template, manage templates for specific content types with simple toggles, and **reset templates to their defaults.**
    - **On-the-Fly Adjustments:** Need to use the default template for a specific import? Override your saved settings directly from the fetch modal.
    - **Smart Variables:** Utilize pre-calculated variables like `formattedCreatedDate`, `domain`, and `formattedTags` for effortless and consistent note formatting.

- **🎯 Powerful & Granular Importing:**
    - **Flexible Fetching:** Easily import your Raindrops via the Obsidian Command Palette using the main "Fetch Raindrops" command for bulk imports or the "Quick Import Raindrop by URL/ID" command for single items.
    - **Precision Filtering (Main Fetch):**
        - By **Collection:** Specify multiple Raindrop.io Collection IDs or Names. **New in 1.7.1: Select collections from a dynamic, filterable list populated directly from your Raindrop.io account!**
        - By **Tags:** Use AND/OR logic to find items with all or any of your specified tags. Contextual help `(?)` available for match type.
        - By **Content Type:** Import only links, articles, images, videos, documents, or audio files.
    - **Selective Sync:** Choose to fetch only new items since your last import, or update existing notes if the Raindrop item has changed.

- **🗂️ Seamless Obsidian Integration:**
    - **Automatic Folder Structure:** Replicates your Raindrop.io collection hierarchy within your Obsidian vault.
    - **Rich YAML Frontmatter:** Every note is enriched with comprehensive metadata: Raindrop ID, title, source URL, type, creation/update dates, full collection path, tags, and a customizable banner image field.
    - **Intelligent Filenaming:** Use the Raindrop title (customizable with a template: `{{title}}`, `{{id}}`, `{{collectionTitle}}`, `{{date}}`) or the unique Raindrop ID for filenames.
    - **Tag Augmentation:** Automatically append your own custom tags to every imported note.

- **⚙️ Robust & Reliable:**
    - **Smart API Handling:** Built-in rate limiting (120 requests/minute) and automatic retries ensure smooth and reliable fetching, even with large libraries.
    - **Safe by Default:** Prevents accidental overwriting of existing notes (with options to update).
    - **Detailed Logging:** Clear console logs for easy troubleshooting if issues arise.
    - **Automated CI Checks:** Ensures build stability with every change.

- **🔧 Highly Configurable:**
    - Securely store your Raindrop.io API token (Contextual help `(?)` available).
    - Set a default vault location for new notes (overrideable per-fetch).
    - Customize filename templates (Contextual help `(?)` available), ribbon icon visibility, and the frontmatter field name for banner images.
    - **Enhanced Template Management:** Easily reset default and content-type specific templates to their original settings.
    - **Improved UI Layout:** Settings and modal inputs are now stacked for better readability.

Stop context-switching and start integrating! Make It Rain brings your valuable web clippings, research, and inspiration directly into your Obsidian workspace, formatted exactly how you want them.

## In the pipe for future releases

- **Enhanced Testing & Reliability**: Comprehensive unit tests for core utility functions.
- ~~Better Documentation: More detailed documentation and usage examples for both users and contributors.~~
- ~~Fix YAML/JSON render issues: Improved handling of frontmatter templates.~~
- ~~Easy Template System: Customizable templates with curly bracket syntax, defined per raindrop type.~~
- Possible Integration with existing Obsidian or Templater template functions.
- **UI Improvements**: Selectable raindrop collections by name or ID from multi-select or drop-down in the import modal.
- **Streamlined versioning workflow**: Bi-directional synchronization with Raindrop.
- **Enhanced highlight handling**: Improved highlight/raindrop-specific note handling and UI within Obsidian notes.
- **Extended content scraping**: Options similar to Raindrop's archive link content copy functionality.
- **Documentation**: Demo videos, tutorials, and use-case examples of plugin workflow and features.
- **Quick Import feature**: Import specific raindrops by ID/Link to specific vault locations.
- **Undo functionality**: Recovery options when operations don't go as planned.
- **Saved fetch settings**: Preserve or save frequently used fetch configurations.
- ~~Performance optimization: Further API/rate limiting improvements and better handling of large Raindrop collections.~~

# Installation

## Manual Installation

(Only option at the moment; you are welcome to inspect the source if you have any
doubts about safety. After I get the plugin's features mostly intact and fully
functioning I will submit a request for inclusion in the Community Plugin Repo.)

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest
   [RELEASE](https://github.com/frostmute/make-it-rain/releases/latest) on GitHub.
2. In your Obsidian vault, navigate to the `.obsidian/plugins/` directory.
3. Create a new folder named `make-it-rain`.
4. Copy the downloaded `main.js`, `manifest.json`, and `styles.css` into this new folder.
5. Restart Obsidian.
6. Go to `Settings` -> `Community Plugins`, find "Make It Rain", and enable it.
7. Configure the required API Token in the plugin settings (see Configuration section).

## Community Plugins Store

*(Once accepted)* This plugin aims to be available directly in the Obsidian
Community Plugins store.

# Configuration

Before the first use, configure the plugin via Obsidian's settings panel
(`Settings` -> `Community Plugins` -> `Make It Rain` -> `Options` (cog icon)).
Contextual help links `(?)` are available for some settings, guiding you directly to the relevant documentation.

1. **Raindrop.io API Token (Required):**
    - You must provide a "Test Token" from Raindrop.io. (Help `(?)` link available in settings)
    - To generate one:
        1. Go to your [Raindrop.io Apps settings page]
           (https://app.raindrop.io/settings/integrations).
        2. Click "+ Create new app".
        3. Give it a name (e.g., "MakeItRain").
        4. Click the newly created app, then click "Create test token".
    - Copy this token and paste it into the plugin's API Token settings field.
      A **"Verify Token"** button is available to test your connection.
2. **Default Vault Location for Notes:**
    - Specify the default folder path within your vault where imported notes should be
      saved (e.g., `Imports/Raindrops`).
    - If left blank, notes will be saved in the root of your vault.
    - This location can be overridden during each fetch operation, providing maximum
      flexibility for many different use cases.
3. **File Name Template:**
    - Define the filename structure when the "Use Raindrop Title for File Name" option
      is enabled in the fetch modal. (Help `(?)` link available in settings)
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
    - Customize the frontmatter field name used for the banner image (default is `banner`).
      Useful if you use plugins that expect a different field name.

# Usage


Make It Rain offers two primary commands to import your Raindrops:

### 1. Fetch Raindrops (Filtered Bulk Import)

1. Open the Obsidian **Command Palette** (`Ctrl+P` or `Cmd+P`).
2. Search for and select the command: **"Fetch Raindrops"**.
3. An **options modal** will appear, allowing you to configure the current fetch operation:
    - **Fetch Criteria:**
        - **Vault Folder (Optional):** Override the default save location for this
          specific fetch.
        - **Collections:** Enter comma-separated Raindrop.io Collection *IDs or Names*, or **select from the dynamic list of your collections** populated directly from your Raindrop.io account.
        - **Filter by Tags:** Enter comma-separated Raindrop.io tag names. Choose your
          tag matching mode (AND/OR). A help `(?)` link is available for "Tag Match Type".
        - **Include Subcollections:** If filtering by Collections, toggle this on to also
          fetch from any collections nested within the specified ones.
        - **Filter by Type:** Select the type of raindrops to fetch (All Types, Links,
          Articles, Images, Videos, Documents, Audio).
    - **Note Options:**
        - **Append Tags to Note Frontmatter:** Enter comma-separated tags to add to the
          `tags` list in the YAML frontmatter.
        - **Use Raindrop Title for File Name:** Toggle on (default) to use the File Name
          Template. If off, the Raindrop bookmark ID will be used as the filename.
        - **Fetch only new items:** If enabled, existing notes will be skipped.
        - **Update existing notes:** If enabled, existing notes will be updated if the
          source raindrop has changed (based on `last_update`). This option disables
          "Fetch only new items".
4. Click the **"Fetch Raindrops"** button in the modal.
5. The plugin will display notices for progress and a final summary. Check the Obsidian
   Developer Console for detailed logs.

### 2. Quick Import Raindrop by URL/ID (Single Item Import)

New in v1.7.1 (and improved!), this command allows you to quickly import a single Raindrop item if you know its URL or unique numeric ID.

1. Open the Obsidian **Command Palette**.
2. Search for and select the command: **"Quick Import Raindrop by URL/ID"**.
3. A modal will appear:
    - **Raindrop URL or ID:** Paste the full URL of the Raindrop item (often found in your browser's address bar when viewing/editing the item in the Raindrop.io app, e.g., `https://app.raindrop.io/my/collection/item/123456789/edit`) or just its unique numeric ID (e.g., `123456789`). The modal provides specific instructions on how to find this.
    - **Vault Save Location (Optional):** Override the default save folder for this specific import.
    - **Append Tags to Notes (Optional):** Add specific tags to this imported note.
4. Click **"Fetch & Create Note"**.

This is ideal for quickly bringing in a specific item without going through the full filtered fetch.

# Created Note Structure

![Make It Rain Imported Raindrop Example](https://github.com/frostmute/make-it-rain/blob/main/assets/Screenshot_20250526_013205.png)

Each successfully imported Raindrop bookmark generates a new Markdown note. When the **Template System** is enabled (default), the structure is defined by the active template. The built-in default template produces a note that looks like this example:

```markdown
---

title: "Example Bookmark Title"
source: https://example.com/article
type: article
created: 2023-10-27T10:30:00Z
lastupdate: 2023-10-28T12:00:00Z
id: 123456789
collectionId: 98765
collectionTitle: "My Research"
collectionPath: "My Research/Tech Articles"
collectionParentId: 12345
tags:
  - web-clipping
  - important-read
banner: https://example.com/cover-image.jpg

---

![Example Bookmark Title](https://example.com/cover-image.jpg)

# Example Bookmark Title

## Description
This is a brief summary or excerpt of the web page. It might contain a few sentences describing the content.

## Notes
This is a note I added to my Raindrop bookmark. It can be multi-line.
Another line of my note.

## Highlights
- This is the first highlighted text from the article.
  *Note:* A small comment on the first highlight.
- And here is a second piece of highlighted text.

---
## Details
- **Type**: Article
- **Domain**: example.com
- **Created**: Oct 27, 2023
- **Updated**: Oct 28, 2023
- **Tags**: web-clipping, important-read
```

**Key Frontmatter Fields (using Default Template):**

- `id`: Unique Raindrop.io ID (e.g., `12345678`). **Required for updates.**
- `title`: Title of the Raindrop (e.g., `"My Awesome Bookmark"`).
- `source`: The original URL of the bookmark (e.g., `https://example.com`).
- `type`: The raw Raindrop type (e.g., `article`, `link`).
- `created`: Creation timestamp in ISO 8601 format (e.g., `2023-10-27T14:30:00Z`).
- `lastupdate`: Last update timestamp in ISO 8601 format (e.g., `2023-10-28T10:20:00Z`). **Required for updates.**
- `collectionId`: ID of the Raindrop's collection (e.g., `98765`).
- `collectionTitle`: Title of the Raindrop's collection (e.g., `"My Research"`).
- `collectionPath`: Full path of the collection (e.g., `"Archive/Tech Articles"`).
- `collectionParentId` (optional): ID of the parent collection if it exists.
- `tags`: A list of tags associated with the Raindrop (e.g., `tags:
  - obsidian
  - productivity`).
- `{{bannerFieldName}}`: (Optional) The field name for the banner image (from
  settings, defaults to `banner`), with the cover image URL (e.g.,
  `banner: https://example.com/image.jpg`).

If the **Template System is disabled**, a more basic fallback structure is used.
See [Note Structure Documentation](https://frostmute.github.io/make-it-rain/note-structure) for details on both.

# Documentation

Comprehensive documentation for the Make It Rain plugin is available on our **[GitHub Pages Site](https://frostmute.github.io/make-it-rain/)**.

This site includes:
- Detailed guides and tutorials
- Usage examples
- Information for developers interested in contributing
- API Reference for the Raindrop.io integration
- An overview of the codebase structure and architecture

In-code documentation is also available via JSDoc comments throughout the codebase,
particularly in the utility modules:

- `src/utils/fileUtils.ts`: Utilities for file operations
- `src/utils/apiUtils.ts`: Utilities for API interactions

## Troubleshooting

### "API token is not set" Error

Ensure you have correctly copied your Raindrop.io Test Token and pasted it into the plugin's settings.

### Check Console for Errors

For any issues, open the Developer Console (`Ctrl+Shift+I` or `Cmd+Option+I` ->
`Console` tab) for detailed error messages and plugin logs.

# Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

# License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
