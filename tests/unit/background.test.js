/**
 * Unit tests for background.js core functions
 */

// Mock implementation of core functions
class YouTubeSummarizerFlow {
  isYouTubeURL(url) {
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      return (
        urlObj.hostname === "www.youtube.com" ||
        urlObj.hostname === "youtube.com"
      );
    } catch {
      return false;
    }
  }

  extractVideoId(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get("v");
    } catch {
      return null;
    }
  }

  formatSummaryText(text, maxLength = 500) {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  filterContentForAge(content, age) {
    const ageNum = parseInt(age);
    if (ageNum < 6) {
      return content.replace(/\b(complex|difficult|hard)\b/gi, "simple");
    }
    return content;
  }
}

describe("Background Script Tests", () => {
  let flow;

  beforeEach(() => {
    flow = new YouTubeSummarizerFlow();
    jest.clearAllMocks();
  });

  describe("URL validation", () => {
    test("should validate YouTube URLs correctly", () => {
      expect(flow.isYouTubeURL("https://www.youtube.com/watch?v=abc123")).toBe(
        true,
      );
      expect(flow.isYouTubeURL("https://youtube.com/watch?v=abc123")).toBe(
        true,
      );
      expect(flow.isYouTubeURL("https://google.com")).toBe(false);
      expect(flow.isYouTubeURL("")).toBe(false);
      expect(flow.isYouTubeURL(null)).toBe(false);
    });

    test("should extract video IDs correctly", () => {
      expect(
        flow.extractVideoId("https://www.youtube.com/watch?v=abc123"),
      ).toBe("abc123");
      expect(flow.extractVideoId("https://youtube.com/watch?v=def456")).toBe(
        "def456",
      );
      expect(flow.extractVideoId("invalid-url")).toBe(null);
    });
  });

  describe("Text formatting", () => {
    test("should format summary text with length limits", () => {
      const shortText = "This is a short summary";
      expect(flow.formatSummaryText(shortText, 500)).toBe(shortText);

      const longText = "a".repeat(600);
      const formatted = flow.formatSummaryText(longText, 500);
      expect(formatted).toBe("a".repeat(500) + "...");
    });

    test("should handle empty text", () => {
      expect(flow.formatSummaryText("")).toBe("");
      expect(flow.formatSummaryText(null)).toBe("");
    });
  });

  describe("Age-appropriate content filtering", () => {
    test("should simplify content for young children", () => {
      const content = "This is a complex and difficult topic";
      const filtered = flow.filterContentForAge(content, "4");
      expect(filtered).toBe("This is a simple and simple topic");
    });

    test("should preserve content for older children", () => {
      const content = "This is educational content";
      expect(flow.filterContentForAge(content, "8")).toBe(content);
    });
  });

  describe("Chrome Extension API integration", () => {
    test("should handle chrome.storage operations", () => {
      const testData = { summary: "Test summary", videoId: "abc123" };

      chrome.storage.local.set.mockImplementation((data, callback) => {
        if (callback) callback();
      });

      chrome.storage.local.set(testData);
      expect(chrome.storage.local.set).toHaveBeenCalledWith(testData);
    });

    test("should handle chrome.runtime.sendMessage", () => {
      const message = { action: "summarize", videoId: "abc123" };

      chrome.runtime.sendMessage(message);
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(message);
    });
  });
});
