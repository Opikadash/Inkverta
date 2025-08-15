const express = require('express');
const router = express.Router();
const os = require('os');
const fs = require('fs-extra');
const path = require('path');

router.get('/', async (req, res) => {
  try {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Check disk space
    const uploadDir = path.join(__dirname, '../../uploads');
    const diskStats = await fs.stat(uploadDir).catch(() => null);
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 60)} minutes`,
      memory: {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        cpuCount: os.cpus().length,
        freeMemory: `${Math.round(os.freemem() / 1024 / 1024)} MB`,
        totalMemory: `${Math.round(os.totalmem() / 1024 / 1024)} MB`,
        loadAverage: os.loadavg()
      },
      services: {
        googleTranslate: !!process.env.GOOGLE_TRANSLATE_API_KEY,
        deepL: !!process.env.DEEPL_API_KEY
      }
    };

    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/ready', (req, res) => {
  res.json({ ready: true, timestamp: new Date().toISOString() });
});

module.exports = router;
