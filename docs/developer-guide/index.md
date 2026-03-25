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
│   ├── components/     # UI components
│   ├── services/       # Core services
│   ├── types/         # TypeScript types
│   ├── utils/         # Utility functions
│   └── main.ts        # Plugin entry point
├── tests/             # Test files
├── docs/              # Documentation
├── manifest.json      # Plugin manifest
└── package.json       # Dependencies
```

### Key Directories

- `src/components/`: UI components and views
- `src/services/`: Core functionality
- `src/types/`: TypeScript interfaces
- `src/utils/`: Helper functions
- `tests/`: Test suites

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
describe('TemplateService', () => {
    it('should validate template', () => {
        const service = new TemplateService();
        const result = service.validateTemplate('{{title}}');
        expect(result.valid).toBe(true);
    });
});
```

### Integration Tests

```typescript
// Example test
describe('ImportService', () => {
    it('should import items', async () => {
        const service = new ImportService();
        const items = await service.importItems([], {});
        expect(items).toBeDefined();
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

- `RaindropService`: API integration
- `TemplateService`: Template processing
- `ImportService`: Note creation
- `SettingsService`: Configuration

### Data Flow

1. User triggers import
2. Fetch data from API
3. Process templates
4. Create notes
5. Update UI

### Event System

```typescript
// Example event handling
eventManager.on(PluginEventType.IMPORT_START, (event) => {
    console.log('Import started:', event.data);
});
```

## Best Practices

### Code Organization

1. Use TypeScript
2. Follow SOLID principles
3. Write clean code
4. Add documentation

### Error Handling

```typescript
try {
    await service.importItems(items);
} catch (error) {
    errorHandler.handle(error);
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
const items = await raindropService.getCollectionItems(id, {
    page: 1,
    perPage: 50
});
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

- `{{title}}`: Raindrop title
- `{{excerpt}}`: Raindrop excerpt
- `{{url}}`: Original URL
- `{{type}}`: Content type
- `{{created}}`: Creation date
- `{{updated}}`: Last update date
- `{{collection}}`: Collection info
- `{{tags}}`: Raindrop tags

### Template Helpers

- `{{#if}}`: Conditional blocks
- `{{#each}}`: Iteration
- `{{formatDate}}`: Date formatting
- `{{sanitize}}`: Text sanitization

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
