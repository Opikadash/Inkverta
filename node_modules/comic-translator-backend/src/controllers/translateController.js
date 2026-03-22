const { translateText } = require('../services/translationService');
const { validateTranslationRequest } = require('../utils/validation');
const logger = require('../utils/logger');

const translate = async (req, res, next) => {
  try {
    const validation = validateTranslationRequest(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const { text, sourceLang, targetLang, service = 'google' } = req.body;

    logger.info(`Translation request: ${sourceLang} -> ${targetLang}, service: ${service}`);

    const translatedText = await translateText(text, sourceLang, targetLang, service);

    res.json({
      success: true,
      result: {
        originalText: text,
        translatedText,
        sourceLang,
        targetLang,
        service,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Translation error:', error);
    next(error);
  }
};

const translateBatch = async (req, res, next) => {
  try {
    const { texts, sourceLang, targetLang, service = 'google' } = req.body;

    if (!texts || !Array.isArray(texts)) {
      return res.status(400).json({ error: 'Texts array is required' });
    }

    if (texts.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 texts allowed per batch' });
    }

    logger.info(`Batch translation request: ${texts.length} texts, ${sourceLang} -> ${targetLang}`);

    const results = [];
    for (const text of texts) {
      try {
        const translatedText = await translateText(text, sourceLang, targetLang, service);
        results.push({ originalText: text, translatedText, success: true });
      } catch (error) {
        results.push({ originalText: text, error: error.message, success: false });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    logger.error('Batch translation error:', error);
    next(error);
  }
};

module.exports = {
  translate,
  translateBatch,
};

