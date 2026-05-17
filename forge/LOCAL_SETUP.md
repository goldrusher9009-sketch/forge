# Forge — Local Development Setup

Get the full stack running locally in under 5 minutes. No Docker, no Postgres, no Redis required.

## Prerequisites

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **npm 9+** (comes with Node 18)

That's it.

## Quick start

Open a terminal in the `forge/` folder, then:

```bash
# 1. Install all dependencies (one-time)
bash setup.sh

# 2. Start both servers
bash start.sh
```

Then open **http://localhost:3001** in your browser.

Default login:
- **Email:** `admin@forge.local`
- **Password:** `Admin1234!`

---

## What runs where

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3001 | Next.js 14 app (forge-web-studio) |
| Backend API | http://localhost:3000/api | Express + SQLite (forge-platform) |
| Health check | http://localhost:3000/health | Backend status |

---

## Manual start (two terminals)

If you prefer separate terminals:

**Terminal 1 — Backend:**
```bash
cd forge-platform
npm run dev
# Starts on port 3000, creates forge.db automatically
```

**Terminal 2 — Frontend:**
```bash
cd forge-web-studio
npm run dev -- --port 3001
# Open http://localhost:3001
```

---

## Environment variables

### `forge-platform/.env`
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=forge-local-dev-secret-at-least-32-chars
JWT_EXPIRES_IN=15m
REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3001
DB_PATH=./forge.db
```

### `forge-web-studio/.env.local`
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
NEXT_PUBLIC_ENABLE_AGENT_CREATION=true
NEXT_PUBLIC_ENABLE_WORKFLOW_CREATION=true
NEXT_PUBLIC_ENABLE_QUEUE_MONITORING=true
NEXT_PUBLIC_ENABLE_HISTORY_TRACKING=true
```

---

## Running tests

```bash
cd forge-platform
npm test
```

Tests use a separate `forge-test.db` that is deleted after the run. Covers:
- Register (valid, duplicate email, bad password, bad email)
- Login (valid, wrong password, unknown user)
- Protected routes (with/without/bad token)
- Agents CRUD (create, list, get, update, delete)
- Dashboard stats
- Logout

---

## API endpoints

### Auth (no token required)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login → returns accessToken + sets refresh cookie |
| POST | `/api/auth/refresh` | Rotate tokens (uses httpOnly cookie) |
| POST | `/api/auth/logout` | Clear tokens |

### Authenticated (send `Authorization: Bearer <token>`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/profile` | Get current user |
| PUT | `/api/profile` | Update name |
| POST | `/api/password/change` | Change password |
| GET | `/api/agents` | List agents |
| POST | `/api/agents` | Create agent |
| GET | `/api/agents/:id` | Get agent |
| PUT | `/api/agents/:id` | Update agent |
| DELETE | `/api/agents/:id` | Delete agent |
| GET | `/api/workflows` | List workflows |
| POST | `/api/workflows` | Create workflow |
| GET | `/api/workflows/:id` | Get workflow |
| DELETE | `/api/workflows/:id` | Delete workflow |
| GET | `/api/dashboard` | Stats (agents, tasks, workflows) |
| GET | `/api/queue` | Queued tasks |
| GET | `/api/history` | Task history |

### Admin only
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/users` | List all users |

---

## Authentication flow

```
Login → accessToken (15m) + refreshToken httpOnly cookie (7d)
         ↓
All API calls: Authorization: Bearer <accessToken>
         ↓
Token expires → useApi hook auto-calls /api/auth/refresh
         ↓
New accessToken issued, old refreshToken rotated
         ↓
Refresh fails → redirect to /login
```

---

## Database

SQLite file at `forge-platform/forge.db` — created automatically on first run.

Tables: `users`, `refresh_tokens`, `agents`, `workflows`, `tasks`

To reset: `rm forge-platform/forge.db` then restart the backend.

---

## Next steps

1. **Deployment** — Dockerize + deploy to Railway/Render/Fly.io
2. **Postgres** — Set `DATABASE_URL` env var and swap `better-sqlite3` for `pg`/`Drizzle`
3. **Email verification** — Wire SendGrid/Resend to the register flow
4. **Stripe billing** — Connect the billing routes module (5-BILLING_ROUTES_MODULE.rs or JS equivalent)
