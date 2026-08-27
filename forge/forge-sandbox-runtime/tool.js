'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');
const { spawn } = require('node:child_process');

const WORKSPACE = '/workspace';
const ARTIFACTS = '/artifacts';
const MAX_OUTPUT_BYTES = 1024 * 1024;
const MAX_WORKSPACE_BYTES = Math.max(16 * 1024 * 1024, Number(process.env.FORGE_MAX_WORKSPACE_BYTES) || 256 * 1024 * 1024);

function normalizeRelative(input) {
  if (typeof input !== 'string' || !input.trim() || input.includes('\0')) throw new Error('SANDBOX_PATH_REQUIRED');
  const value = input.trim().replace(/\\/g, '/');
  if (value.startsWith('/') || /^[A-Za-z]:\//.test(value)) throw new Error('SANDBOX_ABSOLUTE_PATH_REJECTED');
  const normalized = path.posix.normalize(value);
  if (normalized === '..' || normalized.startsWith('../')) throw new Error('SANDBOX_PATH_ESCAPE_REJECTED');
  if (normalized.length > 512) throw new Error('SANDBOX_PATH_TOO_LONG');
  return normalized;
}

function resolveInside(base, relative) {
  const normalized = normalizeRelative(relative);
  const absolute = path.posix.resolve(base, normalized);
  if (absolute !== base && !absolute.startsWith(`${base}/`)) throw new Error('SANDBOX_PATH_ESCAPE_REJECTED');
  return absolute;
}

async function directoryBytes(root) {
  let total = 0;
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    let entries = [];
    try { entries = await fsp.readdir(current, { withFileTypes: true }); }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    for (const entry of entries) {
      const target = path.join(current, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) stack.push(target);
      else if (entry.isFile()) total += (await fsp.stat(target)).size;
      if (total > MAX_WORKSPACE_BYTES) return total;
    }
  }
  return total;
}

async function assertWorkspaceQuota(extraBytes = 0) {
  const used = await directoryBytes(WORKSPACE);
  if (used + extraBytes > MAX_WORKSPACE_BYTES) throw new Error('SANDBOX_WORKSPACE_QUOTA_EXCEEDED');
}

function safeJson(value) {
  const text = JSON.stringify(value);
  if (Buffer.byteLength(text) > MAX_OUTPUT_BYTES) throw new Error('SANDBOX_TOOL_OUTPUT_TOO_LARGE');
  return text;
}

async function fileTool(args) {
  const operation = String(args.operation || '');
  const relative = normalizeRelative(args.path || '.');
  const target = resolveInside(WORKSPACE, relative);
  if (operation === 'list') {
    const entries = await fsp.readdir(target, { withFileTypes: true });
    return { operation, path: relative, entries: await Promise.all(entries.slice(0, 1000).map(async entry => {
      const stat = await fsp.lstat(path.join(target, entry.name));
      return { name: entry.name, type: entry.isDirectory() ? 'directory' : entry.isSymbolicLink() ? 'symlink' : 'file', bytes: stat.size, modifiedAt: stat.mtime.toISOString() };
    })) };
  }
  if (operation === 'read') {
    const stat = await fsp.lstat(target);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('SANDBOX_FILE_NOT_REGULAR');
    if (stat.size > MAX_OUTPUT_BYTES) throw new Error('SANDBOX_FILE_TOO_LARGE_TO_READ');
    return { operation, path: relative, bytes: stat.size, content: await fsp.readFile(target, 'utf8') };
  }
  if (operation === 'write') {
    if (typeof args.content !== 'string') throw new Error('SANDBOX_FILE_CONTENT_REQUIRED');
    const content = Buffer.from(args.content, 'utf8');
    if (content.length > 2 * 1024 * 1024) throw new Error('SANDBOX_FILE_CONTENT_TOO_LARGE');
    await assertWorkspaceQuota(content.length);
    await fsp.mkdir(path.dirname(target), { recursive: true });
    const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
    await fsp.writeFile(temporary, content, { mode: 0o600 });
    await fsp.rename(temporary, target);
    return { operation, path: relative, bytes: content.length, sha256: crypto.createHash('sha256').update(content).digest('hex') };
  }
  if (operation === 'mkdir') {
    await fsp.mkdir(target, { recursive: true, mode: 0o700 });
    return { operation, path: relative };
  }
  if (operation === 'stat') {
    const stat = await fsp.lstat(target);
    return { operation, path: relative, type: stat.isDirectory() ? 'directory' : stat.isSymbolicLink() ? 'symlink' : 'file', bytes: stat.size, modifiedAt: stat.mtime.toISOString() };
  }
  throw new Error('SANDBOX_FILE_OPERATION_INVALID');
}

