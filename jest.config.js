module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: "ts-jest",

  // Use jsdom environment to simulate browser-like environment (Obsidian runs in Electron)
  testEnvironment: "jsdom",

  // Root directory for tests
  roots: ["<rootDir>/src", "<rootDir>/tests"],

  // Test file patterns
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)",
  ],

  // Transform TypeScript files using ts-jest
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },

  // Module file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],

  // Module name mapper for absolute imports
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@types/(.*)$": "<rootDir>/src/types/$1",
  },

  // Setup files to run before tests
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],

  // Coverage configuration
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}",
    "!src/main.ts", // Main entry point, tested via integration tests
    "!**/node_modules/**",
    "!**/build/**",
  ],

  // Coverage thresholds (adjust as needed)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Coverage reporters
  coverageReporters: ["text", "lcov", "html"],

  // Coverage directory
  coverageDirectory: "<rootDir>/coverage",

  // Clear mocks between tests
  clearMocks: true,

  // Automatically restore mock state between every test
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Globals for ts-jest
  globals: {
    "ts-jest": {
      tsconfig: {
        // Use ESNext module resolution for tests
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    },
  },
};
