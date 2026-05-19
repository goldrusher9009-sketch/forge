// Forge Desktop — Preload Script
// Exposes safe IPC bridge to the renderer (web app)

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('forgeDesktop', {
  // Identity
  isDesktop: true,
  version: '1.0.0',

  // Folder context
  pickFolder: () => ipcRenderer.invoke('pick-folder'),
  removeFolder: (path) => ipcRenderer.invoke('remove-folder', path),
  getOpenFolders: () => ipcRenderer.invoke('get-open-folders'),

  // File system
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', { filePath, content }),
  listDir: (dirPath) => ipcRenderer.invoke('list-dir', dirPath),
  getTree: (rootPath) => ipcRenderer.invoke('get-tree', rootPath),
  revealInExplorer: (filePath) => ipcRenderer.invoke('reveal-in-explorer', filePath),

  // Memory
  memoryGet: () => ipcRenderer.invoke('memory-get'),
  memorySet: (key, value) => ipcRenderer.invoke('memory-set', { key, value }),
  memoryDelete: (key) => ipcRenderer.invoke('memory-delete', key),
  memoryClear: () => ipcRenderer.invoke('memory-clear'),
  memorySearch: (query) => ipcRenderer.invoke('memory-search', query),

  // Config
  configGet: () => ipcRenderer.invoke('config-get'),
  configSet: (updates) => ipcRenderer.invoke('config-set', updates),

  // System
  systemInfo: () => ipcRenderer.invoke('system-info'),
  openUrl: (url) => ipcRenderer.invoke('open-url', url),

  // Event listeners
  onFsChange: (callback) => {
    ipcRenderer.on('fs-change', (_, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('fs-change');
  },
  onBrowserEvent: (callback) => {
    ipcRenderer.on('browser-event', (_, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('browser-event');
  },
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (_, action) => callback(action));
    return () => ipcRenderer.removeAllListeners('menu-action');
  },
});
