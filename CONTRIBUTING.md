# 🤝 Contributing to Make It Rain

Thank you for your interest in contributing to Make It Rain! This document provides guidance on how to contribute effectively to the project.

---

## 📖 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [Types of Contributions](#-types-of-contributions)
- [Contribution Workflow](#-contribution-workflow)
- [Commit Message Guidelines](#-commit-message-guidelines)
- [Code Standards](#-code-standards)
- [Testing Requirements](#-testing-requirements)
- [Pull Request Process](#-pull-request-process)
- [Development Setup](#-development-setup)
- [Getting Help](#-getting-help)

---

## 💖 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. We pledge that everyone participating in the Make It Rain community will be treated with respect and dignity.

### Expected Behavior

- **Be respectful**: Treat all contributors with kindness and respect
- **Be inclusive**: Welcome people from all backgrounds and experiences
- **Be patient**: Help others learn and grow
- **Be collaborative**: Work together toward common goals
- **Be professional**: Keep discussions focused and productive

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal attacks or insults
- Spam or promotional content
- Deliberate disruption of discussions
- Any form of discrimination based on identity

### Reporting Violations

If you witness or experience behavior that violates this code of conduct, please report it by:

1. Contacting the maintainers directly via email
2. Opening a private issue (if available)
3. Reaching out in a GitHub discussion

All reports will be reviewed and handled appropriately.

---

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** 16+ and npm installed
- **Git** for version control
- **GitHub account** for pull requests
- Basic familiarity with TypeScript
- Understanding of Obsidian plugins (not required, we'll help!)

### First-Time Contributors

**New to open source?** Don't worry! Here's your path:

1. **Read the documentation**
   - [README.md](README.md) - Project overview
   - [Developer Guide](docs/developer-guide/README.md) - Setup and architecture
   - This file - Contribution guidelines

2. **Find a good first issue**
   - Look for issues labeled `good first issue` or `help wanted`
   - These are specifically chosen for new contributors
   - Search: [GitHub Issues - good first issue](https://github.com/frostmute/make-it-rain/issues?q=label%3A%22good%20first%20issue%22)

3. **Start small**
   - Documentation improvements
   - Bug fixes
   - Small feature additions
   - Test coverage improvements

4. **Ask questions**
   - Use [GitHub Discussions](https://github.com/frostmute/make-it-rain/discussions)
   - Comment on issues
   - Don't hesitate to ask for help!

---

## 📝 Types of Contributions

Make It Rain welcomes all types of contributions:

### 🐛 Bug Reports

**Found a bug?** Help us fix it:

- Search [existing issues](https://github.com/frostmute/make-it-rain/issues) first
- Provide reproduction steps
- Include error messages and logs
- Specify your OS and plugin version
- Use the bug report template

### ✨ Feature Requests

**Have an idea?** We'd love to hear it:

- Check [discussions](https://github.com/frostmute/make-it-rain/discussions) for similar ideas
- Explain the use case
- Describe expected behavior
- Consider existing features
- Use the feature request template

### 🔧 Code Contributions

**Want to code?** Great options:

- Fix bugs from the issues list
- Implement requested features
- Improve error handling
- Optimize performance
- Refactor code for clarity

### 📚 Documentation

**Help with docs?** These are always needed:

- Fix typos and grammar
- Clarify confusing sections
- Add examples and use cases
- Improve user guides
- Create tutorials

### ✅ Testing

**Write tests?** Essential work:

- Increase test coverage
- Add integration tests
- Improve test documentation
- Test edge cases
- Create test fixtures

### 🎨 UI/UX Improvements

**Design eye?** Consider:

- Improving UI clarity
- Better error messages
- Enhanced user guidance
- Accessibility improvements
- Performance optimizations

---

## 🔄 Contribution Workflow

### Step 1: Fork the Repository

```bash
# Visit https://github.com/frostmute/make-it-rain
# Click "Fork" button in top right
# This creates your own copy of the repository
```

### Step 2: Clone Your Fork

```bash
# Clone your forked repository
git clone https://github.com/YOUR_USERNAME/make-it-rain.git
cd make-it-rain

# Add upstream remote to stay updated
git remote add upstream https://github.com/frostmute/make-it-rain.git
```

### Step 3: Create a Branch

```bash
# Update from upstream first
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch with descriptive name
# Format: type/description (e.g., feature/add-bulk-operations)
git checkout -b feature/your-feature-name
```

**Branch naming convention:**

- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions
- `perf/description` - Performance improvements

### Step 4: Make Your Changes

```bash
# Make changes to files
# Follow code standards (see below)
# Keep commits logical and focused
```

**Good practices:**

- Make small, logical commits
- Don't mix unrelated changes
- Write descriptive commit messages
- Update tests and documentation
- Test your changes locally

### Step 5: Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Type check
npm run type-check

# All tests must pass!
```

### Step 6: Commit Your Changes

```bash
# Stage changes
git add .

# Commit with descriptive message (see guidelines below)
git commit -m "feat: add new feature description"

# Push to your fork
git push origin feature/your-feature-name
```

### Step 7: Create a Pull Request

1. **Go to GitHub**: Visit your fork on GitHub
2. **Create PR**: Click "Compare & pull request" button
3. **Fill template**: Complete the PR template
4. **Submit**: Click "Create pull request"

**PR checklist:**

- [ ] Descriptive title
- [ ] Link to related issues
- [ ] Summary of changes
- [ ] Testing performed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)

### Step 8: Respond to Feedback

- Reviewers may request changes
- Be respectful and collaborative
- Make requested changes on your branch
- Commit and push updates
- Comments will auto-update on PR

### Step 9: Merge

Once approved:

- Maintainer will merge your PR
- Your changes go live!
- Thank you for contributing! 🎉

---

## 📝 Commit Message Guidelines

### Format

Follow this format for commit messages:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Example

```
feat(templates): add support for custom content-type templates

- Implemented TemplateEngine class for rendering custom templates
- Added UI for managing content-type specific templates
- Includes default templates for all content types

Fixes #123
```

### Type

Must be one of:

| Type | Description |
|------|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `style` | Code style changes (formatting, semicolons, etc) |
| `refactor` | Code refactoring without feature/fix changes |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `chore` | Build, dependencies, or tooling changes |
| `ci` | CI/CD configuration changes |

### Scope

Optional, but recommended. Examples:

- `feat(api)` - API changes
- `feat(templates)` - Template system changes
- `fix(ui)` - UI bug fixes
- `docs(user-guide)` - User guide documentation
- `test(processors)` - Test additions for processors

### Subject

- Use imperative mood: "add" not "added" or "adds"
- Don't capitalize first letter
- No period at the end
- Limit to 50 characters

### Body

Optional but recommended:

- Explain **what** and **why**, not how
- Wrap at 72 characters
- Use bullets for multiple points
- Reference issues: "Fixes #123", "Relates to #456"

### Footer

Include references:

```
Fixes #123
Closes #456
Relates to #789
```

---

## 💻 Code Standards

### TypeScript

Follow these guidelines:

**Type Annotations**

```typescript
// ✅ Always annotate parameters and returns
function processItem(item: Item, options: ProcessOptions): Promise<void>

// ❌ Avoid
function processItem(item, options)
```

**Naming**

```typescript
// Classes: PascalCase
class RaindropProcessor { }

// Functions: camelCase
function processRaindrop() { }

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3

// Booleans: is/has prefix
const isLoading = false
```

**Error Handling**

```typescript
// ✅ Always handle errors
try {
  const result = await apiCall()
  return result
} catch (error) {
  console.error('Failed:', error)
  throw error
}

// ❌ Avoid
const result = await apiCall() // No error handling
```

**Comments**

```typescript
// ✅ Explain why, not what
// Retry with exponential backoff to handle rate limiting
const delay = Math.pow(2, retryCount) * 1000

// ❌ Avoid
// Add delay
const delay = Math.pow(2, retryCount) * 1000
```

### Code Organization

- **Single responsibility**: One class/function = one purpose
- **DRY**: Don't repeat yourself
- **Exports**: Be explicit about what you export
- **Imports**: Keep them organized and minimal
- **Line length**: Max 100 characters (soft), 120 (hard)
- **Indentation**: 2 spaces (no tabs)

### Documentation

**JSDoc for public APIs:**

```typescript
/**
 * Fetches items from the Raindrop API
 * @param token - API authentication token
 * @param limit - Maximum items to fetch
 * @returns Promise resolving to items array
 * @throws Error if API request fails
 */
export async function fetchItems(
  token: string,
  limit: number
): Promise<Item[]>
```

### File Organization

```typescript
// 1. Imports
import { Obsidian } from "obsidian"
import { ApiClient } from "./api"

// 2. Types/Interfaces
interface Options {
  token: string
  limit: number
}

// 3. Constants
const DEFAULT_LIMIT = 50

// 4. Classes/Functions
class Processor {
  // implementation
}

// 5. Exports
export { Processor }
export type { Options }
```

---

## ✅ Testing Requirements

### For Bug Fixes

Every bug fix must include:

- [ ] Test that reproduces the bug
- [ ] Fix implementation
- [ ] Test that verifies the fix

### For New Features

Every feature must include:

- [ ] Unit tests for core logic
- [ ] Integration tests for workflows
- [ ] Documentation and examples
- [ ] 80%+ code coverage

### Running Tests

```bash
# Run all tests
npm test

# Run specific file
npm test -- filename.test.ts

# Run in watch mode
npm run test:watch

# Check coverage
npm run test:coverage
```

### Test Structure

```typescript
describe("Feature Name", () => {
  beforeEach(() => {
    // Setup
  })

  it("should do something", () => {
    // Arrange
    const input = "test"

    // Act
    const result = process(input)

    // Assert
    expect(result).toBe("expected")
  })

  it("should handle errors", () => {
    expect(() => process(null)).toThrow()
  })
})
```

### Coverage Goals

- **Overall**: 80%+
- **Critical paths**: 100%
- **Utils**: 80%+
- **UI components**: 50%+

---

## 📋 Pull Request Process

### Before Submitting

1. **Test locally**

   ```bash
   npm test
   npm run build
   npm run type-check
   ```

2. **Update documentation**
   - Update CHANGELOG.md if user-facing
   - Update docs if behavior changed
   - Add code comments if complex

3. **Verify no breaking changes**
   - Existing tests still pass
   - API compatibility maintained
   - User workflows unaffected

### PR Title Format

Follow conventional commits:

```
feat: add feature description
fix: fix bug description
docs: update documentation
test: add test coverage
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123

## Changes
- Change 1
- Change 2

## Testing
- Tested with: [describe testing]
- Coverage: [describe coverage]

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] All tests pass
```

### Review Process

1. **Automated checks**
   - GitHub Actions runs tests
   - Coverage verified
   - Build verified

2. **Code review**
   - Maintainers review code
   - Provide constructive feedback
   - May request changes

3. **Approval**
   - Once approved, PR can be merged
   - Celebrate your contribution! 🎉

### After Merge

- Your code is live!
- You're now a contributor
- Thank you! 💖

---

## 🛠️ Development Setup

### Quick Setup

```bash
# Clone and install
git clone https://github.com/YOUR_USERNAME/make-it-rain.git
cd make-it-rain
npm install

# Start development
npm run dev

# Run tests
npm test
```

### Available Commands

```bash
# Development
npm run dev              # Watch and rebuild on changes
npm run build            # Build for production
npm run build:clean      # Clean build

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Quality
npm run type-check       # TypeScript type checking
npm run lint:md          # Lint markdown documentation

# Documentation
npm run docs:build       # Build documentation site
npm run docs:serve       # Serve docs locally
```

### Project Structure

```
src/
├── main.ts              # Plugin entry point
├── types.ts             # Type definitions
├── settings.ts          # Settings UI
├── api/                 # API integration
├── modals/              # Modal components
├── processors/          # Business logic
└── utils/               # Utility functions

tests/
├── unit/                # Unit tests
├── integration/         # Integration tests
└── mocks/               # Test fixtures

docs/
├── user-guide/          # User documentation
└── developer-guide/     # Developer documentation
```

### Useful Resources

- **[Developer Guide](docs/developer-guide/README.md)** - Setup and architecture
- **[API Reference](docs/developer-guide/api-reference.md)** - API documentation
- **[Testing Guide](docs/developer-guide/testing-guide.md)** - Testing documentation

---

## 🆘 Getting Help

### Having Issues?

1. **Check documentation**
   - [Developer Guide](docs/developer-guide/README.md)
   - [README.md](README.md)
   - Inline code comments

2. **Search existing issues**
   - Your question might be answered
   - [GitHub Issues](https://github.com/frostmute/make-it-rain/issues)

3. **Ask in Discussions**
   - [GitHub Discussions](https://github.com/frostmute/make-it-rain/discussions)
   - Great for questions and ideas
   - Community can help

4. **Contact maintainers**
   - Open a detailed issue
   - Include error messages and steps to reproduce
   - Include environment details

### Asking Good Questions

**Do:**

- Provide context and background
- Include error messages and logs
- Share reproducible steps
- Specify your environment
- Be respectful and patient

**Don't:**

- Ask the same question multiple times
- Use demanding language
- Share sensitive information
- Expect immediate responses

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 🎉 Recognition

Contributors are recognized in:

- Project README
- Release notes
- GitHub contributors page
- Community updates

We appreciate all contributions, from code to documentation to bug reports!

---

## 📞 Questions?

- **Issues**: [Open an issue](https://github.com/frostmute/make-it-rain/issues)
- **Discussions**: [Ask a question](https://github.com/frostmute/make-it-rain/discussions)
- **Code of Conduct**: See above or contact maintainers

---

## 🙏 Thank You

Your contributions make Make It Rain better for everyone. We truly appreciate your help!

<div align="center">

**Happy contributing!** 🌧️

[Report Bug](https://github.com/frostmute/make-it-rain/issues) • [Request Feature](https://github.com/frostmute/make-it-rain/discussions) • [View Documentation](docs/)

</div>