async function shellTool(args) {
  const command = String(args.command || '');
  if (!command.trim() || command.length > 20_000) throw new Error('SANDBOX_SHELL_COMMAND_INVALID');
  const cwd = resolveInside(WORKSPACE, args.cwd || '.');
  const timeoutMs = Math.max(1000, Math.min(Number(args.timeoutMs) || 30_000, 120_000));
  await fsp.mkdir(cwd, { recursive: true });
  return new Promise((resolve, reject) => {
    const child = spawn('/bin/sh', ['-lc', command], {
      cwd,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        PATH: '/usr/local/bin:/usr/bin:/bin',
        HOME: '/home/sandbox',
        LANG: 'C.UTF-8',
        FORGE_TENANT_ID: process.env.FORGE_TENANT_ID || '',
        FORGE_USER_ID: process.env.FORGE_USER_ID || '',
        FORGE_WORKSPACE_ID: process.env.FORGE_WORKSPACE_ID || '',
        FORGE_RUN_ID: process.env.FORGE_RUN_ID || '',
        FORGE_ATTEMPT_ID: process.env.FORGE_ATTEMPT_ID || '',
      },
    });
    const stdout = [];
    const stderr = [];
    let bytes = 0;
    let settled = false;
    const killGroup = () => {
      try { process.kill(-child.pid, 'SIGKILL'); } catch {}
    };
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error); else resolve(result);
    };
    const collect = destination => chunk => {
      bytes += chunk.length;
      if (bytes > MAX_OUTPUT_BYTES) {
        killGroup();
        finish(new Error('SANDBOX_SHELL_OUTPUT_TOO_LARGE'));
        return;
      }
      destination.push(chunk);
    };
    child.stdout.on('data', collect(stdout));
    child.stderr.on('data', collect(stderr));
    child.on('error', error => finish(error));
    child.on('close', async (code, signal) => {
      try {
        await assertWorkspaceQuota();
        finish(null, { command, cwd: path.relative(WORKSPACE, cwd) || '.', exitCode: code, signal, stdout: Buffer.concat(stdout).toString('utf8'), stderr: Buffer.concat(stderr).toString('utf8') });
      } catch (error) { finish(error); }
    });
    const timer = setTimeout(() => {
      killGroup();
      finish(new Error('SANDBOX_SHELL_TIMEOUT'));
    }, timeoutMs);
  });
}

