# Test Environment Setup and Installation

## Prerequisites

Before running tests, ensure you have Node.js (version 16 or higher) installed.

## Installation

1. Install dependencies:
```bash
npm install
```

This will install:
- Jest (testing framework)
- Puppeteer (E2E testing)
- Chrome extension testing utilities
- Mock libraries

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### End-to-End Tests Only
```bash
npm run test:e2e
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Structure

```
tests/
├── setup.js                 # Global test setup and mocks
├── unit/                     # Unit tests for individual functions
│   ├── background.test.js    # Background script tests
│   ├── content.test.js       # Content script tests
│   └── popup.test.js         # Popup interface tests
├── integration/              # Integration tests
│   └── api-integration.test.js  # Chrome API and Gemini API tests
├── e2e/                      # End-to-end tests
│   └── extension.test.js     # Full workflow tests with Puppeteer
└── utils/                    # Test utilities and helpers
    └── test-helpers.js       # Reusable test utilities
```

## What Tests Cover

### Unit Tests (70+ test cases)
- ✅ URL validation and video ID extraction
- ✅ Text formatting and HTML conversion
- ✅ Age group validation
- ✅ API key validation
- ✅ DOM manipulation and button management
- ✅ Settings management and persistence
- ✅ Error handling and edge cases

### Integration Tests (20+ test cases)  
- ✅ Chrome Storage API integration
- ✅ Chrome Runtime messaging
- ✅ Chrome Tabs API integration
- ✅ Gemini API communication
- ✅ Component interaction testing
- ✅ Error propagation across components

### End-to-End Tests (15+ test cases)
- ✅ Extension installation and setup
- ✅ YouTube page integration
- ✅ Summary generation workflow
- ✅ Settings persistence
- ✅ Error handling in real browser
- ✅ Accessibility and UX validation

## Test Configuration

Tests are configured in:
- `jest.config.js` - Main Jest configuration
- `package.json` - NPM scripts and Jest settings
- `tests/setup.js` - Global test setup

## Environment Variables

Some tests may require environment variables:
- `GEMINI_API_KEY` - For integration tests with real API
- `HEADLESS_TESTING` - Set to 'false' to see browser during E2E tests

## Continuous Integration

Tests are designed to run in CI environments. The configuration supports:
- GitHub Actions
- Travis CI
- Jenkins
- Any Node.js CI environment

## Coverage Thresholds

The project maintains these coverage thresholds:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Debugging Tests

### Running specific tests:
```bash
# Run specific test file
npm test -- background.test.js

# Run tests matching pattern
npm test -- --testNamePattern="validateURL"

# Run tests in specific directory
npm test -- tests/unit/
```

### Debugging E2E tests:
```bash
# Run E2E tests with visible browser
HEADLESS_TESTING=false npm run test:e2e

# Run with increased timeout
npm run test:e2e -- --testTimeout=30000
```

### Verbose output:
```bash
npm test -- --verbose
```

## Mock Data

Tests use realistic mock data including:
- Sample YouTube video information
- Gemini API responses
- Chrome extension storage data
- User interaction scenarios

## Known Limitations

1. **Real API Testing**: Integration tests use mocked API responses. For testing with real Gemini API, set `GEMINI_API_KEY` environment variable.

2. **Browser Permissions**: E2E tests require browser permissions that may not be available in all CI environments.

3. **YouTube DOM Changes**: Content script tests may need updates if YouTube changes their page structure.

## Contributing to Tests

When adding new features:

1. **Add unit tests** for new functions
2. **Add integration tests** for API interactions  
3. **Add E2E tests** for new user workflows
4. **Update test utilities** if needed
5. **Maintain coverage thresholds**

## Troubleshooting

### Common Issues

**Error: "Extension not loaded"**
- Ensure extension manifest is valid
- Check that all required files exist
- Verify Chrome version compatibility

**Error: "Timeout in E2E tests"**
- Increase timeout values
- Check if YouTube page loads correctly
- Verify extension injection timing

**Error: "Mock not working"**
- Clear Jest cache: `npm test -- --clearCache`
- Check mock setup in `tests/setup.js`
- Verify mock implementation matches API

### Getting Help

1. Check test output for specific error messages
2. Run tests with `--verbose` flag for detailed output
3. Check GitHub issues for known testing problems
4. Refer to Jest and Puppeteer documentation

## Test Data

Tests use kid-friendly content including:
- Educational video summaries
- Age-appropriate language validation
- Child safety content filtering
- Interactive Q&A generation

This ensures the extension works correctly for its target audience of children aged 3-12.
