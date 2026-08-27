const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const forgeRoot = path.resolve(__dirname, '..', '..');
const runtimeFiles = [
  'forge-platform/src/index.ts',
  'forge-desktop/src/main.js',
  'forge-desktop/src/main.ts',
  'forge-extension/background.js',
  'forge-extension/content.js',
  'forge-extension/manifest.json',
  'forge-extension/popup.html',
  'forge-extension/popup.js',
  'forge-web-studio/app/components/ForgeApp.tsx',
  'forge-web-studio/app/api/_forgeProxy.ts',
  'forge-web-studio/app/api/[...path]/route.ts',
];

for (const relativePath of runtimeFiles) {
  const source = fs.readFileSync(path.join(forgeRoot, relativePath), 'utf8');
  assert.doesNotMatch(
    source,
    /https?:\/\/[^\s'"`]*\.up\.railway\.app/i,
    `${relativePath} must not call or default to a Railway deployment`,
  );
}

const platform = fs.readFileSync(path.join(forgeRoot, 'forge-platform/src/index.ts'), 'utf8');
assert.doesNotMatch(
  platform,
  /fetch\([^\n]*\/api\/dream-tool/i,
  'RAG queries must not send bearer tokens through a public self-fetch',
);
assert.match(
  platform,
  /const llm = getUserLLMKey\(req\.user!\.sub\);[\s\S]{0,1200}const result = await callLLM\(/,
  'RAG queries must call the selected user LLM directly inside the control plane',
);

const proxy = fs.readFileSync(path.join(forgeRoot, 'forge-web-studio/app/api/_forgeProxy.ts'), 'utf8');
assert.match(proxy, /FORGE_CONTROL_PLANE_API_URL/);
assert.match(proxy, /FORGE_CONTROL_PLANE_GATEWAY_SECRET/);

console.log(`deployment provider regression: PASS (${runtimeFiles.length} runtime files)`);
