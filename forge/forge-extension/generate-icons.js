// Generate PNG icons from SVG using sharp
// Run: node generate-icons.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

// Forge icon SVG — purple/orange gradient with lightning bolt
const svg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7C3AED"/>
      <stop offset="100%" style="stop-color:#F97316"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#g)"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="${size * 0.6}" fill="white">⚡</text>
</svg>`;

const sizes = [16, 32, 48, 128];

async function generate() {
  for (const size of sizes) {
    await sharp(Buffer.from(svg(size)))
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, `icon${size}.png`));
    console.log(`✅ icons/icon${size}.png`);
  }
  console.log('\nIcons generated in icons/');
}

generate().catch(console.error);
