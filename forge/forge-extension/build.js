// Forge AI Extension — Build Script
// Produces: dist/forge-chrome.zip, dist/forge-firefox.zip

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const target = process.argv[2] || 'all'; // chrome | firefox | all
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

const SHARED_FILES = [
  'content.js',
  'popup.html',
  'popup.js',
  'icons'
];

function buildChrome() {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(path.join(distDir, 'forge-chrome.zip'));
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', () => { console.log(`✅ Chrome/Edge: dist/forge-chrome.zip (${archive.pointer()} bytes)`); resolve(); });
    archive.on('error', reject);
    archive.pipe(output);
    archive.file('manifest.json', { name: 'manifest.json' });
    archive.file('background.js', { name: 'background.js' });
    SHARED_FILES.forEach(f => {
      const full = path.join(__dirname, f);
      if (fs.statSync(full).isDirectory()) archive.directory(full, f);
      else archive.file(full, { name: f });
    });
    archive.finalize();
  });
}

function buildFirefox() {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(path.join(distDir, 'forge-firefox.zip'));
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', () => { console.log(`✅ Firefox: dist/forge-firefox.zip (${archive.pointer()} bytes)`); resolve(); });
    archive.on('error', reject);
    archive.pipe(output);
    archive.file('manifest.firefox.json', { name: 'manifest.json' });
    archive.file('background.firefox.js', { name: 'background.firefox.js' });
    SHARED_FILES.forEach(f => {
      const full = path.join(__dirname, f);
      if (fs.statSync(full).isDirectory()) archive.directory(full, f);
      else archive.file(full, { name: f });
    });
    archive.finalize();
  });
}

async function main() {
  if (target === 'chrome' || target === 'all') await buildChrome();
  if (target === 'firefox' || target === 'all') await buildFirefox();
  console.log('\n📦 Done! Load in browser:');
  console.log('  Chrome/Edge: chrome://extensions → Developer mode → Load unpacked → select forge-extension/');
  console.log('  Firefox:     about:debugging → Load Temporary Add-on → select dist/forge-firefox.zip');
  console.log('\n🍎 Safari: Run: xcrun safari-web-extension-converter forge-extension/ --app-name "Forge AI"');
}

main().catch(console.error);
