# Forge AI Desktop

Downloadable desktop app for Forge — with folder context, persistent memory, and Chrome browser integration. Like Manus or Claude Desktop, but for the Forge platform.

## Features

- **Folder Context** — Open any folder and Forge sees your files. Ask questions about your code, documents, or data.
- **Persistent Memory** — Forge remembers things across sessions. Stores notes, context, and preferences locally.
- **Chrome Bridge** — Install the companion extension to let Forge see your current browser tab, selected text, and page content.
- **File System Access** — Read, write, and browse files directly from the Forge chat interface.
- **Live File Watching** — Forge detects when files change and updates context automatically.

## Quick Start

### 1. Install dependencies
```bash
cd forge-desktop
npm install
```

### 2. Run in development
```bash
npm start
```

### 3. Build installers

**Windows (.exe installer)**
```bash
npm run build:win
```

**macOS (.dmg)**
```bash
npm run build:mac
```

**Linux (.AppImage)**
```bash
npm run build:linux
```

Installers appear in `dist/`.

---

## Chrome Extension Setup

1. Open Chrome → go to `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** → select the `chrome-extension/` folder
4. The ⚡ Forge icon appears in your toolbar
5. Start Forge Desktop first, then the extension auto-connects

When connected, the extension badge turns purple. Click it to send the current page to Forge.

---

## How It Works

```
Forge Desktop (Electron)
  ├── Loads forge-sand-two.vercel.app in a webview
  ├── Injects window.forgeDesktop API via preload.js
  ├── Opens WebSocket server on ws://127.0.0.1:27184
  └── Watches selected folders with chokidar

Chrome Extension
  ├── background.js connects to ws://127.0.0.1:27184
  ├── content.js extracts page text + selection
  └── popup.html shows connection status
```

The web app (`ForgeApp.tsx`) detects `window.forgeDesktop` and unlocks:
- Folder picker button in Studio sidebar
- File tree panel
- Memory viewer
- "Send to Forge" from browser extension

---

## Architecture

| File | Purpose |
|------|---------|
| `src/main.js` | Electron main process — window, IPC, WebSocket bridge, file watcher |
| `src/preload.js` | Secure bridge between Electron and web app |
| `chrome-extension/` | Chrome extension for browser integration |

## Security

- All file operations are sandboxed to user-selected folders
- WebSocket bridge only listens on `127.0.0.1` (localhost only)
- No remote code execution — the web app makes all AI calls via the Forge API
- Token stored in Electron's userData directory (encrypted by OS keychain on macOS/Windows)
