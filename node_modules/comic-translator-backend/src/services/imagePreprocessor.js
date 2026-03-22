const sharp = require('sharp');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const preprocessImage = async (imagePath, options = {}) => {
  try {
    const {
      enhance = true,
      denoise = true,
      sharpen = true,
      contrast = 1.2,
      brightness = 1.1,
      gamma = 1.0,
    } = options;

    const outputPath = path.join(
      path.dirname(imagePath),
      `processed-${uuidv4()}-${path.basename(imagePath)}`,
    );

    let pipeline = sharp(imagePath).grayscale();

    if (enhance) {
      pipeline = pipeline
        .modulate({
          brightness,
          saturation: 1.0,
        })
        .gamma(gamma);
    }

    pipeline = pipeline.linear(contrast, -(128 * contrast) + 128);

    if (sharpen) {
      pipeline = pipeline.sharpen({
        sigma: 1,
        flat: 1,
        jagged: 2,
      });
    }

    if (denoise) {
      pipeline = pipeline.median(3);
    }

    const metadata = await sharp(imagePath).metadata();
    if (metadata.width && metadata.height && (metadata.width < 300 || metadata.height < 300)) {
      pipeline = pipeline.resize(
        Math.max(metadata.width * 2, 600),
        Math.max(metadata.height * 2, 600),
        { fit: 'inside' },
      );
    }

    await pipeline.png().toFile(outputPath);

    logger.debug(
      `Image preprocessed: ${path.basename(imagePath)} -> ${path.basename(outputPath)}`,
    );
    return outputPath;
  } catch (error) {
    logger.error('Image preprocessing error:', error);
    throw new Error('Failed to preprocess image');
  }
};

const detectTextRegions = async (imagePath) => {
  try {
    const image = sharp(imagePath);
    const { data, info } = await image.raw().greyscale().toBuffer({ resolveWithObject: true });

    const regions = [];
    const threshold = 100;
    const minWidth = 50;
    const minHeight = 20;

    let currentRegion = null;

    for (let y = 0; y < info.height; y++) {
      let lineHasText = false;
      let lineStart = null;
      let lineEnd = null;

      for (let x = 0; x < info.width; x++) {
        const pixel = data[y * info.width + x];
        if (pixel < threshold) {
          if (!lineHasText) {
            lineStart = x;
            lineHasText = true;
          }
          lineEnd = x;
        }
      }

      if (lineHasText && lineStart !== null && lineEnd !== null && lineEnd - lineStart > minWidth) {
        if (!currentRegion) {
          currentRegion = { left: lineStart, top: y, right: lineEnd, bottom: y };
        } else {
          currentRegion.left = Math.min(currentRegion.left, lineStart);
          currentRegion.right = Math.max(currentRegion.right, lineEnd);
          currentRegion.bottom = y;
        }
      } else if (currentRegion && y - currentRegion.bottom > 10) {
        if (currentRegion.bottom - currentRegion.top > minHeight) {
          regions.push({
            x: currentRegion.left,
            y: currentRegion.top,
            width: currentRegion.right - currentRegion.left,
            height: currentRegion.bottom - currentRegion.top,
          });
        }
        currentRegion = null;
      }
    }

    if (currentRegion && currentRegion.bottom - currentRegion.top > minHeight) {
      regions.push({
        x: currentRegion.left,
        y: currentRegion.top,
        width: currentRegion.right - currentRegion.left,
        height: currentRegion.bottom - currentRegion.top,
      });
    }

    return regions;
  } catch (error) {
    logger.error('Text region detection error:', error);
    return [];
  }
};

module.exports = {
  preprocessImage,
  detectTextRegions,
};

