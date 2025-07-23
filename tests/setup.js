/**
 * Global test setup for YouTube Summarizer Extension tests
 * Sets up Chrome API mocks and DOM environment
 */

// Mock the Chrome Extension APIs
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    }
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn()
    },
    getURL: jest.fn(),
    id: 'test-extension-id'
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  downloads: {
    download: jest.fn()
  }
};

// Mock fetch API for integration tests
global.fetch = jest.fn();

// Mock DOM APIs
global.document = {
  createElement: jest.fn(() => ({
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn()
    },
    addEventListener: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    textContent: '',
    innerHTML: '',
    style: {}
  })),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
  getElementById: jest.fn(),
  addEventListener: jest.fn(),
  body: {
    appendChild: jest.fn()
  }
};

global.window = {
  location: {
    href: 'https://www.youtube.com/watch?v=test123',
    pathname: '/watch',
    search: '?v=test123'
  },
  addEventListener: jest.fn()
};

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset Chrome API mocks to default behavior
  global.chrome.storage.local.get.mockImplementation((keys, callback) => {
    if (callback) callback({});
  });
  
  global.chrome.storage.local.set.mockImplementation((data, callback) => {
    if (callback) callback();
  });
  
  global.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
    if (callback) callback({ success: true });
  });
  
  global.chrome.tabs.query.mockImplementation((queryInfo, callback) => {
    if (callback) callback([{ id: 1, url: 'https://www.youtube.com/watch?v=test123' }]);
  });
  
  // Reset fetch mock
  global.fetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ summary: 'Mock response' })
  });
});
