# Testing Guide

This guide provides comprehensive information about testing the Make It Rain plugin.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Mocking](#mocking)
- [Coverage](#coverage)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Overview

Make It Rain uses **Jest** as its testing framework with **TypeScript** support via `ts-jest`. The test suite is designed to ensure code quality, catch regressions early, and provide confidence when making changes.

### Why Test?

- **Prevent Regressions**: Catch bugs before they reach users
- **Enable Refactoring**: Make changes with confidence
- **Document Behavior**: Tests serve as executable documentation
- **Improve Design**: Writing testable code leads to better architecture
- **Save Time**: Automated tests are faster than manual testing

### Test Types

1. **Unit Tests**: Test individual functions and utilities in isolation
2. **Integration Tests**: Test how components work together
3. **E2E Tests**: (Future) Test the entire plugin workflow

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm or yarn
- Basic understanding of Jest and TypeScript

### Installation

All testing dependencies are included in the project. Simply run:

```bash
npm install
```

This will install:

- `jest`: Testing framework
- `ts-jest`: TypeScript support for Jest
- `@types/jest`: TypeScript definitions
- `jest-environment-jsdom`: Browser-like environment for tests

### Project Structure

```
make-it-rain/
├── src/                        # Source code
│   ├── main.ts
│   ├── types.ts
│   └── utils/
│       ├── apiUtils.ts
│       ├── fileUtils.ts
│       └── yamlUtils.ts
├── tests/                      # Test files
│   ├── setup.ts               # Test configuration
│   ├── unit/                  # Unit tests
│   │   └── utils/
│   │       ├── apiUtils.test.ts
│   │       ├── fileUtils.test.ts
│   │       └── yamlUtils.test.ts
│   ├── integration/           # Integration tests
│   └── mocks/                 # Mock data
│       └── raindropData.ts
├── jest.config.js             # Jest configuration
└── package.json               # Test scripts
```

## Running Tests

### All Tests

Run the entire test suite:

```bash
npm test
```

### Watch Mode

Automatically re-run tests when files change:

```bash
npm run test:watch
```

This is useful during development. Jest will:

- Only run tests related to changed files
- Provide an interactive menu for filtering tests
- Show test results in real-time

### Coverage Report

Generate a coverage report:

```bash
npm run test:coverage
```

This creates:

- Terminal summary of coverage
- HTML report in `coverage/lcov-report/index.html`
- LCOV file for CI tools

### Verbose Output

Get detailed test output:

```bash
npm run test:verbose
```

### Specific Tests

Run tests for a specific file:

```bash
npm test fileUtils.test.ts
```

Run tests matching a pattern:

```bash
npm test -- --testNamePattern="sanitizeFileName"
```

Run tests in a specific directory:

```bash
npm test -- tests/unit/utils/
```

### Debug Mode

Debug tests with Node.js inspector:

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome and click "inspect".

## Test Structure

### File Organization

```
tests/
├── setup.ts                    # Global test setup
├── unit/                       # Unit tests mirror src structure
│   └── utils/
│       ├── apiUtils.test.ts
│       ├── fileUtils.test.ts
│       └── yamlUtils.test.ts
├── integration/                # Cross-component tests
│   └── importFlow.test.ts
└── mocks/                      # Reusable mock data
    └── raindropData.ts
```

### Test File Anatomy

```typescript
/**
 * Unit Tests for [Module Name]
 * =============================
 * 
 * Brief description of what's being tested.
 */

import { functionToTest } from '../../../src/utils/module';

describe('Module Name', () => {
    // Setup before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Cleanup after each test
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('functionToTest', () => {
        it('should do something specific', () => {
            // Arrange
            const input = 'test';
            
            // Act
            const result = functionToTest(input);
            
            // Assert
            expect(result).toBe('expected');
        });

        it('should handle edge case', () => {
            expect(functionToTest('')).toBe('default');
        });
    });
});
```

## Writing Tests

### AAA Pattern

Structure tests using **Arrange-Act-Assert**:

```typescript
it('should create a folder', async () => {
    // Arrange: Set up test data and mocks
    const mockApp = createMockApp();
    mockApp.vault.adapter.exists.mockResolvedValue(false);
    
    // Act: Execute the code being tested
    const result = await createFolder(mockApp, 'test/folder');
    
    // Assert: Verify the results
    expect(result).toBe(true);
    expect(mockApp.vault.createFolder).toHaveBeenCalledWith('test/folder');
});
```

### Descriptive Test Names

Use clear, descriptive test names:

```typescript
// ✅ Good: Describes what's being tested and expected behavior
it('should remove invalid characters from file names', () => {});
it('should return default name when input is empty', () => {});
it('should truncate file names longer than 200 characters', () => {});

// ❌ Bad: Vague or non-descriptive
it('test 1', () => {});
it('works', () => {});
it('should sanitize', () => {});
```

### Test Edge Cases

Always test boundary conditions:

```typescript
describe('sanitizeFileName', () => {
    // Normal cases
    it('should handle normal file names', () => {
        expect(sanitizeFileName('Normal File')).toBe('Normal File');
    });

    // Edge cases
    it('should handle empty string', () => {
        expect(sanitizeFileName('')).toBe('Unnamed_Raindrop');
    });

    it('should handle whitespace only', () => {
        expect(sanitizeFileName('   ')).toBe('Unnamed_Raindrop');
    });

    it('should handle very long names', () => {
        const longName = 'a'.repeat(300);
        expect(sanitizeFileName(longName)).toHaveLength(200);
    });

    it('should handle special characters', () => {
        expect(sanitizeFileName('file/with:special*chars')).toBe('filewithspecialchars');
    });

    it('should handle unicode characters', () => {
        expect(sanitizeFileName('Café 東京')).toBe('Café 東京');
    });
});
```

### Async Testing

Use async/await for asynchronous code:

```typescript
it('should fetch data from API', async () => {
    const mockResponse = { result: true, items: [] };
    mockRequest.mockResolvedValue(JSON.stringify(mockResponse));
    
    const result = await fetchWithRetry(url, options, rateLimiter);
    
    expect(result).toEqual(mockResponse);
});

// Test promise rejections
it('should handle API errors', async () => {
    mockRequest.mockRejectedValue(new Error('Network error'));
    
    await expect(fetchWithRetry(url, options, rateLimiter))
        .rejects.toThrow('Network error');
});
```

### Testing Errors

Test both success and failure paths:

```typescript
describe('createFolder', () => {
    it('should create folder successfully', async () => {
        mockApp.vault.adapter.exists.mockResolvedValue(false);
        mockApp.vault.createFolder.mockResolvedValue(undefined);
        
        await expect(createFolder(mockApp, 'folder')).resolves.toBe(true);
    });

    it('should throw error if path exists but is not a folder', async () => {
        mockApp.vault.adapter.exists.mockResolvedValue(true);
        mockApp.vault.adapter.stat.mockResolvedValue({ type: 'file' });
        
        await expect(createFolder(mockApp, 'file.md'))
            .rejects.toThrow('Path exists but is not a folder');
    });

    it('should throw error if creation fails', async () => {
        mockApp.vault.adapter.exists.mockResolvedValue(false);
        mockApp.vault.createFolder.mockRejectedValue(new Error('Permission denied'));
        
        await expect(createFolder(mockApp, 'folder'))
            .rejects.toThrow('Failed to create folder');
    });
});
```

## Mocking

### Obsidian API Mocks

The Obsidian API is automatically mocked in `tests/setup.ts`. Use these mocks in your tests:

```typescript
import { mockApp, mockRequest } from '../../setup';

it('should interact with vault', async () => {
    // Configure mock behavior
    mockApp.vault.adapter.exists.mockResolvedValue(true);
    mockApp.vault.adapter.stat.mockResolvedValue({ type: 'folder' });
    
    // Test your code
    const exists = await doesPathExist(mockApp, 'some/path');
    
    expect(exists).toBe(true);
});
```

### Mock Data

Use predefined mock data from `tests/mocks/raindropData.ts`:

```typescript
import {
    mockRaindropArticle,
    mockRaindropResponse,
    createMockRaindrop
} from '../../mocks/raindropData';

it('should process raindrop items', () => {
    const items = mockRaindropResponse.items;
    expect(items).toHaveLength(3);
});

// Create custom mock
it('should handle custom data', () => {
    const customRaindrop = createMockRaindrop({
        title: 'Custom Title',
        tags: ['custom', 'test']
    });
    
    expect(customRaindrop.title).toBe('Custom Title');
});
```

### Jest Mock Functions

Create and configure mocks:

```typescript
// Create a mock function
const mockCallback = jest.fn();

// Configure return value
mockCallback.mockReturnValue('result');

// Configure async return
mockCallback.mockResolvedValue('async result');

// Configure rejection
mockCallback.mockRejectedValue(new Error('error'));

// Chain different return values
mockCallback
    .mockReturnValueOnce('first')
    .mockReturnValueOnce('second')
    .mockReturnValue('default');

// Verify mock was called
expect(mockCallback).toHaveBeenCalled();
expect(mockCallback).toHaveBeenCalledTimes(2);
expect(mockCallback).toHaveBeenCalledWith('arg1', 'arg2');
```

### Mock Timers

Test code that uses timers:

```typescript
describe('rate limiter', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it('should delay between requests', async () => {
        const rateLimiter = createRateLimiter(60, 300);
        
        const promise = rateLimiter.checkLimit();
        
        // Fast-forward time
        jest.advanceTimersByTime(300);
        
        await promise;
        expect(true).toBe(true); // If we got here, the delay worked
    });
});
```

## Coverage

### Viewing Coverage

After running `npm run test:coverage`:

1. **Terminal**: Shows summary statistics
2. **HTML Report**: Open `coverage/lcov-report/index.html` in a browser
3. **LCOV File**: `coverage/lcov.info` for CI tools

### Coverage Thresholds

Current thresholds (in `jest.config.js`):

```javascript
coverageThresholds: {
    global: {
        branches: 50,
        functions: 50,
        lines: 50,
        statements: 50
    }
}
```

Tests will fail if coverage drops below these thresholds.

### Improving Coverage

1. Run coverage report to identify gaps
2. Focus on critical business logic first
3. Test edge cases and error paths
4. Don't chase 100% coverage—focus on meaningful tests

### Excluded from Coverage

These files are excluded:

- `src/main.ts` (entry point, tested via integration)
- Test files themselves
- Type definition files
- Node modules
- Build artifacts

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ✅ Good: Tests the behavior
it('should sanitize file names', () => {
    expect(sanitizeFileName('test/file')).toBe('testfile');
});

// ❌ Bad: Tests implementation details
it('should call replace with regex', () => {
    const spy = jest.spyOn(String.prototype, 'replace');
    sanitizeFileName('test');
    expect(spy).toHaveBeenCalled();
});
```

### 2. Keep Tests Independent

Each test should be runnable in isolation:

```typescript
// ✅ Good: Independent tests
it('test 1', () => {
    const value = 1;
    expect(value).toBe(1);
});

it('test 2', () => {
    const value = 2;
    expect(value).toBe(2);
});

// ❌ Bad: Tests depend on each other
let counter = 0;
it('increments counter', () => {
    counter++;
    expect(counter).toBe(1);
});
it('increments again', () => {
    counter++;
    expect(counter).toBe(2); // Fails if run alone
});
```

### 3. One Concept Per Test

```typescript
// ✅ Good: Each test focuses on one thing
it('should remove slashes', () => {
    expect(sanitizeFileName('path/to/file')).toBe('pathtofile');
});

it('should remove colons', () => {
    expect(sanitizeFileName('file:name')).toBe('filename');
});

// ❌ Bad: Testing too many things
it('should sanitize', () => {
    expect(sanitizeFileName('path/to/file')).toBe('pathtofile');
    expect(sanitizeFileName('file:name')).toBe('filename');
    expect(sanitizeFileName('')).toBe('Unnamed_Raindrop');
});
```

### 4. Use beforeEach/afterEach

Clean up between tests:

```typescript
describe('API tests', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
    });

    afterEach(() => {
        // Restore original implementations
        jest.restoreAllMocks();
    });

    it('test 1', () => {
        // Test code
    });
});
```

### 5. Test Data Builders

Create reusable test data:

```typescript
// In tests/mocks/builders.ts
export function buildMockRaindrop(overrides = {}) {
    return {
        _id: 123,
        title: 'Test',
        link: 'https://example.com',
        type: 'article',
        created: '2024-01-01T00:00:00Z',
        lastUpdate: '2024-01-01T00:00:00Z',
        ...overrides
    };
}

