# Forge AI Browser Extension

Forge AI sidebar on every webpage — no desktop app required. Works standalone.

## Features
- ⚡ **Floating button** on every page — click to open Forge AI sidebar
- 💬 **In-page sidebar** — chat with your AI agent without leaving the page
- 🔍 **Page context** — Forge automatically knows what page you're on, the title, and any text you've selected
- ⌨️ **Keyboard shortcut** — `Alt+Shift+F` to toggle sidebar
- 🔑 **No account required to install** — just bring your own API keys in Forge settings

## Supported Browsers

| Browser | Install Method |
|---------|---------------|
| **Chrome** | Load unpacked / Chrome Web Store |
| **Edge** | Load unpacked / Edge Add-ons Store |
| **Firefox** | Load temporary / Firefox Add-ons (AMO) |
| **Safari** | Xcode conversion (see below) |
| **Brave** | Same as Chrome |
| **Opera** | Same as Chrome |

---

## Install — Chrome / Edge / Brave / Opera

### Method 1: Load Unpacked (Developer Mode)
1. Download/clone this folder
2. Open **chrome://extensions** (or edge://extensions)
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the `forge-extension/` folder
6. The ⚡ Forge button appears on every page

### Method 2: Build ZIP for Store submission
```bash
npm install
npm run build:chrome
# produces dist/forge-chrome.zip
```

---

## Install — Firefox

### Method 1: Temporary (for testing)
1. Open **about:debugging#/runtime/this-firefox**
2. Click **Load Temporary Add-on**
3. Select `manifest.firefox.json` (or the zip from `dist/forge-firefox.zip`)

### Method 2: Build for Firefox Add-ons Store
```bash
npm install
npm run build:firefox
# produces dist/forge-firefox.zip
# Submit to https://addons.mozilla.org/
```

> **Note:** Firefox uses `manifest.firefox.json` (MV2 with background scripts).
> The build script automatically uses the correct manifest.

---

## Install — Safari

Safari requires converting the extension using Xcode (Mac only):

```bash
# Requires Xcode installed on Mac
xcrun safari-web-extension-converter forge-extension/ \
  --app-name "Forge AI" \
  --bundle-identifier com.forgeai.extension \
  --swift
```

This generates an Xcode project. Open it, build and run — Safari will prompt to enable the extension in Safari > Preferences > Extensions.

---

## Build Icons

If you want to regenerate the icons:
```bash
npm install
npm run icons
```

---

## How It Works

1. **Content script** (`content.js`) injects a floating ⚡ button and sidebar iframe on every page
2. **Background script** (`background.js`) tracks tab URLs and captures page context
3. **Sidebar** loads `forge-sand-two.vercel.app` with page context passed as URL params
4. Forge uses the page URL, title, and selected text to give contextual AI responses

No WebSocket or desktop app needed — the extension talks directly to the Forge web app.

---

## Files

```
forge-extension/
├── manifest.json          # Chrome/Edge/Brave MV3
├── manifest.firefox.json  # Firefox MV2
├── background.js          # Chrome service worker
├── background.firefox.js  # Firefox background script
├── content.js             # Injected on every page
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic
├── build.js               # Build script (produces ZIPs)
├── generate-icons.js      # Icon generation (requires sharp)
├── icons/                 # PNG icons (16, 32, 48, 128)
└── dist/                  # Built ZIPs (after npm run build:all)
    ├── forge-chrome.zip
    └── forge-firefox.zip
```
