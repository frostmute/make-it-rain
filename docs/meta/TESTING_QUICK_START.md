# Testing Quick Start 🚀

Get up and running with tests in 2 minutes!

## Install Dependencies

```bash
npm install
```

## Run Tests

```bash
# Run all tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# With coverage report
npm run test:coverage

# Verbose output
npm run test:verbose
```

## What's Tested?

✅ **File Utilities** - Path operations, folder creation, filename sanitization
✅ **API Utilities** - Rate limiting, retries, authentication  
✅ **YAML Utilities** - Frontmatter generation, escaping, formatting

## View Coverage

After running `npm run test:coverage`:

```bash
# On macOS/Linux
open coverage/lcov-report/index.html

# On Windows
start coverage/lcov-report/index.html
```

## Writing Your First Test

1. Create a test file: `tests/unit/myFeature.test.ts`
2. Write a test:

```typescript
import { myFunction } from '../../src/myFeature';

describe('myFunction', () => {
    it('should do something', () => {
        const result = myFunction('input');
        expect(result).toBe('expected');
    });
});
```

3. Run it: `npm test myFeature.test.ts`

## Need Help?

- 📖 Full docs: [tests/README.md](tests/README.md)
- 📝 Testing guide: [docs/testing-guide.md](docs/testing-guide.md)
- 🔍 Examples: Check existing tests in `tests/unit/`

## CI Status

Tests run automatically on every push and PR. Check the Actions tab on GitHub!
