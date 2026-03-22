const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const distDir = path.resolve(__dirname, '..', 'dist');
const outDir = path.resolve(__dirname, '..', 'package');
const outPath = path.join(outDir, 'comic-translator-extension.zip');

if (!fs.existsSync(distDir)) {
  // eslint-disable-next-line no-console
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const output = fs.createWriteStream(outPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  // eslint-disable-next-line no-console
  console.log(`Created ${outPath} (${archive.pointer()} bytes)`);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);
archive.directory(distDir, false);
archive.finalize();

