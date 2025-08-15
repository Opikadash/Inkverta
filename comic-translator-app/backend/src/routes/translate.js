const express = require('express');
const router = express.Router();
const { translate, translateBatch } = require('../controllers/translateController');
const { getSupportedLanguages } = require('../services/translationService');

router.post('/', translate);
router.post('/batch', translateBatch);
router.get('/languages', (req, res) => {
  const service = req.query.service || 'google';
  const languages = getSupportedLanguages(service);
  res.json({ success: true, languages });
});

module.exports = router;
