const fs = require('fs-extra');
const path = require('path');
const logger = require('./logger');

const createDirectories = async () => {
  const dirs = [
    path.join(__dirname, '../../uploads'),
    path.join(__dirname, '../../temp'),
    path.join(__dirname, '../../logs')
  ];
  
  for (const dir of dirs) {
    try {
      await fs.ensureDir(dir);
      logger.info(`Directory ensured: ${dir}`);
    } catch (error) {
      logger.error(`Failed to create directory ${dir}:`, error);
    }
  }
};

const cleanupOldFiles = async (directory, maxAge = 24 * 60 * 60 * 1000) => {
  try {
    const files = await fs.readdir(directory);
    const now = Date.now();
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.remove(filePath);
        logger.info(`Cleaned up old file: ${file}`);
      }
    }
  } catch (error) {
    logger.error(`Failed to cleanup directory ${directory}:`, error);
  }
};

const getFileInfo = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      exists: true
    };
  } catch (error) {
    return { exists: false };
  }
};

module.exports = {
  createDirectories,
  cleanupOldFiles,
  getFileInfo
};
