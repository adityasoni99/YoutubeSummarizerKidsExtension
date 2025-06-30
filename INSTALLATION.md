# Installation Guide - YouTube Summarizer for Kids Chrome Extension

## 🚀 Quick Start

### Prerequisites
- Google Chrome browser (version 88 or later)
- Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Step 1: Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key (keep it secure!)

### Step 2: Install the Extension

#### Option A: Load Unpacked (Development)

1. **Download the Extension**:
   - Download the extension folder
   - Extract to a permanent location (don't delete this folder!)

2. **Open Chrome Extensions**:
   - Type `chrome://extensions/` in your address bar
   - OR: Menu → More Tools → Extensions

3. **Enable Developer Mode**:
   - Toggle "Developer mode" switch (top right)

4. **Load Extension**:
   - Click "Load unpacked"
   - Select the `youtube-summarizer-extension` folder
   - Extension should appear in your extensions list

#### Option B: Chrome Web Store (When Available)

1. Visit the Chrome Web Store listing
2. Click "Add to Chrome"
3. Click "Add Extension" to confirm

### Step 3: Configure API Key

1. **Open Extension Options**:
   - Click the extension icon in Chrome toolbar
   - Click "Settings" 
   - OR: Right-click extension → "Options"

2. **Enter API Key**:
   - Paste your Gemini API key
   - Click "Test API Key" to verify
   - Click "Save Settings"

3. **Configure Preferences** (optional):
   - Set default age group
   - Choose accessibility options
   - Adjust summary settings

### Step 4: Test the Extension

1. **Go to YouTube**:
   - Visit any YouTube video with captions
   - Look for "🎬 Kid-Friendly Summary" button

2. **Create Summary**:
   - Click the summary button
   - Select child's age group
   - Click "Create Kid-Friendly Summary"
   - Wait for processing (30-60 seconds)

3. **View Results**:
   - Summary appears below the video
   - Read the kid-friendly explanation
   - Explore Q&A sections

## 🔧 Troubleshooting

### Extension Not Loading

**Problem**: Extension doesn't appear after loading
**Solution**: 
- Check if folder contains `manifest.json`
- Refresh chrome://extensions/ page
- Check for error messages

### API Key Issues

**Problem**: "API Key not configured" error
**Solution**:
- Verify API key is correct (no extra spaces)
- Check API key has required permissions
- Test key in extension options

**Problem**: "API error 403" or "Access denied"
**Solution**:
- Generate new API key from Google AI Studio
- Check Google Cloud project quotas
- Verify billing is enabled (if required)

### Summary Button Missing

**Problem**: Button doesn't appear on YouTube
**Solution**:
- Refresh the YouTube page
- Check if video has captions/subtitles
- Verify extension is enabled

### Summary Creation Fails

**Problem**: "Could not extract transcript" error
**Solution**:
- Try a different video with auto-generated captions
- Check internet connection
- Verify API key is working

**Problem**: Slow or timeout errors
**Solution**:
- Try shorter videos first
- Check network connection
- Reduce maximum topics in settings

## 🎯 Best Practices

### Choosing Videos
- ✅ Educational content with clear speech
- ✅ Videos with auto-generated captions
- ✅ Age-appropriate content
- ❌ Music videos (limited speech)
- ❌ Videos without captions
- ❌ Very long videos (>30 minutes)

### Age Settings
- **3-5 years**: Very simple words, basic concepts
- **6-8 years**: Elementary explanations
- **9-12 years**: More detailed but kid-friendly

### Optimizing Results
- Use shorter videos (5-15 minutes) for best results
- Choose educational or documentary content
- Ensure videos have good quality captions

## 🔒 Privacy & Security

### Data Safety
- Extension processes content locally
- No video data is stored permanently
- API key stored securely in Chrome

### Recommended Settings
- Enable "Large Fonts" for younger children
- Use "High Contrast" for accessibility
- Set appropriate default age group

## 📞 Getting Help

### Common Questions

**Q: Is this extension free?**
A: The extension is free, but requires a Gemini API key. Google provides free quota for testing.

**Q: Does it work with all YouTube videos?**
A: Only videos with captions/subtitles. Most popular videos have auto-generated captions.

**Q: Can I use it offline?**
A: No, it requires internet connection to access the Gemini API.

**Q: Is it safe for children?**
A: Yes, the extension only processes video transcripts and creates educational summaries.

### Support Resources

- 📖 [Full Documentation](README.md)
- 🐛 [Report Issues](https://github.com/your-repo/issues)
- 💡 [Feature Requests](https://github.com/your-repo/issues)
- 📧 Contact: your-email@example.com

### Update Instructions

1. **Automatic Updates** (Chrome Web Store):
   - Updates install automatically
   - Restart Chrome to apply updates

2. **Manual Updates** (Development):
   - Download new version
   - Go to chrome://extensions/
   - Click refresh icon on extension card
   - Or remove and reload extension

## ✅ Verification Checklist

Before using the extension, verify:

- [ ] Chrome version 88 or later
- [ ] Extension loaded and enabled
- [ ] Valid Gemini API key configured
- [ ] API key tested successfully
- [ ] Age preferences set appropriately
- [ ] Tested on a sample YouTube video

## 🎉 You're Ready!

Once everything is set up:

1. Visit educational YouTube videos
2. Look for the kid-friendly summary button
3. Create summaries tailored to your child's age
4. Enjoy learning together!

---

**Need more help?** Check our [detailed README](README.md) or [contact support](mailto:your-email@example.com).