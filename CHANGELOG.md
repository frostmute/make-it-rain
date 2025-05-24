# Changelog

All notable changes to the Make It Rain plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.6.1] - 2025-05-24

### Added

- Added YAML utilities module for proper frontmatter generation
- Fixed YAML/JSON rendering issues in note frontmatter
- Added support for complex data types in frontmatter
- Improved handling of multiline content in frontmatter

### Changed

- Replaced manual frontmatter generation with a robust YAML serialization system
- Enhanced error handling for frontmatter generation

## [1.6.0] - 2025-05-24

### Added

- Added comprehensive documentation to all utility modules
- Added improved code-level documentation throughout the codebase
- Added usage examples in code documentation

### Changed

- Refactored codebase to use functional programming patterns
- Separated utility functions into dedicated modules (fileUtils.ts and apiUtils.ts)
- Enhanced fetchWithRetry to support both old and new parameter patterns for backward compatibility
- Improved error handling and recovery mechanisms
- Updated README with clearer documentation and roadmap

### Fixed

- Fixed TypeScript compilation errors and warnings
- Resolved duplicate function implementations
- Fixed import conflicts between modules

## [1.5.1] - 2025-05-17

### Fixed

- Fixed collection hierarchy to properly maintain nested folder structure when no filter options are selected.
- Improved rate limiting logic with more conservative limits and longer delays between retries.
- Added small delays between consecutive API calls to reduce rate limit issues.
- Added user-visible notices during rate limit waiting periods.
- Fixed JSON parsing issues with API responses.

## [1.5.0] - 2025-05-16

### Added

- Added "Filter by Type" dropdown to fetch modal (Links, Articles, Images, Videos, Documents, Audio).
- Added "Fetch only new items" toggle to fetch modal.
- Added "Update existing notes" toggle to fetch modal with logic to compare Raindrop ID and `last_update`.
- Added "Show Ribbon Icon" toggle in settings.
- Added "Banner Frontmatter Field Name" setting to customize banner field.
- Added "Verify Token" button to API Token setting.
- Implemented logic to add Raindrop ID, collection ID, title, and full path to note frontmatter.

### Changed

- Improved handling of nested collection structures and created corresponding folder paths based on Raindrop.io hierarchy.
- Updated loading notices for better user feedback during fetch and processing.
- Made banner image frontmatter field name configurable.
- Disabled "Fetch only new" when "Update existing" is enabled.

### Fixed

- Improved handling of multi-line excerpts in frontmatter.

## [1.4.0] - 2025-05-16

## [1.3.0] - 2025-05-16

## [1.2.0] - 2025-05-16

## [1.1.0] - 2025-05-16

### Added

- Support for OR logic in tag-based searches
- Improved tag search with individual API calls for better reliability
- Detailed logging for tag search operations
- Comprehensive error handling for API responses
- Rate limiting implementation (120 requests/minute)

### Changed

- Improved tag search query construction
- Enhanced error messages for better debugging
- Updated documentation with new features

### Fixed

- Tag search reliability issues
- Rate limiting compliance
- Error handling in collection fetching

## [1.0.0] - 2024-03-XX

### Added

- Initial release
- Basic Raindrop.io bookmark import functionality
- Collection-based folder organization
- Tag-based filtering
- Custom file naming templates
- Frontmatter support for metadata
- Support for highlights and notes
