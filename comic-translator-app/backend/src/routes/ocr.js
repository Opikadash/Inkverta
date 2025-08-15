const express = require('express');
const router = express.Router();
const { extractText, extractTextFromMultiple } = require('../controllers/ocrController');

router.post('/extract', extractText);
router.post('/batch', extractTextFromMultiple);

module.exports = router;
