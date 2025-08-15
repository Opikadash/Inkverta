class PopupManager {
  constructor() {
    this.settings = {};
    this.stats = { today: 0, total: 0 };
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.loadStats();
    this.bindEvents();
    this.updateUI();
  }

  async loadSettings() {
    const settings = await chrome.storage.sync.get([
      'sourceLang', 'targetLang', 'service', 'showOverlay', 'autoTranslate', 'apiUrl'
    ]);

    this.settings = {
      sourceLang: settings.sourceLang || 'auto',
      targetLang: settings.targetLang || 'en',
      service: settings.service || 'google',
      showOverlay: settings.showOverlay !== false,
      autoTranslate: settings.autoTranslate || false,
      apiUrl: settings.apiUrl || 'http://localhost:3001'
    };
  }

  async loadStats() {
    const stats = await chrome.storage.local.get(['translationsToday', 'totalTranslations', 'lastDate']);
    const today = new Date().toDateString();
    
    if (stats.lastDate !== today) {
      // Reset daily counter
      this.stats.today = 0;
      await chrome.storage.local.set({ 
        translationsToday: 0, 
        lastDate: today 
      });
    } else {
      this.stats.today = stats.translationsToday || 0;
    }
    
    this.stats.total = stats.totalTranslations || 0;
  }

  bindEvents() {
    // Settings
    document.getElementById('source-lang').addEventListener('change', this.handleSettingChange.bind(this));
    document.getElementById('target-lang').addEventListener('change', this.handleSettingChange.bind(this));
    document.getElementById('translation-service').addEventListener('change', this.handleSettingChange.bind(this));
    document.getElementById('show-overlay').addEventListener('change', this.handleSettingChange.bind(this));
    document.getElementById('auto-translate').addEventListener('change', this.handleSettingChange.bind(this));

    // Actions
    document.getElementById('translate-current').addEventListener('click', this.translateCurrentPage.bind(this));
    document.getElementById('open-web-app').addEventListener('click', this.openWebApp.bind(this));

    // Footer buttons
    document.getElementById('settings-btn').addEventListener('click', this.openSettings.bind(this));
    document.getElementById('history-btn').addEventListener('click', this.openHistory.bind(this));
    document.getElementById('help-btn').addEventListener('click', this.openHelp.bind(this));
  }

  updateUI() {
    // Update form values
    document.getElementById('source-lang').value = this.settings.sourceLang;
    document.getElementById('target-lang').value = this.settings.targetLang;
    document.getElementById('translation-service').value = this.settings.service;
    document.getElementById('show-overlay').checked = this.settings.showOverlay;
    document.getElementById('auto-translate').checked = this.settings.autoTranslate;

    // Update stats
    document.getElementById('translations-today').textContent = this.stats.today;
    document.getElementById('total-translations').textContent = this.stats.total;
  }

  async handleSettingChange(event) {
    const { id, value, type, checked } = event.target;
    const settingValue = type === 'checkbox' ? checked : value;
    
    let settingKey = id.replace('-', '');
    if (id === 'translation-service') settingKey = 'service';
    if (id === 'show-overlay') settingKey = 'showOverlay';
    if (id === 'auto-translate') settingKey = 'autoTranslate';
    if (id === 'source-lang') settingKey = 'sourceLang';
    if (id === 'target-lang') settingKey = 'targetLang';

    this.settings[settingKey] = settingValue;
    await chrome.storage.sync.set({ [settingKey]: settingValue });
  }

  async translateCurrentPage() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, { 
      action: 'translate-page',
      settings: this.settings
    });

    // Update stats
    this.stats.today++;
    this.stats.total++;
    await chrome.storage.local.set({
      translationsToday: this.stats.today,
      totalTranslations: this.stats.total
    });
    
    this.updateUI();
    window.close();
  }

  openWebApp() {
    chrome.tabs.create({ 
      url: this.settings.apiUrl.replace(':3001', ':3000') || 'http://localhost:3000' 
    });
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  openHistory() {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup/history.html') });
  }

  openHelp() {
    chrome.tabs.create({ url: 'https://github.com/your-repo/comic-translator#usage' });
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
