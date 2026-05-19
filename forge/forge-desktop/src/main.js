// Forge AI Desktop — Main Process
// Provides: folder context, persistent memory, Chrome/browser bridge, file system access

const { app, BrowserWindow, ipcMain, dialog, Menu, Tray, nativeImage, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const WebSocket = require('ws');
const chokidar = require('chokidar');

// ─── Config ───────────────────────────────────────────────────────────────────
const FORGE_API = 'https://forge-production-2692.up.railway.app/api';
const MEMORY_FILE = path.join(app.getPath('userData'), 'forge-memory.json');
const CONFIG_FILE = path.join(app.getPath('userData'), 'forge-config.json');
const WS_PORT = 27184; // Native messaging bridge port

let mainWindow = null;
let tray = null;
let watcher = null;
let wsServer = null;
let memory = {};
let config = {};

// ─── Memory ───────────────────────────────────────────────────────────────────
function loadMemory() {
  try { memory = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8')); } catch { memory = {}; }
}
function saveMemory() {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
}

function loadConfig() {
  try { config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); }
  catch { config = { openFolders: [], token: null, theme: 'dark', autoLaunch: false }; }
}
function saveConfig() {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// ─── WebSocket Bridge (for Chrome extension) ──────────────────────────────────
function startWsBridge() {
  wsServer = new WebSocket.Server({ port: WS_PORT, host: '127.0.0.1' });
  wsServer.on('connection', (ws) => {
    console.log('[Bridge] Chrome extension connected');
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        // Forward browser events to renderer
        if (mainWindow) mainWindow.webContents.send('browser-event', msg);
      } catch (e) { console.error('[Bridge] parse error', e); }
    });
    // Send context to extension
    ws.send(JSON.stringify({ type: 'context', folders: config.openFolders || [], memory: Object.keys(memory).length }));
  });
  wsServer.on('error', (e) => console.error('[Bridge] WS error', e.message));
}

// ─── Folder Watcher ───────────────────────────────────────────────────────────
function watchFolders(folders) {
  if (watcher) watcher.close();
  if (!folders || folders.length === 0) return;
  watcher = chokidar.watch(folders, {
    ignored: /(^|[\/\\])\..|(node_modules)|(\.git)/,
    persistent: true, ignoreInitial: true, depth: 4
  });
  watcher
    .on('add',    p => sendToRenderer('fs-change', { type: 'add',    path: p }))
    .on('change', p => sendToRenderer('fs-change', { type: 'change', path: p }))
    .on('unlink', p => sendToRenderer('fs-change', { type: 'delete', path: p }));
}

