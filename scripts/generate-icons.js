const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');

const svg = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3b82f6"/>
      <stop offset="1" stop-color="#764ba2"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="url(#g)"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        font-family="Arial, Helvetica, sans-serif" font-size="${Math.round(size * 0.42)}"
        font-weight="700" fill="#ffffff">CT</text>
</svg>`;

const writePng = async (outPath, size) => {
  await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
  await sharp(Buffer.from(svg(size))).png().toFile(outPath);
};

const main = async () => {
  const extensionDir = path.join(root, 'chrome-extension', 'icons');
  const pwaDir = path.join(root, 'frontend', 'public', 'icons');

  await Promise.all([
    writePng(path.join(extensionDir, 'icon16.png'), 16),
    writePng(path.join(extensionDir, 'icon32.png'), 32),
    writePng(path.join(extensionDir, 'icon48.png'), 48),
    writePng(path.join(extensionDir, 'icon128.png'), 128),
    writePng(path.join(pwaDir, 'icon-192.png'), 192),
    writePng(path.join(pwaDir, 'icon-512.png'), 512),
  ]);

  // eslint-disable-next-line no-console
  console.log('Icons generated.');
};

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

