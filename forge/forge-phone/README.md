# Forge Phone Agent

AI that controls your entire phone — browse the web, reply to texts, use WhatsApp, navigate maps, and anything else you can do on a phone.

## How it works

```
User gives a goal
       ↓
App captures screenshot of current screen
       ↓
Screenshot + goal + action history → Forge Backend AI
       ↓
AI returns next action: { action: "tap", args: { x: 450, y: 320, element: "Send button" } }
       ↓
Android Accessibility Service executes the tap
       ↓
Repeat until goal is complete
```

## Architecture

```
forge-phone/
├── App.tsx                           # React Native UI — goal input, step viewer
├── src/
│   ├── ForgeAgent.ts                 # Core agent loop — calls backend, manages state
│   └── config.ts                     # Types and API URL config
├── android/app/src/main/java/
│   └── com/forge/phoneagent/
│       ├── ForgeAccessibilityService.kt   # Android Accessibility Service — real phone control
│       └── ForgeModule.kt                 # React Native ↔ Android bridge
└── app.json                          # Expo config
```

## Backend

The AI brain runs on Forge's backend:
- `POST /api/phone-agent/action` — takes screenshot + goal → returns next action
- `POST /api/phone-agent/session` — create tracking session
- `GET /api/phone-agent/sessions` — list past sessions

Uses `claude-sonnet-4-5` with vision for screenshot analysis.

## Setup

### Android (Full control)

1. Install the APK on your Android device
2. Go to **Settings → Accessibility → Forge Phone Agent → Enable**
3. Open the app, enter your Forge token, give it a goal
4. Watch the AI control your phone

### Demo Mode (No accessibility service needed)

1. Run the app with `expo start`
2. Toggle "Demo mode" ON
3. AI plans every step but doesn't execute — shows you what it would do

## What it can do

- 💬 **WhatsApp** — read messages, reply, send to contacts
- 📱 **SMS** — reply to texts, send new messages  
- 🌐 **Browser** — search Google, browse websites, fill forms
- 📧 **Gmail** — read emails, compose replies
- 📍 **Maps** — search locations, start navigation
- 🎵 **Spotify/Music** — play songs, skip tracks
- 📷 **Camera** — take photos, record video
- ⏰ **Clock/Alarms** — set timers, create alarms
- 📞 **Calls** — dial numbers, answer calls
- 📋 **Any app** — if a human can tap it, so can the AI

## Limitations

- **iOS**: Apple restricts cross-app automation. Full control requires TestFlight enterprise build or jailbreak. Shortcuts integration available for basic tasks.
- **Screen reader apps** (banking, etc.) sometimes block accessibility services for security
- Vision quality depends on screen resolution and lighting

## Building the APK

```bash
cd forge-phone
npm install
npx eas build --platform android --profile production
```

Requires [EAS CLI](https://docs.expo.dev/build/setup/) and an Expo account.
