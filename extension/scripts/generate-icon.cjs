#!/usr/bin/env node
// Simple icon generator using Jimp.
// Usage: node scripts/generate-icon.cjs [inputPath] [outputBase]
// - inputPath: path to source image (default: resources/source.png)
// - outputBase: base name for outputs without extension (default: resources/icon)

const Jimp = require('jimp');

async function main() {
  const inputPath = process.argv[2] || 'resources/source.png';
  const outputBase = process.argv[3] || 'resources/icon';
  const out128 = `${outputBase}-128.png`;
  const out256 = `${outputBase}-256.png`;

  try {
    const img = await Jimp.read(inputPath);
    const w = img.bitmap.width;
    const h = img.bitmap.height;

    // Compute a square crop that biases upward to avoid bottom text.
    const size = Math.min(w, h);
    const x = Math.max(0, Math.round((w - size) / 2));
    let y = Math.max(0, Math.round(h * 0.15)); // shift up ~15%
    if (y + size > h) y = Math.max(0, h - size);

    const cropped = img.clone().crop(x, y, size, size);

    // Add transparent padding to avoid edge clipping in small sizes.
    const pad = Math.round(size * 0.08);
    const canvasSize = size + pad * 2;
    const canvas = new Jimp(canvasSize, canvasSize, 0x00000000);
    canvas.composite(cropped, pad, pad);

    const icon128 = canvas.clone().resize(128, 128, Jimp.RESIZE_BICUBIC);
    const icon256 = canvas.clone().resize(256, 256, Jimp.RESIZE_BICUBIC);

    await icon128.writeAsync(out128);
    await icon256.writeAsync(out256);

    console.log(`Generated: \n - ${out128}\n - ${out256}`);
  } catch (err) {
    console.error('Icon generation failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
