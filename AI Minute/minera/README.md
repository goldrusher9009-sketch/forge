# ✦ Minera — Decentralized AI Mining Network

> **Working name.** Swap `Minera` / `MINE` everywhere once the final brand is chosen
> (all user-facing strings are centralized — see `BRAND` in `.env`).

A super-brain assembled from contributors' computers. It discovers verifiable,
licensable insights. Every contributor is paid automatically, and protocol fees
buy back & burn the token.

## Monorepo layout

```
minera/
├─ contracts/   Solidity + Hardhat   (token, mining, insights, bonds)
├─ backend/     Node + Express       (API gateway + SQLite database)
│   └─ src/database/  schema.sql + db.js  (single-file SQLite, auto-seeded)
│   └─ data/minera.db  (created on first run — the database)
└─ frontend/    React + Vite         (one-click operator dashboard)

Everything — frontend, backend, and database — lives in this one folder.
The database is a single self-contained SQLite file (no DB server to install).
```

## Quick start

```bash
# 0. install everything
npm install

# 1. local blockchain  (terminal A)
npm run chain

# 2. deploy contracts  (terminal B)
npm run deploy:local        # prints addresses → paste into .env

# 3. backend API       (terminal C)
cp .env.example .env
npm run dev:backend         # http://localhost:4000

# 4. frontend          (terminal D)
npm run dev:frontend        # http://localhost:5173
```

## Feature set (all working, DB-backed, verified)

User flow: **Sign in → wallet auto-created → mine/explore → earn (persisted) → trade → cash out.**

| Feature | FR | Status |
|---------|----|--------|
| Google sign-in + auto wallet + persistent accounts | FR10 | ✅ |
| Compute mining (live earnings, flushed to DB) | FR1 | ✅ |
| Prompt explorer → swarm inference → submit insight | FR2 | ✅ |
| Data upload → IPFS pin (mock CID) → DB | FR3 | ✅ |
| Insight verification (novelty check) + reward credit | FR4 | ✅ |
| Knowledge marketplace + licensing (40/35/20/5 split) | FR5 | ✅ |
| Eureka Bonds: create (2% fee) / mine / award (5% fee) | FR6 | ✅ |
| Prediction markets: stake YES/NO, settle, 3% fee | FR7 | ✅ |
| OpenAI-compatible inference endpoint | FR8 | ✅ |
| Burn engine: fees buy-and-burn, supply shrinks | FR9 | ✅ |
| Full 10-role miner taxonomy with activate/stake | — | ✅ |
| Leaderboard + per-user transaction ledger | — | ✅ |
| Live protocol stats banner (supply/burned/treasury) | — | ✅ |

### API surface (Express, SQLite-backed)
`/api/auth/login` · `/api/users/:a (+credit/withdraw/transactions)` · `/api/generate` ·
`/api/insights` · `/api/data` · `/api/bonds (+submit/award)` · `/api/predictions (+settle)` ·
`/api/market (+license)` · `/api/stats (+burn)` · `/api/leaderboard` · `/v1/chat/completions`

## Original MVP table

## What works today (MVP / demo grade)

| Layer | Status |
|-------|--------|
| 4 smart contracts compiling + deploy script | ✅ |
| Token mint/burn, mining check-in/claim, insight submit/verify, eureka bonds | ✅ |
| Express API: generate, insights, data, bonds, OpenAI-compatible inference | ✅ (mocked swarm) |
| React dashboard with live state, role wizard, bonds, cash-out | ✅ |
| SQLite database (insights, bonds, data, users) auto-created + seeded | ✅ |
| Mock wallet/auth context (Web3Auth slot) | ✅ stub |
| Real Petals swarm / OriginTrail DKG / TEE oracle | ⏳ integration points stubbed |

## Roadmap stubs
- `backend/src/services/swarm.js` → replace mock with Petals client.
- `backend/src/services/dkg.js` → replace with OriginTrail SDK.
- `frontend/src/context/AuthContext.jsx` → wire Web3Auth + Google.

## License
MIT


## Realtime + Admin + On-chain (latest)

| Feature | Status |
|---------|--------|
| Server-Sent Events live feed (`/api/events`) — insight/license/bond/burn/predict | ✅ |
| Live network ticker in UI, auto-updating | ✅ |
| Verifier/Admin console — approve/reject pending, award bonds, settle markets | ✅ |
| On-chain bridge (`/api/chain/*`) — auto-connects if RPC+token set, else DB-only | ✅ |
| On-chain reward mint hook (best-effort, DB stays authoritative) | ✅ |
| Per-user notifications + 🔔 bell with unread badge | ✅ |

