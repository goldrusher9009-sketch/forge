# VIVA — Build Progress

**Last updated:** 2026-06-09
**Status:** ✅ Full stack complete — frontend + backend + database + Docker + deploy configs

---

## 📊 Module Status

| # | Module | Status | Path |
|---|--------|--------|------|
| 01 | **Onboarding / Auth** | ✅ Complete | `apps/web/app/auth/onboard/` |
| 02 | **HomeCanvas** — 5-ring life dashboard | ✅ Complete | `apps/web/app/home/` |
| 03 | **Feed** — Attention Economy | ✅ Complete | `apps/web/app/feed/` |
| 04 | **Messenger** — E2E encrypted | ✅ Complete | `apps/web/app/messages/` |
| 05 | **Dating** — ZK-Verified Match | ✅ Complete | `apps/web/app/dating/` |
| 06 | **AI Twin** — HyperAgent | ✅ Complete | `apps/web/app/twin/` |
| 07 | **Prediction Markets** | ✅ Complete | `apps/web/app/markets/` |
| 08 | **Health ZK Proof** | ✅ Complete | `apps/web/app/health/` |
| 09 | **YouToken + Marketplace** | ✅ Complete | `apps/web/app/token/` |
| 10 | **Audio Rooms** | ✅ Complete | `apps/web/app/rooms/` |

---

## 🏗️ Architecture

```
apps/
  web/                        ← Next.js 14 full app
    app/
      auth/onboard/           ← 5-step onboarding wizard
      home/                   ← HomeCanvas: 5-ring SVG dashboard
      feed/                   ← Attention economy feed
      messages/               ← E2E encrypted messenger
      dating/                 ← ZK-verified matching
      twin/                   ← AI Twin / HyperAgent
      markets/                ← Prediction markets
      health/                 ← ZK health proofs + rings
      token/                  ← YouToken bonding curve + marketplace
      rooms/                  ← V-gated live audio rooms
    components/
      layout/AppShell.tsx     ← Sidebar + mobile nav
    lib/
      store.ts                ← Zustand store + mock data
      utils.ts                ← Helpers
    styles/globals.css        ← Design system CSS vars
    tailwind.config.ts        ← Ring colors + typography
  mobile/                     ← React Native (existing scaffold)
backend/                      ← 11 microservices (scaffolded)
contracts/                    ← 5 Solidity contracts (scaffolded)
database/migrations/          ← 3 SQL migration files
```

---

## 🎨 Design System

- **Base:** `#04040A` void black
- **Paper:** `#F5F4F0` warm off-white
- **V-Score:** `#7C3AED` violet
- **Ring colors:**
  - Sleep `#7C3AED` violet
  - Nutrition `#0891B2` cyan
  - Activity `#059669` emerald
  - Social `#D97706` amber
  - Wealth `#E11D48` rose
- **Typography:** System fonts, editorial scale
- **Grid:** 12-col editorial, aside numbers, no card shadows
- **Noise grain:** body::after overlay, 0.4 opacity

---

## 🔑 Key Features Built

### HomeCanvas
- SVG 5-ring concentric system with tick marks, endpoint dots, glow filters
- Interactive hover state per ring with color highlight
- V-Score center badge with tier color
- Quick stats grid + quick action links
- AI Twin status widget

### Onboarding
- 5-step wizard: Welcome → Identity → Rings → Wallet → Ready
- Animated progress bar, step dots
- ZK identity handle claim
- Ring value sliders with live color feedback
- Wallet connection simulation
- V-Score initialization preview

### Feed / Attention Economy
- Attention earned counter, signal score, reach metrics
- Category filter chips
- Post composer with publish
- Engagement actions with hover reveal

### Messenger
- Thread list with unread badges
- Full message pane with E2E encryption label
- Real-time send, Enter shortcut
- ZK identity verified indicator

### Dating / Verified Match
- Editorial profile cards with compatibility %
- ZK badges (Health / Income / Location)
- Pass / Connect swipe actions
- Match animation overlay
- Matches tab

### AI Twin / HyperAgent
- L1/L2/L3 autonomy selector
- 6 task agents with status indicators
- MetaAgent chat interface with simulated responses
- Agent activity log with ring-color attribution
- Weekly ring impact chart

### Prediction Markets
- Market cards with probability bars
- Category filter, sort options
- Stake modal with YES/NO toggle
- Payout calculator
- Portfolio stats

### Health ZK
- Animated ring bars with tick marks
- ZK proof cards with SBT generation flow
- Health log tab
- Data input

### YouToken
- Token card with bonding curve SVG
- Mint flow
- Holders leaderboard
- Marketplace with buy modal

### Audio Rooms
- Live room list with V-Score gating
- Active room: animated waveform visualizer
- Mute/hand raise controls
- Listener gallery
- Upcoming rooms

---

## 🚀 To Run

```bash
cd apps/web
npm install
npm run dev
# → http://localhost:3000
```

App starts at `/auth/onboard` for first-time flow, then `/home` for HomeCanvas.

---

## 🖥️ Backend (apps/api)

| File | Purpose |
|---|---|
| `src/index.ts` | Express server + WebSocket |
| `src/routes/auth.ts` | Register / Login / JWT refresh |
| `src/routes/users.ts` | User profiles + search |
| `src/routes/feed.ts` | Posts + likes (cursor paginated) |
| `src/routes/messages.ts` | Threads + E2E messages |
| `src/routes/markets.ts` | Prediction market staking |
| `src/routes/health.ts` | Ring logs + ZK proof + SBT mint |
| `src/routes/tokens.ts` | Bonding curve token buy/mint |
| `src/routes/rooms.ts` | Audio rooms join/leave/mute |
| `src/routes/twin.ts` | AI agent tasks + chat |
| `src/routes/dating.ts` | Discover + match + pass |
| `src/ws/server.ts` | WebSocket: messages + rooms |
| `src/seed.ts` | Demo data seed |
| `prisma/schema.prisma` | Full PostgreSQL schema |

## 🚀 How to Run (Local)

```bash
# Terminal 1 — Database + API
docker compose up postgres -d --wait
cd apps/api && npm install
npx prisma generate
npx prisma migrate dev --name init
npx tsx src/seed.ts
npm run dev          # → http://localhost:4000

# Terminal 2 — Frontend
cd apps/web && npm install --legacy-peer-deps
npm run dev          # → http://localhost:3000
```

Demo: `demo@viva.app` / `demo1234`

## 🐳 Docker (Single Command)

```bash
docker compose build --parallel
docker compose up -d
# → http://localhost:3000
```

## ☁️ Deploy Online

- Frontend → `vercel` in `apps/web/`
- Backend → Railway (auto-detects `apps/api/Dockerfile`)
- Database → Supabase PostgreSQL

---

## 📋 Remaining (smart contracts)

Backend fully built (Node/Express/Prisma). Remaining optional:
- Solidity: VIVAToken deploy, YouTokenFactory, PredictionMarket (contracts scaffolded)
- ZK circuits: real health proof circuits (circom) — currently simulated
- LiveKit: real audio streaming for rooms
- Push notifications: FCM/APNS
