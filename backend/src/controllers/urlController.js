const logger = require('../utils/logger');
const { ingestUrl } = require('../services/urlIngestService');

const ingest = async (req, res, next) => {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'url is required' });
    }

    const result = await ingestUrl({ url });
    return res.json(result);
  } catch (error) {
    logger.error('URL ingest error:', error);
    next(error);
  }
};

module.exports = {
  ingest,
};

