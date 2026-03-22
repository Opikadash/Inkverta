const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const path = require('path');
require('dotenv').config();

const logger = require('./src/utils/logger');
const errorHandler = require('./src/middleware/errorHandler');
const healthRoutes = require('./src/routes/health');
const uploadRoutes = require('./src/routes/upload');
const translateRoutes = require('./src/routes/translate');
const ocrRoutes = require('./src/routes/ocr');
const { createDirectories, getUploadDir } = require('./src/utils/fileManager');

const app = express();
const PORT = process.env.PORT || 3001;
const uploadDir = getUploadDir();

if (process.env.NODE_ENV === 'production') {
  // Needed for correct IP detection behind reverse proxies (rate limiting, logs)
  app.set('trust proxy', 1);
}

// Ensure required directories exist (uploads/temp/logs)
createDirectories().catch((error) => {
  logger.error('Failed to ensure directories:', error);
});

// Security middleware
app.use(helmet());

const parseCorsOrigins = () => {
  const origins = new Set();

  if (process.env.FRONTEND_URL) origins.add(process.env.FRONTEND_URL);
  if (process.env.CORS_ORIGINS) {
    for (const origin of process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)) {
      origins.add(origin);
    }
  }

  if (origins.size === 0) origins.add('http://localhost:3000');
  return origins;
};

const allowedOrigins = parseCorsOrigins();

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.has(origin)) return cb(null, true);
      if (origin.startsWith('chrome-extension://')) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const speedLimiter = slowDown({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15 * 60 * 1000, // 15 minutes
  delayAfter: parseInt(process.env.RATE_LIMIT_DELAY_AFTER, 10) || 50, // allow 50 requests per 15 minutes, then...
  delayMs: parseInt(process.env.RATE_LIMIT_DELAY_MS, 10) || 500 // begin adding 500ms of delay per request above 50
});

app.use(limiter);
app.use(speedLimiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/ocr', ocrRoutes);

app.get('/api/openapi.yaml', (req, res) => {
  res.sendFile(path.join(__dirname, 'openapi.yaml'));
});

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

if (require.main === module) {
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error: error?.message, stack: error?.stack });
    process.exit(1);
  });

  const server = app.listen(PORT, () => {
    logger.info(
      `Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`,
    );
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = app;
