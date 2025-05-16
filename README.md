# Make It Rain

![Plugin Header Image](https://i.ibb.co/HTx7TnbN/makeitrain.png)

## Raindrop.io Importer for Obsidian

This plugin for [Obsidian](https://obsidian.md) enables you to fetch bookmarks from your [Raindrop.io](https://raindrop.io) account and create notes in your vault using a customizable template. Seamlessly integrate your web clippings, articles, and references into your Obsidian knowledge base!

05-2025 - This is an initial, functional release. I will be continually developing this plugin to further streamline user expierience and extend functionality. Please do not hesitate to leave feedback, submit feature requests, or ask for assisstance with anything; I intend to adress every inquiry to the best of my abilities... I am new to public development and have never shared anything I've made with anyone else, so if I'm overlooking something, or have made an error in etiquette, please let me know. I value and appreciate all forms of feedback and it helps immensely in my learning process.

![Make It Rain Showcase](https://media-hosting.imagekit.io/853ddddf673144e2/make-it-rain.png?Expires=1841358260&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=XVGTj3Pdo~IxT8aNCLvkbHYu7-DdN4tjxt7ExRXq2IIUDwBjMnOxbpGpaknLEkYwCeACXBcJG85dHCQpUO4efd80PDBzlmArPVFkoUt8qTfwAV58eDjOPORlVn-kD9ZNAnDpE1p1UaXHlvNgU6jMQD2JL8BOJIIG0pcJOs-~w9UlOKHXMdlTvCscj4pDcANDKmpo6Iu-tzLE93YGIr6BOoB-ydm8X4koJ983wHueEIQc2T~cFBzky-ucMqlk9kpCAM8tvj0kEPtNT6o1Yqyje8pCFmRdXlDcVDTgBUdMZL6BKSmF1zOj~eenxKjot~9FZ3Mqkfeeu-j4xp-UN8Ie6g__)

![Make It Rain Options Modal](https://media-hosting.imagekit.io/77030d8132614182/Screenshot_20250508_055051.png?Expires=1841358311&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=jP~5eQ0twVTjkw2wj1VY9zTh5LxdFLVxg5cFmkVD5lQEBWMZHzkhck6YmGOoh2HNEAjD1yjOomN2-qaUorzeU-Neq1ocSVnqC8ik2I8hd5FFBx0z-xq4FW6nAmlnZe3dYlg8Zm2lsYlFHH8eAkRi0zeiGb7EnPhdcqjgMKZFHpTz5GQ4E5R5bmm6sRp0FPH5UIZOsdn3eLGMLx~vfDS2UcPOTuE75V7ExNs7u3V6YCo9hULhg99hlDdfUDoICCoAjZdzEQ~jApWCywSqDZwPIzcj2Hlz9qO~Zba1yfuBQkW0eYN5svo7X3TDocp-kSKMo-pUad8CTy-ER41giCTiuw__)

## Features

* **On-Demand Fetching:** Import Raindrops using a Command Palette action.
* **Flexible Filtering:** Control which bookmarks to fetch per session via an interactive modal:
  * Filter by specific Raindrop.io Collection IDs (comma-separated).
  * Filter by specific Raindrop.io Tags (comma-separated; matches items with ALL specified tags).
  * Optionally include items from subcollections when filtering by Collection ID.
* **Comprehensive Note Generation:** Created notes include:
  * **YAML Frontmatter:** `title`, `description` (from Raindrop excerpt), `source` (original URL), `tags` (combining Raindrop tags and any appended tags), and `banner` (using the Raindrop cover image URL, compatible with plugins like Banner).
  * **Note Body:** Cover image (if available), H1 Title, H2 section for your Raindrop Note/Annotation, the Raindrop Excerpt, and a list of Highlights (including any notes on highlights).
* **Configurable Filenames:**
  * Choose between using the Raindrop title (processed via template) or the Raindrop ID for filenames.
  * Customize the filename format with placeholders: `{{title}}`, `{{id}}`, `{{collectionTitle}}`, `{{date}}`.
* **Tag Management:** Automatically append custom tags to the frontmatter of every imported note.
* **Safe Import:** Prevents overwriting by checking if a note with the target filename already exists in the specified destination.
* **Handles Pagination:** Reliably fetches all matching bookmarks from Raindrop.io, respecting API rate limits.
* **Persistent Settings:** Configure and save your API key, default note save location, and filename template preferences.

## Installation

<!-- Reminder: Update this link when releases are available -->
### Manual Installation

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
4. Enable the "Make It Rain" plugin under `Settings` -> `Community Plugins`.
5. Configure the required API Token in the plugin settings.

### Community Plugins Store

*(Once accepted)* This plugin aims to be available directly in the Obsidian Community Plugins store.

## Configuration

Before the first use, configure the plugin via Obsidian's settings panel (`Settings` -> `Community Plugins` -> `Make It Rain` -> `Options` (cog icon)).

1. **Raindrop.io API Token (Required):**
    * You must provide a "Test Token" from Raindrop.io.
    * To generate one:
        1. Go to your [Raindrop.io Apps settings page](https://app.raindrop.io/settings/integrations).
        2. Click "+ Create new app".
        3. Give it a name (e.g., "MakeItRain").
        4. Click the newly created app, then click "Create test token".
    * Copy this token and paste it into the plugin's API Token settings field.
2. **Default Vault Location for Notes:**
    * Specify the default folder path within your vault where imported notes should be saved (e.g., `Imports/Raindrops`).
    * If left blank, notes will be saved in the root of your vault.
    * This location can be overridden during each fetch operation, providing maximum flexibility for many different use cases.
3. **File Name Template:**
    * Define the filename structure when the "Use Raindrop Title for File Name" option is enabled in the fetch modal.
    * Uses Handlebars-like syntax: `{{placeholder}}`.
    * Available placeholders:
        * `{{title}}`: The Raindrop bookmark title.
        * `{{id}}`: The unique Raindrop bookmark ID.
        * `{{collectionTitle}}`: The title of the collection the bookmark belongs to (if any).
        * `{{date}}`: The creation date of the bookmark (format: `YYYY-MM-DD`).
    * Default value: `{{title}}`

## Usage

1. Open the Obsidian **Command Palette** (`Ctrl+P` or `Cmd+P`).
2. Search for and select the command: **"Fetch Raindrops"**.
3. An **options modal** will appear, allowing you to configure the current fetch operation:
    * **Vault Folder (Optional):** Override the default save location for this specific fetch.
    * **Collections IDs:** Enter comma-separated Raindrop.io Collection *IDs* to fetch from specific collections (e.g., `12345,67890`). The ID can be found in the URL when viewing a collection on Raindrop.io (e.g., `.../collection/123456/...`). Leave blank to fetch from all collections (unless filtered by tags).
    * **Filter by Tags:** Enter comma-separated Raindrop.io tag names. The plugin will only fetch bookmarks that contain **ALL** listed tags. Leave blank if not filtering by tags (unless filtered by collections).
    * **Include Subcollections:** If filtering by Collection IDs, toggle this on to also fetch from any collections nested within the specified ones.
    * **Append Tags to Note Frontmatter:** Enter comma-separated tags (e.g., `#imported/raindrop, #topic/web`) to add to the `tags` list in the YAML frontmatter of *every* note created during this fetch.
    * **Use Raindrop Title for File Name:** Toggle on (default) to use the File Name Template. If off, the Raindrop bookmark ID will be used as the filename.
4. Click the **"Fetch Raindrops"** button in the modal.
5. The plugin will display notices for progress ("Fetching...", "Processing...", final summary). For detailed logs or errors, check the Obsidian Developer Console (`Ctrl+Shift+I` or `Cmd+Option+I`, then navigate to the `Console` tab).

## Created Note Structure

Each successfully imported Raindrop bookmark generates a new Markdown note with the following structure. Placeholders like `<Raindrop Title>` indicate where Raindrop.io data will be inserted.

```markdown
---
title: "<Raindrop Title>"
description: "<Raindrop Excerpt (summary from the webpage)>"
source: <Raindrop URL (link)>
tags:
  - <raindrop_tag_1_sanitized>
  - <raindrop_tag_2_sanitized>
  - <appended_tag_1_sanitized> # If you added tags via the modal
banner: <Raindrop Cover Image URL (if available)>
---

![<Sanitized Title or 'Cover Image'>](<Raindrop Cover Image URL (if available)>)

# <Raindrop Title>

## <Raindrop Note (your personal annotation, if any)>

<Raindrop Excerpt (summary from the webpage)>

### Highlights
- Highlight text 1 (newlines are replaced with spaces)
  *Note:* Optional note for highlight 1 (newlines are replaced with spaces)
- Highlight text 2 (newlines are replaced with spaces)
  *Note:* Optional note for highlight 2 (newlines are replaced with spaces)

```

**Note on Tags:** Tags in the frontmatter are automatically sanitized for Obsidian compatibility: spaces are replaced with underscores (`_`), and special characters are removed.

## Troubleshooting

### "API token is not set" Error

Ensure you have correctly copied your Raindrop.io Test Token and pasted it into the plugin's settings.

### Check Console for Errors

For any issues, open the Developer Console (`Ctrl+Shift+I` or `Cmd+Option+I` -> `Console` tab) for detailed error messages and plugin logs.

---

## License

Released under the "Do What The F*ck You Want To Public License" (WTFPL).

```text
            DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
                    Version 2, December 2004

 Copyright (C) 2004 Sam Hocevar <sam@hocevar.net>

 Everyone is permitted to copy and distribute verbatim or modified
 copies of this license document, and changing it is allowed as long
 as the name is changed.

            DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
   TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

  0. You just DO WHAT THE FUCK YOU WANT TO.
```
