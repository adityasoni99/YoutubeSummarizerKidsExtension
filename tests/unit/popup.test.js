/**
 * Unit tests for popup.js script
 */

// Mock popup functionality
class PopupController {
  extractVideoIdFromUrl(url) {
    if (!url) return null;
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
  }

  updateUI(summary) {
    const summaryElement = document.getElementById("summary-content");
    if (summaryElement) {
      summaryElement.textContent = summary.summary || "No summary available";
    }
  }

  showError(message) {
    const errorElement = document.getElementById("error-message");
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
    }
  }
}

describe("Popup Script Tests", () => {
  let popup;

  beforeEach(() => {
    popup = new PopupController();

    // Create mock popup HTML structure
    document.body.innerHTML = `
      <div id="popup-container">
        <div id="error-message" style="display: none;"></div>
        <div id="summary-content"></div>
        <button id="generate-btn">Generate Summary</button>
      </div>
    `;

    jest.clearAllMocks();
  });

  describe("Video ID extraction", () => {
    test("should extract video ID from YouTube URL", () => {
      const url = "https://www.youtube.com/watch?v=abc123&list=playlist";
      const videoId = popup.extractVideoIdFromUrl(url);
      expect(videoId).toBe("abc123");
    });

    test("should handle URLs without video ID", () => {
      expect(popup.extractVideoIdFromUrl("https://www.youtube.com")).toBe(null);
      expect(popup.extractVideoIdFromUrl("")).toBe(null);
      expect(popup.extractVideoIdFromUrl(null)).toBe(null);
    });
  });

  describe("UI updates", () => {
    test("should update UI with summary data", () => {
      const mockSummary = {
        summary: "This video explains photosynthesis to children.",
      };
      popup.updateUI(mockSummary);

      const summaryContent = document.getElementById("summary-content");
      expect(summaryContent.textContent).toBe(mockSummary.summary);
    });

    test("should handle empty summary data", () => {
      const emptySummary = {};
      popup.updateUI(emptySummary);

      const summaryContent = document.getElementById("summary-content");
      expect(summaryContent.textContent).toBe("No summary available");
    });

    test("should show error messages", () => {
      const errorMessage = "Failed to generate summary";
      popup.showError(errorMessage);

      const errorElement = document.getElementById("error-message");
      expect(errorElement.textContent).toBe(errorMessage);
      expect(errorElement.style.display).toBe("block");
    });
  });

  describe("Chrome API integration", () => {
    test("should handle chrome.tabs.query", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, () => {});
      expect(chrome.tabs.query).toHaveBeenCalled();
    });

    test("should send messages to background script", () => {
      const message = { action: "summarize" };
      chrome.runtime.sendMessage(message);
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(message);
    });
  });
});
