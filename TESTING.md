# 🧪 Testing Guide - YouTube Summarizer for Kids Chrome Extension

## ✅ Automated Testing Framework - 29 Passing Tests

This project includes a comprehensive automated testing framework with **29 passing tests**:

### Test Results Summary

```
Test Suites: 5 passed, 5 total
Tests:       29 passed, 29 total
Snapshots:   0 total
Time:        1.19 s
```

### Running Automated Tests

```bash
# Run all tests
npm test

# Run by category
npm run test:unit        # 20 unit tests
npm run test:integration # 3 integration tests
npm run test:e2e         # 6 end-to-end tests

# Development mode
npm run test:watch       # Watch for changes
npm run test:coverage    # Generate coverage report
```

### Test Categories

- **Unit Tests** (`tests/unit/`) - 20 tests covering core functionality
- **Integration Tests** (`tests/integration/`) - 3 tests for API integration
- **E2E Tests** (`tests/e2e/`) - 6 tests for browser automation

---

## 🚀 Manual Testing Steps

### 1. Install the Extension

```bash
1. Open Chrome and go to chrome://extensions/
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the youtube-summarizer-extension folder
5. Verify extension appears in the list
```

### 2. Configure API Key

```bash
1. Get a Gemini API key from: https://makersuite.google.com/app/apikey
2. Click the extension icon in Chrome toolbar
3. Click "Settings" or right-click extension → "Options"
4. Enter your API key and click "Test API Key"
5. Save settings
```

### 3. Test on YouTube Videos

#### ✅ Recommended Test Videos (Educational with good descriptions):

- **TED-Ed videos** - Usually have great captions and educational content
- **National Geographic Kids** - Perfect for kid-friendly testing
- **Crash Course Kids** - Educational content designed for children
- **SciShow Kids** - Science content for young learners

#### 🔍 Testing Process:

1. Go to any educational YouTube video
2. Look for the "🎬 Kid-Friendly Summary" button (may be floating or in video controls)
3. Click the button
4. Wait 30-60 seconds for processing
5. Check that summary appears below the video

## 🐛 Troubleshooting Common Issues

### Issue 1: "Failed to extract video info: Unable to extract sufficient content"

**Causes:**

- Video has no captions/subtitles
- Video description is too short
- Content extraction failed

**Solutions:**

1. Try a different video with auto-generated captions
2. Look for educational videos with longer descriptions
3. Try TED-Ed or educational channels
4. Check browser console for detailed errors

**Test Commands:**

```javascript
// Open browser console (F12) and run:
console.log("Video ID:", new URLSearchParams(window.location.search).get("v"));

// Check if description exists:
console.log("Description found:", !!document.querySelector("#description"));
```

### Issue 2: "NotFoundError: Failed to execute 'insertBefore'"

**Causes:**

- DOM insertion target not found
- YouTube page structure changed

**Solutions:**

1. Refresh the YouTube page
2. Wait for page to fully load before clicking summary button
3. Try a different video page

**Fixed in latest version:** Now uses multiple fallback insertion points

### Issue 3: Summary says "created" but not visible

**Causes:**

- Summary inserted but not scrolled into view
- CSS styling issues
- DOM insertion in wrong location

**Solutions:**

1. Scroll down on the YouTube page to look for the summary
2. Check browser console for errors
3. Try clicking the summary button again

**Test Command:**

```javascript
// Check if summary panel exists:
console.log(
  "Summary panels:",
  document.querySelectorAll(".yt-summarizer-panel").length,
);
```

### Issue 4: API Key errors

**Error Messages:**

- "API Key not configured"
- "403 Forbidden"
- "Invalid API key"

**Solutions:**

1. Verify API key is correctly entered (no extra spaces)
2. Test API key in extension options
3. Generate a new API key from Google AI Studio
4. Check Google Cloud quotas/billing

## 🎯 Comprehensive Testing Checklist

### ✅ Basic Functionality

- [ ] Extension loads without errors
- [ ] API key can be configured and tested
- [ ] Summary button appears on YouTube videos
- [ ] Button shows loading state when clicked
- [ ] Summary generates successfully
- [ ] Summary is displayed properly
- [ ] Error messages are clear and helpful

### ✅ Content Quality Testing

- [ ] Summaries are age-appropriate for selected age group
- [ ] Q&A sections are engaging and educational
- [ ] Topics are relevant to video content
- [ ] Language is simple and kid-friendly
- [ ] No inappropriate content in summaries

