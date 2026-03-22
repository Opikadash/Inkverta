const validateTranslationRequest = (data) => {
  const { text, sourceLang, targetLang, service } = data;
  
  if (!text || typeof text !== 'string') {
    return { isValid: false, error: 'Text is required and must be a string' };
  }
  
  if (text.length > 5000) {
    return { isValid: false, error: 'Text must be less than 5000 characters' };
  }
  
  if (!targetLang || typeof targetLang !== 'string') {
    return { isValid: false, error: 'Target language is required' };
  }
  
  if (service && !['google', 'deepl'].includes(service.toLowerCase())) {
    return { isValid: false, error: 'Service must be either google or deepl' };
  }
  
  return { isValid: true };
};

const validateOcrRequest = (data) => {
  const { filename, language } = data;
  
  if (!filename || typeof filename !== 'string') {
    return { isValid: false, error: 'Filename is required and must be a string' };
  }
  
  if (language && typeof language !== 'string') {
    return { isValid: false, error: 'Language must be a string' };
  }
  
  return { isValid: true };
};

const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};

const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'];
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  if (!allowedTypes.includes(file.mimetype)) {
    return { isValid: false, error: 'Invalid file type' };
  }
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size too large' };
  }
  
  return { isValid: true };
};

module.exports = {
  validateTranslationRequest,
  validateOcrRequest,
  sanitizeFilename,
  validateImageFile
};
