chrome.runtime.onInstalled.addListener(() => {
  // Create context menu
  chrome.contextMenus.create({
    id: 'translate-image',
    title: 'Translate Image',
    contexts: ['image']
  });

  chrome.contextMenus.create({
    id: 'translate-selection',
    title: 'Translate Selected Text',
    contexts: ['selection'],
  });

  // Set default settings
  chrome.storage.sync.set({
    apiUrl: 'https://Inkverta-api.up.railway.app',
    webAppUrl: 'https://Inkverta.vercel.app',
    sourceLang: 'auto',
    targetLang: 'en',
    service: 'google',
    showOverlay: true,
    autoTranslate: false
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'translate-image') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'translate-image',
      imageUrl: info.srcUrl
    });
  }

  if (info.menuItemId === 'translate-selection') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'translate-selection',
      text: info.selectionText || '',
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translate-text') {
    handleTranslation(request.data)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});

async function handleTranslation({ text, sourceLang, targetLang, service }) {
  const settings = await chrome.storage.sync.get(['apiUrl']);
  const apiUrl = settings.apiUrl || 'http://localhost:3001';
  
  const response = await fetch(`${apiUrl}/api/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      sourceLang,
      targetLang,
      service
    })
  });
  
  if (!response.ok) {
    throw new Error('Translation failed');
  }
  
  const result = await response.json();
  return result.result;
}