// In tests
it('should process raindrop', () => {
    const raindrop = buildMockRaindrop({ title: 'Custom Title' });
    expect(processRaindrop(raindrop)).toBeDefined();
});
```

### 6. Avoid Test Logic

Keep tests simple:

```typescript
// ✅ Good: Simple, direct test
it('should return true for valid input', () => {
    expect(validate('valid')).toBe(true);
});

// ❌ Bad: Contains logic
it('should validate inputs', () => {
    const inputs = ['valid1', 'valid2', 'valid3'];
    for (const input of inputs) {
        if (input.startsWith('valid')) {
            expect(validate(input)).toBe(true);
        }
    }
});
```

## CI/CD Integration

### GitHub Actions

Tests run automatically on:

- Push to `main` branch
- Pull requests
- Manual workflow dispatch

Configuration in `.github/workflows/ci.yml`:

```yaml
- name: Run tests
  run: npm test

- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage reports to Codecov
  uses: codecov/codecov-action@v4
  with:
    files: ./coverage/lcov.info
```

### Pre-commit Hooks

Consider adding pre-commit hooks (optional):

```bash
# Install husky
npm install --save-dev husky

# Set up pre-commit hook
npx husky install
npx husky add .husky/pre-commit "npm test"
```

### Coverage Reporting

Coverage reports are uploaded to Codecov (if configured) for tracking over time.

## Troubleshooting

### Tests Not Running

```bash
# Clear Jest cache
npm test -- --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Module Resolution Issues

