# 👨‍💻 Developer Guide

Welcome to the Make It Rain **Developer Guide**! This comprehensive documentation will help you set up a development environment, understand the codebase, and contribute to the project.

---

## 🎯 What's in This Guide?

This guide covers everything you need to contribute:

- **Getting Started**: Setting up your development environment
- **Architecture**: Understanding the codebase structure
- **Technology Stack**: Tools and frameworks used
- **Development Workflow**: How to build, test, and submit changes
- **Code Standards**: Style guides and best practices
- **Testing**: Writing and running tests
- **Resources**: API documentation and references

---

## ⚡ Quick Start for Developers

### Prerequisites

Before you start, ensure you have:
- **Node.js** 16+ and npm
- **Git** for version control
- **TypeScript** knowledge
- Basic understanding of Obsidian plugins
- Code editor (VS Code recommended)

### Get Set Up in 5 Minutes

```bash
# 1. Clone the repository
git clone https://github.com/frostmute/make-it-rain.git
cd make-it-rain

# 2. Install dependencies
npm install

# 3. Run tests to verify setup
npm test

# 4. Start development build
npm run dev

# 5. You're ready to code!
```

That's it! Your environment is ready.

---

## 🏗️ Project Architecture

### High-Level Overview

Make It Rain is an **Obsidian plugin** built with TypeScript that integrates with the **Raindrop.io API** to import bookmarks into your vault.

```
┌─────────────────────────────────────────────────────────┐
│                    Obsidian Vault                       │
│  (Note files, folder structure, metadata)               │
└────────────────────▲────────────────────────────────────┘
                     │ (Write files, create folders)
                     │
┌────────────────────┴────────────────────────────────────┐
│          Make It Rain Plugin (TypeScript)               │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ User Interface (Settings, Modals)               │  │
│  │  - Settings Tab                                 │  │
│  │  - Fetch Modal                                  │  │
│  │  - Quick Import Modal                           │  │
│  └─────────────────────────────────────────────────┘  │
│                     ▲ (User interactions)               │
│                     │                                   │
│  ┌─────────────────┴─────────────────────────────────┐ │
│  │ Core Logic (Processors, Templates, Filters)      │ │
│  │  - Raindrop processing                           │ │
│  │  - Template rendering                            │ │
│  │  - Filter logic                                  │ │
│  │  - File/folder operations                        │ │
│  └────────────────┬─────────────────────────────────┘ │
│                   │                                    │
│  ┌────────────────▼─────────────────────────────────┐ │
│  │ API Layer (Rate limiting, Error handling)        │ │
│  │  - Raindrop.io API client                        │ │
│  │  - Rate limiting & retry logic                   │ │
│  │  - Error handling                                │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────┬──────────────────────────────────┘
                     │ (HTTP requests)
                     ▼
        ┌─────────────────────────────────┐
        │    Raindrop.io API              │
        │    (REST endpoints)             │
        └─────────────────────────────────┘
```

### Core Modules

| Module | Purpose | Key Files |
|--------|---------|-----------|
| **UI Layer** | User interface components | `main.ts`, `settingsTab.ts`, `modals/` |
| **API Client** | Raindrop.io integration | `api/` |
| **Processing** | Core business logic | `processors/`, `utils/` |
| **Templates** | Template rendering | `templates/`, `template-system/` |
| **File I/O** | Vault file operations | `utils/fileUtils.ts` |
| **Types** | TypeScript definitions | `types.ts` |

### Data Flow

```
1. User opens plugin or runs command
   ↓
2. Modal/Settings UI captures input
   ↓
3. Plugin processes user selections
   ↓
4. API layer fetches from Raindrop.io
   ↓
5. Processing layer:
   - Applies filters
   - Renders templates
   - Generates notes
   ↓
6. File I/O writes to vault
   ↓
7. User sees imported notes in Obsidian
```

---

## 🛠️ Technology Stack

### Core Technologies

| Technology | Purpose | Version |
|---|---|---|
| **TypeScript** | Language | 5.x |
| **Node.js** | Runtime | 16+ |
| **Obsidian API** | Plugin framework | Latest |
| **Handlebars** | Template engine | 4.x |
| **esbuild** | Build tool | Latest |
| **Jest** | Testing framework | 29.x |

### Key Dependencies

