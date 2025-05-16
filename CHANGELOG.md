# Changelog

All notable changes to the Make It Rain plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
