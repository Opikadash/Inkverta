const $ = (id) => document.getElementById(id);

const setStatus = (text, isError = false) => {
  $('status').textContent = text;
  $('status').style.color = isError ? '#b91c1c' : '#065f46';
};

const normalizeUrl = (url) => {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  return trimmed.replace(/\/+$/, '');
};

const load = async () => {
  const { apiUrl, webAppUrl } = await chrome.storage.sync.get(['apiUrl', 'webAppUrl']);
  $('apiUrl').value = apiUrl || 'https://Inkverta-api.up.railway.app';
  $('webAppUrl').value = webAppUrl || 'https://Inkverta.vercel.app';
};

const save = async () => {
  const apiUrl = normalizeUrl($('apiUrl').value);
  const webAppUrl = normalizeUrl($('webAppUrl').value);

  if (!apiUrl) {
    setStatus('API URL is required.', true);
    return;
  }

  await chrome.storage.sync.set({ apiUrl, webAppUrl });
  setStatus('Saved.');
};

const test = async () => {
  setStatus('Testing...');
  const apiUrl = normalizeUrl($('apiUrl').value);
  if (!apiUrl) return setStatus('API URL is required.', true);

  try {
    const resp = await fetch(`${apiUrl}/api/health`, { method: 'GET' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    setStatus('Connection OK.');
  } catch (err) {
    setStatus(`Failed: ${err.message}`, true);
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  await load();

  $('save').addEventListener('click', () => save());
  $('test').addEventListener('click', () => test());
});
