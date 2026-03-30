# Make It Rain - Documentation

> **Seamlessly import your [Raindrop.io](https://raindrop.io) bookmarks into [Obsidian.md](https://obsidian.md/)**

Welcome to Make It Rain! This documentation will help you get the most out of the plugin, whether you're a first-time user or an advanced contributor.

---

## 🚀 Start Here

**New to Make It Rain?** Begin with these essential guides:

1. **[Installation Guide](user-guide/installation.md)** - Get the plugin up and running
2. **[Quick Start Configuration](user-guide/configuration.md)** - Set up your API token in 2 minutes
3. **[Your First Import](user-guide/usage.md)** - Import your first bookmarks

---

## ✨ Key Features at a Glance

### 🎯 Flexible Filtering & Importing
- **Bulk Import**: Fetch multiple bookmarks with advanced filtering by collections, tags, and content types
- **Quick Import**: Import individual items by URL or ID
- **Selective Sync**: Only fetch new items or update existing notes
- **Smart Filtering**: Combine collections, tags (AND/OR logic), and content types

### 🗂️ Smart Organization
- **Automatic Folder Hierarchy**: Replicates your Raindrop collection structure in Obsidian
- **Rich Metadata**: Comprehensive YAML frontmatter with all important details
- **Customizable Filenames**: Use template variables to create meaningful note names
- **Tag Integration**: Automatically append custom Obsidian tags to imported notes

### 🎨 Powerful Customization
- **Template System**: Full control over note format with Handlebars-like syntax
- **Content-Type Templates**: Different formats for articles, images, videos, and more
- **Banner Images**: Display cover images from your bookmarks
- **Flexible Formatting**: Customize every aspect of your imported notes

### ⚙️ Robust & Reliable
- **Smart Rate Limiting**: Gracefully handles API limits with automatic retries
- **Safe by Default**: Prevents accidental overwrites of existing notes
- **Detailed Logging**: Full transparency for troubleshooting
- **Stable Builds**: Automated CI/CD ensures reliability

---

## 📚 Documentation Guide

### For Users

**Getting Started**
- [📥 Installation Guide](user-guide/installation.md) - Install and get your API token
- [⚙️ Configuration Guide](user-guide/configuration.md) - Set up the plugin to your liking
- [📖 User Guide](user-guide/README.md) - Complete user documentation

**Using the Plugin**
- [🔄 Usage Guide](user-guide/usage.md) - Learn how to import and organize bookmarks
- [📂 Collections](user-guide/collections.md) - Working with your Raindrop collections
- [🏷️ Tags](user-guide/tags.md) - Tag filtering and management
- [📋 Note Structure](user-guide/note-structure.md) - Understanding the note format

**Customization**
- [🎨 Template System](user-guide/template-system.md) - Customize how notes are formatted
- [🖼️ Template Gallery](user-guide/template-gallery.md) - Pre-built templates and examples

**Help & Resources**
- [🆘 Troubleshooting](user-guide/troubleshooting.md) - Fix common issues
- [❓ FAQ](user-guide/faq.md) - Frequently asked questions
- [⚠️ Known Issues](user-guide/known-issues.md) - Current limitations and workarounds

### For Developers

**Contributing**
- [👨‍💻 Developer Guide](developer-guide/README.md) - Set up your development environment
- [🏗️ Architecture Overview](developer-guide/index.md) - Understand the codebase
- [📝 Contributing Guide](../CONTRIBUTING.md) - Contribution workflow and standards

**Technical Resources**
- [🔌 API Reference](developer-guide/api-reference.md) - API documentation
- [✅ Testing Guide](developer-guide/testing-guide.md) - Writing and running tests
- [🔨 Build Verification](developer-guide/BUILD_VERIFICATION.md) - Verifying builds

---

## 🎯 Common Tasks

### First Time Setup
```
Installation → API Configuration → Test Import → Explore Settings
```
[Follow the Getting Started Guide →](user-guide/installation.md)

### Daily Workflow
```
Add bookmarks in Raindrop.io → Run "Fetch Raindrops" → Organize in Obsidian
```
[Learn about importing →](user-guide/usage.md)

### Custom Templates
```
Explore examples → Customize template → Test with small batch → Import full collection
```
[Template customization guide →](user-guide/template-system.md)

### Contributing Code
```
Fork repository → Set up dev environment → Create feature branch → Write tests → Submit PR
```
[Contributing guide →](../CONTRIBUTING.md)

---

## 🤔 Quick Reference

| I want to... | See... |
|---|---|
| **Install the plugin** | [Installation Guide](user-guide/installation.md) |
| **Set up my API token** | [Configuration Guide](user-guide/configuration.md) |
| **Import all my bookmarks** | [Usage Guide](user-guide/usage.md) |
| **Customize note format** | [Template System](user-guide/template-system.md) |
| **Filter by collection** | [Collections Guide](user-guide/collections.md) |
| **Filter by tags** | [Tags Guide](user-guide/tags.md) |
| **Fix import errors** | [Troubleshooting](user-guide/troubleshooting.md) |
| **Set up development** | [Developer Guide](developer-guide/README.md) |
| **Write tests** | [Testing Guide](developer-guide/testing-guide.md) |
| **Contribute code** | [Contributing Guide](../CONTRIBUTING.md) |

---

## 📖 Documentation Structure

```
docs/
├── index.md                 ← You are here!
├── user-guide/              ← User documentation
│   ├── README.md
│   ├── installation.md
│   ├── configuration.md
│   ├── usage.md
│   ├── collections.md
│   ├── tags.md
│   ├── note-structure.md
│   ├── template-system.md
│   ├── template-gallery.md
│   ├── troubleshooting.md
│   ├── faq.md
│   └── known-issues.md
├── developer-guide/         ← Developer documentation
│   ├── README.md
│   ├── index.md
│   ├── api-reference.md
│   ├── testing-guide.md
│   └── BUILD_VERIFICATION.md
└── release-notes/           ← Version history
```

---

## 💡 Getting Help

**Can't find what you're looking for?**

1. **Quick answers**: Check the [FAQ](user-guide/faq.md)
2. **Common issues**: Review [Troubleshooting](user-guide/troubleshooting.md)
3. **Known limitations**: See [Known Issues](user-guide/known-issues.md)
4. **Community**: Visit [GitHub Discussions](https://github.com/frostmute/make-it-rain/discussions)
5. **Report bugs**: [Open an issue on GitHub](https://github.com/frostmute/make-it-rain/issues)

---

## 🔗 Resources

- **GitHub Repository**: [frostmute/make-it-rain](https://github.com/frostmute/make-it-rain)
- **Raindrop.io**: [raindrop.io](https://raindrop.io)
- **Obsidian**: [obsidian.md](https://obsidian.md)
- **Changelog**: [View all releases](../CHANGELOG.md)

---

## 🎓 Learning Paths

### Path 1: Just Getting Started
→ [Installation](user-guide/installation.md) → [Configuration](user-guide/configuration.md) → [Usage](user-guide/usage.md)

### Path 2: Power User
→ [Template System](user-guide/template-system.md) → [Template Gallery](user-guide/template-gallery.md) → [Advanced Filtering](user-guide/usage.md)

### Path 3: Contributing Developer
→ [Developer Guide](developer-guide/README.md) → [Contributing](../CONTRIBUTING.md) → [Testing](developer-guide/testing-guide.md)

---

<div align="center">

**Ready to get started?** [→ Install Make It Rain](user-guide/installation.md)

For updates and news, follow the [Changelog](../CHANGELOG.md)

</div>