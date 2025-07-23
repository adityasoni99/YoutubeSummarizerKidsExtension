/**
 * Unit tests for content.js script
 */

// Mock YouTube page functionality
class YouTubeContentScript {
  findVideoTitle() {
    const titleElement = document.querySelector('h1.watch-title, .title.ytd-video-primary-info-renderer');
    return titleElement ? titleElement.textContent.trim() : '';
  }

  getCurrentVideoId() {
    const url = window.location.href;
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
  }

  createSummaryButton() {
    const button = document.createElement('button');
    button.id = 'yt-summarizer-btn';
    button.textContent = 'Get Summary';
    button.style.cssText = 'background: #ff4444; color: white; padding: 8px 16px; border: none; border-radius: 4px;';
    return button;
  }
}

describe('Content Script Tests', () => {
  let contentScript;

  beforeEach(() => {
    contentScript = new YouTubeContentScript();
    
    // Create mock DOM structure
    document.body.innerHTML = `
      <div id="content">
        <h1 class="watch-title">Test Educational Video</h1>
        <div id="description">This video teaches kids about science</div>
      </div>
    `;

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { href: 'https://www.youtube.com/watch?v=abc123' },
      writable: true
    });

    jest.clearAllMocks();
  });

  describe('Video information extraction', () => {
    test('should find video title', () => {
      const title = contentScript.findVideoTitle();
      expect(title).toBe('Test Educational Video');
    });

    test('should extract video ID from URL', () => {
      const videoId = contentScript.getCurrentVideoId();
      expect(videoId).toBe('abc123');
    });

    test('should handle missing elements gracefully', () => {
      document.body.innerHTML = '<div></div>';
      expect(contentScript.findVideoTitle()).toBe('');
    });
  });

  describe('UI manipulation', () => {
    test('should create summary button with correct properties', () => {
      const button = contentScript.createSummaryButton();
      
      expect(button.id).toBe('yt-summarizer-btn');
      expect(button.textContent).toBe('Get Summary');
      expect(button.style.background).toBe('rgb(255, 68, 68)');
    });
  });

  describe('Message passing with background script', () => {
    test('should send messages to background script', () => {
      const message = { action: 'summarize', videoId: 'abc123', age: '8' };
      
      chrome.runtime.sendMessage(message);
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(message);
    });
  });
});
