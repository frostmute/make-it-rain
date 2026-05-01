# Make It Rain - AI Coding Agent Guide

*Current Version: 1.9.0*

## Architecture Overview

Make It Rain is an Obsidian plugin that imports Raindrop.io bookmarks into structured Markdown notes. The codebase follows a modular architecture centered around a main plugin class (`RaindropToObsidian`) that orchestrates:

- **API Integration**: Fetches bookmarks from Raindrop.io with rate limiting and retry logic
- **Template System**: Custom Handlebars-like syntax for note formatting with content-type-specific templates
- **File Management**: Creates organized folder structures mirroring Raindrop collections with automatic folder notes
- **Data Processing**: Transforms Raindrop items into YAML-frontmatter Markdown notes
- **File Downloads**: Downloads native Raindrop file attachments (PDFs, EPUBs, images, videos, etc.)

## Key Components

### Core Files
- `src/main.ts`: Main plugin class handling initialization, settings, and import orchestration
- `src/modals.ts`: UI modals for bulk import and quick single-item import
- `src/settings.ts`: Plugin configuration and settings tab
- `src/types.ts`: TypeScript interfaces for Raindrop API responses and plugin settings

### Utility Modules (`src/utils/`)
- `apiUtils.ts`: Rate limiting, authentication, API request handling
- `fileUtils.ts`: File system operations, path sanitization, folder creation
- `yamlUtils.ts`: YAML frontmatter generation with proper escaping
- `formatUtils.ts`: Date formatting, tag processing, domain extraction

## Critical Workflows

### Development
```bash
npm run dev          # Watch mode with esbuild
npm run build        # Production build (TypeScript check + esbuild)
npm run copy-to-vault # Copy built files to Obsidian vaults (hardcoded paths)
npm run build-and-copy # Build and copy to vault in one command
```

### Testing
```bash
npm test             # Run Jest test suite
npm run test:watch   # Watch mode for tests
npm run test:coverage # Generate coverage reports
npm run test:verbose # Run tests with verbose output
```

### Release
```bash
npm run version      # Bump version in manifest.json and versions.json
```

### Code Quality
```bash
npm run lint         # Run ESLint on source files
npm run lint:md      # Lint markdown files
```

## Project-Specific Patterns

### Template System
Custom Handlebars-like syntax implemented in `renderTemplate()` method with support for content-type-specific templates:
- `{{variable}}`: Simple variable substitution
- `{{#if condition}}...{{/if}}`: Conditional blocks with optional `{{else}}`
- `{{#each array}}...{{/each}}`: Iteration over arrays
- Pre-calculated helpers: `{{domain}}`, `{{renderedType}}`, `{{formattedCreatedDate}}`, `{{formattedUpdatedDate}}`, `{{formattedTags}}`

Templates are configurable per content type (link, article, image, video, document, audio, book) with individual toggles. Modal options allow temporary overrides during import.

Example template:
```
---
title: "{{title}}"
source: {{link}}
type: {{type}}
created: {{created}}
lastupdate: {{lastupdate}}
id: {{id}}
collectionId: {{collectionId}}
collectionTitle: "{{collectionTitle}}"
collectionPath: "{{collectionPath}}"
{{#if collectionParentId}}collectionParentId: {{collectionParentId}}{{/if}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
{{#if cover}}
{{bannerFieldName}}: {{cover}}
{{/if}}
---

{{#if cover}}
![{{title}}]({{cover}})
{{/if}}

# {{title}}

{{#if excerpt}}
## Description
{{excerpt}}
{{/if}}

{{#if note}}
## Notes
{{note}}
{{/if}}

{{#if highlights}}
## Highlights
{{#each highlights}}
- {{text}}
{{#if note}}  *Note:* {{note}}{{/if}}
{{/each}}
{{/if}}
```

### File Naming
Template-based with placeholders:
- `{{title}}`: Raindrop title (sanitized)
- `{{id}}`: Unique Raindrop ID
- `{{date}}`: Creation date (YYYY-MM-DD)
- `{{collectionTitle}}`: Collection name

### Tag Processing
Tags are normalized by:
1. Converting spaces to underscores
2. Removing invalid YAML characters: `#[?"*<>:|]`

### Collection Hierarchy
Collections are fetched in parallel (root + nested) and cached for 5 minutes. Paths are built by traversing parent-child relationships to create nested folder structures.

### Rate Limiting
Configurable rate limiter (default 60 req/min) with automatic delays between API calls. Uses `setTimeout` for delays, tested with Jest fake timers.

### File Downloads
For native Raindrop uploads and attachments:
- Detects via `raindrop.link` containing `/v2/` and `/file`
- Downloads via authenticated API endpoint with S3 redirect handling
- Validates file type via MIME types and magic bytes
- Supports PDFs, EPUBs, images, videos, audio files, and documents
- Creates debug files on download failures for troubleshooting
- Configurable via settings toggle

### Automatic Folder Notes
Plugin automatically generates index notes for collection folders:
- Creates `FOLDER_NAME.md` files in each collection directory
- Includes YAML frontmatter with collection metadata
- Lists all notes in the collection with wiki-links
- Improves Obsidian graph compatibility and navigation
- Configurable via settings toggle

### Error Handling
- API errors show user notices but continue processing
- File operation failures are logged but don't stop batch imports
- Network timeouts and rate limits trigger automatic retries

## Integration Points

### External APIs
- **Raindrop.io REST API v1**: Collections, raindrops, file downloads
- Authentication via Bearer token in Authorization header

### Obsidian APIs
- `app.vault`: File creation, binary downloads, path operations
- `app.vault.adapter`: Direct file system access for existence checks
- `normalizePath()`: Cross-platform path handling

### Build System
- **esbuild**: Bundles TypeScript to CommonJS, excludes Obsidian and builtins
- **TypeScript**: Strict checking before build
- Output: `main.js`, `manifest.json`, `styles.css` in project root
- Manifest relocated to root for better compatibility with automated submission tools

## Testing Patterns

### Mock Setup
- Obsidian API automatically mocked in `tests/setup.ts`
- Raindrop data mocked in `tests/mocks/raindropData.ts`
- Use `mockApp`, `mockRequest` from setup for vault operations

### Test Structure
- Unit tests mirror source structure in `tests/unit/utils/`
- Integration tests in `tests/integration/` for end-to-end flows
- Jest with jsdom environment, ts-jest for TypeScript

### Common Test Patterns
```typescript
// Mock API responses
mockRequest.mockResolvedValue(JSON.stringify(mockResponse));

// Test async operations
await expect(asyncFunction()).resolves.toEqual(expected);

// Test error handling
await expect(asyncFunction()).rejects.toThrow('error message');
```

## Configuration

### Settings Structure
Plugin settings include API token, templates, file naming, download options, and UI preferences. Templates are stored per content type with toggle controls.

### Environment Variables
- `npm_package_version`: Used by version bump script
- Hardcoded vault paths in copy script: `/home/frost/Obsidian Vault/` and `/home/frost/Make-It-Rain Test/`

## Key Files for Reference

- `src/main.ts`: Main plugin logic and import orchestration
- `src/utils/index.ts`: Centralized utility exports
- `src/types.ts`: Data structures and interfaces
- `jest.config.js`: Test configuration with coverage thresholds
- `scripts/esbuild.config.mjs`: Build configuration
- `manifest.json`: Plugin metadata and version</content>
<parameter name="filePath">\\wsl.localhost\Ubuntu\home\frost\make-it-rain\AGENTS.md
