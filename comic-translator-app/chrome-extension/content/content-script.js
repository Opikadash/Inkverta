class ComicTranslator {
  constructor() {
    this.apiUrl = 'http://localhost:3001';
    this.isEnabled = true;
    this.overlay = null;
    this.settings = {};
    this.translationCache = new Map();
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.createOverlay();
    this.bindEvents();
    this.detectComicSite();
  }

  async loadSettings() {
    const settings = await chrome.storage.sync.get([
      'apiUrl',
      'sourceLang',
      'targetLang',
      'service',
      'showOverlay',
      'autoTranslate'
    ]);
    
    this.settings = {
      apiUrl: settings.apiUrl || 'http://localhost:3001',
      sourceLang: settings.sourceLang || 'auto',
      targetLang: settings.targetLang || 'en',
      service: settings.service || 'google',
      showOverlay: settings.showOverlay !== false,
      autoTranslate: settings.autoTranslate || false
    };
    
    this.apiUrl = this.settings.apiUrl;
  }

  createOverlay() {
    if (!this.settings.showOverlay) return;
    
    this.overlay = document.createElement('div');
    this.overlay.id = 'comic-translator-overlay';
    this.overlay.innerHTML = `
      <div class="ct-panel">
        <div class="ct-header">
          <span>Comic Translator</span>
          <button class="ct-close">×</button>
        </div>
        <div class="ct-content">
          <div class="ct-translation-area">
            <div class="ct-original">
              <label>Original:</label>
              <div class="ct-text"></div>
            </div>
            <div class="ct-translated">
              <label>Translation:</label>
              <div class="ct-text"></div>
            </div>
          </div>
          <div class="ct-controls">
            <select class="ct-source-lang">
              <option value="auto">Auto-detect</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="zh">Chinese</option>
            </select>
            <span>→</span>
            <select class="ct-target-lang">
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
            <button class="ct-translate-btn">Translate</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.overlay);
    this.bindOverlayEvents();
  }

  bindEvents() {
    document.addEventListener('contextmenu', this.handleRightClick.bind(this));
    document.addEventListener('click', this.handleImageClick.bind(this));
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'translate-image') {
        this.translateImage(request.imageUrl);
      }
    });
  }

  bindOverlayEvents() {
    if (!this.overlay) return;
    
    const closeBtn = this.overlay.querySelector('.ct-close');
    const translateBtn = this.overlay.querySelector('.ct-translate-btn');
    const sourceLangSelect = this.overlay.querySelector('.ct-source-lang');
    const targetLangSelect = this.overlay.querySelector('.ct-target-lang');
    
    closeBtn.addEventListener('click', () => this.hideOverlay());
    translateBtn.addEventListener('click', () => this.performTranslation());
    
    sourceLangSelect.value = this.settings.sourceLang;
    targetLangSelect.value = this.settings.targetLang;
    
    sourceLangSelect.addEventListener('change', (e) => {
      this.settings.sourceLang = e.target.value;
      chrome.storage.sync.set({ sourceLang: e.target.value });
    });
    
    targetLangSelect.addEventListener('change', (e) => {
      this.settings.targetLang = e.target.value;
      chrome.storage.sync.set({ targetLang: e.target.value });
    });
  }

  handleRightClick(event) {
    const target = event.target;
    if (target.tagName === 'IMG') {
      this.selectedImage = target;
    }
  }

  handleImageClick(event) {
    if (!this.settings.autoTranslate) return;
    
    const target = event.target;
    if (target.tagName === 'IMG' && this.isComicImage(target)) {
      event.preventDefault();
      this.translateImage(target.src, target);
    }
  }

  isComicImage(img) {
    const src = img.src.toLowerCase();
    const alt = img.alt?.toLowerCase() || '';
    const className = img.className?.toLowerCase() || '';
    
    // Check for comic/manga related patterns
    const comicPatterns = [
      'comic', 'manga', 'chapter', 'page', 'panel',
      'webtoon', 'manhwa', 'manhua'
    ];
    
    return comicPatterns.some(pattern => 
      src.includes(pattern) || alt.includes(pattern) || className.includes(pattern)
    ) || img.width > 300 || img.height > 300;
  }

  async translateImage(imageUrl, imageElement = null) {
    try {
      this.showOverlay();
      this.setOverlayLoading(true);
      
      // Check cache first
      const cacheKey = `${imageUrl}-${this.settings.sourceLang}-${this.settings.targetLang}`;
      if (this.translationCache.has(cacheKey)) {
        const cached = this.translationCache.get(cacheKey);
        this.displayTranslation(cached.original, cached.translated);
        this.setOverlayLoading(false);
        return;
      }
      
      // Convert image to base64 for OCR
      const imageData = await this.imageToBase64(imageUrl);
      
      // Extract text using OCR
      const ocrResult = await this.performOCR(imageData);
      
      if (ocrResult.text.trim()) {
        // Translate the text
        const translation = await this.translateText(
          ocrResult.text,
          this.settings.sourceLang,
          this.settings.targetLang
        );
        
        // Cache the result
        this.translationCache.set(cacheKey, {
          original: ocrResult.text,
          translated: translation.translatedText
        });
        
        this.displayTranslation(ocrResult.text, translation.translatedText);
        
        // If auto-translate is enabled and we have an image element, show overlay on image
        if (this.settings.autoTranslate && imageElement) {
          this.showImageOverlay(imageElement, translation.translatedText);
        }
      } else {
        this.displayTranslation('No text detected', '');
      }
      
    } catch (error) {
      console.error('Translation error:', error);
      this.displayTranslation('Error', error.message);
    } finally {
      this.setOverlayLoading(false);
    }
  }

  async imageToBase64(imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(dataUrl);
      };
      
      img.onerror = reject;
      img.src = imageUrl;
    });
  }

  async performOCR(imageData) {
    const formData = new FormData();
    
    // Convert base64 to blob
    const response = await fetch(imageData);
    const blob = await response.blob();
    
    formData.append('image', blob, 'image.jpg');
    
    const ocrResponse = await fetch(`${this.apiUrl}/api/upload/single`, {
      method: 'POST',
      body: formData
    });
    
    if (!ocrResponse.ok) {
      throw new Error('OCR upload failed');
    }
    
    const uploadResult = await ocrResponse.json();
    
    // Extract text from uploaded image
    const extractResponse = await fetch(`${this.apiUrl}/api/ocr/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename: uploadResult.file.filename,
        language: 'eng+jpn+kor+chi_sim',
        preprocess: true
      })
    });
    
    if (!extractResponse.ok) {
      throw new Error('OCR extraction failed');
    }
    
    const result = await extractResponse.json();
    return result.result;
  }

  async translateText(text, sourceLang, targetLang) {
    const response = await fetch(`${this.apiUrl}/api/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        sourceLang,
        targetLang,
        service: this.settings.service
      })
    });
    
    if (!response.ok) {
      throw new Error('Translation failed');
    }
    
    const result = await response.json();
    return result.result;
  }

  showOverlay() {
    if (this.overlay) {
      this.overlay.style.display = 'block';
    }
  }

  hideOverlay() {
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
  }

  setOverlayLoading(loading) {
    if (!this.overlay) return;
    
    const translateBtn = this.overlay.querySelector('.ct-translate-btn');
    translateBtn.textContent = loading ? 'Processing...' : 'Translate';
    translateBtn.disabled = loading;
  }

  displayTranslation(original, translated) {
    if (!this.overlay) return;
    
    const originalDiv = this.overlay.querySelector('.ct-original .ct-text');
    const translatedDiv = this.overlay.querySelector('.ct-translated .ct-text');
    
    originalDiv.textContent = original;
    translatedDiv.textContent = translated;
  }

  showImageOverlay(imageElement, translatedText) {
    // Create floating overlay on the image
    const existingOverlay = imageElement.parentNode.querySelector('.ct-image-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'ct-image-overlay';
    overlay.innerHTML = `
      <div class="ct-translation-bubble">
        <div class="ct-translation-text">${translatedText}</div>
        <button class="ct-close-bubble">×</button>
      </div>
    `;
    
    // Position relative to image
    const rect = imageElement.getBoundingClientRect();
    overlay.style.position = 'absolute';
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.zIndex = '9999';
    
    document.body.appendChild(overlay);
    
    // Close button
    overlay.querySelector('.ct-close-bubble').addEventListener('click', () => {
      overlay.remove();
    });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.remove();
      }
    }, 5000);
  }

  detectComicSite() {
    const hostname = window.location.hostname;
    
    if (hostname.includes('mangadex.org')) {
      this.setupMangaDexIntegration();
    } else if (hostname.includes('webtoons.com')) {
      this.setupWebtoonsIntegration();
    } else if (hostname.includes('crunchyroll.com')) {
      this.setupCrunchyrollIntegration();
    }
  }

  setupMangaDexIntegration() {
    // MangaDex specific optimizations
    const comicImages = document.querySelectorAll('img[src*="mangadex"]');
    comicImages.forEach(img => {
      if (!img.dataset.translatorEnabled) {
        img.dataset.translatorEnabled = 'true';
        img.addEventListener('dblclick', () => {
          this.translateImage(img.src, img);
        });
      }
    });
  }

  setupWebtoonsIntegration() {
    // Webtoons specific optimizations
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const images = node.querySelectorAll('img');
            images.forEach(img => {
              if (this.isComicImage(img) && !img.dataset.translatorEnabled) {
                img.dataset.translatorEnabled = 'true';
                img.addEventListener('dblclick', () => {
                  this.translateImage(img.src, img);
                });
              }
            });
          }
        });
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }

  setupCrunchyrollIntegration() {
    // Crunchyroll manga specific optimizations
    console.log('Crunchyroll integration enabled');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ComicTranslator();
  });
} else {
  new ComicTranslator();
}
