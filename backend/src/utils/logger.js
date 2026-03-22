const winston = require('winston');
const path = require('path');
const fs = require('fs-extra');

const logDir = process.env.LOG_DIR ? path.resolve(process.env.LOG_DIR) : path.join(process.cwd(), 'logs');

if (process.env.LOG_TO_FILE === 'true') {
  try {
    fs.ensureDirSync(logDir);
  } catch {
    // fall back to console-only
  }
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'comic-translator' },
  transports:
    process.env.LOG_TO_FILE === 'true'
      ? [
          new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ]
      : [],
});

// Always log to stdout/stderr in container environments (Railway/Docker/etc.)
logger.add(
  new winston.transports.Console({
    format:
      process.env.NODE_ENV !== 'production'
        ? winston.format.combine(winston.format.colorize(), winston.format.simple())
        : winston.format.json(),
  }),
);

module.exports = logger;
