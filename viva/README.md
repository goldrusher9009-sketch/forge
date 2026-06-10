# VIVA — Life Operating System

> Sovereign data. Sovereign life.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, TailwindCSS, Framer Motion, Zustand |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL 16 |
| Auth | JWT (access 15m + refresh 30d) |
| Realtime | WebSocket (ws) |
| Deploy | Vercel (web) + Railway (api) + Supabase (db) |

---

## Option A — Local Dev (fastest)

### Prerequisites
- Node 20+
- Docker Desktop running

### Steps

```bash
# 1. Start Postgres via Docker
docker compose up postgres -d --wait

# 2. Setup API
cd apps/api
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npx tsx src/seed.ts

# 3. Start API (keep terminal open)
npm run dev
# → http://localhost:4000

# 4. New terminal — start frontend
cd ../web
npm install --legacy-peer-deps
npm run dev
# → http://localhost:3000
```

**Demo login:** `demo@viva.app` / `demo1234`

---

## Option B — Full Docker Stack

```bash
docker compose build --parallel
docker compose up -d
```

→ http://localhost:3000

---

## Option C — Deploy Online

### Frontend → Vercel

```bash
cd apps/web
npx vercel
# Set NEXT_PUBLIC_API_URL = https://your-api.railway.app
```

### Backend → Railway

1. railway.app/new → Deploy from GitHub → `apps/api`
2. Set env vars:
   ```
   DATABASE_URL=<supabase-url>
   JWT_ACCESS_SECRET=<32-char-random>
   JWT_REFRESH_SECRET=<32-char-random>
   FRONTEND_URL=https://your-app.vercel.app
   NODE_ENV=production
   ```

### Database → Supabase

1. supabase.com/dashboard/new → Create project
2. Settings → Database → copy connection string
3. Paste as `DATABASE_URL` in Railway

---

## API Routes

```
POST  /api/auth/register
POST  /api/auth/login
POST  /api/auth/refresh
GET   /api/auth/me

GET   /api/users/:handle
PATCH /api/users/me

GET   /api/feed
POST  /api/feed
POST  /api/feed/:id/like

GET   /api/messages/threads
POST  /api/messages/threads
GET   /api/messages/threads/:id
POST  /api/messages/threads/:id

GET   /api/markets
POST  /api/markets/:id/stake

GET   /api/health/logs
POST  /api/health/logs
POST  /api/health/proofs/generate
POST  /api/health/proofs/:id/mint-sbt

GET   /api/tokens
POST  /api/tokens/create
POST  /api/tokens/:id/mint
POST  /api/tokens/:id/buy

GET   /api/rooms
POST  /api/rooms
POST  /api/rooms/:id/join

GET   /api/twin/tasks
POST  /api/twin/tasks
POST  /api/twin/chat

GET   /health
WS    /ws?token=<jwt>
```

---

## Project Structure

```
viva/
├── apps/
│   ├── web/              ← Next.js 14 frontend
│   │   ├── app/          ← 10 module routes
│   │   ├── components/   ← AppShell layout
│   │   ├── lib/          ← store.ts + api.ts
│   │   └── styles/       ← Design system CSS
│   └── api/              ← Express + Prisma backend
│       ├── src/
│       │   ├── routes/   ← All API handlers
│       │   ├── middleware/
│       │   ├── lib/      ← prisma + jwt
│       │   └── ws/       ← WebSocket server
│       └── prisma/       ← Schema + migrations
├── docker-compose.yml
├── scripts/
│   ├── dev.sh
│   └── docker-start.sh
└── PROGRESS.md
```

---

## Modules

| # | Module | Route |
|---|---|---|
| 1 | Onboarding | `/auth/onboard` |
| 2 | HomeCanvas | `/home` |
| 3 | Feed | `/feed` |
| 4 | Messenger | `/messages` |
| 5 | Dating | `/dating` |
| 6 | AI Twin | `/twin` |
| 7 | Markets | `/markets` |
| 8 | Health ZK | `/health` |
| 9 | YouToken | `/token` |
| 10 | Audio Rooms | `/rooms` |
