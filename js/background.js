// Background service worker for YouTube Summarizer for Kids Chrome Extension
// Implements the PocketFlow design pattern with Map-Reduce approach

class YouTubeSummarizerFlow {
  constructor() {
    this.shared = {};
    this.apiKey = null;
    this.debugMode = false; // Disabled for production
  }

  log(message, data = null) {
    if (this.debugMode) {
      console.log(`[YT-Summarizer-BG] ${message}`, data || "");
    }
  }

  async initialize() {
    // Get API key from storage
    const result = await chrome.storage.sync.get(["geminiApiKey"]);
    this.apiKey = result.geminiApiKey;

    if (!this.apiKey) {
      throw new Error(
        "Gemini API key not configured. Please set it in the extension options.",
      );
    }

    this.log("Initialized with API key");
  }

  // Node 1: Validate URL
  async validateURL(url) {
    this.log("Validating URL:", url);
    const youtubeRegex =
      /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);

    if (!match) {
      return {
        isValid: false,
        error:
          "Invalid YouTube URL. Please make sure you're on a YouTube video page.",
      };
    }

    this.shared.videoId = match[3];
    this.shared.youtubeUrl = url;
    this.log("URL validated, videoId:", this.shared.videoId);
    return { isValid: true };
  }

  // Node 2: Get Transcript (using content script extraction)
  async getTranscript() {
    try {
      this.log("Starting transcript extraction...");

      // Extract video info from the page
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab || !tab.url.includes("youtube.com/watch")) {
        throw new Error("Please navigate to a YouTube video page");
      }

      // Get transcript and video info from content script with retry logic
      let result;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          this.log(`Attempt ${retryCount + 1} to get video info...`);
          result = await chrome.tabs.sendMessage(tab.id, {
            action: "getVideoInfo",
            videoId: this.shared.videoId,
          });

          if (result && !result.error) {
            this.log("Successfully got video info");
            break;
          }

          if (result && result.error) {
            throw new Error(result.error);
          }
        } catch (error) {
          retryCount++;
          this.log(`Attempt ${retryCount} failed:`, error.message);
          if (retryCount >= maxRetries) {
            throw error;
          }
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      if (!result) {
        throw new Error(
          "Failed to get response from content script after multiple attempts. Please refresh the page and try again.",
        );
      }

      if (result.error) {
        throw new Error(result.error);
      }

      // More flexible content validation
      if (!result.transcript || result.transcript.length < 30) {
        throw new Error(
          "Insufficient video content for summarization. This video may not have captions, description, or other extractable content. Please try a different educational video.",
        );
      }

      this.shared.transcript = result.transcript;
      this.shared.videoInfo = {
        title: result.title || "YouTube Video",
        duration: result.duration || 0,
        url: `https://www.youtube.com/watch?v=${this.shared.videoId}`,
        thumbnailUrl:
          result.thumbnailUrl ||
          `https://img.youtube.com/vi/${this.shared.videoId}/maxresdefault.jpg`,
      };

      this.log("Transcript extracted successfully:", {
        title: this.shared.videoInfo.title,
        transcriptLength: this.shared.transcript.length,
      });

      return { success: true };
    } catch (error) {
      this.log("Failed to get transcript:", error.message);
      throw new Error(`Failed to get transcript: ${error.message}`);
    }
  }

  // Node 3: Generate Topics using Gemini API
  async generateTopics() {
    this.log("Generating topics and initial summary...");

    // Get user preferences for topic generation
    const settings = await chrome.storage.sync.get(["maxTopics"]);
    const maxTopics = settings.maxTopics || 5;

    // Truncate transcript if too long to avoid API limits
    const maxLength = 8000;
    const transcript =
      this.shared.transcript.length > maxLength
        ? this.shared.transcript.substring(0, maxLength) + "..."
        : this.shared.transcript;

    const prompt = `You are analyzing a YouTube video to identify the main topics discussed and creating an initial summary.

VIDEO TITLE: ${this.shared.videoInfo.title}

CONTENT:
${transcript}

TASK:
1. Identify ${maxTopics} main topics or themes from this video content (or fewer if the content doesn't support that many).
2. For each topic, create a brief description.
3. Create a kid-friendly initial summary of the overall video (150-200 words).
4. Format your response as JSON following this structure:

{
  "topics": [
    {
      "id": 1,
      "name": "First Topic Name",
      "content": "Brief description of what this topic covers"
    },
    // more topics...
  ],
  "initialSummary": "A clear, simple summary of the video suitable for children."
}

Only include valid JSON in your response.`;

    try {
      const response = await this.callGemini(prompt);
      let topics;

      try {
        // Try to parse JSON directly
        topics = JSON.parse(response);
      } catch {
        // If that fails, try to extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          topics = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Invalid JSON response from AI");
        }
      }

      // Ensure topics is valid
      if (
        !topics.topics ||
        !Array.isArray(topics.topics) ||
        topics.topics.length === 0
      ) {
        throw new Error("No valid topics found");
      }

      this.shared.topics = topics.topics;
      this.shared.initialSummary = topics.initialSummary || "";
      this.log(
        "Topics and initial summary generated:",
        this.shared.topics.length,
      );
      return { success: true, count: this.shared.topics.length };
    } catch (error) {
      this.log("Topic generation failed, using fallback:", error.message);
      // Fallback: create a single topic with the content
      this.shared.topics = [
        {
          id: 1,
          name: "Main Content",
          content: `This video "${this.shared.videoInfo.title}" discusses various educational topics that can be explained in a kid-friendly way.`,
        },
      ];
      this.shared.initialSummary = `This video "${this.shared.videoInfo.title}" contains educational content that can be fun to learn about!`;
      return { success: true, count: 1, fallback: true };
    }
  }

  // Node 4: Topic Processor (Map phase - BatchNode equivalent)
  async processTopics() {
    this.log("Processing topics...");
    const processedTopics = [];

    // Get user's age preference from settings
    const settings = await chrome.storage.sync.get(["defaultAge"]);
    const targetAge = settings.defaultAge || "6-8";
    this.log("Target age:", targetAge);

    // Process each topic independently (Map phase)
    for (const topic of this.shared.topics) {
      try {
        const processed = await this.processSingleTopic(topic, targetAge);
        processedTopics.push(processed);
      } catch (error) {
        this.log("Failed to process topic:", topic.name, error.message);
        // Fallback for failed topic processing
        processedTopics.push({
          id: topic.id,
          name: topic.name,
          content: topic.content,
          summary: `This part talks about ${topic.name}`,
          explanation: `This section discusses ${topic.name} in the video.`,
          qaPairs: [
            {
              question: `What is ${topic.name}?`,
              answer: "It's something interesting discussed in the video!",
            },
          ],
        });
      }
    }

    this.shared.processedTopics = processedTopics;
    this.log("Topics processed:", processedTopics.length);
    return { success: true, processedCount: processedTopics.length };
  }

  async processSingleTopic(topic, targetAge) {
    const agePrompts = {
      "3-5":
        "Use very simple words and basic concepts that a 3-5 year old would understand. Use fun analogies and short sentences.",
      "6-8":
        "Use elementary school level language that a 6-8 year old would understand. Include some educational details but keep it simple.",
      "9-12":
        "Use middle school level language that a 9-12 year old would understand. Include more detailed explanations but keep it engaging.",
    };

    const ageInstruction = agePrompts[targetAge] || agePrompts["6-8"];

    const prompt = `You are creating a child-friendly explanation for a YouTube video topic.

TARGET AGE: ${targetAge} years old
AGE INSTRUCTION: ${ageInstruction}

TOPIC: ${topic.name}
CONTENT: ${topic.content}

TASK:
1. Create a very simple summary of this topic that fits the target age.
2. Create a detailed but age-appropriate explanation.
3. Create 2-3 question and answer pairs that a curious child might ask.

Format your response as JSON:

{
  "summary": "Your child-friendly summary here",
  "explanation": "Your detailed but simple explanation here",
  "qaPairs": [
    {
      "question": "First question?",
      "answer": "Simple answer for the first question"
    },
    {
      "question": "Second question?",
      "answer": "Simple answer for the second question"
    }
  ]
}

Only include valid JSON in your response.`;

    const response = await this.callGemini(prompt);

    try {
      let qaData;
      try {
        qaData = JSON.parse(response);
      } catch {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          qaData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Invalid JSON response");
        }
      }

      return {
        id: topic.id,
        name: topic.name,
        content: topic.content,
        summary: qaData.summary || `This topic is about ${topic.name}`,
        explanation:
          qaData.explanation ||
          `${topic.name} is an interesting subject from the video.`,
        qaPairs: qaData.qaPairs || [
          {
            question: `What is ${topic.name}?`,
            answer: "It's something educational from the video!",
          },
        ],
      };
    } catch (error) {
      this.log("Failed to parse topic processing response:", error.message);
      throw error;
    }
  }

  // Node 5: Combine Topics (Reduce phase)
  async combineTopics() {
    this.log("Combining topics...");

    if (
      !this.shared.processedTopics ||
      this.shared.processedTopics.length === 0
    ) {
      this.shared.topicConnections = [];
      this.shared.topicRanking = [];
      return { success: true, fallback: true };
    }

    const topicInfo = this.shared.processedTopics
      .map(
        (topic) =>
          `TOPIC ${topic.id}: ${topic.name}\nSUMMARY: ${topic.summary}`,
      )
      .join("\n\n");

    const prompt = `You are reviewing child-friendly explanations of topics from a YouTube video.

VIDEO TITLE: ${this.shared.videoInfo.title}

TOPICS OVERVIEW:
${topicInfo}

TASK:
1. Create 1-2 connections between topics to form a cohesive story.
2. Rank the topics by importance for learning.

Format your response as JSON:

{
  "connections": [
    "Brief connection between topics 1 and 2",
    "Another connection between topics"
  ],
  "ranking": [
    {
      "topicId": 1,
      "importance": "high",
      "reason": "Why this topic is important"
    }
  ]
}

Only include valid JSON in your response.`;

    try {
      const response = await this.callGemini(prompt);
      let combinedData;

      try {
        combinedData = JSON.parse(response);
      } catch {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          combinedData = JSON.parse(jsonMatch[0]);
        } else {
          combinedData = { connections: [], ranking: [] };
        }
      }

      this.shared.topicConnections = combinedData.connections || [];
      this.shared.topicRanking = combinedData.ranking || [];

      return { success: true };
    } catch (error) {
      this.log("Topic combination failed:", error.message);
      // Fallback
      this.shared.topicConnections = [];
      this.shared.topicRanking = [];
      return { success: true, fallback: true };
    }
  }

  // Node 6: Create Summary
  async createSummary() {
    this.log("Creating summary...");

    if (
      !this.shared.processedTopics ||
      this.shared.processedTopics.length === 0
    ) {
      this.shared.summary = `This video "${this.shared.videoInfo.title}" contains educational content that can be fun to learn about!`;
      return { success: true, fallback: true };
    }

    const topicSummaries = this.shared.processedTopics
      .map((topic) => `- ${topic.name}: ${topic.summary}`)
      .join("\n");

    const connections =
      this.shared.topicConnections?.length > 0
        ? this.shared.topicConnections.map((conn) => `- ${conn}`).join("\n")
        : "";

    const prompt = `You are creating a simple overall summary of a YouTube video for children.
The summary should be suitable for children to understand.

VIDEO TITLE: ${this.shared.videoInfo.title}

TOPIC SUMMARIES:
${topicSummaries}

CONNECTIONS BETWEEN TOPICS:
${connections || "No specific connections identified."}

TASK:
Create a very simple, engaging overall summary of this video that children would understand.
Use simple words, fun language, and a friendly tone.
Keep it to 3-4 sentences.

Your summary:`;

    try {
      const summary = await this.callGemini(prompt);
      this.shared.summary = summary.trim();
      return { success: true };
    } catch (error) {
      this.log("Summary creation failed:", error.message);
      // Fallback summary
      this.shared.summary = `This video "${this.shared.videoInfo.title}" talks about ${this.shared.processedTopics.length} main topics that are fun to learn about!`;
      return { success: true, fallback: true };
    }
  }

  // Node 6.1: Create Initial Summary (new step for two-phase approach)
  async createInitialSummary() {
    this.log("Creating initial summary...");

    if (!this.shared.topics || this.shared.topics.length === 0) {
      this.shared.initialSummary = `This video "${this.shared.videoInfo.title}" contains educational content that can be fun to learn about!`;
      return { success: true, fallback: true };
    }

    const topicHighlights = this.shared.topics
      .map((topic) => `- ${topic.name}`)
      .join("\n");

    const prompt = `You are creating an initial summary of a YouTube video for children.
This summary should highlight the main topics without going into detail.

VIDEO TITLE: ${this.shared.videoInfo.title}

MAIN TOPICS:
${topicHighlights}

TASK:
Create a very simple, engaging initial summary of this video that children would understand.
Use simple words and a friendly tone.
Keep it to 2-3 sentences.

Your summary:`;

    try {
      const summary = await this.callGemini(prompt);
      this.shared.initialSummary = summary.trim();
      return { success: true };
    } catch (error) {
      this.log("Initial summary creation failed:", error.message);
      // Fallback initial summary
      this.shared.initialSummary = `This video "${this.shared.videoInfo.title}" covers various interesting topics!`;
      return { success: true, fallback: true };
    }
  }

  // Node 7: Create Detailed Summary
  async createDetailedSummary() {
    this.log("Creating detailed summary...");

    // Get settings for target age and summary preferences
    const settings = await chrome.storage.sync.get([
      "defaultAge",
      "summaryLength",
    ]);
    const targetAge = settings.defaultAge || "6-8";
    const summaryLength = settings.summaryLength || "medium";

    // Adjust word count based on length preference
    const lengthMap = {
      short: "150-200 words",
      medium: "250-300 words",
      long: "350-400 words",
    };
    const targetLength = lengthMap[summaryLength] || lengthMap["medium"];

    const prompt = `You are creating a detailed summary of a YouTube video for young children (age range: ${targetAge}).

VIDEO TITLE: ${this.shared.videoInfo.title}

PROCESSED TOPICS:
${JSON.stringify(this.shared.processedTopics, null, 2)}

TOPIC CONNECTIONS:
${JSON.stringify(this.shared.topicConnections, null, 2)}

TASK:
Create a thorough but accessible detailed summary that:
1. Uses simple, engaging language suitable for children aged ${targetAge}
2. Captures the main points and how they connect
3. Is approximately ${targetLength}
4. Doesn't include complex terminology without explanation
5. Uses a friendly, positive tone

SUMMARY:`;

    try {
      const response = await this.callGemini(prompt);
      this.shared.detailedSummary = response.trim();
      this.log(
        "Detailed summary created, length:",
        this.shared.detailedSummary.length,
      );
      return { success: true };
    } catch (error) {
      this.log(
        "Failed to create detailed summary, using fallback:",
        error.message,
      );
      // Create a fallback summary
      this.shared.detailedSummary = `This video called "${this.shared.videoInfo.title}" has some interesting information about ${this.shared.processedTopics.map((t) => t.name).join(", ")}. Each topic is explained in a way that's easy to understand. You can explore each topic section to learn more!`;
      return { success: true, fallback: true };
    }
  }

  // Utility function to call Gemini API
  async callGemini(prompt) {
    this.log("Calling Gemini API...");

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const data = await response.json();

    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content
    ) {
      throw new Error("No content generated by Gemini API");
    }

    const result = data.candidates[0].content.parts[0].text;
    this.log("Gemini API response received");
    return result;
  }

  // Main flow execution
  async run(url, phase = "initial") {
    try {
      this.log(
        `Starting YouTube summarizer flow for: ${url} (Phase: ${phase})`,
      );

      await this.initialize();

      // Step 1: Validate URL
      const validation = await this.validateURL(url);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Step 2: Get transcript
      await this.getTranscript();

      // Step 3: Generate topics and initial summary
      await this.generateTopics();

      if (phase === "initial") {
        // Initial phase: Just return topics and initial summary
        this.log("Initial phase completed successfully");
        return {
          success: true,
          phase: "initial",
          data: {
            videoInfo: this.shared.videoInfo,
            summary: this.shared.initialSummary,
            topics: this.shared.topics,
            processingState: "initial",
          },
        };
      } else if (phase === "detailed") {
        // Detailed phase: Process topics in depth

        // Step 4: Process topics (Map phase)
        await this.processTopics();

        // Step 5: Combine topics (Reduce phase)
        await this.combineTopics();

        // Step 6: Create detailed summary
        await this.createDetailedSummary();

        this.log("Detailed phase completed successfully");
        return {
          success: true,
          phase: "detailed",
          data: {
            videoInfo: this.shared.videoInfo,
            summary: this.shared.detailedSummary,
            topics: this.shared.topics, // Include original topics for download
            processedTopics: this.shared.processedTopics,
            topicConnections: this.shared.topicConnections,
            topicRanking: this.shared.topicRanking,
            processingState: "completed",
          },
        };
      }
    } catch (error) {
      this.log("Flow execution failed:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Message handler for popup and content script communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "summarizeVideo") {
    const flow = new YouTubeSummarizerFlow();
    const phase = request.phase || "initial";

    flow
      .run(request.url, phase)
      .then((result) => sendResponse(result))
      .catch((error) =>
        sendResponse({
          success: false,
          error: error.message,
        }),
      );

    return true; // Keep message channel open for async response
  }

  if (request.action === "downloadSummary") {
    try {
      const downloadManager = new SummaryDownloadManager();
      const result = downloadManager.generateDownloadableHTML(request.data);

      sendResponse({
        success: true,
        html: result.html,
        filename: result.filename,
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message,
      });
    }

    return true;
  }

  if (request.action === "checkApiKey") {
    chrome.storage.sync.get(["geminiApiKey"], (result) => {
      sendResponse({ hasApiKey: !!result.geminiApiKey });
    });

    return true;
  }
});

