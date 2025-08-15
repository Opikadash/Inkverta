const axios = require('axios');
const NodeCache = require('node-cache');
const logger = require('../utils/logger');

const cache = new NodeCache({ 
  stdTTL: parseInt(process.env.CACHE_TTL) || 3600,
  maxKeys: parseInt(process.env.CACHE_MAX_KEYS) || 1000
});

const generateCacheKey = (text, sourceLang, targetLang, service) => {
  return `${service}:${sourceLang}:${targetLang}:${Buffer.from(text).toString('base64').slice(0, 50)}`;
};

const translateWithGoogle = async (text, sourceLang, targetLang) => {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    throw new Error('Google Translate API key not configured');
  }

  try {
    const response = await axios.post(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text'
      }
    );

    return response.data.data.translations[0].translatedText;
  } catch (error) {
    logger.error('Google Translate error:', error.response?.data || error.message);
    throw new Error('Google Translate service error');
  }
};

const translateWithDeepL = async (text, sourceLang, targetLang) => {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    throw new Error('DeepL API key not configured');
  }

  try {
    const response = await axios.post(
      'https://api-free.deepl.com/v2/translate',
      {
        text: [text],
        source_lang: sourceLang.toUpperCase(),
        target_lang: targetLang.toUpperCase()
      },
      {
        headers: {
          'Authorization': `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.translations[0].text;
  } catch (error) {
    logger.error('DeepL error:', error.response?.data || error.message);
    throw new Error('DeepL service error');
  }
};

const translateText = async (text, sourceLang = 'auto', targetLang = 'en', service = 'google') => {
  if (!text || text.trim().length === 0) {
    return '';
  }

  // Check cache first
  const cacheKey = generateCacheKey(text, sourceLang, targetLang, service);
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    logger.debug('Translation cache hit');
    return cachedResult;
  }

  let translatedText;

  switch (service.toLowerCase()) {
    case 'google':
      translatedText = await translateWithGoogle(text, sourceLang, targetLang);
      break;
    case 'deepl':
      translatedText = await translateWithDeepL(text, sourceLang, targetLang);
      break;
    default:
      throw new Error(`Unsupported translation service: ${service}`);
  }

  // Cache the result
  cache.set(cacheKey, translatedText);
  
  return translatedText;
};

const getSupportedLanguages = (service = 'google') => {
  const googleLanguages = {
    'auto': 'Detect Language',
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese (Simplified)',
    'zh-TW': 'Chinese (Traditional)',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'th': 'Thai',
    'vi': 'Vietnamese',
    'nl': 'Dutch',
    'sv': 'Swedish',
    'no': 'Norwegian',
    'da': 'Danish',
    'fi': 'Finnish',
    'pl': 'Polish',
    'cs': 'Czech',
    'hu': 'Hungarian',
    'ro': 'Romanian',
    'bg': 'Bulgarian',
    'hr': 'Croatian',
    'sk': 'Slovak',
    'sl': 'Slovenian',
    'et': 'Estonian',
    'lv': 'Latvian',
    'lt': 'Lithuanian',
    'uk': 'Ukrainian',
    'be': 'Belarusian',
    'mk': 'Macedonian',
    'sq': 'Albanian',
    'sr': 'Serbian',
    'bs': 'Bosnian',
    'mt': 'Maltese',
    'cy': 'Welsh',
    'ga': 'Irish',
    'is': 'Icelandic',
    'eu': 'Basque',
    'ca': 'Catalan',
    'gl': 'Galician'
  };

  const deeplLanguages = {
    'en': 'English',
    'de': 'German',
    'fr': 'French',
    'it': 'Italian',
    'ja': 'Japanese',
    'es': 'Spanish',
    'nl': 'Dutch',
    'pl': 'Polish',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'zh': 'Chinese',
    'bg': 'Bulgarian',
    'cs': 'Czech',
    'da': 'Danish',
    'et': 'Estonian',
    'fi': 'Finnish',
    'el': 'Greek',
    'hu': 'Hungarian',
    'lv': 'Latvian',
    'lt': 'Lithuanian',
    'ro': 'Romanian',
    'sk': 'Slovak',
    'sl': 'Slovenian',
    'sv': 'Swedish'
  };

  return service.toLowerCase() === 'deepl' ? deeplLanguages : googleLanguages;
};

module.exports = {
  translateText,
  getSupportedLanguages
};

// src/services/imagePreprocessor.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const preprocessImage = async (imagePath, options = {}) => {
  try {
    const {
      enhance = true,
      denoise = true,
      sharpen = true,
      contrast = 1.2,
      brightness = 1.1,
      gamma = 1.0
    } = options;

    const outputPath = path.join(
      path.dirname(imagePath),
      `processed-${uuidv4()}-${path.basename(imagePath)}`
    );

    let pipeline = sharp(imagePath);

    // Convert to grayscale for better OCR
    pipeline = pipeline.grayscale();

    // Enhance contrast and brightness
    if (enhance) {
      pipeline = pipeline.modulate({
        brightness: brightness,
        saturation: 1.0
      }).gamma(gamma);
    }

    // Apply contrast
    pipeline = pipeline.linear(contrast, -(128 * contrast) + 128);

    // Sharpen for better text recognition
    if (sharpen) {
      pipeline = pipeline.sharpen({
        sigma: 1,
        flat: 1,
        jagged: 2
      });
    }

    // Denoise
    if (denoise) {
      pipeline = pipeline.median(3);
    }

    // Ensure good resolution for OCR
    const metadata = await sharp(imagePath).metadata();
    if (metadata.width < 300 || metadata.height < 300) {
      pipeline = pipeline.resize(
        Math.max(metadata.width * 2, 600),
        Math.max(metadata.height * 2, 600),
        { fit: 'inside' }
      );
    }

    await pipeline.png().toFile(outputPath);

    logger.debug(`Image preprocessed: ${path.basename(imagePath)} -> ${path.basename(outputPath)}`);
    return outputPath;
  } catch (error) {
    logger.error('Image preprocessing error:', error);
    throw new Error('Failed to preprocess image');
  }
};

const detectTextRegions = async (imagePath) => {
  try {
    const image = sharp(imagePath);
    const { data, info } = await image
      .raw()
      .greyscale()
      .toBuffer({ resolveWithObject: true });

    // Simple text region detection using edge detection
    const regions = [];
    const threshold = 100;
    const minWidth = 50;
    const minHeight = 20;

    let currentRegion = null;
    
    for (let y = 0; y < info.height; y++) {
      let lineHasText = false;
      let lineStart = null;
      let lineEnd = null;

      for (let x = 0; x < info.width; x++) {
        const pixel = data[y * info.width + x];
        
        if (pixel < threshold) { // Dark pixel (likely text)
          if (!lineHasText) {
            lineStart = x;
            lineHasText = true;
          }
          lineEnd = x;
        }
      }

      if (lineHasText && (lineEnd - lineStart) > minWidth) {
        if (!currentRegion) {
          currentRegion = {
            left: lineStart,
            top: y,
            right: lineEnd,
            bottom: y
          };
        } else {
          currentRegion.left = Math.min(currentRegion.left, lineStart);
          currentRegion.right = Math.max(currentRegion.right, lineEnd);
          currentRegion.bottom = y;
        }
      } else if (currentRegion && y - currentRegion.bottom > 10) {
        // End current region if gap is too large
        if ((currentRegion.bottom - currentRegion.top) > minHeight) {
          regions.push({
            x: currentRegion.left,
            y: currentRegion.top,
            width: currentRegion.right - currentRegion.left,
            height: currentRegion.bottom - currentRegion.top
          });
        }
        currentRegion = null;
      }
    }

    // Add final region if exists
    if (currentRegion && (currentRegion.bottom - currentRegion.top) > minHeight) {
      regions.push({
        x: currentRegion.left,
        y: currentRegion.top,
        width: currentRegion.right - currentRegion.left,
        height: currentRegion.bottom - currentRegion.top
      });
    }

    return regions;
  } catch (error) {
    logger.error('Text region detection error:', error);
    return [];
  }
};

module.exports = {
  preprocessImage,
  detectTextRegions
};
