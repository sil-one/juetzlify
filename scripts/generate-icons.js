import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE = path.join(__dirname, '../frontend/public/juetzlify_logo.png');
const OUTPUT_DIR = path.join(__dirname, '../frontend/public');

const sizes = [192, 512];

async function generateIcons() {
  console.log('Generating PWA icons...\n');

  for (const size of sizes) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}.png`);

    await sharp(SOURCE)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`✓ Generated icon-${size}.png`);
  }

  console.log('\nDone! Update your manifest.json if needed.');
}

generateIcons().catch(console.error);