// Install/startup handler
chrome.runtime.onInstalled.addListener(() => {
  console.log("YouTube Summarizer for Kids extension installed");
});

class SummaryDownloadManager {
  constructor() {
    this.debugMode = false; // Disabled for production
  }

  log(message, data = null) {
    if (this.debugMode) {
      console.log(`[YT-Summarizer-Download] ${message}`, data || "");
    }
  }

  formatTextForHTML(text) {
    if (!text || typeof text !== "string") return text;

    // Convert line breaks to <br> tags
    const formattedText = text.replace(/\n/g, "<br>");

    // Convert bullet points (* text) to proper HTML lists
    const bulletRegex = /\* ([^*\n]+)/g;
    if (bulletRegex.test(text)) {
      // Split by line breaks and process
      const lines = text.split("\n");
      let inList = false;
      let result = "";

      for (let line of lines) {
        line = line.trim();
        if (line.startsWith("* ")) {
          if (!inList) {
            result += "<ul>";
            inList = true;
          }
          const bulletContent = line.substring(2).trim();
          result += `<li>${this.formatInlineText(bulletContent)}</li>`;
        } else {
          if (inList) {
            result += "</ul>";
            inList = false;
          }
          if (line) {
            result += `<p>${this.formatInlineText(line)}</p>`;
          }
        }
      }

      if (inList) {
        result += "</ul>";
      }

      return result;
    }

    // If no bullet points, just format inline text and preserve line breaks
    return formattedText
      .split("<br>")
      .map((line) => {
        line = line.trim();
        return line ? `<p>${this.formatInlineText(line)}</p>` : "";
      })
      .filter((line) => line)
      .join("");
  }