### ✅ Edge Cases

- [ ] Very short videos (< 2 minutes)
- [ ] Very long videos (> 30 minutes)
- [ ] Videos without captions
- [ ] Videos with auto-generated captions only
- [ ] Videos in different languages
- [ ] Music videos or non-educational content

### ✅ UI/UX Testing

- [ ] Extension popup opens properly
- [ ] Settings page loads correctly
- [ ] All buttons are clickable and responsive
- [ ] Error messages are user-friendly
- [ ] Summary panel can be closed
- [ ] Extension works on page navigation

## 🔧 Debug Commands

### Check Extension Status

```javascript
// Run in browser console on YouTube page:

// 1. Check if content script loaded
console.log("Content script:", typeof YouTubeContentScript);

// 2. Check current video ID
console.log("Video ID:", new URLSearchParams(window.location.search).get("v"));

// 3. Check if extension is communicating
chrome.runtime.sendMessage({ action: "checkApiKey" }, (response) => {
  console.log("API Key configured:", response.hasApiKey);
});

// 4. Check for existing summary panels
console.log(
  "Summary panels:",
  document.querySelectorAll(".yt-summarizer-panel"),
);

// 5. Check for summary button
console.log("Summary button:", document.getElementById("yt-summarizer-btn"));
```

### Force Button Creation

```javascript
// If button doesn't appear, force create it:
const button = document.createElement("button");
button.id = "yt-summarizer-btn-test";
button.innerHTML = "🧪 Test Summary";
button.style.cssText = `
  position: fixed; top: 100px; right: 20px; z-index: 9999;
  background: #ff6b6b; color: white; border: none;
  padding: 12px; border-radius: 8px; cursor: pointer;
`;
button.onclick = () => {
  chrome.runtime.sendMessage(
    {
      action: "summarizeVideo",
      url: window.location.href,
    },
    (response) => {
      console.log("Summary result:", response);
    },
  );
};
document.body.appendChild(button);
```

## 📊 Test Results Template

### Test Environment

- **Chrome Version:** \***\*\_\_\_\*\***
- **Extension Version:** 1.0.0
- **Operating System:** \***\*\_\_\_\*\***
- **Test Date:** \***\*\_\_\_\*\***

### Test Results

| Test Case              | Status | Notes |
| ---------------------- | ------ | ----- |
| Extension Installation | ✅/❌  |       |
| API Key Configuration  | ✅/❌  |       |
| Button Appearance      | ✅/❌  |       |
| Summary Generation     | ✅/❌  |       |
| Summary Display        | ✅/❌  |       |
| Error Handling         | ✅/❌  |       |
| Age Customization      | ✅/❌  |       |

### Video Tests

| Video Type           | URL | Result | Notes |
| -------------------- | --- | ------ | ----- |
| Educational (TED-Ed) |     | ✅/❌  |       |
| Kids Content         |     | ✅/❌  |       |
| Science Video        |     | ✅/❌  |       |
| Long Video (>20min)  |     | ✅/❌  |       |
| Short Video (<5min)  |     | ✅/❌  |       |

## 🚑 Emergency Fixes

### If Extension Won't Load

1. Check manifest.json syntax
2. Ensure all files are present
3. Check browser console for errors
4. Try removing and reloading extension

### If API Calls Fail

1. Verify internet connection
2. Check API key validity
3. Test with curl:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-goog-api-key: YOUR_API_KEY" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
  https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent
```

### If DOM Insertion Fails

1. Check YouTube page fully loaded
2. Try different insertion selectors
3. Use floating button as fallback

## 📞 Getting Help

### Debug Information to Collect

1. Chrome version: `chrome://version/`
2. Extension ID from chrome://extensions/
3. Browser console errors (F12 → Console)
4. Video URL being tested
5. API key status (configured/not configured)

### Console Commands for Support

```javascript
// Collect debug info
const debugInfo = {
  url: window.location.href,
  videoId: new URLSearchParams(window.location.search).get("v"),
  hasButton: !!document.getElementById("yt-summarizer-btn"),
  hasPanels: document.querySelectorAll(".yt-summarizer-panel").length,
  userAgent: navigator.userAgent,
  timestamp: new Date().toISOString(),
};
console.log("Debug Info:", JSON.stringify(debugInfo, null, 2));
```

---

**💡 Pro Tip:** Start testing with educational videos from well-known channels like TED-Ed, Crash Course, or National Geographic. These typically have good captions and appropriate content for testing the summarization features.
