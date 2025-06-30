// Popup script for YouTube Summarizer for Kids Chrome Extension

class PopupController {
  constructor() {
    this.currentTab = null;
    this.isProcessing = false;
    this.init();
  }

  async init() {
    await this.getCurrentTab();
    await this.checkSetup();
    this.setupEventListeners();
    this.loadUserPreferences();
  }

  async getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    this.currentTab = tab;
  }

  async checkSetup() {
    // Check if API key is configured
    const apiKeyCheck = await chrome.runtime.sendMessage({ action: 'checkApiKey' });
    
    if (!apiKeyCheck.hasApiKey) {
      this.showApiKeyWarning();
      return;
    }

    // Check if we're on a YouTube video page
    if (this.isYouTubeVideoPage()) {
      this.showYouTubeInterface();
      this.loadVideoInfo();
    } else {
      this.showNonYouTubeInterface();
    }
  }

  isYouTubeVideoPage() {
    return this.currentTab && 
           this.currentTab.url && 
           this.currentTab.url.includes('youtube.com/watch');
  }

  showApiKeyWarning() {
    this.hideAllInterfaces();
    document.getElementById('api-key-warning').classList.remove('hidden');
  }

  showYouTubeInterface() {
    this.hideAllInterfaces();
    document.getElementById('youtube-interface').classList.remove('hidden');
    document.getElementById('age-section').classList.remove('hidden');
  }

  showNonYouTubeInterface() {
    this.hideAllInterfaces();
    document.getElementById('non-youtube-interface').classList.remove('hidden');
  }

  hideAllInterfaces() {
    const interfaces = [
      'youtube-interface',
      'non-youtube-interface', 
      'api-key-warning',
      'age-section',
      'status',
      'results',
      'error'
    ];
    
    interfaces.forEach(id => {
      document.getElementById(id).classList.add('hidden');
    });
  }

  async loadVideoInfo() {
    if (!this.currentTab) return;

    try {
      // Extract video title from tab title (YouTube format: "Title - YouTube")
      const title = this.currentTab.title.replace(' - YouTube', '');
      document.getElementById('video-title').textContent = title;
      document.getElementById('video-url').textContent = this.currentTab.url;
    } catch (error) {
      console.error('Error loading video info:', error);
    }
  }

  setupEventListeners() {
    // Summarize button
    document.getElementById('summarize-btn').addEventListener('click', () => {
      this.handleSummarize();
    });

    // Settings button
    document.getElementById('settings-btn').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    // Open options from warning
    document.getElementById('open-options').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    // Help button
    document.getElementById('help-btn').addEventListener('click', () => {
      this.showHelp();
    });

    // Retry button
    document.getElementById('retry-btn').addEventListener('click', () => {
      this.hideError();
      this.checkSetup();
    });

    // Create another summary button
    document.getElementById('create-another').addEventListener('click', () => {
      this.hideResults();
      this.showYouTubeInterface();
    });

    // Age selection change
    document.querySelectorAll('input[name="age"]').forEach(radio => {
      radio.addEventListener('change', () => {
        this.saveUserPreferences();
      });
    });
  }

  async handleSummarize() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.showStatus('Creating kid-friendly summary...');

    try {
      const selectedAge = document.querySelector('input[name="age"]:checked').value;
      
      // Store age preference for the background script to use
      await chrome.storage.sync.set({ preferredAge: selectedAge });

      const result = await chrome.runtime.sendMessage({
        action: 'summarizeVideo',
        url: this.currentTab.url
      });

      if (result.success) {
        this.showResults();
        
        // Optional: Inject the summary directly into the page
        try {
          await chrome.tabs.sendMessage(this.currentTab.id, {
            action: 'displaySummary',
            data: result.data
          });
        } catch (e) {
          // Content script might not be ready, that's okay
          console.log('Could not inject summary into page:', e);
        }
      } else {
        this.showError(result.error);
      }
    } catch (error) {
      this.showError(error.message);
    } finally {
      this.isProcessing = false;
      this.hideStatus();
    }
  }

  showStatus(message) {
    document.getElementById('status').classList.remove('hidden');
    document.querySelector('.status-text').textContent = message;
    document.getElementById('youtube-interface').classList.add('hidden');
  }

  hideStatus() {
    document.getElementById('status').classList.add('hidden');
  }

  showResults() {
    this.hideAllInterfaces();
    document.getElementById('results').classList.remove('hidden');
  }

  hideResults() {
    document.getElementById('results').classList.add('hidden');
  }

  showError(message) {
    this.hideAllInterfaces();
    document.getElementById('error').classList.remove('hidden');
    document.getElementById('error-message').textContent = message;
  }

  hideError() {
    document.getElementById('error').classList.add('hidden');
  }

  showHelp() {
    const helpText = `
How to use YouTube Summarizer for Kids:

1. 🔧 Set up your Gemini API key in Settings
2. 📺 Go to any YouTube video
3. 👶 Select your child's age group
4. 🎯 Click "Create Kid-Friendly Summary"
5. 📖 Read the simple summary with Q&A!

Features:
• Simple explanations for children
• Interactive Q&A sections  
• Age-appropriate content
• Colorful, engaging format

Need help? Check the extension options for more settings!
    `;
    
    alert(helpText);
  }

  async loadUserPreferences() {
    try {
      const result = await chrome.storage.sync.get(['preferredAge']);
      if (result.preferredAge) {
        const radio = document.querySelector(`input[name="age"][value="${result.preferredAge}"]`);
        if (radio) {
          radio.checked = true;
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }

  async saveUserPreferences() {
    try {
      const selectedAge = document.querySelector('input[name="age"]:checked').value;
      await chrome.storage.sync.set({ preferredAge: selectedAge });
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});