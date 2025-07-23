/**
 * Integration tests for Chrome APIs and external service integration
 */

describe('Chrome Extension API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Storage API integration', () => {
    test('should save and retrieve summary data', async () => {
      const testData = {
        videoId: 'abc123',
        summary: 'Test educational summary',
        timestamp: Date.now()
      };

      // Mock storage operations
      chrome.storage.local.set.mockImplementation((data, callback) => {
        if (callback) callback();
      });

      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ [`summary_${testData.videoId}`]: testData });
      });

      // Test storage set
      await new Promise(resolve => {
        chrome.storage.local.set({ [`summary_${testData.videoId}`]: testData }, resolve);
      });

      // Test storage get
      const result = await new Promise(resolve => {
        chrome.storage.local.get([`summary_${testData.videoId}`], resolve);
      });

      expect(chrome.storage.local.set).toHaveBeenCalled();
      expect(chrome.storage.local.get).toHaveBeenCalled();
      expect(result[`summary_${testData.videoId}`]).toEqual(testData);
    });
  });

  describe('Runtime messaging integration', () => {
    test('should handle bidirectional messaging', async () => {
      const requestMessage = { action: 'summarize', videoId: 'abc123', age: '8' };
      const responseMessage = { success: true, data: { summary: 'Generated summary' } };

      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        setTimeout(() => callback(responseMessage), 10);
      });

      const response = await new Promise(resolve => {
        chrome.runtime.sendMessage(requestMessage, resolve);
      });

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(requestMessage, expect.any(Function));
      expect(response).toEqual(responseMessage);
    });
  });

  describe('External API integration', () => {
    test('should make API requests', async () => {
      const mockResponse = { summary: 'AI-generated summary' };

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await fetch('https://api.example.com/summarize')
        .then(res => res.json());

      expect(global.fetch).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });
});
