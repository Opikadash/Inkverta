const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs-extra');
const logger = require('../utils/logger');
const { preprocessImage } = require('../services/imagePreprocessor');
const { validateOcrRequest } = require('../utils/validation');
const { getUploadDir } = require('../utils/fileManager');

const extractText = async (req, res, next) => {
  try {
    const { filename, language = process.env.OCR_LANGUAGE || 'eng', preprocess = true } = req.body;

    const validation = validateOcrRequest({ filename, language });
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    const imagePath = path.join(getUploadDir(), filename);

    if (!(await fs.pathExists(imagePath))) {
      return res.status(404).json({ error: 'File not found' });
    }

    let processedImagePath = imagePath;
    if (preprocess) {
      processedImagePath = await preprocessImage(imagePath);
    }

    logger.info(`Starting OCR for ${filename} with language ${language}`);

    const { data } = await Tesseract.recognize(processedImagePath, language, {
      logger: (m) => logger.debug(`OCR Progress: ${m.status} ${m.progress}`),
    });

    if (processedImagePath !== imagePath) {
      await fs.remove(processedImagePath);
    }

    const result = {
      text: (data.text || '').trim(),
      confidence: data.confidence,
      wordCount: (data.words || []).length,
      detectedBlocks: (data.words || [])
        .filter((word) => word.confidence > 50)
        .map((word) => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox,
        })),
    };

    logger.info(`OCR completed for ${filename}, confidence: ${data.confidence}%`);
    res.json({ success: true, result });
  } catch (error) {
    logger.error('OCR error:', error);
    next(error);
  }
};

const extractTextFromMultiple = async (req, res, next) => {
  try {
    const { filenames, language = process.env.OCR_LANGUAGE || 'eng', preprocess = true } = req.body;

    if (!filenames || !Array.isArray(filenames)) {
      return res.status(400).json({ error: 'Filenames array is required' });
    }

    const validation = validateOcrRequest({ filename: filenames[0] || 'x', language });
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const results = [];

    for (const filename of filenames) {
      const imagePath = path.join(getUploadDir(), filename);

      if (!(await fs.pathExists(imagePath))) {
        results.push({ filename, error: 'File not found', success: false });
        continue;
      }

      try {
        let processedImagePath = imagePath;
        if (preprocess) {
          processedImagePath = await preprocessImage(imagePath);
        }

        const { data } = await Tesseract.recognize(processedImagePath, language);

        if (processedImagePath !== imagePath) {
          await fs.remove(processedImagePath);
        }

        results.push({
          filename,
          success: true,
          result: {
            text: (data.text || '').trim(),
            confidence: data.confidence,
            wordCount: (data.words || []).length,
            detectedBlocks: (data.words || [])
              .filter((word) => word.confidence > 50)
              .map((word) => ({
                text: word.text,
                confidence: word.confidence,
                bbox: word.bbox,
              })),
          },
        });
      } catch (error) {
        results.push({ filename, error: error.message, success: false });
      }
    }

    logger.info(`Batch OCR completed for ${filenames.length} files`);
    res.json({ success: true, results });
  } catch (error) {
    logger.error('Batch OCR error:', error);
    next(error);
  }
};

module.exports = {
  extractText,
  extractTextFromMultiple,
};
