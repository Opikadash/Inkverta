const logger = require('../utils/logger');
const { ingestUrl } = require('../services/urlIngestService');

const ingest = async (req, res, next) => {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'Bad Request', message: 'url is required' });
    }

    const result = await ingestUrl({ url });
    return res.json(result);
  } catch (error) {
    logger.error('URL ingest error:', error);

    const message = error?.message || 'URL ingest failed';
    const isClientError =
      message.includes('Invalid URL') ||
      message.includes('Only http(s)') ||
      message.includes('hostname is not allowed') ||
      message.includes('Non-standard ports') ||
      message.includes('private network address');

    if (error?.name === 'AbortError') {
      return res.status(504).json({ success: false, error: 'Timeout', message });
    }

    if (isClientError) {
      return res.status(400).json({ success: false, error: 'Bad Request', message });
    }

    if (message.startsWith('Fetch failed') || message.includes('did not return HTML')) {
      return res.status(502).json({ success: false, error: 'Bad Gateway', message });
    }

    return res.status(500).json({ success: false, error: 'Server error', message: 'Internal server error' });
  }
};

module.exports = {
  ingest,
};
