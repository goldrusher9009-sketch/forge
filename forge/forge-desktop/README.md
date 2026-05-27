# Forge AI Desktop

Native desktop app for Windows, macOS and Linux. Wraps the Forge web app with local superpowers.

## Features
- 📁 **Local folder access** — open any folder, browse file tree, inject file contents into chat
- 🧠 **Persistent memory** — key-value store that survives across sessions
- 🌐 **Browser bridge** — Chrome extension sends current page context to the desktop app
- 🖥️ **Native menus** — Cmd/Ctrl+O to open folder, Cmd/Ctrl+N for new chat
- 🔄 **File watcher** — detects file changes in open folders in real time
- 🔒 **Local WebSocket server** — bridge on `ws://127.0.0.1:27184`

## Supported Platforms

| Platform | Status |
|----------|--------|
| **Windows** x64 | ✅ |
| **Windows** ARM64 | ✅ |
| **macOS** Universal (Intel + Apple Silicon) | ✅ |
| **Linux** x64 | ✅ |

---

## Install (Pre-built)

Download from GitHub Releases:

| Platform | File |
|----------|------|
| Windows | `Forge-AI-Setup-x.x.x-x64.exe` |
| macOS | `Forge-AI-x.x.x-universal.dmg` |
| Linux | `Forge-AI-x.x.x-x64.AppImage` |

---

## Build from Source

```bash
cd forge-desktop
npm install
```

### Windows
```bash
npm run build:win          # x64 NSIS installer + portable
npm run build:win:arm      # ARM64
```

### macOS
```bash
npm run build:mac          # Universal binary (Intel + Apple Silicon)
npm run build:mac:x64      # Intel only
npm run build:mac:arm      # Apple Silicon only
```

> **Mac code signing:** Set `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD` for notarization.

### Linux
```bash
npm run build:linux        # AppImage + .deb
```

### All platforms
```bash
npm run build:all
```

---

## Development

```bash
npm start      # Run in production mode
npm run dev    # Run with DevTools open
```

---

## How It Works

1. App loads `https://forge-sand-two.vercel.app` in an Electron window
2. `preload.js` exposes `window.forgeDesktop` API via contextBridge
3. The web app detects `window.forgeDesktop` and shows the `🖥️ Desktop` tab
4. Local folder context, memory, and browser events flow through IPC

## WebSocket Bridge (for desktop Chrome extension)

When running, starts `ws://127.0.0.1:27184`.  
Load `chrome-extension/` as an unpacked extension to connect browser → desktop → Forge.

For a **standalone** browser extension (no desktop app), use `../forge-extension/` instead.

---

## File Structure

```
forge-desktop/
├── src/
│   ├── main.js                    # Main process
│   └── preload.js                 # window.forgeDesktop API
├── assets/
│   ├── icon.ico                   # Windows
│   ├── icon.icns                  # macOS
│   ├── icon.png                   # Linux
│   ├── dmg-background.png         # macOS DMG background
│   └── entitlements.mac.plist     # Mac hardened runtime
├── chrome-extension/              # Desktop bridge extension
└── package.json
```