function sendToRenderer(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, data);
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────
function setupIPC() {
  // Open folder picker
  ipcMain.handle('pick-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'multiSelections'],
      title: 'Select folders for Forge context'
    });
    if (!result.canceled && result.filePaths.length > 0) {
      config.openFolders = [...new Set([...(config.openFolders||[]), ...result.filePaths])];
      saveConfig();
      watchFolders(config.openFolders);
      return result.filePaths;
    }
    return [];
  });

  // Remove folder from context
  ipcMain.handle('remove-folder', (_, folderPath) => {
    config.openFolders = (config.openFolders||[]).filter(f => f !== folderPath);
    saveConfig();
    watchFolders(config.openFolders);
    return config.openFolders;
  });

  // Read file
  ipcMain.handle('read-file', async (_, filePath) => {
    try {
      const stat = fs.statSync(filePath);
      if (stat.size > 5 * 1024 * 1024) return { error: 'File too large (>5MB)' };
      return { content: fs.readFileSync(filePath, 'utf8'), path: filePath };
    } catch (e) { return { error: e.message }; }
  });

  // Write file
  ipcMain.handle('write-file', async (_, { filePath, content }) => {
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content, 'utf8');
      return { success: true };
    } catch (e) { return { error: e.message }; }
  });

  // List directory
  ipcMain.handle('list-dir', async (_, dirPath) => {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      return entries
        .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules')
        .map(e => ({
          name: e.name,
          path: path.join(dirPath, e.name),
          isDir: e.isDirectory(),
          ext: e.isFile() ? path.extname(e.name) : null
        }));
    } catch (e) { return { error: e.message }; }
  });

  // Get full folder tree (shallow)
  ipcMain.handle('get-tree', async (_, rootPath) => {
    function buildTree(dir, depth = 0) {
      if (depth > 3) return [];
      try {
        return fs.readdirSync(dir, { withFileTypes: true })
          .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== '.git')
          .map(e => {
            const fullPath = path.join(dir, e.name);
            return {
              name: e.name, path: fullPath, isDir: e.isDirectory(),
              children: e.isDirectory() ? buildTree(fullPath, depth + 1) : []
            };
          });
      } catch { return []; }
    }
    return buildTree(rootPath);
  });

  // Memory operations
  ipcMain.handle('memory-get', () => memory);
  ipcMain.handle('memory-set', (_, { key, value }) => { memory[key] = { value, ts: Date.now() }; saveMemory(); return true; });
  ipcMain.handle('memory-delete', (_, key) => { delete memory[key]; saveMemory(); return true; });
  ipcMain.handle('memory-clear', () => { memory = {}; saveMemory(); return true; });
  ipcMain.handle('memory-search', (_, query) => {
    const q = query.toLowerCase();
    return Object.entries(memory)
      .filter(([k, v]) => k.toLowerCase().includes(q) || JSON.stringify(v).toLowerCase().includes(q))
      .map(([k, v]) => ({ key: k, ...v }));
  });

  // Config
  ipcMain.handle('config-get', () => config);
  ipcMain.handle('config-set', (_, updates) => { Object.assign(config, updates); saveConfig(); return config; });
  ipcMain.handle('get-open-folders', () => config.openFolders || []);

  // System info
  ipcMain.handle('system-info', () => ({
    platform: process.platform,
    arch: process.arch,
    homeDir: os.homedir(),
    desktopDir: app.getPath('desktop'),
    documentsDir: app.getPath('documents'),
    downloadsDir: app.getPath('downloads'),
    userDataDir: app.getPath('userData'),
  }));

  // Open in file explorer
  ipcMain.handle('reveal-in-explorer', (_, filePath) => shell.showItemInFolder(filePath));

  // Open external URL
  ipcMain.handle('open-url', (_, url) => shell.openExternal(url));
}

// ─── Window ───────────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900,
    minWidth: 900, minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: true,
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    show: false,
  });

  // Load the Forge web app
  mainWindow.loadURL('https://forge-sand-two.vercel.app');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Inject desktop context after load
    mainWindow.webContents.executeJavaScript(`
      window.__FORGE_DESKTOP__ = true;
      window.__FORGE_DESKTOP_VERSION__ = '1.0.0';
      console.log('[Forge Desktop] Context injected');
    `);
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  // Dev tools in dev mode
  if (process.env.NODE_ENV === 'development') mainWindow.webContents.openDevTools();

  setupMenu();
}

function setupMenu() {
  const template = [
    {
      label: 'Forge',
      submenu: [
        { label: 'About Forge AI', role: 'about' },
        { type: 'separator' },
        { label: 'Open Folder…', accelerator: 'CmdOrCtrl+O', click: () => mainWindow?.webContents.send('menu-action', 'pick-folder') },
        { label: 'New Chat', accelerator: 'CmdOrCtrl+N', click: () => mainWindow?.webContents.send('menu-action', 'new-chat') },
        { type: 'separator' },
        { label: 'Preferences', accelerator: 'CmdOrCtrl+,', click: () => mainWindow?.webContents.send('menu-action', 'settings') },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }] },
    { label: 'View', submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }, { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' }] },
    { label: 'Window', submenu: [{ role: 'minimize' }, { role: 'zoom' }] },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  loadMemory();
  loadConfig();
  setupIPC();
  createWindow();
  startWsBridge();
  watchFolders(config.openFolders || []);

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => { if (watcher) watcher.close(); if (wsServer) wsServer.close(); });
