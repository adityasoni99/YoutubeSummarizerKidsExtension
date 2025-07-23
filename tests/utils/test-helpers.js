/**
 * Test utilities and helpers for YouTube Summarizer Extension
 */

class TestUtils {
  /**
   * Creates a mock YouTube video page DOM structure
   */
  static createMockYouTubeDOM() {
    const html = `
      <div id="content">
        <div id="primary">
          <div id="above-the-fold">
            <h1 class="ytd-video-primary-info-renderer">
              <span class="watch-title">Test Educational Video for Kids</span>
            </h1>
          </div>
          <div id="description-text">
            This is a comprehensive educational video that teaches children about science, nature, and learning. 
            The content is designed to be engaging and informative for young minds.
            It covers various topics including basic physics, biology, and environmental science.
          </div>
        </div>
        <div id="secondary">
          <!-- Secondary content area -->
        </div>
      </div>
    `;

    document.body.innerHTML = html;
    return document.body;
  }

  /**
   * Creates mock video info for testing
   */
  static createMockVideoInfo(overrides = {}) {
    return {
      videoId: "test123video",
      title: "Educational Science Video for Kids",
      description:
        "A comprehensive guide to basic science concepts for children aged 6-8",
      transcript:
        "Hello kids! Today we are going to learn about amazing science. Science is everywhere around us. We can see it in plants, animals, and even in the sky. Let me show you some cool experiments that you can try at home safely.",
      url: "https://www.youtube.com/watch?v=test123video",
      duration: "10:30",
      ...overrides,
    };
  }

