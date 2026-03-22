const runtimeApiUrl =
  (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.VITE_API_URL) || '';

const baseURL = runtimeApiUrl || import.meta.env.VITE_API_URL || '';

const joinUrl = (base, path) => {
  if (!base) return path;
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
};

const parseJsonSafely = async (res) => {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const apiClient = {
  async post(path, body, config = {}) {
    const url = joinUrl(baseURL, path);

    const headers = new Headers(config.headers || {});
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

    if (!isFormData && body != null && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: isFormData ? body : body == null ? undefined : JSON.stringify(body),
      credentials: 'include',
    });

    const data = await parseJsonSafely(res);
    if (!res.ok) {
      const message =
        (data && typeof data === 'object' && (data.error || data.message)) ||
        `Request failed with status ${res.status}`;
      const err = new Error(message);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return { data };
  },
};

export default apiClient;
