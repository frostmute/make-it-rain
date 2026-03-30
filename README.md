![Make It Rain Hero](https://github.com/frostmute/make-it-rain/blob/main/assets/1748151599078.webp)

<div align="center">

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/frostmute/make-it-rain)](https://github.com/frostmute/make-it-rain/releases/latest)
[![License](https://img.shields.io/github/license/frostmute/make-it-rain)](LICENSE)
[![Documentation](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://frostmute.github.io/make-it-rain/)
[![Code of Conduct](https://img.shields.io/badge/code%20of-conduct-ff69b4)](CODE_OF_CONDUCT.md)

# Make It Rain

**Seamlessly import your [Raindrop.io](https://raindrop.io) bookmarks into [Obsidian](https://obsidian.md/)**

Transform your web clippings, articles, and research into a powerful knowledge base.

[🚀 Quick Start](#-quick-start) • [📚 Features](#-features) • [📖 Documentation](https://frostmute.github.io/make-it-rain/) • [🤝 Contributing](#-contributing) • [💬 Support](#-support)

</div>

---

## 🌟 What is Make It Rain?

Make It Rain is a powerful Obsidian plugin that brings your Raindrop.io bookmarks, highlights, and notes directly into your vault. Whether you're a researcher collecting articles, a reader saving interesting finds, or a developer curating resources, Make It Rain helps you integrate your web discoveries seamlessly into your knowledge base.

**The Problem:** Your bookmarks live in Raindrop.io, but your knowledge base lives in Obsidian. Keeping them in sync is tedious.

**The Solution:** Make It Rain automates the import process with flexible filtering, customizable templates, and smart organization.

---

## ✨ Features at a Glance

### 🎨 Powerful Template System
Fully customize how your notes look with our flexible template system. Choose from pre-configured templates for different content types, or build your own with smart variables.

- **Customizable templates** with Handlebars-like syntax
- **Pre-configured templates** for articles, videos, images, links, and more
- **Smart variables** (formatted dates, domains, tag lists)
- **One-click reset** to default templates
- **Per-import overrides** to use different templates on demand

### 🎯 Advanced Filtering & Selection
Import exactly what you need with granular filtering options.

- **Bulk import** with filtering by collections, tags, and content types
- **Quick import** by URL or ID for individual items
- **Dynamic collection selector** - browse and select from your Raindrop account
- **Tag filtering** with AND/OR logic
- **Content type filtering** (links, articles, images, videos, documents, audio)
- **Selective sync** - fetch only new items or update existing notes

### 🗂️ Smart Organization
Your imported notes organize themselves based on your Raindrop structure.

- **Automatic folder hierarchy** mirroring your collections
- **Rich YAML frontmatter** with comprehensive metadata
- **Customizable filenames** with template variables
- **Auto-tagging** - append custom tags to all imports
- **Banner images** automatically included in notes

### ⚙️ Reliable & Robust
Built to handle large Raindrop libraries with confidence.

- **Smart rate limiting** (120 requests/minute) with automatic retries
- **Safe by default** - prevents accidental overwrites
- **Detailed logging** for troubleshooting
- **Comprehensive error handling**
- **Automated testing** with CI/CD

---

## 🚀 Quick Start

Get started in 3 simple steps:

### Step 1️⃣: Install the Plugin

1. Download `make-it-rain.zip` from the [latest release](https://github.com/frostmute/make-it-rain/releases/latest)
   > ⚠️ Download `make-it-rain.zip`, **not** the source code
2. Extract to get `main.js`, `manifest.json`, and `styles.css`
3. Copy these files to your vault's `.obsidian/plugins/make-it-rain/` folder
4. Restart Obsidian
5. Enable the plugin in `Settings` → `Community Plugins`

### Step 2️⃣: Get Your API Token

1. Go to [Raindrop.io Apps settings](https://app.raindrop.io/settings/integrations)
2. Click **+ Create new app**
3. Give it a name (e.g., "Make It Rain")
4. Click **Create test token**
5. Copy the token to your clipboard

### Step 3️⃣: Configure & Import

1. Open Obsidian `Settings` → `Make It Rain`
2. Paste your API token
3. Click **Verify Token** to test the connection
4. (Optional) Set your default import folder
5. Done! Run **"Fetch Raindrops"** from the Command Palette to start importing

> 💡 **New to Make It Rain?** Check out the [Installation Guide](https://frostmute.github.io/make-it-rain/user-guide/installation) for detailed instructions.

---

## 📚 Documentation

Comprehensive documentation is available on our **[Documentation Site](https://frostmute.github.io/make-it-rain/)**.

### 📖 For Users

Start here based on your experience level:

| Guide | Purpose | Time |
|-------|---------|------|
| **[Quick Start](https://frostmute.github.io/make-it-rain/user-guide/installation)** | Get up and running | 5 min |
| **[Installation](https://frostmute.github.io/make-it-rain/user-guide/installation)** | Install and configure | 10 min |
| **[Configuration](https://frostmute.github.io/make-it-rain/user-guide/configuration)** | Customize settings | 15 min |
| **[Usage Guide](https://frostmute.github.io/make-it-rain/user-guide/usage)** | Learn all features | 30 min |
| **[Template System](https://frostmute.github.io/make-it-rain/user-guide/template-system)** | Customize note format | 45 min |
| **[Troubleshooting](https://frostmute.github.io/make-it-rain/user-guide/troubleshooting)** | Fix common issues | 10 min |
| **[FAQ](https://frostmute.github.io/make-it-rain/user-guide/faq)** | Common questions | 5 min |

### 🛠️ For Developers

Learn how to contribute to the project:

| Resource | Purpose |
|----------|---------|
| **[Developer Guide](https://frostmute.github.io/make-it-rain/developer-guide/)** | Architecture & setup |
| **[Contributing Guide](CONTRIBUTING.md)** | How to contribute |
| **[Testing Guide](https://frostmute.github.io/make-it-rain/developer-guide/testing-guide)** | Write tests |
| **[API Reference](https://frostmute.github.io/make-it-rain/developer-guide/api-reference)** | API documentation |

---

## ⚙️ Configuration Reference

### Settings Overview

| Setting | Description | Default |
|---------|-------------|---------|
| **API Token** | Your Raindrop.io test token (required) | - |
| **Default Vault Location** | Folder path for imported notes | Vault root |
| **Filename Template** | Template for note filenames | `{{title}}` |
| **Show Ribbon Icon** | Display plugin icon in sidebar | Enabled |
| **Banner Field Name** | Frontmatter field for banner images | `banner` |

### Filename Template Placeholders

Use these variables in your filename template:
- `{{title}}` - Raindrop bookmark title
- `{{id}}` - Raindrop unique ID
- `{{collectionTitle}}` - Collection name
- `{{date}}` - Creation date (YYYY-MM-DD format)

**Example:** `{{date}} - {{title}}` produces `2024-01-15 - My Bookmark Title.md`

---

## 📝 How Notes Are Structured

Each imported Raindrop becomes a beautifully formatted Markdown note with YAML frontmatter.

### Example Note Frontmatter
```yaml
---
title: "Understanding React Hooks"
source: https://example.com/article
type: article
created: 2024-01-15T10:30:00Z
lastupdate: 2024-01-16T14:20:00Z
id: 123456789
collectionTitle: "Web Development"
collectionPath: "Learning/Web Development"
tags:
  - react
  - javascript
  - frontend
banner: https://example.com/cover-image.jpg
---
```

### Example Note Body

The default template structures your notes like this:

```markdown
# Understanding React Hooks

Your bookmark's description and highlights are formatted with:
- Description section
- Personal notes and annotations
- Highlights with inline comments
- Metadata and details
- Source link

All automatically organized and beautifully formatted!
```

For complete details, see the [Note Structure documentation](https://frostmute.github.io/make-it-rain/user-guide/note-structure).

---

## 🎯 Common Tasks

### Import bookmarks from a specific collection
1. Open Command Palette (`Ctrl/Cmd+P`)
2. Run **"Fetch Raindrops"**
3. Select your collection from the dynamic list
4. Click **Fetch Raindrops**

### Import a single bookmark by URL
1. Open Command Palette
2. Run **"Quick Import Raindrop by URL/ID"**
3. Paste the Raindrop URL or ID
4. Click **Fetch & Create Note**

### Use different templates for different import types
1. Open **"Fetch Raindrops"** modal
2. Configure your filters
3. Enable **"Override template"**
4. Choose your template
5. Fetch!

### Automatically organize by collection
1. In settings, ensure your collection hierarchy matches your desired folder structure
2. Enable **"Include Subcollections"** when fetching
3. Notes will automatically create nested folders

For more tips and workflows, see the [Usage Guide](https://frostmute.github.io/make-it-rain/user-guide/usage).

---

## 🔧 Troubleshooting

### "API token is not set" Error
- Verify you've copied your token correctly
- Click **"Verify Token"** in settings to test the connection
- Token should start with `eyJ` (JWT format)

### Notes Not Importing
- Check the Developer Console (`Ctrl/Cmd+Shift+I` → `Console` tab)
- Verify collections/tags exist in your Raindrop account
- Ensure the target vault folder exists
- Check that you have bookmarks in the selected collections

### Template Not Working
- Verify the template syntax is correct
- Check the browser console for error messages
- Reset to default template to test
- See the [Template System guide](https://frostmute.github.io/make-it-rain/user-guide/template-system) for syntax help

### Performance Issues with Large Libraries
- Fetch in smaller batches using collection filters
- Import by content type to reduce load
- Enable "Fetch only new items" to skip existing notes

**Still need help?**
- 📖 [Troubleshooting Guide](https://frostmute.github.io/make-it-rain/user-guide/troubleshooting)
- ❓ [FAQ](https://frostmute.github.io/make-it-rain/user-guide/faq)
- 🐛 [GitHub Issues](https://github.com/frostmute/make-it-rain/issues)
- 💬 [Discussions](https://github.com/frostmute/make-it-rain/discussions)

---

## 🗺️ Roadmap

Active development focuses on these features:

- 🔄 **Bi-directional sync** - Keep Obsidian and Raindrop in sync
- 📌 **Enhanced highlights** - Better highlight handling in notes
- 💾 **Saved presets** - Store and reuse fetch configurations
- 🎬 **Video tutorials** - Learn by watching
- 📊 **Archive scraping** - Extended content extraction
- ↩️ **Undo functionality** - Recover from mistakes

See the full [GitHub Issues](https://github.com/frostmute/make-it-rain/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement) for more planned features.

---

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help makes Make It Rain better.

### Getting Started
1. Read our [Contributing Guide](CONTRIBUTING.md)
2. Check the [Developer Guide](https://frostmute.github.io/make-it-rain/developer-guide/)
3. Follow our [Code of Conduct](CODE_OF_CONDUCT.md)

### Ways to Contribute
- **Code** - Submit pull requests with bug fixes or features
- **Documentation** - Improve guides or add examples
- **Testing** - Report bugs or test new features
- **Ideas** - Suggest features via GitHub Issues
- **Translation** - Help localize the plugin

### Development Quick Start
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

See the [Developer Guide](https://frostmute.github.io/make-it-rain/developer-guide/) for detailed setup instructions.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

This means you're free to use, modify, and distribute Make It Rain, provided you include the original license.

---

## 💖 Support Make It Rain

If you find Make It Rain useful and want to support its development, consider buying me a coffee! ☕

[![Support on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Z8Z7RYUWN)

Even if you can't contribute financially, you can help by:
- ⭐ Starring the repository
- 📢 Sharing the project with friends
- 🐛 Reporting bugs
- 💡 Suggesting features
- 📚 Improving documentation

---

## 🆘 Getting Help

### I have a question
- 📖 Check the [FAQ](https://frostmute.github.io/make-it-rain/user-guide/faq)
- 💬 Ask in [GitHub Discussions](https://github.com/frostmute/make-it-rain/discussions)
- 📧 Email [frostmute@gmail.com](mailto:frostmute@gmail.com)

### I found a bug
- 🐛 [Report it on GitHub Issues](https://github.com/frostmute/make-it-rain/issues/new?template=bug_report.md)
- 📋 Use the bug report template for details

### I have a feature idea
- 💡 [Suggest it on GitHub Issues](https://github.com/frostmute/make-it-rain/issues/new?template=feature_request.md)
- 📝 Use the feature request template

### I want to contribute
- 🤝 See [Contributing Guide](CONTRIBUTING.md)
- 👨‍💻 Check [Developer Guide](https://frostmute.github.io/make-it-rain/developer-guide/)

---

## 📊 Project Status

| Aspect | Status |
|--------|--------|
| **Build** | ✅ Passing |
| **Tests** | ✅ Setup Complete |
| **Documentation** | ✅ Comprehensive |
| **Community** | ✅ Welcoming |
| **Maintenance** | ✅ Active |

---

<div align="center">

### Quick Links

**[📖 Documentation](https://frostmute.github.io/make-it-rain/)** •
**[📋 Changelog](CHANGELOG.md)** •
**[🐛 Issues](https://github.com/frostmute/make-it-rain/issues)** •
**[📦 Releases](https://github.com/frostmute/make-it-rain/releases)** •
**[🤝 Contributing](CONTRIBUTING.md)** •
**[💬 Code of Conduct](CODE_OF_CONDUCT.md)**

---

### About the Author

Made with ❤️ by [frostmute](https://github.com/frostmute)

Whether you're importing bookmarks or building features, thank you for being part of the Make It Rain community! 🌧️✨

</div>