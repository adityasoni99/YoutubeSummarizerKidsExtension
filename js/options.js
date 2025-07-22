// Options page script for YouTube Summarizer for Kids Chrome Extension

class OptionsController {
  constructor() {
    this.defaultSettings = {
      geminiApiKey: '',
      defaultAge: '6-8',
      // Planned features (disabled for now)
      // largeFonts: false,
      // highContrast: false, 
      // textToSpeech: false,
      // summaryLanguage: 'en',
      maxTopics: 5,
      summaryLength: 'medium',
      autoSummarize: true  // Auto-detect new videos by default
    };
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
  }

  async loadSettings() {
    try {
      const settings = await chrome.storage.sync.get(this.defaultSettings);
      
      // API Key
      document.getElementById('api-key').value = settings.geminiApiKey || '';
      
      // Default Age
      const ageRadio = document.querySelector(`input[name="default-age"][value="${settings.defaultAge}"]`);
      if (ageRadio) ageRadio.checked = true;
      
      // Accessibility (disabled features - keep for future use but don't make functional)
      // document.getElementById('large-fonts').checked = settings.largeFonts;
      // document.getElementById('high-contrast').checked = settings.highContrast;
      // document.getElementById('text-to-speech').checked = settings.textToSpeech;
      
      // Language (disabled feature - keep for future use but don't make functional)
      // document.getElementById('summary-language').value = settings.summaryLanguage;
      
      // Advanced
      document.getElementById('max-topics').value = settings.maxTopics;
      this.updateRangeDisplay('max-topics', settings.maxTopics + ' topics');
      document.getElementById('summary-length').value = settings.summaryLength;
      document.getElementById('auto-summarize').checked = settings.autoSummarize;
      
    } catch (error) {
      console.error('Error loading settings:', error);
      this.showStatus('Error loading settings', 'error');
    }
  }

  setupEventListeners() {
    // Save settings button
    document.getElementById('save-settings').addEventListener('click', () => {
      this.saveSettings();
    });

    // Reset settings button
    document.getElementById('reset-settings').addEventListener('click', () => {
      this.resetSettings();
    });

    // API key visibility toggle
    document.getElementById('toggle-key-visibility').addEventListener('click', () => {
      this.toggleApiKeyVisibility();
    });

    // Test API key button
    document.getElementById('test-api-key').addEventListener('click', () => {
      this.testApiKey();
    });

    // Range input updates
    document.getElementById('max-topics').addEventListener('input', (e) => {
      this.updateRangeDisplay('max-topics', e.target.value + ' topics');
    });

    // Export/Import settings
    document.getElementById('export-settings').addEventListener('click', () => {
      this.exportSettings();
    });

    document.getElementById('import-settings').addEventListener('click', () => {
      document.getElementById('import-file').click();
    });

    document.getElementById('import-file').addEventListener('change', (e) => {
      this.importSettings(e.target.files[0]);
    });

    // Auto-save on input changes
    this.setupAutoSave();
  }

