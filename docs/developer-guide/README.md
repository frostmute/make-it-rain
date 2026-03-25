# Developer Guide

Welcome to the Make It Rain developer documentation! This directory contains all the resources you need to contribute to the plugin.

## Contents

### Getting Started

- **[Developer Guide](index.md)** - Main developer documentation
  - Project structure
  - Development setup
  - Contribution guidelines
  - Architecture overview
  - Best practices

### Testing

- **[Testing Guide](testing-guide.md)** - Comprehensive testing documentation
  - Running tests
  - Writing tests
  - Test structure
  - Coverage reports
  - Best practices
  - CI/CD integration

- **[BUILD_VERIFICATION.md](BUILD_VERIFICATION.md)** - Build verification guide
  - How to verify builds are successful
  - Common build issues
  - Build scripts overview
  - Quick verification commands

### API Documentation

- **[API Reference](api-reference.md)** - API documentation
  - Raindrop.io API integration
  - Obsidian API usage
  - Plugin interfaces
  - Type definitions

## Quick Links

### First Time Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Read the [Developer Guide](index.md)
4. Run tests: `npm test`
5. Build: `npm run build`

### Development Workflow

```bash
# Install dependencies
npm install

# Run tests in watch mode
npm run test:watch

# Build in development mode
npm run dev

# Build for production
npm run build

# Run all tests
npm test

# Generate coverage report
npm run test:coverage
```

### Common Tasks

| Task | Command | Documentation |
|------|---------|---------------|
| Run tests | `npm test` | [Testing Guide](testing-guide.md) |
| Build plugin | `npm run build` | [BUILD_VERIFICATION.md](BUILD_VERIFICATION.md) |
| Watch mode | `npm run dev` | [Developer Guide](index.md) |
| Coverage | `npm run test:coverage` | [Testing Guide](testing-guide.md) |
| Lint markdown | `npm run lint:md` | [Developer Guide](index.md) |

## Documentation Standards

When contributing documentation:

1. **Use Markdown** for all documentation files
2. **Follow existing structure** in the docs/ directory
3. **Include code examples** where helpful
4. **Update the table of contents** when adding new sections
5. **Link between related documents** for easy navigation

## Project Structure

```
make-it-rain/
├── src/                      # Source code
│   ├── main.ts              # Plugin entry point
│   ├── types.ts             # Type definitions
│   └── utils/               # Utility functions
├── tests/                    # Test suite
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   └── mocks/               # Test fixtures
├── docs/                     # Documentation
│   ├── developer-guide/     # You are here!
│   ├── meta/                # Meta documentation
│   └── release-notes/       # Version history
├── scripts/                  # Build scripts
└── build/                    # Build output
```

## Contributing

Before contributing, please:

1. Read the [Developer Guide](index.md)
2. Check existing [issues](https://github.com/frostmute/make-it-rain/issues)
3. Write tests for new features
4. Follow the coding style
5. Update documentation

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/frostmute/make-it-rain/issues)
- **Discussions**: [GitHub Discussions](https://github.com/frostmute/make-it-rain/discussions)
- **Troubleshooting**: [docs/user-guide/troubleshooting.md](../user-guide/troubleshooting.md)

## Additional Resources

### User Documentation

For user-facing documentation, see the main [docs](../) directory:
- Installation guide
- Configuration guide
- Usage guide
- Template system
- FAQ

### Meta Documentation

For temporary/meta documentation, see [docs/meta/](../meta/):
- Cleanup plans
- Setup documentation
- Historical records

---

**Ready to contribute?** Start with the [Developer Guide](index.md)!