async function browserTool(args) {
  const { chromium } = require('playwright-core');
  const actions = Array.isArray(args.actions) ? args.actions : [];
  if (!actions.length || actions.length > 20) throw new Error('SANDBOX_BROWSER_ACTIONS_INVALID');
  const retrySafe = actions.every(raw => ['navigate', 'extract', 'screenshot', 'wait'].includes(String(raw.action || '').toLowerCase()));
  const attempts = retrySafe ? 2 : 1;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const statePath = path.join(WORKSPACE, '.forge-browser-state.json');
    const browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
      headless: true,
      proxy: process.env.FORGE_BROWSER_PROXY ? { server: process.env.FORGE_BROWSER_PROXY } : undefined,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-background-networking',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-component-extensions-with-background-pages',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-domain-reliability',
        '--disable-features=AutofillServerCommunication,CertificateTransparencyComponentUpdater,MediaRouter,OptimizationHints,Translate',
        '--disable-sync',
        '--metrics-recording-only',
        '--no-default-browser-check',
        '--no-first-run',
        '--password-store=basic',
        '--use-mock-keychain',
      ],
    });
    try {
      const context = await browser.newContext({
        javaScriptEnabled: true,
        acceptDownloads: false,
        storageState: fs.existsSync(statePath) ? statePath : undefined,
        viewport: { width: 1440, height: 1000 },
      });
      const page = await context.newPage();
      page.setDefaultTimeout(15_000);
      const results = [];
      for (const raw of actions) {
        const action = String(raw.action || '').toLowerCase();
        if (action === 'navigate') {
          if (typeof raw.url !== 'string' || !/^https?:\/\//i.test(raw.url)) throw new Error('SANDBOX_BROWSER_URL_INVALID');
          const response = await page.goto(raw.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
          const responseHeaders = response ? await response.allHeaders() : {};
          if (responseHeaders['x-forge-egress-blocked']) throw new Error(responseHeaders['x-forge-egress-blocked']);
          results.push({ action, url: page.url(), status: response ? response.status() : null, title: await page.title() });
        } else if (action === 'extract') {
          const locator = raw.selector ? page.locator(String(raw.selector)).first() : page.locator('body');
          const text = String(await locator.innerText({ timeout: 15_000 })).slice(0, 100_000);
          results.push({ action, selector: raw.selector || 'body', text });
        } else if (action === 'screenshot') {
          const relative = normalizeRelative(raw.path || `screenshots/${Date.now()}.png`);
          const target = resolveInside(WORKSPACE, relative);
          await fsp.mkdir(path.dirname(target), { recursive: true });
          await page.screenshot({ path: target, fullPage: true });
          results.push({ action, path: relative, bytes: (await fsp.stat(target)).size });
        } else if (action === 'fill') {
          await page.locator(String(raw.selector || '')).fill(String(raw.value || ''));
          results.push({ action, selector: raw.selector });
        } else if (action === 'click' || action === 'submit') {
          await page.locator(String(raw.selector || '')).click();
          await page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
          results.push({ action, selector: raw.selector, url: page.url(), title: await page.title() });
        } else if (action === 'upload') {
          const target = resolveInside(WORKSPACE, raw.path);
          await page.locator(String(raw.selector || '')).setInputFiles(target);
          results.push({ action, selector: raw.selector, path: normalizeRelative(raw.path) });
        } else if (action === 'wait') {
          const timeoutMs = Math.max(0, Math.min(Number(raw.timeoutMs) || 1000, 10_000));
          await page.waitForTimeout(timeoutMs);
          results.push({ action, timeoutMs });
        } else {
          throw new Error('SANDBOX_BROWSER_ACTION_INVALID');
        }
      }
      await context.storageState({ path: statePath });
      await assertWorkspaceQuota();
      const finalUrl = page.url();
      await context.close();
      return { url: finalUrl, results };
    } catch (error) {
      lastError = error;
    } finally {
      await browser.close().catch(() => {});
    }
    if (!retrySafe || attempt === attempts) throw lastError;
  }
  throw lastError || new Error('SANDBOX_BROWSER_FAILED');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
}

async function documentTool(args) {
  const operation = String(args.operation || '');
  if (operation === 'render_markdown_pdf') {
    const { chromium } = require('playwright-core');
    const { marked } = require('marked');
    const source = resolveInside(WORKSPACE, args.sourcePath);
    const outputRelative = normalizeRelative(args.outputPath || 'output.pdf');
    const output = resolveInside(WORKSPACE, outputRelative);
    const markdown = await fsp.readFile(source, 'utf8');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(args.title || 'Forge artifact')}</title><style>body{font-family:Arial,"Noto Sans",sans-serif;max-width:820px;margin:48px auto;color:#172033;line-height:1.55}h1,h2,h3{color:#101827}pre,code{font-family:monospace;background:#f3f5f8}pre{padding:12px;overflow-wrap:anywhere}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccd3dd;padding:7px;text-align:left}img{max-width:100%}</style></head><body>${marked.parse(markdown)}</body></html>`;
    await fsp.mkdir(path.dirname(output), { recursive: true });
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--disable-background-networking'] });
    try {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      await page.pdf({ path: output, format: 'A4', printBackground: true, margin: { top: '18mm', right: '16mm', bottom: '18mm', left: '16mm' } });
      await context.close();
    } finally { await browser.close(); }
    await assertWorkspaceQuota();
    return { operation, sourcePath: normalizeRelative(args.sourcePath), outputPath: outputRelative, bytes: (await fsp.stat(output)).size };
  }
  if (operation === 'inspect_spreadsheet') {
    const XLSX = require('xlsx');
    const relative = normalizeRelative(args.path);
    const target = resolveInside(WORKSPACE, relative);
    const workbook = XLSX.readFile(target, { cellFormula: true, cellDates: true });
    const sheets = workbook.SheetNames.map(name => {
      const sheet = workbook.Sheets[name];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false }).slice(0, 50);
      const formulaCells = Object.values(sheet).filter(cell => cell && typeof cell === 'object' && cell.f).length;
      return { name, range: sheet['!ref'] || null, previewRows: rows, formulaCells };
    });
    return { operation, path: relative, sheets };
  }
  if (operation === 'create_spreadsheet') {
    const XLSX = require('xlsx');
    if (!Array.isArray(args.rows) || args.rows.length > 10_000) throw new Error('SANDBOX_SPREADSHEET_ROWS_INVALID');
    const relative = normalizeRelative(args.path);
    const target = resolveInside(WORKSPACE, relative);
    await fsp.mkdir(path.dirname(target), { recursive: true });
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(args.rows);
    XLSX.utils.book_append_sheet(workbook, sheet, String(args.sheetName || 'Sheet1').slice(0, 31));
    XLSX.writeFile(workbook, target, { compression: true });
    const validated = XLSX.readFile(target);
    await assertWorkspaceQuota();
    return { operation, path: relative, bytes: (await fsp.stat(target)).size, sheets: validated.SheetNames };
  }
  throw new Error('SANDBOX_DOCUMENT_OPERATION_INVALID');
}