If imports fail:

1. Check `jest.config.js` module name mapper
2. Verify `tsconfig.json` paths
3. Ensure files are in correct locations

### Mock Not Working

```typescript
// Make sure mocks are cleared
beforeEach(() => {
    jest.clearAllMocks();
});

// Verify mock is configured correctly
mockFunction.mockReturnValue('value');
expect(mockFunction()).toBe('value');
```

### Async Test Timeout

Increase timeout for slow tests:

```typescript
it('slow test', async () => {
    // Test code
}, 10000); // 10 second timeout
```

Or globally in `jest.config.js`:

```javascript
testTimeout: 10000
```

### Coverage Not Generating

```bash
# Remove old coverage
rm -rf coverage

# Generate fresh
npm run test:coverage
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Test Driven Development (TDD)](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
- [Make It Rain Test Examples](../tests/)

## Contributing

When contributing to the test suite:

1. ✅ Write tests for all new features
2. ✅ Update tests when modifying code
3. ✅ Ensure all tests pass before submitting PR
4. ✅ Maintain or improve coverage
5. ✅ Follow the testing patterns in existing tests
6. ✅ Add descriptive test names
7. ✅ Include edge cases

---

**Happy Testing!** 🧪

For questions or help with testing, please open an issue or discussion on GitHub.
