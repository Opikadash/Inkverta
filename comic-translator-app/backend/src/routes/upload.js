const express = require('express');
const router = express.Router();
const { upload, uploadSingle, uploadMultiple } = require('../controllers/uploadController');

router.post('/single', upload.single('image'), uploadSingle);
router.post('/multiple', upload.array('images', 10), uploadMultiple);

module.exports = router;