async function artifactTool(args) {
  if (String(args.operation || 'commit') !== 'commit') throw new Error('SANDBOX_ARTIFACT_OPERATION_INVALID');
  const relative = normalizeRelative(args.path);
  const source = resolveInside(WORKSPACE, relative);
  const stat = await fsp.lstat(source);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('SANDBOX_ARTIFACT_FILE_REQUIRED');
  if (stat.size > 20 * 1024 * 1024) throw new Error('SANDBOX_ARTIFACT_TOO_LARGE');
  const runId = String(process.env.FORGE_RUN_ID || 'unknown-run').replace(/[^A-Za-z0-9_-]/g, '_');
  const attemptId = String(process.env.FORGE_ATTEMPT_ID || 'unknown-attempt').replace(/[^A-Za-z0-9_-]/g, '_');
  const artifactRelative = path.posix.join(runId, attemptId, path.posix.basename(relative));
  const destination = resolveInside(ARTIFACTS, artifactRelative);
  await fsp.mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.${process.pid}.${Date.now()}.tmp`;
  await fsp.copyFile(source, temporary);
  await fsp.rename(temporary, destination);
  const content = await fsp.readFile(destination);
  return {
    operation: 'commit',
    sourcePath: relative,
    artifactPath: artifactRelative,
    title: String(args.title || path.posix.basename(relative)).slice(0, 200),
    mimeType: String(args.mimeType || 'application/octet-stream').slice(0, 200),
    bytes: content.length,
    sha256: crypto.createHash('sha256').update(content).digest('hex'),
  };
}

async function main() {
  const encoded = process.argv[2];
  if (!encoded || encoded.length > 4 * 1024 * 1024) throw new Error('SANDBOX_TOOL_REQUEST_INVALID');
  let request;
  try { request = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')); }
  catch { throw new Error('SANDBOX_TOOL_REQUEST_INVALID'); }
  let data;
  if (request.toolName === 'sandbox_file') data = await fileTool(request.args || {});
  else if (request.toolName === 'sandbox_shell') data = await shellTool(request.args || {});
  else if (request.toolName === 'sandbox_browser') data = await browserTool(request.args || {});
  else if (request.toolName === 'sandbox_document') data = await documentTool(request.args || {});
  else if (request.toolName === 'sandbox_artifact') data = await artifactTool(request.args || {});
  else throw new Error('SANDBOX_TOOL_NOT_ALLOWED');
  process.stdout.write(safeJson({ ok: true, data }));
}

if (require.main === module) {
  main().catch(error => {
    process.stdout.write(JSON.stringify({ ok: false, error: String(error && error.message || 'SANDBOX_TOOL_FAILED').slice(0, 2000) }));
    process.exitCode = 1;
  });
}

module.exports = { normalizeRelative, resolveInside };