```json
{
  "dependencies": {
    "obsidian": "latest",
    "handlebars": "^4.7.7"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/jest": "^29.0.0",
    "jest": "^29.0.0",
    "esbuild": "^0.17.0",
    "@typescript-eslint/eslint-plugin": "^5.x",
    "@typescript-eslint/parser": "^5.x"
  }
}
```

### Build Tools

- **esbuild**: Bundles TypeScript into single `main.js`
- **TypeScript**: Provides type safety and compilation
- **Jest**: Runs unit and integration tests
- **ESLint**: Enforces code style (optional, configured)

---

## 📁 Project Structure

```
make-it-rain/
├── src/
│   ├── main.ts                 # Plugin entry point
│   ├── types.ts                # TypeScript type definitions
│   ├── settingsTab.ts          # Settings UI component
│   ├── api/
│   │   ├── raindropClient.ts   # Raindrop.io API wrapper
│   │   └── types.ts            # API response types
│   ├── modals/
│   │   ├── FetchModal.ts       # Bulk fetch UI
│   │   └── QuickImportModal.ts # Quick import UI
│   ├── processors/
│   │   ├── raindropProcessor.ts # Core processing logic
│   │   └── templateProcessor.ts # Template rendering
│   ├── template-system/
│   │   ├── templates.ts        # Default templates
│   │   └── helpers.ts          # Template helper functions
│   └── utils/
│       ├── fileUtils.ts        # File I/O operations
│       ├── apiUtils.ts         # API helper functions
│       ├── logger.ts           # Logging utilities
│       └── validators.ts       # Input validation
├── tests/
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── mocks/                  # Test fixtures and mocks
├── docs/
│   ├── index.md                # Documentation index
│   ├── user-guide/             # User documentation
│   └── developer-guide/        # Developer documentation
├── scripts/
│   └── esbuild.config.mjs      # Build configuration
├── manifest.json               # Plugin metadata
├── package.json                # npm configuration
├── tsconfig.json               # TypeScript configuration
├── jest.config.js              # Jest configuration
├── .eslintrc.json             # ESLint configuration
└── README.md                   # Project readme
```

### Key Files Explained

| File | Purpose |
|------|---------|
| `main.ts` | Plugin initialization and command registration |
| `settingsTab.ts` | Settings UI for API token, templates, etc. |
| `raindropClient.ts` | Wrapper around Raindrop.io REST API |
| `raindropProcessor.ts` | Main logic for processing raindrops |
| `FetchModal.ts` | UI for bulk import with filtering |
| `QuickImportModal.ts` | UI for importing single bookmarks |
| `fileUtils.ts` | Vault file operations (create, write, folders) |
| `types.ts` | Type definitions for plugin data |

---

## 🚀 Development Workflow

### Setting Up Your Environment

#### 1. Clone and Install

```bash
git clone https://github.com/frostmute/make-it-rain.git
cd make-it-rain
npm install
```

#### 2. Understand the Build

```bash
# Development build (watches for changes)
npm run dev

# Production build
npm run build

# Clean build
npm run build:clean
```

#### 3. Plugin Installation for Testing

```bash
# Copy build output to test vault
# Typically: ~/.obsidian/vaults/YOUR_VAULT/.obsidian/plugins/make-it-rain/

# Or use esbuild watch:
npm run dev
```

### Development Commands

```bash
# Start development build (watches for changes)
npm run dev

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Build for production
npm run build

# Clean build artifacts
npm run build:clean

# Type check (no compilation)
npm run type-check

# Lint markdown documentation
npm run lint:md
```

### Creating a Feature

#### Step 1: Create a Branch

```bash
git checkout -b feature/your-feature-name
git push -u origin feature/your-feature-name
```

#### Step 2: Make Your Changes

- Create or modify files in `src/`
- Follow code standards (see section below)
- Add tests for new functionality
- Update documentation as needed

#### Step 3: Test Your Changes

```bash
# Run tests
npm test

# Test in Obsidian vault
npm run dev
# Then reload plugin in Obsidian
```

#### Step 4: Commit and Push

```bash
git add .
git commit -m "feat: add new feature description"
git push origin feature/your-feature-name
```

#### Step 5: Submit a Pull Request

- Go to GitHub repository
- Create PR from your branch to `main`
- Follow PR template
- Wait for review and feedback

---

