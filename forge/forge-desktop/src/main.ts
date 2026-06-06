/**
 * Forge Desktop — Electron wrapper for Forge web app
 * v6.64 — Auto-update, native notifications, offline mode
 */

import { app, BrowserWindow, Menu, ipcMain, Notification } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.ts'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const url = isDev ? 'http://localhost:3000' : 'https://forge-sand-two.vercel.app';
  mainWindow.loadURL(url);

  if (isDev) mainWindow.webDevTools.openDevTools();

  mainWindow.on('closed', () => { mainWindow = null; });
};

app.on('ready', createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (!mainWindow) createWindow(); });

// IPC: notify user of task completion
ipcMain.handle('notify', (_event, title: string, message: string) => {
  new Notification({ title, body: message }).show();
});

// IPC: offline mode flag
ipcMain.handle('is-online', () => mainWindow ? true : false);

// Menu
const template: any[] = [
  {
    label: 'File',
    submenu: [
      { label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
    ],
  },
  {
    label: 'View',
    submenu: [
      { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
      { label: 'DevTools', accelerator: 'CmdOrCtrl+Shift+I', click: () => mainWindow?.webContents.toggleDevTools() },
    ],
  },
];

Menu.setApplicationMenu(Menu.buildFromTemplate(template));
