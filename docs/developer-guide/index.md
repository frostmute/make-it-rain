# Developer Guide

This guide provides information for developers who want to contribute to the Make It Rain plugin.

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Testing](#testing)
- [Contributing](#contributing)
- [Architecture](#architecture)
- [Best Practices](#best-practices)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git
- Obsidian (for testing)
- Raindrop.io account and API token

### Quick Start

1. Fork the repository
2. Clone your fork
3. Install dependencies
4. Build the plugin
5. Link to Obsidian

```bash
# Clone repository
git clone https://github.com/your-username/make-it-rain.git

# Install dependencies
npm install

# Build plugin
npm run build

# Watch for changes
npm run dev
```

## Project Structure

```plaintext
make-it-rain/
├── src/
│   ├── types.ts              # Centralized TypeScript interfaces
│   ├── main.ts               # Plugin lifecycle and entry point
│   ├── settings.ts           # Settings UI (RaindropSettingTab)
│   ├── modals.ts             # Interactive user prompts (Bulk/Quick import)
│   ├── template-validator.ts # AST-based template parsing logic
│   └── utils/                # Functional utility modules
│       ├── apiUtils.ts       # Network and rate-limiting
│       ├── fileUtils.ts      # Vault operations and path sanitization
│       ├── formatUtils.ts    # Date, tag, and domain formatting
│       ├── yamlUtils.ts      # Frontmatter generation
│       ├── scrapingUtils.ts  # HTML extraction
│       └── securityUtils.ts  # Content sanitization
├── tests/                    # Test files (unit and integration)
├── docs/                     # Documentation
├── manifest.json             # Plugin manifest
└── package.json              # Dependencies
```

### Key Directories

- `src/`: Core plugin lifecycle, UI bridges, and Types.
- `src/utils/`: Functional utilities handling data transformation and side effects.
- `tests/`: Jest test suites containing unit and integration tests.

## Development Setup

### Environment Setup

1. Install dependencies
2. Configure development environment
3. Set up testing environment
4. Configure API access

### Development Workflow

1. Create feature branch
2. Make changes
3. Run tests
4. Build plugin
5. Test in Obsidian
6. Submit PR

### Debugging

1. Enable developer mode
2. Use console logging
3. Check error messages
4. Monitor network requests

## Testing

### Unit Tests

```typescript
// Example test
import { validateTemplate } from '../../src/template-validator';

describe('validateTemplate', () => {
    it('should validate AST template structure', () => {
        const result = validateTemplate('{{#if excerpt}}{{excerpt}}{{/if}}');
        expect(result.isValid).toBe(true);
    });
});
```

### Integration Tests

```typescript
// Example test
describe('Import Workflow', () => {
    it('should process a collection and create notes', async () => {
        // Setup mocks for app.vault and apiUtils
        // Trigger bulk import flow
        // Expect app.vault.create to have been called with correctly formatted markdown
    });
});
```

### Test Coverage

1. Run tests with coverage
2. Check coverage report
3. Add missing tests
4. Maintain coverage

## Contributing

### Code Style

- Use TypeScript
- Follow ESLint rules
- Use Prettier
- Add comments

### Git Workflow

1. Create branch
2. Make changes
3. Commit changes
4. Push branch
5. Create PR

### Pull Request Process

1. Update documentation
2. Add tests
3. Check CI
4. Get review
5. Merge changes

## Architecture

### Core Components

The plugin is structured around a functional utility pattern driven by a central orchestrator class:

- **`RaindropToObsidian` (`main.ts`)**: The core orchestrator managing settings, plugin lifecycle, and the execution of bulk/quick import workflows.
- **UI Modules (`modals.ts`, `settings.ts`)**: Provide the user interface for input and configuration.
- **Utility Modules (`src/utils/*.ts`)**: Isolate pure data transformation and specific side-effects (e.g., `apiUtils` for network, `fileUtils` for Obsidian vault writes, `template-validator` for AST parsing).

### Modular Data Flow

1. **Initiation**: User triggers an import (bulk, folder, or single).
2. **Collection Resolution**: `fetchAllUserCollections` builds a complete parent-child hierarchy.
3. **Item Fetching**: Parallelized or sequential fetching based on filters, managed by a centralized `RateLimiter`.
4. **Processing**: Items are sanitized, tags are normalized, and templates are rendered.
5. **Persistence**: Notes are created in the Obsidian vault with structured metadata.

## Best Practices

### Code Organization

1. Use TypeScript
2. Keep UI logic separate from data processing
3. Rely on functional utility modules (`src/utils/`) over large OOP state machines
4. Maintain high test coverage for string/data transformations

### Error Handling

```typescript
try {
    await processItems(items);
} catch (error) {
    new Notice('Import failed: ' + error.message);
    console.error('Make It Rain Error:', error);
}
```

### Performance

1. Use async/await
2. Implement caching
3. Optimize templates
4. Monitor resources

### Security

1. Validate input
2. Handle tokens
3. Sanitize output
4. Check permissions

## API Integration

### Raindrop.io API

```typescript
// Example API call
import { fetchRaindrops } from './utils/apiUtils';

const items = await fetchRaindrops(token, collectionId, 0);
```

### Obsidian API

```typescript
// Example Obsidian API usage
app.vault.create(
    'path/to/note.md',
    content
);
```

## Template System

### Template Development

```typescript
// Example template
const template = `
# {{title}}

{{#if excerpt}}
## Summary
{{excerpt}}
{{/if}}
`;
```

### Template Variables

- `{{title}}`: Raindrop title (YAML-escaped)
- `{{excerpt}}`: Raindrop excerpt (YAML-escaped)
- `{{link}}`: Original URL (alias `{{url}}`)
- `{{type}}`: Content type (e.g., `article`)
- `{{created}}`: Creation date (ISO)
- `{{lastupdate}}`: Last update date (alias `{{updated}}`)
- `{{collectionTitle}}`: Collection name
- `{{tags}}`: Array of tags

### Template Helpers

- `{{#if}}`: Conditional blocks
- `{{#each}}`: Iteration
- `{{uppercase}}`: UPPERCASE transformation
- `{{lowercase}}`: lowercase transformation
- `{{titlecase}}`: Title Case transformation
- `{{truncate}}`: String truncation with length parameter

## Error Handling

### Common Errors

1. API Rate Limits
2. Network Issues
3. Invalid Templates
4. File System Errors

### Error Recovery

1. Automatic Retries
2. Fallback Options
3. User Notifications
4. Error Logging

## Performance Optimization

### Caching

1. API Response Cache
2. Template Cache
3. File System Cache
4. Memory Management

### Resource Management

1. Connection Pooling
2. Memory Usage
3. File Handles
4. Network Connections

## Security Considerations

### API Security

1. Token Management
2. Rate Limiting
3. Request Validation
4. Response Sanitization

### File System Security

1. Path Validation
2. Permission Checks
3. File Operations
4. Error Handling

## Documentation

### Code Documentation

1. JSDoc Comments
2. Type Definitions
3. API Documentation
4. Usage Examples

### User Documentation

1. Installation Guide
2. Configuration Guide
3. Usage Guide
4. Troubleshooting Guide

## Release Process

### Version Management

1. Semantic Versioning
2. Changelog Updates
3. Release Notes
4. Tag Management

### Deployment

1. Build Process
2. Testing
3. Distribution
4. Updates

## Support

### Community Support

1. GitHub Issues
2. Discussions
3. Pull Requests
4. Documentation

### Developer Support

1. Code Review
2. Mentoring
3. Best Practices
4. Tools and Resources
