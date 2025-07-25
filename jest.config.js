module.exports = {
  // Test environment setup
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  // Test file patterns
  testMatch: ["<rootDir>/tests/**/*.test.js"],

  // Coverage configuration - disabled for mock-based testing
  collectCoverage: false,
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "js/**/*.js",
    "!js/**/*.test.js",
    "!**/node_modules/**",
  ],
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10,
    },
  },

  // Module mapping for cleaner imports
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/js/$1",
  },

  // Test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Transform configuration for ES6 modules
  transform: {
    "^.+\\.js$": "babel-jest",
  },

  // Module file extensions
  moduleFileExtensions: ["js", "json"],

  // Test environment options
  testEnvironmentOptions: {
    url: "https://www.youtube.com/watch?v=test",
  },
};