## 📋 Code Standards & Style

### TypeScript Guidelines

#### Naming Conventions

```typescript
// Classes: PascalCase
class RaindropClient { }

// Interfaces: PascalCase, with I prefix (optional)
interface IRaindrop { }
interface FetchOptions { }

// Functions: camelCase
function processRaindrop() { }

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const API_BASE_URL = "https://api.raindrop.io";

// Variables: camelCase
let currentProgress = 0;
const apiToken = "xxx";

// Private members: _leadingUnderscore
class MyClass {
  private _internalState = 0;
}

// Booleans: is/has prefix
const isLoading = false;
const hasError = true;
```

#### Type Annotations

Always include type annotations for clarity:

```typescript
// ✅ Good
function fetchRaindrops(token: string, limit: number): Promise<Raindrop[]> {
  // ...
}

const config: FetchConfig = {
  token: "xxx",
  limit: 50,
};

// ❌ Avoid
function fetchRaindrops(token, limit) {
  // ...
}

const config = {
  token: "xxx",
  limit: 50,
};
```

#### Comments and Documentation

```typescript
/**
 * Fetches raindrops from Raindrop.io API
 * @param token - API authentication token
 * @param options - Fetch configuration options
 * @returns Promise resolving to array of raindrops
 * @throws {ApiError} If API request fails
 */
function fetchRaindrops(token: string, options: FetchOptions): Promise<Raindrop[]> {
  // Implementation
}

// Use comments for "why", not "what"
// ✅ Good
// Retry with exponential backoff to handle rate limiting
const delay = Math.pow(2, retryCount) * 1000;

// ❌ Avoid
// Add delay
const delay = Math.pow(2, retryCount) * 1000;
```

### Code Organization

#### Module Structure

```typescript
// imports
import { Obsidian } from "obsidian";
import { RaindropClient } from "./api/raindropClient";

// types/interfaces
interface ProcessorOptions {
  token: string;
  limit: number;
}

// constants
const DEFAULT_LIMIT = 50;

// class/functions
class RaindropProcessor {
  // constructor
  constructor(private client: RaindropClient) {}

  // public methods
  async process(options: ProcessorOptions): Promise<void> {
    // ...
  }

  // private methods
  private async validate(data: unknown): Promise<void> {
    // ...
  }
}

// exports
export { RaindropProcessor };
export type { ProcessorOptions };
```

#### Error Handling

```typescript
// Define custom error types
class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Use try-catch with proper typing
try {
  const result = await fetchRaindrops(token);
  return result;
} catch (error) {
  if (error instanceof ApiError) {
    // Handle API errors
    console.error(`API Error ${error.statusCode}: ${error.message}`);
  } else if (error instanceof Error) {
    // Handle generic errors
    console.error(`Error: ${error.message}`);
  } else {
    // Handle unknown errors
    console.error("Unknown error occurred");
  }
  throw error;
}
```

### Style Rules

| Rule | Example |
|------|---------|
| **Max line length** | 100 characters (soft), 120 (hard) |
| **Indentation** | 2 spaces (no tabs) |
| **Semicolons** | Required at end of statements |
| **Quotes** | Double quotes (`"`) preferred |
| **Trailing commas** | Include in multi-line structures |
| **Unused variables** | Remove or prefix with `_` |
| **Console logs** | Use `logger` utility in production |

#### Formatting Example

```typescript
// ✅ Good
function processRaindrops(
  raindrops: Raindrop[],
  options: ProcessOptions,
): Promise<ProcessResult> {
  return raindrops
    .filter((r) => shouldInclude(r, options))
    .map((r) => transformRaindrop(r))
    .reduce((acc, r) => merge(acc, r), {});
}

// ❌ Avoid
function processRaindrops(raindrops, options) {
  let result = {}
  for(let i=0; i<raindrops.length; i++){
    if(shouldInclude(raindrops[i],options)){
      result = merge(result, transformRaindrop(raindrops[i]))
    }
  }
  return result
}
```

---

## ✅ Testing Guide

### Writing Tests

#### Test Structure

