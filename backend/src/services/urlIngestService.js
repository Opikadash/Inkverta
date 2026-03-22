const dns = require('dns').promises;
const logger = require('../utils/logger');

const isPrivateIPv4 = (ip) => {
  const parts = ip.split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;
  const [a, b] = parts;

  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
};

const isPrivateIPv6 = (ip) => {
  const lower = ip.toLowerCase();
  if (lower === '::1') return true;
  if (lower.startsWith('fe80:')) return true; // link-local
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // ULA
  return false;
};

const isBlockedHostname = (hostname) => {
  const h = hostname.toLowerCase();
  return (
    h === 'localhost' ||
    h.endsWith('.localhost') ||
    h === '0.0.0.0' ||
    h === '127.0.0.1' ||
    h === '::1'
  );
};

const assertSafeUrl = async (urlString) => {
  let url;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error('Invalid URL');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only http(s) URLs are supported');
  }

  if (isBlockedHostname(url.hostname)) {
    throw new Error('URL hostname is not allowed');
  }

  const allowNonStandardPorts = process.env.ALLOW_NON_STANDARD_PORTS === 'true';
  if (!allowNonStandardPorts) {
    const port = url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80;
    if (![80, 443].includes(port)) {
      throw new Error('Non-standard ports are not allowed');
    }
  }

  // DNS resolve to prevent SSRF to private ranges
  const results = await dns.lookup(url.hostname, { all: true });
  for (const r of results) {
    if (r.family === 4 && isPrivateIPv4(r.address)) {
      throw new Error('URL resolves to a private network address');
    }
    if (r.family === 6 && isPrivateIPv6(r.address)) {
      throw new Error('URL resolves to a private network address');
    }
  }

  return url;
};

const normalizeAbsoluteHttpUrl = (value, baseUrl) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (raw.startsWith('data:') || raw.startsWith('blob:')) return null;

  try {
    const u = new URL(raw, baseUrl);
    if (!['http:', 'https:'].includes(u.protocol)) return null;
    u.hash = '';
    return u.toString();
  } catch {
    return null;
  }
};

const extractFromHtml = async (html, pageUrl) => {
  // Lazy-load cheerio to avoid overhead on cold paths
  // eslint-disable-next-line global-require
  const cheerio = require('cheerio');
  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('title').first().text().trim() ||
    null;

  const imageCandidates = [];

  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) imageCandidates.push(ogImage);

  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
    if (src) imageCandidates.push(src);
  });

  const images = [];
  const seen = new Set();
  for (const c of imageCandidates) {
    const abs = normalizeAbsoluteHttpUrl(c, pageUrl);
    if (!abs) continue;
    if (seen.has(abs)) continue;
    seen.add(abs);
    images.push(abs);
    if (images.length >= (parseInt(process.env.URL_INGEST_MAX_IMAGES, 10) || 60)) break;
  }

  // Text blocks (novel pages): gather paragraphs/headings; filter by length
  $('script,style,noscript').remove();
  const textCandidates = [];
  $('h1,h2,h3,p,li').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text && text.length >= 30) textCandidates.push(text);
  });

  const maxBlocks = parseInt(process.env.URL_INGEST_MAX_TEXT_BLOCKS, 10) || 120;
  const textBlocks = textCandidates.slice(0, maxBlocks);

  return { title, images, textBlocks };
};

const ingestUrl = async ({ url: urlString }) => {
  const url = await assertSafeUrl(urlString);

  const controller = new AbortController();
  const timeoutMs = parseInt(process.env.URL_INGEST_TIMEOUT_MS, 10) || 15000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    logger.info(`URL ingest: fetching ${url.toString()}`);

    const res = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': process.env.URL_INGEST_UA || 'InkvertaBot/1.0 (+https://inkverta.vercel.app)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    if (!res.ok) {
      throw new Error(`Fetch failed (${res.status})`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('text/html')) {
      throw new Error('URL did not return HTML');
    }

    const html = await res.text();
    const extracted = await extractFromHtml(html, url.toString());

    return {
      success: true,
      url: url.toString(),
      title: extracted.title,
      images: extracted.images,
      textBlocks: extracted.textBlocks,
      timestamp: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = {
  ingestUrl,
};

