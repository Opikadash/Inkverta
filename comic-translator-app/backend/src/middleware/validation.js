const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

const translateValidation = [
  body('text')
    .isString()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Text must be between 1 and 5000 characters'),
  body('sourceLang')
    .optional()
    .isString()
    .isLength({ min: 2, max: 10 })
    .withMessage('Source language must be a valid language code'),
  body('targetLang')
    .isString()
    .isLength({ min: 2, max: 10 })
    .withMessage('Target language must be a valid language code'),
  body('service')
    .optional()
    .isIn(['google', 'deepl'])
    .withMessage('Service must be either google or deepl'),
  validateRequest
];

const ocrValidation = [
  body('filename')
    .isString()
    .notEmpty()
    .withMessage('Filename is required'),
  body('language')
    .optional()
    .isString()
    .withMessage('Language must be a string'),
  body('preprocess')
    .optional()
    .isBoolean()
    .withMessage('Preprocess must be a boolean'),
  validateRequest
];

module.exports = {
  validateRequest,
  translateValidation,
  ocrValidation
};
