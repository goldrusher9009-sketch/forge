'use strict';

const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const sourceExtensions = new Set(['.css', '.html', '.js', '.jsx', '.scss', '.ts', '.tsx']);
const buildExtensions = new Set(['.css', '.html', '.js', '.json', '.rsc', '.txt']);
const remoteFontPattern = /fonts\.(?:googleapis|gstatic)\.com/i;
const googleFontImportPattern = /next\/font\/google/i;

function filesUnder(root, extensions) {
  if (!fs.existsSync(root)) throw new Error(`FONT_REGRESSION_REQUIRED_PATH_MISSING: ${path.relative(projectRoot, root)}`);
  const files = [];
  const pending = [root];
  while (pending.length) {
    const directory = pending.pop();
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) pending.push(absolute);
      else if (entry.isFile() && extensions.has(path.extname(entry.name))) files.push(absolute);
    }
  }
  return files;
}

function scan(files, patterns) {
  const findings = [];
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const pattern of patterns) {
      if (pattern.test(content)) findings.push(path.relative(projectRoot, file).replace(/\\/g, '/'));
      pattern.lastIndex = 0;
    }
  }
  return [...new Set(findings)].sort();
}

const sourceFiles = [
  ...filesUnder(path.join(projectRoot, 'app'), sourceExtensions),
  ...filesUnder(path.join(projectRoot, 'public'), sourceExtensions),
];
const buildFiles = [
  ...filesUnder(path.join(projectRoot, '.next', 'server'), buildExtensions),
  ...filesUnder(path.join(projectRoot, '.next', 'static'), buildExtensions),
];
const sourceFindings = scan(sourceFiles, [remoteFontPattern, googleFontImportPattern]);
const buildFindings = scan(buildFiles, [remoteFontPattern]);

if (sourceFindings.length || buildFindings.length) {
  throw new Error(`REMOTE_FONT_DEPENDENCY_FOUND: ${JSON.stringify({ sourceFindings, buildFindings })}`);
}

process.stdout.write(`${JSON.stringify({
  success: true,
  sourceFilesScanned: sourceFiles.length,
  buildFilesScanned: buildFiles.length,
  remoteFontReferences: 0,
})}\n`);