  /**
   * Creates mock Gemini API response
   */
  static createMockGeminiResponse(type = "topics") {
    if (type === "topics") {
      return {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    topics: [
                      {
                        id: 1,
                        name: "Introduction to Science",
                        content:
                          "Basic introduction to scientific concepts for kids",
                      },
                      {
                        id: 2,
                        name: "Fun Experiments",
                        content: "Safe and easy experiments children can do",
                      },
                      {
                        id: 3,
                        name: "Science in Nature",
                        content: "How science appears in our natural world",
                      },
                    ],
                    overallSummary:
                      "This video teaches kids about basic science through fun examples and experiments.",
                  }),
                },
              ],
            },
          },
        ],
      };
    }

    if (type === "detailed") {
      return {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    title: "Introduction to Science",
                    summary:
                      "Science is all around us and helps us understand how things work.",
                    explanation:
                      "In this section, we learn that science helps us ask questions about the world. We can use our eyes to observe, our hands to touch, and our minds to think about what we discover.",
                    keyPoints: [
                      "Science helps us learn about the world",
                      "We can do simple experiments safely",
                      "Asking questions is part of being a scientist",
                    ],
                    questions: [
                      {
                        question: "What is science?",
                        answer:
                          "Science is a way to learn about the world around us by asking questions and finding answers.",
                      },
                      {
                        question: "Can kids do science experiments?",
                        answer:
                          "Yes! Kids can do many safe and fun science experiments with help from adults.",
                      },
                    ],
                  }),
                },
              ],
            },
          },
        ],
      };
    }

    return {
      candidates: [
        {
          content: {
            parts: [
              {
                text: "Generic mock response text",
              },
            ],
          },
        },
      ],
    };
  }

  /**
   * Creates mock Chrome storage data
   */
  static createMockStorageData(overrides = {}) {
    return {
      geminiApiKey: "test-api-key-12345",
      defaultAge: "6-8",
      summaryLength: "medium",
      maxTopics: 5,
      autoSummarize: true,
      contentSafety: "strict",
      ...overrides,
    };
  }

  /**
   * Simulates Chrome API responses
   */
  static setupChromeApiMocks() {
    // Storage API
    chrome.storage.sync.get.mockImplementation((keys) => {
      const data = TestUtils.createMockStorageData();
      if (Array.isArray(keys)) {
        const result = {};
        keys.forEach((key) => {
          if (data[key] !== undefined) {
            result[key] = data[key];
          }
        });
        return Promise.resolve(result);
      }
      return Promise.resolve(data);
    });

    chrome.storage.sync.set.mockImplementation((data) => {
      return Promise.resolve();
    });

    chrome.storage.onChanged.addListener.mockImplementation((callback) => {
      // Store callback for manual triggering in tests
      TestUtils._storageChangeCallback = callback;
    });

    // Runtime API
    chrome.runtime.sendMessage.mockImplementation((message) => {
      // Simulate background script responses
      if (message.action === "checkApiKey") {
        return Promise.resolve({ hasApiKey: true });
      }
      if (message.action === "generateSummary") {
        return Promise.resolve({
          success: true,
          data: {
            summary: "Test summary for kids",
            topics: ["Topic 1", "Topic 2"],
            downloadUrl: "blob:test-url",
          },
        });
      }
      return Promise.resolve({ success: true });
    });

    chrome.runtime.onMessage.addListener.mockImplementation((callback) => {
      TestUtils._messageCallback = callback;
    });

    // Tabs API
    chrome.tabs.query.mockImplementation((queryInfo) => {
      const mockTab = {
        id: 123,
        url: "https://www.youtube.com/watch?v=test123",
        title: "Test Video - YouTube",
        active: true,
      };
      return Promise.resolve([mockTab]);
    });

    chrome.tabs.sendMessage.mockImplementation((tabId, message) => {
      if (message.action === "getVideoInfo") {
        return Promise.resolve(TestUtils.createMockVideoInfo());
      }
      if (message.action === "displaySummary") {
        return Promise.resolve({ success: true });
      }
      return Promise.resolve({ success: true });
    });

    // Downloads API
    chrome.downloads.download.mockImplementation((options) => {
      return Promise.resolve(Math.floor(Math.random() * 1000));
    });
  }

  /**
   * Simulates fetch API for Gemini requests
   */
  static setupFetchMocks() {
    global.fetch.mockImplementation((url, options) => {
      if (url.includes("generativelanguage.googleapis.com")) {
        // Parse request to determine response type
        const body = JSON.parse(options.body);
        const prompt = body.contents[0].parts[0].text;

        let responseType = "topics";
        if (prompt.includes("TASK:\n1. Create a very simple summary")) {
          responseType = "detailed";
        }

        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve(TestUtils.createMockGeminiResponse(responseType)),
        });
      }

      // Default fetch response
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });
    });
  }

  /**
   * Triggers storage change event for testing
   */
  static triggerStorageChange(changes, namespace = "sync") {
    if (TestUtils._storageChangeCallback) {
      TestUtils._storageChangeCallback(changes, namespace);
    }
  }

  /**
   * Triggers runtime message for testing
   */
  static triggerRuntimeMessage(message, sender, sendResponse) {
    if (TestUtils._messageCallback) {
      return TestUtils._messageCallback(message, sender, sendResponse);
    }
  }

  /**
   * Creates a mock DOM element with specified properties
   */
  static createElement(tag, properties = {}) {
    const element = document.createElement(tag);

    Object.keys(properties).forEach((key) => {
      if (key === "textContent") {
        element.textContent = properties[key];
      } else if (key === "innerHTML") {
        element.innerHTML = properties[key];
      } else if (key === "className") {
        element.className = properties[key];
      } else {
        element.setAttribute(key, properties[key]);
      }
    });

    return element;
  }

  /**
   * Waits for a condition to be true
   */
  static async waitFor(condition, timeout = 5000, interval = 100) {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * Simulates user interaction delays
   */
  static async delay(ms = 100) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Validates summary content for kid-friendliness
   */
  static validateKidFriendlyContent(content) {
    const issues = [];

    // Check for appropriate language
    const inappropriateWords = [
      "complex",
      "complicated",
      "sophisticated",
      "intricate",
    ];
    inappropriateWords.forEach((word) => {
      if (content.toLowerCase().includes(word)) {
        issues.push(`Contains potentially complex word: ${word}`);
      }
    });

    // Check for kid-friendly indicators
    const kidFriendlyIndicators = [
      "fun",
      "cool",
      "amazing",
      "kids",
      "children",
      "learn",
    ];
    const hasKidFriendlyLanguage = kidFriendlyIndicators.some((indicator) =>
      content.toLowerCase().includes(indicator),
    );

    if (!hasKidFriendlyLanguage) {
      issues.push("Lacks kid-friendly language indicators");
    }

    // Check length - should not be too long for kids
    if (content.length > 1000) {
      issues.push("Content may be too long for target age group");
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Validates HTML formatting
   */
  static validateHTMLFormatting(html) {
    const issues = [];

    // Check for proper paragraph tags
    if (!html.includes("<p>") && html.length > 50) {
      issues.push("Missing paragraph tags for longer content");
    }

    // Check for bullet points formatting
    if (html.includes("•") || html.includes("-") || html.includes("*")) {
      if (!html.includes("<ul>") && !html.includes("<li>")) {
        issues.push("Bullet points not properly formatted as HTML lists");
      }
    }

    // Check for bold text formatting
    if (html.includes("**") || html.includes("__")) {
      issues.push("Markdown formatting not converted to HTML");
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Cleans up test environment
   */
  static cleanup() {
    // Reset DOM
    document.body.innerHTML = "";

    // Clear stored callbacks
    TestUtils._storageChangeCallback = null;
    TestUtils._messageCallback = null;

    // Reset mocks
    jest.clearAllMocks();
  }
}

/**
 * Test data factory for creating realistic test scenarios
 */
export class TestDataFactory {
  static youtubeUrls = {
    valid: [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQ",
      "https://www.youtube.com/watch?v=abc123DEF_-&t=30s",
      "http://www.youtube.com/watch?v=test123",
    ],
    invalid: [
      "https://example.com",
      "https://youtube.com/channel/test",
      "not-a-url",
      "https://www.youtube.com/watch?v=",
      "",
    ],
  };

  static videoContent = {
    educational: {
      title: "How Plants Grow - Science for Kids",
      description:
        "Learn about how plants grow from seeds to full plants in this fun educational video for children.",
      transcript:
        "Hello kids! Today we are going to learn about plants. Plants start as tiny seeds. When we plant them in soil and give them water and sunlight, they begin to grow. First, a small root grows down into the soil. Then a green shoot grows up toward the sun. With more water and sunlight, the plant gets bigger and bigger until it becomes a full grown plant with leaves and maybe even flowers!",
    },
    entertainment: {
      title: "Funny Cat Videos Compilation",
      description:
        "Watch these hilarious cats doing silly things that will make you laugh.",
      transcript:
        "Here are some funny cats doing silly things. This cat is trying to fit in a box that is too small. This one is chasing its own tail. And this cat thinks it is a dog!",
    },
    minimal: {
      title: "Short Video",
      description: "Brief content",
      transcript:
        "Very short content that might not be suitable for summarization due to insufficient length.",
    },
  };

  static apiResponses = {
    success: {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  topics: [
                    {
                      id: 1,
                      name: "Plant Growth",
                      content: "How plants grow from seeds",
                    },
                    {
                      id: 2,
                      name: "What Plants Need",
                      content: "Water, sunlight, and soil requirements",
                    },
                  ],
                  overallSummary:
                    "This video teaches kids how plants grow and what they need to be healthy.",
                }),
              },
            ],
          },
        },
      ],
    },
    error401: {
      error: {
        code: 401,
        message: "API key not valid",
      },
    },
    error429: {
      error: {
        code: 429,
        message: "Resource has been exhausted",
      },
    },
    invalidFormat: {
      candidates: [],
    },
  };

  static userSettings = {
    defaultUser: {
      defaultAge: "6-8",
      summaryLength: "medium",
      autoSummarize: true,
      contentSafety: "strict",
    },
    youngerChild: {
      defaultAge: "3-5",
      summaryLength: "short",
      autoSummarize: true,
      contentSafety: "strict",
    },
    olderChild: {
      defaultAge: "9-12",
      summaryLength: "long",
      autoSummarize: false,
      contentSafety: "moderate",
    },
  };
}

module.exports = TestUtils;