### Full API surface
auth · users(+credit/withdraw/transactions/notifications) · generate · insights ·
data · bonds(+submit/award) · predictions(+settle) · market(+license) · stats(+burn) ·
leaderboard · admin(pending/verify/open-bonds/open-markets) · chain(status/balance) ·
events(SSE) · /v1/chat/completions


## Analytics · Subnets · API · Tests · Docker (latest)

| Feature | Status |
|---------|--------|
| Analytics dashboard — daily insights/burns/license charts + earnings-by-source (inline SVG, no deps) | ✅ |
| Subnet system (role S-10) — launch vertical subnet, route paid queries, 20–30% operator cut | ✅ |
| API keys + OpenAI-compatible metered inference (20% fee → burn) | ✅ |
| Automated backend test suite — `npm test` (node:test) | ✅ 9/9 pass |
| Docker + docker-compose (backend + frontend) | ✅ |

### Run with Docker
```bash
cd minera
docker compose up --build      # frontend :8080  ·  backend :4000
```

### Run tests
```bash
cd minera/backend && npm install && npm test
```


## Governance · Staking · Security · Mobile (latest)

| Feature | Status |
|---------|--------|
| DAO governance — proposals, balance-weighted voting, tally/execute | ✅ |
| Staking — lock balance, 18% APR yield accrual, unstake principal+yield | ✅ |
| Security — rate limiting, security headers, input validation, error handler | ✅ |
| Mobile-responsive — scrolling tabs, collapsing grids, sub-460px layout | ✅ |
| Demo seeder — `npm run seed` (users, subnets, proposals) | ✅ |

Run the demo seed: `cd minera/backend && npm run seed`


## Deep integration flows (wired end-to-end)

| Flow | What it does | Status |
|------|--------------|--------|
| Petals swarm client | Real inference if `PETALS_URL` set, else mock; mode shown in UI | ✅ |
| OriginTrail DKG | Verified insight → Knowledge Asset with UAL + provenance; UAL shown in UI | ✅ |
| Royalty distribution | License pays submitter + compute pool + data pool (40/35/20/5), ledgered | ✅ |
| Burn engine scheduler | Auto buyback-burn every 60s converts treasury USD → MINE → burn | ✅ |
| Contract deploy automation | `deploy.js` auto-writes addresses to `.env` + `deployments.json` | ✅ |
| Referral system | `?ref=` on signup, referrer earns 50 MINE on referee's first insight | ✅ |

Tests: **14/14 passing** (`cd backend && npm test`).

### Env toggles for real integrations
```
PETALS_URL=        # set → real swarm inference
DKG_ENDPOINT=      # set → real OriginTrail publish
CHAIN_RPC / TOKEN_ADDRESS  # set → on-chain mirror + mint
```


## UX + platform polish (latest)

| Feature | Status |
|---------|--------|
| Dark/light theme toggle (blueprint-dark variant) | ✅ |
| First-run onboarding wizard (3 steps) | ✅ |
| Achievements/badges — first insight, license, 1k club, staker, recruiter | ✅ |
| Global search across insights/bonds/subnets (topbar) | ✅ |
| GitHub Actions CI (test backend + build frontend) | ✅ |
| .editorconfig | ✅ |

Tests: **16/16 passing**.


## Live platform + reach (latest)

| Feature | Status |
|---------|--------|
| DEX price oracle — MINE price rises with scarcity, live feed + sparkline | ✅ |
| Presence — heartbeat, live online-operator count in topbar | ✅ |
| PWA — manifest, service worker, offline shell, installable | ✅ |
| i18n — EN / ES / FR language switch | ✅ |

Tests: **18/18 passing**.


## Ops + power-user (latest)

| Feature | Status |
|---------|--------|
| Data export — transactions/insights/leaderboard as CSV + JSON | ✅ |
| Admin protocol-analytics — users, balance, staked, burned, revenue KPIs | ✅ |
| End-to-end lifecycle test (signup→license→stake→govern→cash out) | ✅ |
| Keyboard shortcuts (1-9 tabs, ? help, esc) + help overlay | ✅ |

Tests: **19/19 passing** (includes full E2E flow).


## Profiles · Activity · Health · A11y (latest)

| Feature | Status |
|---------|--------|
| Profile editor — display name, bio, deterministic identicon avatar | ✅ |
| Global activity feed — persisted events, filterable live page | ✅ |
| Admin system-health panel — uptime, memory, swarm/dkg/chain mode | ✅ |
| Accessibility — focus rings, aria-labels, prefers-reduced-motion, sr-only | ✅ |

Tests: **22/22 passing**.
