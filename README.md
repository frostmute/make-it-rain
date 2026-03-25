![Make It Rain Hero](https://github.com/frostmute/make-it-rain/blob/main/assets/1748151599078.webp)

<div align="center">

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/frostmute/make-it-rain)](https://github.com/frostmute/make-it-rain/releases/latest)
[![License](https://img.shields.io/github/license/frostmute/make-it-rain)](LICENSE)
[![Documentation](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://frostmute.github.io/make-it-rain/)

**Seamlessly import your [Raindrop.io](https://raindrop.io) bookmarks into [Obsidian](https://obsidian.md/)**

[Features](#-features) • [Installation](#-installation) • [Quick Start](#-quick-start) • [Documentation](https://frostmute.github.io/make-it-rain/) • [Contributing](#-contributing)

</div>

---

## 📖 About

Make It Rain is a powerful Obsidian plugin that brings your Raindrop.io bookmarks, highlights, and notes directly into your vault. Transform your web clippings and research into a seamlessly integrated knowledge base with flexible filtering, automatic organization, and customizable templates.

## ✨ Features

### 🎨 Powerful Template System
- **Fully customizable note templates** with Handlebars-like syntax
- **Pre-configured templates** for each content type (articles, videos, images, etc.)
- **Smart variables** including formatted dates, domains, and tag lists
- **Easy template management** with reset-to-default options

### 🎯 Flexible Import Options
- **Bulk import** with advanced filtering by collections, tags, and content types
- **Quick import** by URL or ID for individual items
- **Selective sync** - fetch only new items or update existing notes
- **Dynamic collection selector** - browse and select from your Raindrop collections

### 🗂️ Smart Organization
- **Automatic folder structure** replicating your Raindrop collection hierarchy
- **Rich YAML frontmatter** with comprehensive metadata
- **Customizable filenames** using template variables
- **Tag augmentation** - append custom tags to imported notes

### ⚙️ Robust & Reliable
- **Smart rate limiting** (120 requests/minute) with automatic retries
- **Safe by default** - prevents accidental overwrites
- **Detailed logging** for troubleshooting
- **Automated CI/CD** for build stability

## 🚀 Installation

### Manual Installation

1. Download `make-it-rain.zip` from the [latest release](https://github.com/frostmute/make-it-rain/releases/latest)
   > ⚠️ **Important:** Download `make-it-rain.zip`, not the source code
2. Extract the zip file to get `main.js`, `manifest.json`, and `styles.css`
3. Navigate to your vault's `.obsidian/plugins/` directory
4. Create a new folder named `make-it-rain`
5. Copy the three files into this folder
6. Restart Obsidian
7. Enable the plugin in `Settings` → `Community Plugins`

### Community Plugin Store

*Coming soon* - submission pending

## ⚡ Quick Start

### 1. Get Your API Token

1. Visit [Raindrop.io Apps settings](https://app.raindrop.io/settings/integrations)
2. Click "+ Create new app"
3. Name it (e.g., "MakeItRain")
4. Click "Create test token"
5. Copy the token

### 2. Configure the Plugin

1. Open Obsidian Settings → `Make It Rain`
2. Paste your API token
3. (Optional) Set default vault location for imported notes
4. Click "Verify Token" to test connection

### 3. Import Your Bookmarks

**Bulk Import:**
- Open Command Palette (`Ctrl/Cmd+P`)
- Run "Fetch Raindrops"
- Configure filters (collections, tags, types)
- Click "Fetch Raindrops"

**Quick Import:**
- Open Command Palette
- Run "Quick Import Raindrop by URL/ID"
- Paste Raindrop URL or ID
- Click "Fetch & Create Note"

## 📚 Documentation

Comprehensive documentation is available on our **[Documentation Site](https://frostmute.github.io/make-it-rain/)**.

### For Users
- [Installation Guide](https://frostmute.github.io/make-it-rain/user-guide/installation)
- [Configuration Guide](https://frostmute.github.io/make-it-rain/user-guide/configuration)
- [Usage Guide](https://frostmute.github.io/make-it-rain/user-guide/usage)
- [Template System](https://frostmute.github.io/make-it-rain/user-guide/template-system)
- [Troubleshooting](https://frostmute.github.io/make-it-rain/user-guide/troubleshooting)
- [FAQ](https://frostmute.github.io/make-it-rain/user-guide/faq)

### For Developers
- [Developer Guide](https://frostmute.github.io/make-it-rain/developer-guide/)
- [API Reference](https://frostmute.github.io/make-it-rain/developer-guide/api-reference)
- [Testing Guide](https://frostmute.github.io/make-it-rain/developer-guide/testing-guide)

## 🎯 Configuration Options

| Setting | Description | Default |
|---------|-------------|---------|
| **API Token** | Your Raindrop.io test token (required) | - |
| **Default Vault Location** | Folder path for imported notes | Root |
| **Filename Template** | Template for note filenames | `{{title}}` |
| **Show Ribbon Icon** | Display plugin icon in sidebar | Enabled |
| **Banner Field Name** | Frontmatter field for banner images | `banner` |

**Available filename placeholders:** `{{title}}`, `{{id}}`, `{{collectionTitle}}`, `{{date}}`

## 📝 Note Structure

Each imported Raindrop creates a Markdown note with:

### YAML Frontmatter
```yaml
---
title: "Example Bookmark Title"
source: https://example.com/article
type: article
created: 2023-10-27T10:30:00Z
lastupdate: 2023-10-28T12:00:00Z
id: 123456789
collectionTitle: "My Research"
collectionPath: "Archive/Tech Articles"
tags:
  - web-clipping
  - productivity
banner: https://example.com/cover-image.jpg
---
```

### Note Body
The default template includes:
- Banner image
- Title heading
- Description
- Personal notes
- Highlights with annotations
- Metadata details

See the [Note Structure documentation](https://frostmute.github.io/make-it-rain/user-guide/note-structure) for complete details.

## 🛠️ Troubleshooting

**"API token is not set" error**
- Verify your token is correctly copied into plugin settings
- Click "Verify Token" to test the connection

**Notes not importing**
- Check the Developer Console (`Ctrl/Cmd+Shift+I` → Console) for errors
- Ensure collections/tags exist in your Raindrop account
- Verify vault folder path exists

**Need more help?**
- Check the [Troubleshooting Guide](https://frostmute.github.io/make-it-rain/user-guide/troubleshooting)
- Review [Known Issues](https://frostmute.github.io/make-it-rain/user-guide/known-issues)
- [Open an issue](https://github.com/frostmute/make-it-rain/issues)

## 🗺️ Roadmap

- [ ] Bi-directional synchronization with Raindrop.io
- [ ] Enhanced highlight handling within Obsidian notes
- [ ] Extended content scraping options
- [ ] Undo functionality for operations
- [ ] Saved fetch presets
- [ ] Video tutorials and demos

See the full [Roadmap](https://github.com/frostmute/make-it-rain/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement) on GitHub Issues.

## 🤝 Contributing

Contributions are welcome! Please see our [Developer Guide](https://frostmute.github.io/make-it-rain/developer-guide/) for details on:
- Setting up the development environment
- Running tests
- Submitting pull requests
- Code style guidelines

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💖 Support

If you find this plugin useful, consider supporting its development:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Z8Z7RYUWN)

---

<div align="center">

**[Documentation](https://frostmute.github.io/make-it-rain/)** • **[Changelog](CHANGELOG.md)** • **[Issues](https://github.com/frostmute/make-it-rain/issues)** • **[Releases](https://github.com/frostmute/make-it-rain/releases)**

Made with ❤️ by [frostmute](https://github.com/frostmute)

</div>