# 📖 User Guide - Make It Rain

Welcome to the Make It Rain User Guide! This comprehensive documentation will help you get the most out of the plugin, from your first import to advanced customization.

---

## 🎯 Getting Started

### For First-Time Users

New to Make It Rain? Follow these steps to get up and running:

1. **[📥 Installation](installation.md)** - Install the plugin and obtain your Raindrop.io API token
2. **[⚙️ Configuration](configuration.md)** - Configure the plugin with your API token and preferences
3. **[🚀 Quick Import](usage.md#quick-import)** - Import your first bookmark in under 2 minutes

Once you've completed these three steps, you'll be ready to import all your bookmarks!

---

## 📚 Complete Documentation

### Setup & Configuration
**Just getting started? Begin here.**

- **[📥 Installation Guide](installation.md)** `Beginner`
  - Installing from Community Plugins or manual installation
  - Getting your Raindrop.io API token
  - Initial plugin setup and verification

- **[⚙️ Configuration Guide](configuration.md)** `Beginner`
  - Setting your API token
  - Configuring default vault location
  - Customizing filename templates
  - Banner field settings

### Using the Plugin
**Core features and daily usage.**

- **[📖 Usage Guide](usage.md)** `Beginner to Intermediate`
  - Fetching raindrops (bulk import)
  - Quick import by URL or ID
  - Understanding filtering options
  - Smart rate limiting and retry logic

- **[📂 Collections Guide](collections.md)** `Intermediate`
  - Understanding collection hierarchy
  - Filtering by collection
  - Automatic folder structure creation
  - Working with nested collections

- **[🏷️ Tags Guide](tags.md)** `Intermediate`
  - Tag filtering (AND/OR logic)
  - Appending custom tags to notes
  - Tag organization strategies
  - Tag matching and filtering

- **[📋 Note Structure](note-structure.md)** `Beginner`
  - Understanding the note format
  - YAML frontmatter fields
  - Default note sections
  - Available metadata

### Customization
**Make the plugin work exactly how you want.**

- **[🎨 Template System](template-system.md)** `Intermediate to Advanced`
  - Template syntax and basics
  - Available variables and helpers
  - Creating custom templates
  - Content-type specific templates
  - Advanced formatting techniques

- **[🖼️ Template Gallery](template-gallery.md)** `Beginner to Intermediate`
  - Pre-built template examples
  - Use case scenarios
  - Copy-paste ready templates
  - Customization tips

### Help & Support
**Troubleshooting and answers.**

- **[🆘 Troubleshooting Guide](troubleshooting.md)** `Beginner to Intermediate`
  - API token issues
  - Import problems and solutions
  - Template debugging
  - General error resolution

- **[❓ FAQ](faq.md)** `Beginner`
  - Frequently asked questions
  - Quick tips and tricks
  - Common workflows
  - Best practices

- **[⚠️ Known Issues](known-issues.md)** `Beginner`
  - Current limitations
  - Documented bugs
  - Workarounds and solutions
  - Future fixes roadmap

---

## 🎓 Learning Paths

### Path 1: Just Getting Started ⭐
**Estimated time: 10-15 minutes**

Want to import your first bookmarks quickly? Follow this path:

```
1. Installation (installation.md)
   ↓
2. Configuration (configuration.md)
   ↓
3. Quick Import (usage.md#quick-import)
   ↓
4. Done! Start importing
```

### Path 2: Complete Setup 🚀
**Estimated time: 30-45 minutes**

Get everything set up and understand all features:

```
1. Installation (installation.md)
   ↓
2. Configuration (configuration.md)
   ↓
3. Usage Guide (usage.md) - Read all sections
   ↓
4. Collections Guide (collections.md)
   ↓
5. Tags Guide (tags.md)
   ↓
6. Ready for full usage!
```

### Path 3: Power User 💪
**Estimated time: 1-2 hours**

Customize everything and unlock advanced features:

```
1. Complete Setup (Path 2)
   ↓
2. Note Structure (note-structure.md)
   ↓
3. Template System (template-system.md)
   ↓
4. Template Gallery (template-gallery.md)
   ↓
5. Create custom templates
   ↓
6. Advanced filtering & organization
```

---

## 🗂️ Common Tasks

### Quick Reference Table

| I want to... | Difficulty | Where to go |
|---|---|---|
| **Install the plugin** | Beginner | [Installation Guide](installation.md) |
| **Set my API token** | Beginner | [Configuration Guide](configuration.md#api-token) |
| **Import one bookmark quickly** | Beginner | [Quick Import](usage.md#quick-import) |
| **Import all my bookmarks** | Beginner | [Fetch Raindrops](usage.md#fetch-raindrops) |
| **Organize imports into folders** | Beginner | [Collections Guide](collections.md) |
| **Filter by tags** | Intermediate | [Tags Guide](tags.md) |
| **Only import new items** | Intermediate | [Usage Guide](usage.md) |
| **Customize note format** | Intermediate | [Template System](template-system.md) |
| **Use a pre-built template** | Intermediate | [Template Gallery](template-gallery.md) |
| **Create my own template** | Advanced | [Template System](template-system.md) |
| **Fix import errors** | Intermediate | [Troubleshooting](troubleshooting.md) |
| **Answer a quick question** | Beginner | [FAQ](faq.md) |

### Workflow Examples

#### Workflow 1: Daily Bookmark Sync
**Time: 2-3 minutes per day**

```
1. Add bookmarks to Raindrop.io throughout the day
2. Open Obsidian
3. Open Command Palette (Ctrl/Cmd+P)
4. Run "Fetch Raindrops"
5. Toggle "Fetch only new items" ON
6. Click Fetch
7. Done! New bookmarks are in your vault
```

See: [Usage Guide - Fetch Raindrops](usage.md#fetch-raindrops)

#### Workflow 2: Organized Research Collection
**Time: 15-20 minutes**

```
1. Go to Configuration (Settings > Make It Rain)
2. Set default folder to "Research/Articles"
3. Run "Fetch Raindrops"
4. Select a specific collection (e.g., "Research")
5. Toggle "Fetch only new items" ON
6. Click Fetch
7. Notes appear organized in your Research folder
```

See: [Collections Guide](collections.md) | [Configuration Guide](configuration.md)

#### Workflow 3: Custom Templates Setup
**Time: 30-45 minutes (one-time)**

```
1. Read Template System overview (template-system.md)
2. Browse Template Gallery for examples (template-gallery.md)
3. Pick a template that matches your style
4. Go to Settings > Make It Rain > Template System
5. Enable custom templates
6. Edit the template to match your preferences
7. Test with a small import (2-3 items)
8. Adjust as needed
9. Import your full collection with your new template!
```

See: [Template System](template-system.md) | [Template Gallery](template-gallery.md)

#### Workflow 4: Multi-Collection Organization
**Time: 20-30 minutes**

```
1. Understand your Raindrop collection structure
2. Set default folder to vault root
3. Run "Fetch Raindrops" multiple times:
   - Filter by collection "Research" → Fetch
   - Filter by collection "Design" → Fetch
   - Filter by collection "Tools" → Fetch
4. Your vault now has organized folders:
   Research/
   Design/
   Tools/
```

See: [Collections Guide](collections.md) | [Usage Guide](usage.md)

---

## 💡 Tips & Best Practices

### Getting Started Tips
- ✅ Start with a small test import (3-5 bookmarks) to verify settings
- ✅ Use "Quick Import" to test a single bookmark first
- ✅ Verify your API token is working before bulk importing
- ✅ Check the developer console (Ctrl/Cmd+Shift+I) for detailed error messages

### Organization Tips
- 📂 Use collections in Raindrop to organize by topic, then import by collection
- 🏷️ Use tags for cross-cutting concerns (e.g., "to-read", "high-priority")
- 📝 Customize filename templates to include dates or collection names
- 🎨 Create different templates for different content types

### Template Tips
- 🎨 Start with a pre-built template from the gallery
- 🧪 Test template changes with a small batch first
- 📚 Use the Template System guide for advanced variables
- 🔄 You can reset to defaults at any time in Settings

### Import Tips
- ⚡ "Fetch only new items" is great for daily syncs (fast!)
- 🔄 "Update existing notes" can refresh old items with new highlights
- 🏷️ Combine collection and tag filters for precise imports
- 💾 The plugin won't overwrite notes unless you explicitly ask it to

---

## 📊 Feature Overview

### Import Methods

| Method | Best For | Speed | Flexibility |
|---|---|---|---|
| **Quick Import** | Single bookmarks | ⚡⚡⚡ | Medium |
| **Fetch Raindrops** | Bulk imports | ⚡ | High |
| **Collection Filter** | Topic-based imports | ⚡⚡ | High |
| **Tag Filter** | Label-based imports | ⚡⚡ | High |

### Organization Methods

| Method | Use Case | Learning Curve |
|---|---|---|
| **Default Folder** | Store everything in one place | Easy |
| **Collections** | Organize by Raindrop collections | Medium |
| **Custom Filenames** | Add metadata to filename | Medium |
| **Custom Templates** | Create custom note structure | Advanced |

### Customization Options

| Feature | Difficulty | Impact |
|---|---|---|
| **API Token** | Beginner | Required |
| **Default Folder** | Beginner | Convenience |
| **Filename Template** | Beginner | Organization |
| **Custom Template** | Intermediate | Note appearance |
| **Content-Type Templates** | Advanced | Fine-grained control |

---

## ✨ Key Features Explained

### 🔄 Smart Filtering
Filter your imports by:
- **Collections** - Specific Raindrop collections
- **Tags** - AND/OR tag logic for precise matching
- **Content Type** - Links, Articles, Images, Videos, Documents, Audio
- **Status** - Fetch only new items or update existing

### 🗂️ Collection Hierarchy
Your Raindrop collection structure is automatically replicated:
```
Raindrop.io:              Obsidian:
├── Research       →      ├── Research/
│   ├── Articles   →      │   └── Articles/
│   └── Papers     →      │   └── Papers/
└── Design         →      └── Design/
```

### 🎨 Template System
Complete control over note format:
- Use variables like `{{title}}`, `{{domain}}`, `{{formattedDate}}`
- Content-type specific templates
- Handlebars-like syntax for advanced formatting
- Built-in helpers for common operations

### 🏷️ Tag Management
- Import original Raindrop tags
- Append custom Obsidian tags
- Filter by AND/OR tag logic
- Organize with tag hierarchies

---

## 🆘 Getting Help

**Having trouble?** Here's how to find answers:

1. **Quick answers** → [FAQ](faq.md)
2. **Problem-solving** → [Troubleshooting Guide](troubleshooting.md)
3. **Known bugs** → [Known Issues](known-issues.md)
4. **Community questions** → [GitHub Discussions](https://github.com/frostmute/make-it-rain/discussions)
5. **Found a bug** → [GitHub Issues](https://github.com/frostmute/make-it-rain/issues)

---

## 📖 Document Structure

```
User Guide (you are here)
├── Installation (getting the plugin)
├── Configuration (setting it up)
├── Usage (how to use it)
├── Collections (organizing by collection)
├── Tags (organizing by tags)
├── Note Structure (understanding the format)
├── Template System (customizing notes)
├── Template Gallery (examples)
├── Troubleshooting (fixing problems)
├── FAQ (quick answers)
└── Known Issues (limitations)
```

---

## 🎓 Difficulty Levels Explained

### Beginner ⭐
Requires no prior knowledge. Straightforward steps with clear outcomes.
- **Examples**: Installation, Basic Configuration, Quick Import

### Intermediate 🔷
Requires some familiarity with the plugin. Combines multiple features.
- **Examples**: Advanced Filtering, Custom Filenames, Using Templates

### Advanced 🔶
Requires understanding of templates, syntax, and plugin mechanics.
- **Examples**: Creating Custom Templates, Complex Filtering Logic

---

## 🚀 Next Steps

**Just getting started?**
→ Go to [Installation Guide](installation.md)

**Already installed?**
→ Go to [Configuration Guide](configuration.md)

**Ready to import?**
→ Go to [Usage Guide](usage.md)

**Want to customize?**
→ Go to [Template System](template-system.md)

---

<div align="center">

**Have a question?** Check the [FAQ](faq.md)

**Found an issue?** See [Troubleshooting](troubleshooting.md)

**Want to contribute?** Visit the [Developer Guide](../developer-guide/README.md)

</div>