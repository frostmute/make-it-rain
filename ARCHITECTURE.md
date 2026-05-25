# Architecture

This document describes the high-level architecture of **Make It Rain**.

## Bird's Eye View

Make It Rain is an Obsidian plugin that acts as a bridge between the [Raindrop.io API](https://developer.raindrop.io/) and the Obsidian local file system. The primary goal is to transform cloud-stored bookmarks into structured, searchable, and locally-owned Markdown notes.

### Data Flow

1.  **Authentication**: The plugin uses a developer token to authenticate requests via Bearer token in the `Authorization` header.
2.  **Discovery**:
    *   **Collections**: The plugin fetches the user's collection hierarchy (root and nested).
    *   **Raindrops**: It iterates through selected collections to retrieve bookmark metadata.
3.  **Transformation**:
    *   Each Raindrop item is processed through a **Template System**.
    *   Variables (title, excerpt, note, highlights, tags, etc.) are extracted and sanitized.
    *   Content-type-specific templates (Article, Image, Video, Document, etc.) are applied to generate the final Markdown string.
4.  **Persistence**:
    *   **Folder Mapping**: Collections are mapped to a nested folder structure in the Obsidian vault.
    *   **Note Creation**: Markdown files are written to the vault using the `app.vault` API.
    *   **Folder Notes**: Index notes are optionally generated for each collection folder.
    *   **Binary Downloads**: File attachments (PDFs, images, etc.) are downloaded and stored locally.

## Code Map

The project is structured into a main entry point and several utility modules that handle specific responsibilities.

### Core Components

*   `src/main.ts`: The `RaindropToObsidian` class. It manages the plugin lifecycle, settings, and orchestrates the import workflows (Bulk and Quick Import).
*   `src/modals.ts`: Handles user interaction for choosing what to import. It bridges the UI and the underlying import logic.
*   `src/settings.ts`: Defines the `RaindropSettingTab`, allowing users to configure API tokens, folder locations, templates, and behavior toggles.
*   `src/types.ts`: Centralized TypeScript interfaces for Raindrop API responses, plugin settings, and internal data structures.

### Utility Modules (`src/utils/`)

*   `apiUtils.ts`: Handles all network communication. It includes **Rate Limiting** logic (default 60 requests/minute) and automatic retry mechanisms for failed requests.
*   `fileUtils.ts`: Manages interactions with the Obsidian vault. It handles path sanitization, folder creation, and binary file writing.
*   `formatUtils.ts`: Provides helpers for data normalization, such as date formatting, tag sanitization (removing invalid characters), and domain extraction.
*   `yamlUtils.ts`: Dedicated to generating valid YAML frontmatter, ensuring proper escaping of special characters to maintain Obsidian's metadata integrity.
*   `scrapingUtils.ts`: Used for extracting content from Raindrop's permanent archives (HTML/Text) when full content is available.
*   `securityUtils.ts`: Ensures that imported content is sanitized to prevent XSS or malicious code execution within Obsidian.

## Architecture Invariants

To maintain a robust and predictable system, we adhere to these invariants:

1.  **Strict Rate Limiting**: All API calls must pass through the `apiUtils` rate limiter to avoid 429 errors and ensure fair usage of the Raindrop.io API.
2.  **Path Safety**: All file and folder names derived from user content (e.g., Raindrop titles) must be sanitized using `fileUtils` to ensure compatibility across different operating systems and Obsidian vault requirements.
3.  **Decoupled Templates**: Rendering logic is separated from data fetching. Templates are user-configurable and content-aware, allowing for significant flexibility without altering the core import logic.
4.  **Failsafe Operations**: Network or file system failures during a batch import should be caught and logged (via User Notices or console), allowing the rest of the batch to continue whenever possible.
5.  **Data Integrity**: Frontmatter generation must use `yamlUtils` to ensure that strings containing reserved YAML characters are properly quoted or escaped.

## Cross-Cutting Concerns

### Testing Strategy

We use **Jest** for unit and integration testing.
*   **Mocks**: Obsidian and Raindrop APIs are mocked to allow tests to run in a Node.js environment.
*   **Coverage**: We maintain high coverage for utility modules where data transformation logic resides.

### Error Handling

The plugin distinguishes between transient network errors (which trigger retries) and permanent errors (which are reported to the user). We prioritize completing as much of an import as possible even if individual items fail.

### Build System

The project uses **esbuild** for fast bundling of TypeScript into CommonJS modules compatible with Obsidian. The build pipeline includes strict TypeScript checking to ensure type safety.