  setupAutoSave() {
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.addEventListener('change', () => {
        // Debounced auto-save
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
          this.saveSettings(true); // Silent save
        }, 1000);
      });
    });
  }

  async saveSettings(silent = false) {
    try {
      const settings = {
        geminiApiKey: document.getElementById('api-key').value.trim(),
        defaultAge: document.querySelector('input[name="default-age"]:checked').value,
        // Skip disabled/planned features for now
        // largeFonts: document.getElementById('large-fonts').checked,
        // highContrast: document.getElementById('high-contrast').checked,
        // textToSpeech: document.getElementById('text-to-speech').checked,
        // summaryLanguage: document.getElementById('summary-language').value,
        maxTopics: parseInt(document.getElementById('max-topics').value),
        summaryLength: document.getElementById('summary-length').value,
        autoSummarize: document.getElementById('auto-summarize').checked
      };

      await chrome.storage.sync.set(settings);
      
      if (!silent) {
        this.showStatus('Settings saved successfully!', 'success');
      }
      
      // Apply accessibility settings immediately (disabled for now)
      // this.applyAccessibilitySettings(settings);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showStatus('Error saving settings', 'error');
    }
  }

  async resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      try {
        await chrome.storage.sync.clear();
        await this.loadSettings();
        this.showStatus('Settings reset to defaults', 'success');
      } catch (error) {
        console.error('Error resetting settings:', error);
        this.showStatus('Error resetting settings', 'error');
      }
    }
  }

  toggleApiKeyVisibility() {
    const apiKeyInput = document.getElementById('api-key');
    const toggleBtn = document.getElementById('toggle-key-visibility');
    
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleBtn.textContent = '🙈';
      toggleBtn.title = 'Hide API Key';
    } else {
      apiKeyInput.type = 'password';
      toggleBtn.textContent = '👁️';
      toggleBtn.title = 'Show API Key';
    }
  }

  async testApiKey() {
    const apiKey = document.getElementById('api-key').value.trim();
    const resultDiv = document.getElementById('api-test-result');
    
    if (!apiKey) {
      this.showTestResult('Please enter an API key first', 'error');
      return;
    }

    this.showTestResult('Testing API key...', 'loading');

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Hello! This is a test. Please respond with just "API key working!"'
            }]
          }],
          generationConfig: {
            maxOutputTokens: 10
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0]) {
          this.showTestResult('✅ API key is working correctly!', 'success');
        } else {
          this.showTestResult('⚠️ API key works but response format unexpected', 'warning');
        }
      } else {
        if (response.status === 403) {
          this.showTestResult('❌ Invalid API key or access denied', 'error');
        } else if (response.status === 429) {
          this.showTestResult('⚠️ Rate limited - API key is valid but try again later', 'warning');
        } else {
          this.showTestResult(`❌ API error: ${response.status} ${response.statusText}`, 'error');
        }
      }
    } catch (error) {
      this.showTestResult(`❌ Network error: ${error.message}`, 'error');
    }
  }

  showTestResult(message, type) {
    const resultDiv = document.getElementById('api-test-result');
    resultDiv.textContent = message;
    resultDiv.className = `test-result ${type}`;
    resultDiv.classList.remove('hidden');
    
    if (type !== 'loading') {
      setTimeout(() => {
        resultDiv.classList.add('hidden');
      }, 5000);
    }
  }

  updateRangeDisplay(rangeId, value) {
    const rangeInput = document.getElementById(rangeId);
    const valueDisplay = rangeInput.parentElement.querySelector('.range-value');
    if (valueDisplay) {
      valueDisplay.textContent = value;
    }
  }

  async exportSettings() {
    try {
      const settings = await chrome.storage.sync.get();
      
      // Remove sensitive data for export
      const exportData = { ...settings };
      if (exportData.geminiApiKey) {
        exportData.geminiApiKey = '[REDACTED]';
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'youtube-summarizer-settings.json';
      a.click();
      
      URL.revokeObjectURL(url);
      
      this.showStatus('Settings exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting settings:', error);
      this.showStatus('Error exporting settings', 'error');
    }
  }

  async importSettings(file) {
    if (!file) return;

    try {
      const text = await file.text();
      const importedSettings = JSON.parse(text);
      
      // Validate imported settings
      const validSettings = {};
      for (const [key, value] of Object.entries(importedSettings)) {
        if (key in this.defaultSettings && key !== 'geminiApiKey') {
          validSettings[key] = value;
        }
      }
      
      await chrome.storage.sync.set(validSettings);
      await this.loadSettings();
      
      this.showStatus('Settings imported successfully! (API key not imported for security)', 'success');
    } catch (error) {
      console.error('Error importing settings:', error);
      this.showStatus('Error importing settings - invalid file format', 'error');
    }
  }

  applyAccessibilitySettings(settings) {
    // Disabled until features are fully implemented
    // document.body.classList.toggle('large-fonts', settings.largeFonts);
    // document.body.classList.toggle('high-contrast', settings.highContrast);
  }

  showStatus(message, type) {
    const statusDiv = document.getElementById('save-status');
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
    statusDiv.classList.remove('hidden');
    
    setTimeout(() => {
      statusDiv.classList.add('hidden');
    }, 3000);
  }
}

// Initialize options page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new OptionsController();
});