  formatInlineText(text) {
    if (!text) return text;

    // Convert ALL CAPS words to bold (common pattern in the text)
    text = text.replace(/\b[A-Z]{2,}\b/g, "<strong>$&</strong>");

    // Convert text between asterisks to bold
    text = text.replace(/\*([^*]+)\*/g, "<strong>$1</strong>");

    // Convert text in quotes to emphasis
    text = text.replace(/"([^"]+)"/g, '<em>"$1"</em>');

    return text;
  }

  generateDownloadableHTML(data) {
    this.log("Generating downloadable HTML for summary");

    const {
      videoInfo,
      summary,
      topics,
      processedTopics,
      topicConnections,
      processingState,
    } = data;
    const generationDate = new Date().toLocaleDateString();
    const generationTime = new Date().toLocaleTimeString();

    // Create safe filename from video title
    const safeTitle = this.createSafeFileName(videoInfo.title);

    // Determine if this is initial or detailed summary
    const isDetailed =
      processingState === "completed" &&
      processedTopics &&
      processedTopics.length > 0;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YouTube Summary: ${videoInfo.title}</title>
    <style>
        ${this.getDownloadableCSS()}
    </style>
</head>
<body>
    <div class="summary-container">
        <header class="summary-header">
            <div class="video-info">
                <img src="${videoInfo.thumbnailUrl}" alt="Video thumbnail" class="video-thumbnail" onerror="this.style.display='none'">
                <div class="video-details">
                    <h1 class="video-title">${videoInfo.title}</h1>
                    <div class="video-meta">
                        <span class="duration">Duration: ${this.formatDuration(videoInfo.duration)}</span>
                        <span class="generation-info">Generated on ${generationDate} at ${generationTime}</span>
                    </div>
                </div>
            </div>
            <div class="summary-type">
                <span class="type-badge ${isDetailed ? "detailed" : "initial"}">${isDetailed ? "Detailed" : "Quick"} Summary</span>
            </div>
        </header>

        <main class="summary-content">
            <section class="overview-section">
                <h2>📝 Video Summary</h2>
                <div class="summary-text">${this.formatTextForHTML(summary)}</div>
            </section>

            ${this.generateTopicsHTML(topics, processedTopics, isDetailed)}
            
            ${this.generateConnectionsHTML(topicConnections)}
        </main>

        <footer class="summary-footer">
            <div class="footer-content">
                <p>Generated by <strong>YouTube Summarizer for Kids</strong> Chrome Extension</p>
                <p class="original-url">Original video: <a href="${data.videoInfo.url || "#"}" target="_blank">${data.videoInfo.title || "YouTube Video"}</a></p>
                <p class="disclaimer">This summary was created using AI and is intended for educational purposes.</p>
            </div>
        </footer>
    </div>

    <script>
        // Add print functionality
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                window.print();
            }
        });
        
        // Collapsible sections for detailed summaries
        document.querySelectorAll('.topic-header').forEach(header => {
            header.addEventListener('click', function() {
                const content = this.nextElementSibling;
                const icon = this.querySelector('.toggle-icon');
                
                if (content.style.display === 'none' || content.style.display === '') {
                    content.style.display = 'block';
                    icon.textContent = '▼';
                } else {
                    content.style.display = 'none';
                    icon.textContent = '►';
                }
            });
        });

        // Set initial collapsed state for detailed summaries
        document.querySelectorAll('.topic-detailed .topic-content').forEach(content => {
            content.style.display = 'none';
        });
        document.querySelectorAll('.topic-detailed .toggle-icon').forEach(icon => {
            icon.textContent = '►';
        });
    </script>
