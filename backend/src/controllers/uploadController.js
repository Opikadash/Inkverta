const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const logger = require('../utils/logger');

const getUploadDir = () => {
  return process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.join(__dirname, '../../uploads');
};

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadPath = getUploadDir();
      await fs.ensureDir(uploadPath);
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file type. Only JPEG, PNG, WebP, and TIFF are allowed.'),
      false,
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10,
  },
});

const optimizeToJpeg = async (inputPath, filename) => {
  const optimizedPath = path.join(path.dirname(inputPath), `optimized-${filename}`);

  await sharp(inputPath)
    .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toFile(optimizedPath);

  await fs.remove(inputPath);
  return optimizedPath;
};

const uploadSingle = async (req, res, next) => {
  try {
    const uploadedFile = req.file;

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const optimizedPath = await optimizeToJpeg(uploadedFile.path, uploadedFile.filename);

    const fileInfo = {
      id: uuidv4(),
      originalName: uploadedFile.originalname,
      filename: `optimized-${uploadedFile.filename}`,
      path: optimizedPath,
      size: (await fs.stat(optimizedPath)).size,
      mimetype: 'image/jpeg',
      uploadedAt: new Date().toISOString(),
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
      const optimizedPath = await optimizeToJpeg(file.path, file.filename);

      processedFiles.push({
        id: uuidv4(),
        originalName: file.originalname,
        filename: `optimized-${file.filename}`,
        path: optimizedPath,
        size: (await fs.stat(optimizedPath)).size,
        mimetype: 'image/jpeg',
        uploadedAt: new Date().toISOString(),
      });
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
  uploadMultiple,
};

