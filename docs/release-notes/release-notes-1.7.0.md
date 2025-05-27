## [1.7.0] - 2025-05-06

### Added

- **Pre-calculated Template Variables**: Introduced new variables directly available in templates for easier use and consistency: `formattedCreatedDate`, `formattedUpdatedDate`, `renderedType`, `domain`, `formattedTags`.
- **Directory Creation**: Implemented logic in `processRaindrop` to automatically create necessary target directories before writing note files, preventing "ENOENT: no such file or directory" errors.

### Changed

- **Template Data Structure**:
    - Flattened `collection` data in templates. Instead of `{{collection.id}}`, use `{{collectionId}}`, `{{collectionTitle}}`, `{{collectionPath}}`, and `{{collectionParentId}}` (if available).
    - Standardized the `lastupdate` variable (previously `last_update` or `lastUpdate` in some places) across all templates, `DEFAULT_SETTINGS`, and internal logic.
- **Default Templates Updated**: All default and content-type specific templates within `DEFAULT_SETTINGS` in `src/main.ts` have been updated to:
    - Use the flattened collection variables.
    - Utilize the new pre-calculated display variables instead of template helper functions.
    - Consistently use `lastupdate` and ensure `id: {{id}}` is present.
    - Use `{{bannerFieldName}}` for the cover image in frontmatter.
    - Include a standard 'Details' block with pre-calculated variables.
- **Fallback Note Generation**: Ensured fallback note creation logic (when templates are disabled) in `processRaindrop` uses `lastupdate` and correct newline character `\n` formatting for the note body.
- **README.md "Created Note Structure"**:
    - Replaced the Handlebars template source code example with an example of the *rendered Markdown output* that a user would see in their Obsidian note using the default template. This provides a clearer, more user-friendly illustration of the plugin's output.
    - Previously, also addressed Markdown linting issues (line lengths) and briefly switched template code block highlighting from `markdown` to `handlebars`.
- **Dependencies**: Corrected `package.json` by removing an erroneous `@types/obsidian` devDependency. The primary `obsidian` devDependency remains for type checking.

### Fixed

- **Type Filtering in Modal**: Addressed an issue where fetching raindrops from the modal ignored the selected type filter (logic added to filter `allData` by `options.filterType` in `main.ts` *after* fetching and *before* passing to `processRaindrops`).
- **Collection Hierarchy Replication**: Ensured the collection/sub-collection hierarchy from Raindrop.io is correctly replicated as a folder structure in Obsidian during import (achieved by using `getFullPathSegments` and `createFolderStructure` in `processRaindrop`).
- **Frontmatter Rendering (YAML vs. JSON)**: Resolved an issue where the `collection` frontmatter field could render as a JSON object in Obsidian's reading view by flattening the collection data for the template.
- **Template Helper Rendering**: Fixed issues where template helper functions like `{{formatDate created}}` were not rendering in the "Details" section by pre-calculating these values and adding them to `enhancedDataForRender`.
- **Fallback Note Body Formatting**: Corrected an issue where fallback note generation (templates disabled) output literal `\\n` characters in the note body.

### Documentation

- Updated `docs/template-system.md`: Added `id: {{id}}` to the default template example and ensured consistency with flattened collection variables, `lastupdate`, and pre-calculated variables.
- Updated `docs/template-gallery.md`: Added `id: {{id}}` to relevant template examples and ensured overall consistency with current template variables and structure.
- Verified `docs/templates.md` (variable lists) and `docs/note-structure.md` (fallback structure) are consistent with the latest changes. 