</body>
</html>`;

    return {
      html: htmlContent,
      filename: `YouTube_${isDetailed ? "Detailed" : "Quick"}_Summary_${safeTitle}_${this.getDateString()}.html`,
    };
  }

  generateTopicsHTML(topics, processedTopics, isDetailed) {
    let html = "";

    // For detailed summaries, show both main topics and detailed topics
    if (isDetailed && processedTopics && processedTopics.length > 0) {
      // Add main topics section if available
      if (topics && topics.length > 0) {
        html += `
          <section class="topics-section">
              <h2>🎯 Main Topics</h2>
              ${topics
                .map(
                  (topic) => `
                  <div class="topic-simple">
                      <h3>📚 ${topic.name}</h3>
                      <div>${this.formatTextForHTML(topic.content)}</div>
                  </div>
              `,
                )
                .join("")}
          </section>
        `;
      }

      // Add detailed topics section
      html += `
        <section class="topics-section">
            <h2>🎯 Detailed Topics</h2>
            ${processedTopics
              .map(
                (topic) => `
                <div class="topic-detailed">
                    <div class="topic-header">
                        <h3>📚 ${topic.name}</h3>
                        <span class="toggle-icon">►</span>
                    </div>
                    <div class="topic-content">
                        <div class="topic-summary">
                            <h4>Quick Summary:</h4>
                            <div>${this.formatTextForHTML(topic.summary)}</div>
                        </div>
                        <div class="topic-explanation">
                            <h4>📖 Learn More:</h4>
                            <div>${this.formatTextForHTML(topic.explanation)}</div>
                        </div>
                        <div class="topic-qa">
                            <h4>❓ Questions & Answers:</h4>
                            ${
                              topic.qaPairs && topic.qaPairs.length > 0
                                ? topic.qaPairs
                                    .map(
                                      (qa) => `
                                <div class="qa-pair">
                                    <div class="question">Q: ${this.formatInlineText(qa.question)}</div>
                                    <div class="answer">A: ${this.formatTextForHTML(qa.answer)}</div>
                                </div>
                            `,
                                    )
                                    .join("")
                                : "<p>No questions available for this topic.</p>"
                            }
                        </div>
                    </div>
                </div>
            `,
              )
              .join("")}
        </section>
      `;

      return html;
    } else if (topics && topics.length > 0) {
      // For quick summaries, show only main topics
      return `
        <section class="topics-section">
            <h2>🎯 Main Topics</h2>
            ${topics
              .map(
                (topic) => `
                <div class="topic-simple">
                    <h3>📚 ${topic.name}</h3>
                    <div>${this.formatTextForHTML(topic.content)}</div>
                </div>
            `,
              )
              .join("")}
        </section>
      `;
    } else {
      return "";
    }
  }

  generateConnectionsHTML(connections) {
    if (!connections || connections.length === 0) return "";

    return `
      <section class="connections-section">
          <h2>🔗 How Topics Connect</h2>
          <ul class="connections-list">
              ${connections.map((connection) => `<li>${connection}</li>`).join("")}
          </ul>
      </section>
    `;
  }

  getDownloadableCSS() {
    return `
      /* YouTube Summarizer - Downloadable HTML Styles */
      * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
      }

      body {
          font-family: 'Comic Sans MS', 'Chalkboard SE', 'Segoe UI', sans-serif;
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
      }

      .summary-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: white;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          border-radius: 15px;
          margin-top: 20px;
          margin-bottom: 20px;
      }

      .summary-header {
          border-bottom: 3px solid #ff6b6b;
          padding-bottom: 20px;
          margin-bottom: 30px;
      }

      .video-info {
          display: flex;
          gap: 20px;
          align-items: center;
          margin-bottom: 15px;
      }

      .video-thumbnail {
          width: 120px;
          height: 90px;
          object-fit: cover;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }

      .video-title {
          color: #ff6b6b;
          font-size: 24px;
          margin-bottom: 10px;
      }

      .video-meta {
          display: flex;
          flex-direction: column;
          gap: 5px;
          font-size: 14px;
          color: #666;
      }

      .type-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 12px;
      }

      .type-badge.initial {
          background: #4ecdc4;
          color: white;
      }

      .type-badge.detailed {
          background: #ff9f43;
          color: white;
      }

      .summary-content {
          margin-bottom: 30px;
      }

      .overview-section, .topics-section, .connections-section {
          margin-bottom: 30px;
      }

      .overview-section h2, .topics-section h2, .connections-section h2 {
          color: #ff6b6b;
          font-size: 20px;
          margin-bottom: 15px;
          border-left: 4px solid #ff6b6b;
          padding-left: 15px;
      }

      .summary-text {
          background: #ffe8d6;
          padding: 20px;
          border-radius: 10px;
          border-left: 4px solid #ff9f43;
          font-size: 16px;
      }

      /* Formatting for structured text content */
      .summary-text p, .topic-simple div p, .topic-summary div p, .topic-explanation div p {
          margin-bottom: 12px;
          line-height: 1.6;
      }

      .summary-text ul, .topic-simple div ul, .topic-summary div ul, .topic-explanation div ul {
          margin: 15px 0;
          padding-left: 20px;
      }

      .summary-text li, .topic-simple div li, .topic-summary div li, .topic-explanation div li {
          margin-bottom: 8px;
          line-height: 1.5;
      }

      .summary-text strong, .topic-simple div strong, .topic-summary div strong, .topic-explanation div strong, .answer strong {
          color: #ff6b6b;
          font-weight: bold;
      }

      .summary-text em, .topic-simple div em, .topic-summary div em, .topic-explanation div em {
          font-style: italic;
          color: #666;
      }

      .topic-simple, .topic-detailed {
          background: #e8f4f8;
          border-radius: 10px;
          margin-bottom: 15px;
          overflow: hidden;
          border-left: 4px solid #4ecdc4;
      }

      .topic-simple {
          padding: 20px;
      }

      .topic-simple h3 {
          color: #4ecdc4;
          margin-bottom: 10px;
          font-size: 18px;
      }

      .topic-header {
          background: #4ecdc4;
          color: white;
          padding: 15px 20px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: background 0.3s ease;
      }

      .topic-header:hover {
          background: #45b7b8;
      }

      .topic-header h3 {
          margin: 0;
          font-size: 18px;
      }

      .toggle-icon {
          font-size: 16px;
          font-weight: bold;
      }

      .topic-content {
          padding: 20px;
      }

      .topic-summary, .topic-explanation, .topic-qa {
          margin-bottom: 20px;
      }

      .topic-summary h4, .topic-explanation h4, .topic-qa h4 {
          color: #ff6b6b;
          margin-bottom: 10px;
          font-size: 16px;
      }

      .qa-pair {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 10px;
          border-left: 3px solid #7ed321;
      }

      .question {
          font-weight: bold;
          color: #ff6b6b;
          margin-bottom: 5px;
      }

      .answer {
          color: #333;
          padding-left: 15px;
      }

      .answer p {
          margin-bottom: 8px;
      }

      .answer ul {
          margin: 10px 0 10px 15px;
      }

      .answer li {
          margin-bottom: 5px;
      }

      .connections-list {
          list-style: none;
          padding-left: 0;
      }

      .connections-list li {
          background: #e8f5e8;
          padding: 15px;
          margin-bottom: 10px;
          border-radius: 8px;
          border-left: 4px solid #7ed321;
      }

      .summary-footer {
          border-top: 2px solid #eee;
          padding-top: 20px;
          text-align: center;
          color: #666;
          font-size: 14px;
      }

      .footer-content p {
          margin-bottom: 8px;
      }

      .original-url a {
          color: #4ecdc4;
          text-decoration: none;
      }

      .original-url a:hover {
          text-decoration: underline;
      }

      .disclaimer {
          font-style: italic;
          font-size: 12px;
          color: #999;
      }

      /* Print styles */
      @media print {
          body {
              background: white;
          }
          
          .summary-container {
              box-shadow: none;
              margin: 0;
              padding: 0;
          }
          
          .topic-header {
              background: #4ecdc4 !important;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
          }
          
          .type-badge {
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
          }
      }

      /* Responsive design */
      @media (max-width: 768px) {
          .summary-container {
              margin: 10px;
              padding: 15px;
          }
          
          .video-info {
              flex-direction: column;
              text-align: center;
          }
          
          .video-thumbnail {
              width: 100px;
              height: 75px;
          }
          
          .video-title {
              font-size: 20px;
          }
      }
    `;
  }

  createSafeFileName(title) {
    return title
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .replace(/_+/g, "_") // Replace multiple underscores with single
      .substring(0, 50) // Limit length
      .replace(/_$/, ""); // Remove trailing underscore
  }

  getDateString() {
    const now = new Date();
    return now.toISOString().split("T")[0]; // YYYY-MM-DD format
  }

  formatDuration(seconds) {
    if (!seconds || seconds === 0) return "Unknown duration";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, "0")}`;
    }
  }
}
