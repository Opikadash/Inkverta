const rateLimit = require('express-rate-limit');

const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  next();
};

const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false
  });
};

const translateRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  30, // 30 requests per minute
  'Too many translation requests'
);

const ocrRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  10, // 10 requests per minute
  'Too many OCR requests'
);

const uploadRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  20, // 20 uploads per minute
  'Too many upload requests'
);

module.exports = {
  apiKeyAuth,
  translateRateLimit,
  ocrRateLimit,
  uploadRateLimit
};