```typescript
// tests/unit/processors/raindropProcessor.test.ts

import { RaindropProcessor } from "../../../src/processors/raindropProcessor";
import { mockRaindropClient } from "../../mocks/raindropClient";

describe("RaindropProcessor", () => {
  let processor: RaindropProcessor;

  beforeEach(() => {
    processor = new RaindropProcessor(mockRaindropClient());
  });

  describe("processRaindrop", () => {
    it("should create a note with correct title", async () => {
      const raindrop = {
        id: 123,
        title: "Test Article",
        link: "https://example.com",
      };

      const result = await processor.processRaindrop(raindrop);

      expect(result.title).toBe("Test Article");
    });

    it("should throw error on invalid input", async () => {
      await expect(processor.processRaindrop(null)).rejects.toThrow();
    });
  });
});
```

#### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- raindropProcessor.test.ts

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

#### Test Coverage Goals

- Aim for **80%+ coverage** on core modules
- **100% coverage** on critical paths (API, processing)
- Focus on **integration tests** for complex workflows
- Mock external dependencies (API, Obsidian, file system)

### Test Best Practices

1. **Descriptive test names**: `it("should create note with correct frontmatter when given valid raindrop")`
2. **Arrange-Act-Assert pattern**: Setup → Execute → Verify
3. **Use mocks** for external dependencies
4. **Test edge cases**: null, empty, errors
5. **Avoid test interdependencies**: Each test should be independent

---

## 🐛 Debugging

### Development Mode

```bash
# Start dev build with watch
npm run dev

# In Obsidian: Settings → Community Plugins → Reload plugin
# (Or reload with Ctrl/Cmd+R in plugin folder)
```

### Viewing Logs

```typescript
// Use logger utility
import { logger } from "./utils/logger";

logger.info("Processing started", { itemCount: 10 });
logger.error("Failed to fetch", { error });
logger.debug("Details", { data });
```

Access logs in:
- **Obsidian Console**: Ctrl/Cmd+Shift+I → Console tab
- **File**: Check plugin logs directory

### Common Issues

| Issue | Solution |
|---|---|
| **Changes not reflected** | Reload plugin (Ctrl/Cmd+R) or restart Obsidian |
| **Type errors** | Run `npm run type-check` |
| **Build fails** | Check `npm run build` output |
| **Tests fail** | Review error message, check mock setup |

---

## 📚 Additional Resources

### Within This Project

- **[Architecture Deep Dive](index.md)** - Detailed architecture explanation
- **[API Reference](api-reference.md)** - Plugin and Raindrop API docs
- **[Testing Guide](testing-guide.md)** - Comprehensive testing documentation
- **[Build Verification](BUILD_VERIFICATION.md)** - Verifying builds work

### External Resources

- **[Obsidian Plugin Docs](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)** - Official plugin development
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)** - TypeScript reference
- **[Handlebars Docs](https://handlebarsjs.com/)** - Template syntax
- **[Raindrop.io API](https://developer.raindrop.io/)** - API reference

---

## 🤝 Contribution Checklist

Before submitting a pull request, ensure:

- [ ] Code follows style guidelines (this document)
- [ ] All tests pass (`npm test`)
- [ ] New features have tests
- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] Documentation is updated (if needed)
- [ ] Commit messages are descriptive
- [ ] No console.log() statements in production code
- [ ] No hardcoded values (use constants or config)
- [ ] Error handling is implemented
- [ ] Comments explain "why", not "what"

---

## 🔗 Getting Help

- **Questions about architecture?** Check [Architecture Overview](index.md)
- **Need API details?** See [API Reference](api-reference.md)
- **Testing questions?** Read [Testing Guide](testing-guide.md)
- **GitHub Issues?** Search [existing issues](https://github.com/frostmute/make-it-rain/issues)
- **General help?** Ask in [GitHub Discussions](https://github.com/frostmute/make-it-rain/discussions)

---

## 📝 Next Steps

1. **Set up your environment**: Follow [Quick Start](#-quick-start-for-developers)
2. **Read the architecture**: Review [Project Architecture](#-project-architecture)
3. **Pick an issue**: Find a good first issue in GitHub
4. **Create a feature branch**: Start coding!
5. **Write tests**: Ensure quality
6. **Submit a PR**: Contribute your changes!

---

<div align="center">

**Ready to contribute?** Start with the [Contributing Guide](../../CONTRIBUTING.md)

**Questions?** Check the [FAQ](../user-guide/faq.md) or [Discussions](https://github.com/frostmute/make-it-rain/discussions)

</div>