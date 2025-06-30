# YouTube Summarizer Extension - Testing Guide

## 🚀 Quick Test Steps

### 1. Install the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `youtube-summarizer-extension` folder
5. The extension should appear in your extensions list

### 2. Configure API Key
1. Click the extension icon in the toolbar (puzzle piece icon)
2. Click "Options" or right-click the extension and select "Options"
3. Enter your Gemini API key
4. Set your preferred age range (6-8 is default)
5. Click "Save Settings"

### 3. Test on YouTube
1. Go to any educational YouTube video, for example:
   - https://www.youtube.com/watch?v=dQw4w9WgXcQ (Rick Roll - has description)
   - https://www.youtube.com/watch?v=9bZkp7q19f0 (Gangnam Style - popular video)
   - Any educational video with captions/subtitles

2. Look for the "🎬 Kid-Friendly Summary" button - it should appear:
   - Near the video actions (like/dislike buttons)
   - Below the video title
   - In the secondary info area
   - Or as a floating button on the right side

3. Click the button and wait for the summary to be generated

### 4. Expected Results
✅ **Success Indicators:**
- Button appears within 3-5 seconds of page load
- Button shows "⏳ Creating Summary..." when clicked
- Success notification appears in top-right corner
- Summary panel appears below/beside the video with:
  - Video thumbnail and title
  - Overall summary
  - Topic sections with Q&A
  - Kid-friendly explanations

❌ **Common Issues & Solutions:**

#### Issue: "Failed to get transcript"
**Solution:** Try videos with:
- Auto-generated captions
- Detailed descriptions
- Educational content
- Avoid: Music videos, short clips, private/restricted videos

#### Issue: "API key not configured"
**Solution:** 
- Go to extension options
- Make sure API key is saved correctly
- Get a valid Gemini API key from Google AI Studio

#### Issue: Button doesn't appear
**Solution:**
- Refresh the YouTube page
- Wait a few more seconds
- Check if it appears as a floating button
- Try a different YouTube video

#### Issue: Summary panel not visible
**Solution:**
- Scroll down the page to look for it
- Check if it appeared in the sidebar
- Look for success notification confirming creation

### 5. Testing Different Video Types

**✅ Best Videos to Test:**
- Educational channels (Khan Academy, TED-Ed, Crash Course)
- How-to tutorials
- Documentary clips
- Science/history videos
- Videos with captions enabled

**❌ Avoid Testing With:**
- Music videos (usually no useful transcript)
- Very short videos (< 2 minutes)
- Live streams
- Age-restricted content
- Videos without descriptions or captions

### 6. Debug Mode
The extension includes debug logging. To see logs:
1. Open YouTube video page
2. Press F12 to open Developer Tools
3. Go to "Console" tab
4. Look for messages starting with `[YT-Summarizer]`

### 7. API Key Setup
If you need a Gemini API key:
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key and paste it in extension options

## 🔧 Troubleshooting

### Extension Not Loading
- Check that all files are in the folder
- Make sure manifest.json is valid
- Check for errors in chrome://extensions/

### Button Not Appearing
- Clear browser cache
- Disable other YouTube extensions temporarily
- Try incognito mode

### API Errors
- Verify API key is correct
- Check internet connection
- Try a different video

### Content Not Extracting
- The extension tries multiple methods:
  1. YouTube captions/transcript
  2. Video description
  3. Top comments
  4. Metadata-based content
- If all fail, try a different educational video

## 📋 Test Checklist

- [ ] Extension installs without errors
- [ ] Options page opens and saves settings
- [ ] Button appears on YouTube videos
- [ ] Button loading state works
- [ ] Success notification appears
- [ ] Summary panel displays correctly
- [ ] Panel can be closed
- [ ] Works with different video types
- [ ] Age-appropriate content for selected age range
- [ ] Error messages are helpful

## 🆘 Getting Help

If you encounter issues:
1. Check the Console logs for error details
2. Try the troubleshooting steps above
3. Test with different videos
4. Verify your API key is working
5. Try refreshing the page and testing again

The extension is designed to be robust and handle various edge cases, but YouTube's dynamic content can sometimes cause issues. The fallback mechanisms should ensure it works even when some features aren't available.