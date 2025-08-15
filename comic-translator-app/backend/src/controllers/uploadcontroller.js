const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const logger = require('../utils/logger');

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    await fs.ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and TIFF are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10
  }
});

const uploadSingle = async (req, res, next) => {
  try {
    const uploadedFile = req.file;
    
    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Optimize image
    const optimizedPath = path.join(
      path.dirname(uploadedFile.path),
      `optimized-${uploadedFile.filename}`
    );

    await sharp(uploadedFile.path)
      .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toFile(optimizedPath);

    // Remove original if optimization successful
    await fs.remove(uploadedFile.path);

    const fileInfo = {
      id: uuidv4(),
      originalName: uploadedFile.originalname,
      filename: `optimized-${uploadedFile.filename}`,
      path: optimizedPath,
      size: (await fs.stat(optimizedPath)).size,
      mimetype: 'image/jpeg',
      uploadedAt: new Date().toISOString()
    };

    logger.info(`File uploaded successfully: ${fileInfo.filename}`);
    res.json({ success: true, file: fileInfo });
  } catch (error) {
    logger.error('Upload error:', error);
    next(error);
  }
};

const uploadMultiple = async (req, res, next) => {
  try {
    const uploadedFiles = req.files;
    
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const processedFiles = [];

    for (const file of uploadedFiles) {
      const optimizedPath = path.join(
        path.dirname(file.path),
        `optimized-${file.filename}`
      );

      await sharp(file.path)
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toFile(optimizedPath);

      await fs.remove(file.path);

      const fileInfo = {
        id: uuidv4(),
        originalName: file.originalname,
        filename: `optimized-${file.filename}`,
        path: optimizedPath,
        size: (await fs.stat(optimizedPath)).size,
        mimetype: 'image/jpeg',
        uploadedAt: new Date().toISOString()
      };

      processedFiles.push(fileInfo);
    }

    logger.info(`Multiple files uploaded successfully: ${processedFiles.length} files`);
    res.json({ success: true, files: processedFiles });
  } catch (error) {
    logger.error('Multiple upload error:', error);
    next(error);
  }
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple
};

// src/controllers/ocrController.js
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');
const logger = require('../utils/logger');
const { preprocessImage } = require('../services/imagePreprocessor');

const extractText = async (req, res, next) => {
  try {
    const { filename, language = 'eng', preprocess = true } = req.body;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    const imagePath = path.join(__dirname, '../../uploads', filename);
    
    if (!await fs.pathExists(imagePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    let processedImagePath = imagePath;
    
    if (preprocess) {
      processedImagePath = await preprocessImage(imagePath);
    }

    logger.info(`Starting OCR for ${filename} with language ${language}`);
    
    const { data: { text, confidence, words } } = await Tesseract.recognize(
      processedImagePath,
      language,
      {
        logger: m => logger.debug(`OCR Progress: ${m.status} ${m.progress}`)
      }
    );

    // Clean up preprocessed image if it was created
    if (processedImagePath !== imagePath) {
      await fs.remove(processedImagePath);
    }

    const result = {
      text: text.trim(),
      confidence,
      wordCount: words.length,
      detectedBlocks: words.filter(word => word.confidence > 50).map(word => ({
        text: word.text,
        confidence: word.confidence,
        bbox: word.bbox
      }))
    };

    logger.info(`OCR completed for ${filename}, confidence: ${confidence}%`);
    res.json({ success: true, result });
  } catch (error) {
    logger.error('OCR error:', error);
    next(error);
  }
};

const extractTextFromMultiple = async (req, res, next) => {
  try {
    const { filenames, language = 'eng', preprocess = true } = req.body;
    
    if (!filenames || !Array.isArray(filenames)) {
      return res.status(400).json({ error: 'Filenames array is required' });
    }

    const results = [];

    for (const filename of filenames) {
      const imagePath = path.join(__dirname, '../../uploads', filename);
      
      if (!await fs.pathExists(imagePath)) {
        results.push({ filename, error: 'File not found' });
        continue;
      }

      try {
        let processedImagePath = imagePath;
        
        if (preprocess) {
          processedImagePath = await preprocessImage(imagePath);
        }

        const { data: { text, confidence, words } } = await Tesseract.recognize(
          processedImagePath,
          language
        );

        if (processedImagePath !== imagePath) {
          await fs.remove(processedImagePath);
        }

        results.push({
          filename,
          success: true,
          result: {
            text: text.trim(),
            confidence,
            wordCount: words.length,
            detectedBlocks: words.filter(word => word.confidence > 50).map(word => ({
              text: word.text,
              confidence: word.confidence,
              bbox: word.bbox
            }))
          }
        });
      } catch (error) {
        results.push({ filename, error: error.message });
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
  extractTextFromMultiple
};

// src/controllers/translateController.js
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

    const result = {
      originalText: text,
      translatedText,
      sourceLang,
      targetLang,
      service,
      timestamp: new Date().toISOString()
    };

    res.json({ success: true, result });
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
        results.push({
          originalText: text,
          translatedText,
          success: true
        });
      } catch (error) {
        results.push({
          originalText: text,
          error: error.message,
          success: false
        });
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
  translateBatch
};
