# Make It Rain - Test Suite

This directory contains the test suite for the Make It Rain plugin.

## Table of Contents

- [Overview](#overview)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Coverage](#coverage)
- [Mocking Obsidian API](#mocking-obsidian-api)
- [Best Practices](#best-practices)

## Overview

The test suite uses **Jest** with **TypeScript** support via `ts-jest`. Tests are organized into unit tests and integration tests:

- **Unit Tests**: Test individual functions and utilities in isolation
- **Integration Tests**: Test the interaction between multiple components

## Running Tests

### Install Dependencies

First, make sure all dependencies are installed:

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Watch Mode

Run tests in watch mode (automatically re-runs tests when files change):

```bash
npm run test:watch
```

### Coverage Report

Generate a coverage report:

```bash
npm run test:coverage
```

The coverage report will be generated in the `coverage/` directory. Open `coverage/lcov-report/index.html` in a browser to view the detailed report.

### Verbose Output

Run tests with verbose output:

```bash
npm run test:verbose
```

### Run Specific Tests

Run tests for a specific file:

```bash
npm test -- fileUtils.test.ts
```

Run tests matching a pattern:

```bash
npm test -- --testNamePattern="sanitizeFileName"
```

## Test Structure

```
tests/
├── README.md                    # This file
├── setup.ts                     # Test setup and Obsidian API mocks
├── unit/                        # Unit tests
│   └── utils/                   # Utility function tests
│       ├── apiUtils.test.ts     # API utilities tests
│       ├── fileUtils.test.ts    # File utilities tests
│       └── yamlUtils.test.ts    # YAML utilities tests
├── integration/                 # Integration tests
│   └── (future tests)
└── mocks/                       # Mock data and utilities
    └── (future mocks)
```

## Writing Tests

### Test File Naming

Test files should follow the naming convention:

- `*.test.ts` for test files
- `*.spec.ts` is also supported
- Place tests in `__tests__` directories if preferred

### Example Unit Test

```typescript
import { sanitizeFileName } from '../../../src/utils/fileUtils';

describe('sanitizeFileName', () => {
    it('should remove invalid characters', () => {
        const result = sanitizeFileName('Test/File:Name*With?Invalid');
        expect(result).toBe('TestFileNameWithInvalid');
    });

    it('should return default name for empty string', () => {
        const result = sanitizeFileName('');
        expect(result).toBe('Unnamed_Raindrop');
    });
});
```

### Using Mocks

The Obsidian API is mocked in `setup.ts`. You can use these mocks in your tests:

```typescript
import { mockApp, mockRequest } from '../../setup';

describe('My Test Suite', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
    });

    it('should interact with the vault', async () => {
        mockApp.vault.adapter.exists.mockResolvedValue(true);
        
        // Your test code here
    });
});
```

### Test Organization

Each test file should follow this structure:

1. **Imports**: Import the functions/modules to test
2. **Describe blocks**: Group related tests
3. **BeforeEach/AfterEach**: Set up and tear down test state
4. **It blocks**: Individual test cases
5. **Assertions**: Use Jest matchers to verify behavior

### Common Jest Matchers

```typescript
// Equality
expect(value).toBe(expected);           // Strict equality (===)
expect(value).toEqual(expected);        // Deep equality
expect(value).not.toBe(unexpected);

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(number).toBeGreaterThan(3);
expect(number).toBeGreaterThanOrEqual(3.5);
expect(number).toBeLessThan(5);
expect(number).toBeLessThanOrEqual(4.5);

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Objects
expect(object).toHaveProperty('key');
expect(object).toMatchObject({ key: 'value' });

// Exceptions
expect(() => fn()).toThrow();
expect(() => fn()).toThrow('error message');

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();
```

## Coverage

### Coverage Thresholds

The project has the following coverage thresholds (configured in `jest.config.js`):

- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 50%
- **Statements**: 50%

These thresholds will increase as the test suite matures.

### Coverage Reports

After running `npm run test:coverage`, you'll get:

1. **Terminal output**: Summary of coverage
2. **HTML report**: Detailed, interactive report in `coverage/lcov-report/index.html`
3. **LCOV file**: Machine-readable format in `coverage/lcov.info`

### Improving Coverage

To improve coverage:

1. Run `npm run test:coverage` to see uncovered areas
2. Open the HTML report to identify specific lines
3. Write tests for uncovered code paths
4. Focus on critical business logic first

## Mocking Obsidian API

Since tests run in Node.js (not in Obsidian), the Obsidian API must be mocked. The `setup.ts` file provides comprehensive mocks:

### Available Mocks

- `MockNotice`: User notifications
- `MockModal`: Modal dialogs
- `MockPlugin`: Plugin base class
- `MockPluginSettingTab`: Settings tab
- `MockSetting`: Individual settings
- `MockVault`: Vault operations
- `mockApp`: Complete App instance
- `mockRequest`: HTTP requests
- `mockNormalizePath`: Path normalization

### Creating Custom Mocks

For component-specific tests, you can create additional mocks in the `mocks/` directory:

```typescript
// mocks/raindropData.ts
export const mockRaindropItem = {
    _id: 12345,
    title: 'Test Article',
    link: 'https://example.com',
    type: 'article',
    created: '2024-01-01T00:00:00Z',
    lastUpdate: '2024-01-02T00:00:00Z',
    tags: ['test', 'example']
};

export const mockRaindropResponse = {
    result: true,
    items: [mockRaindropItem],
    count: 1
};
```

Then use in tests:

```typescript
import { mockRaindropResponse } from '../../mocks/raindropData';

it('should process raindrop items', () => {
    // Use mock data in your test
});
```

## Best Practices

### 1. Test Naming

Use descriptive test names that explain what's being tested:

```typescript
// ✅ Good
it('should return default name when input is empty string', () => {});

// ❌ Bad
it('test 1', () => {});
```

### 2. Arrange-Act-Assert (AAA)

Structure tests with clear sections:

```typescript
it('should create a folder', async () => {
    // Arrange
    const mockApp = createMockApp();
    mockApp.vault.adapter.exists.mockResolvedValue(false);
    
    // Act
    const result = await createFolder(mockApp, 'test/folder');
    
    // Assert
    expect(result).toBe(true);
    expect(mockApp.vault.createFolder).toHaveBeenCalledWith('test/folder');
});
```

### 3. One Assertion Per Test

Focus each test on one specific behavior:

```typescript
// ✅ Good
it('should remove invalid characters', () => {
    expect(sanitizeFileName('test/file')).toBe('testfile');
});

it('should truncate long names', () => {
    expect(sanitizeFileName('a'.repeat(300))).toHaveLength(200);
});

// ❌ Bad - testing too many things
it('should sanitize filenames', () => {
    expect(sanitizeFileName('test/file')).toBe('testfile');
    expect(sanitizeFileName('a'.repeat(300))).toHaveLength(200);
    expect(sanitizeFileName('')).toBe('Unnamed_Raindrop');
});
```

### 4. Test Edge Cases

Always test boundary conditions:

- Empty strings/arrays/objects
- Null/undefined values
- Maximum/minimum values
- Invalid input
- Error conditions

### 5. Clean Up

Use `beforeEach` and `afterEach` to clean up:

```typescript
describe('My Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });
});
```

### 6. Avoid Test Interdependence

Each test should be independent and runnable in any order:

```typescript
// ❌ Bad - depends on previous test
let counter = 0;
it('increments counter', () => {
    counter++;
    expect(counter).toBe(1);
});
it('increments again', () => {
    counter++;
    expect(counter).toBe(2); // Will fail if run in isolation
});

// ✅ Good - independent tests
it('increments counter from 0', () => {
    let counter = 0;
    counter++;
    expect(counter).toBe(1);
});
```

### 7. Use Descriptive Variable Names

```typescript
// ✅ Good
const expectedFileName = 'sanitized-name';
const actualFileName = sanitizeFileName(input);
expect(actualFileName).toBe(expectedFileName);

// ❌ Bad
const x = 'sanitized-name';
const y = sanitizeFileName(input);
expect(y).toBe(x);
```

## Continuous Integration

Tests run automatically on CI via GitHub Actions when:

- Pushing to `main` branch
- Creating pull requests
- Running manual builds

The CI pipeline will fail if:

- Any test fails
- Coverage drops below thresholds
- Build errors occur

## Future Improvements

- [ ] Add integration tests for full import flow
- [ ] Add performance benchmarks
- [ ] Add visual regression tests for modals
- [ ] Increase coverage thresholds to 80%+
- [ ] Add mutation testing
- [ ] Add E2E tests with real Obsidian environment

## Troubleshooting

### Tests Not Running

```bash
# Clear Jest cache
npm test -- --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Mock Issues

If mocks aren't working:

1. Check `setup.ts` is being loaded
2. Verify `setupFilesAfterEnv` in `jest.config.js`
3. Clear Jest cache

### Coverage Not Generating

```bash
# Remove old coverage
rm -rf coverage

# Generate fresh coverage
npm run test:coverage
```

## Contributing

When contributing:

1. Write tests for all new features
2. Update tests when modifying existing code
3. Ensure all tests pass before submitting PR
4. Maintain or improve coverage
5. Follow the testing best practices above

---

**Happy Testing! 🧪**

If you have questions or suggestions for improving the test suite, please open an issue or discussion on GitHub.