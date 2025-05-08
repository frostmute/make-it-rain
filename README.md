# Make It Rain 

![Plugin Header Image](https://i.ibb.co/HTx7TnbN/makeitrain.png) 

## Raindrop.io Importer for Obsidian

This plugin for [Obsidian](https://obsidian.md) allows you to fetch bookmarks from your [Raindrop.io](https://raindrop.io) account and create notes in your vault based on a customizable template. Bring your web clippings, articles, and references directly into your knowledge base!

## Features

* **Fetch on Demand:** Import Raindrops using a command palette action.
* **Flexible Filtering:** Choose which bookmarks to fetch per-session using the interactive modal:
    * Filter by specific Raindrop.io Collection IDs (comma-separated).
    * Filter by specific Raindrop.io Tags (comma-separated, matches items with ALL specified tags).
    * Optionally include items from subcollections when filtering by Collection ID.
* **Generated notes include:**
    * **YAML Frontmatter:** `title`, `description` (from Raindrop excerpt), `source` (original URL), `tags` (combining Raindrop tags and optionally appended tags), `banner` (using Raindrop cover image URL for plugins like Banner).
    * **Note Body:** Cover image (if available), H1 Title, H2 section for your Raindrop Note/Annotation, the Raindrop Excerpt, and a list of Highlights (including any notes on highlights).
* **Configurable Filenames:**
    * Choose whether to use the Raindrop title (processed via template) or the Raindrop ID for filenames.
    * Customize the filename format using a template with placeholders: `{{title}}`, `{{id}}`, `{{collectionTitle}}`, `{{date}}`.
* **Tag Management:** Automatically append custom tags to the frontmatter of every imported note.
* **Safe Import:** Checks if a note with the target filename already exists in the specified destination within your vault and skips it to prevent overwriting.
* **Handles Pagination:** Fetches all matching bookmarks from Raindrop.io, respecting API limits.
* **Persistent Settings:** Configure your API key, default save location, and filename template preferences.

## Installation

### Manual Installation

1.  Download the `main.js`, `manifest.json`, and `styles.css` files from the latest [Release](https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME/releases/latest) on GitHub.
2.  In your Obsidian vault, navigate to `.obsidian/plugins/`.
3.  Create a new folder named `make-it-rain`.
4.  Copy the downloaded `main.js`, `manifest.json`, and `styles.css` into this new folder.
5.  Restart Obsidian.
6.  Go to Settings -> Community Plugins, find "Make It Rain", and enable it.
7.  Configure the required API Token in the plugin settings.

### Using BRAT (Recommended for pre-release versions)

1.  Install the [BRAT (Beta Reviewer's Auto-update Tester)](https://github.com/TfTHacker/obsidian42-brat) plugin via the Community Plugins browser.
2.  Enable BRAT in Obsidian's settings.
3.  Go to BRAT's settings, click "Add Beta plugin", and enter the URL of this GitHub repository: `https://github.com/frostmute/make-it-rain`
4.  Enable the "Make It Rain" plugin in Settings -> Community Plugins.
5.  Configure the required API Token in the plugin settings.

### Community Plugins Store

*(Once accepted)* This plugin will hopefully be available directly in the Obsidian Community Plugins store soon.

## Configuration

Before first use, you need to configure the plugin via Obsidian's settings panel (Settings -> Community Plugins -> Make It Rain -> Options (cog icon)).

1.  **Raindrop.io API Token (Required):**
    * You must provide a "Test Token" from Raindrop.io.
    * Generate one by going to your [Raindrop.io Apps settings page](https://app.raindrop.io/settings/integrations), clicking "+ Create new app", giving it a name (e.g., "Obsidian Importer"), clicking the created app, and then clicking "Create test token".
    * Copy this token and paste it into the settings field.
2.  **Default Vault Location for Notes:**
    * Specify a default folder path within your vault where imported notes should be saved (e.g., `Imports/Raindrops`).
    * Leave this blank to save notes directly in the root of your vault.
    * This can be overridden each time you fetch using the modal.
3.  **File Name Template:**
    * Define the structure for filenames when the "Use Raindrop Title for File Name" option is enabled in the fetch modal.
    * Uses Handlebars-like syntax with double curly braces.
    * Available placeholders:
        * `{{title}}`: The Raindrop bookmark title.
        * `{{id}}`: The unique Raindrop bookmark ID.
        * `{{collectionTitle}}`: The title of the collection the bookmark belongs to (if any).
        * `{{date}}`: The creation date of the bookmark in `YYYY-MM-DD` format.
    * Default: `{{title}}`

## Usage

1.  **Open the Command Palette** (usually `Ctrl+P` or `Cmd+P`).
2.  Search for and select the command: **"Fetch Raindrops"**.
3.  An **options modal** will appear, allowing you to configure this specific fetch operation:
    * **Vault Folder (Optional):** Override the default save location for this fetch.
    * **Collections:** Enter comma-separated Raindrop.io Collection *IDs* if you only want to fetch from specific collections. Find the ID in the URL when viewing a collection on Raindrop.io (e.g., `.../collection/123456/...`). Leave blank to fetch from all (unless filtered by tags).
    * **Filter by Tags:** Enter comma-separated Raindrop.io tag names. The plugin will only fetch bookmarks that contain **ALL** the tags listed here. Leave blank to not filter by tags (unless filtered by collections).
    * **Include Subcollections:** If filtering by Collection IDs, toggle this on to also fetch from any collections nested inside the specified ones.
    * **Append Tags to Note Frontmatter:** Enter comma-separated tags (e.g., `#imported/raindrop, #processed`) that will be added to the `tags:` list in the YAML frontmatter of *every* note created during this fetch.
    * **Use Raindrop Title for File Name:** Toggle this on (default) to use the File Name Template defined in settings. If off, the Raindrop bookmark ID will be used as the filename.
4.  Click the **"Fetch Raindrops"** button in the modal.

5.  The plugin will show notices indicating progress ("Fetching...", "Processing...", final summary). Check the Obsidian Developer Console (`Ctrl+Shift+I` or `Cmd+Option+I`) for detailed logs and potential errors.

## Created Note Structure

Each successfully imported Raindrop bookmark will generate a new Markdown note with the following structure:

````markdown

Note Title <Sanitized Title (excludes obsidian-forbidden characters in note title)>

---
title: "<Raindrop Title>"
description: "<Raindrop Excerpt (often a summary from the webpage)>"
source: <Raindrop URL (link)>
tags:
  - <raindrop_tag_1_sanitized>
  - <raindrop_tag_2_sanitized>
  - <appended_tag_1_sanitized>
banner: <Raindrop Cover Image URL (if available)>
---

![<Sanitized Title or 'Cover Image'>](<Raindrop Cover Image URL (if available)>)

# <Raindrop Title>

## <Raindrop Note (your personal annotation on the bookmark, if any)>

<Raindrop Excerpt (often a summary from the webpage)>

### Highlights
- Highlight text 1 (newlines replaced with spaces)
  *Note:* Optional note for highlight 1 (newlines replaced with spaces)
- Highlight text 2 (newlines replaced with spaces)

````

Note: Tags in the frontmatter will have spaces replaced with underscores (_) and special characters removed to be compatible with Obsidian's tagging system.

## Troubleshooting

###  "API token is not set" Error: 
    
    Ensure you have correctly copied and pasted your Raindrop.io Test Token into the plugin settings.

### Check Console: 
    
    For any issues, open the Developer Console (Ctrl+Shift+I or Cmd+Option+I -> Console tab) for detailed error messages and logs.

--- 

## Released under the "Do What the Fuck You Want to Public License"


                    Version 2, December 2004 

 Copyright (C) 2004 Sam Hocevar <sam@hocevar.net> 

 Everyone is permitted to copy and distribute verbatim or modified 
 copies of this license document, and changing it is allowed as long 
 as the name is changed. 

            DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE 
   TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION 

  0. You just DO WHAT THE FUCK YOU WANT TO.
