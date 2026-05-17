# Forge — Deploy to Production

Backend → Railway | Frontend → Vercel  
Two commands each. Done in under 10 minutes.

---

## 1. Push to GitHub (one-time)

```bash
# In the forge/ folder:
git init
git add .
git commit -m "Initial Forge Platform release"

# Create a repo at github.com/new, then:
git remote add origin https://github.com/YOUR_USERNAME/forge.git
git branch -M main
git push -u origin main
```

---

## 2. Deploy Backend to Railway

### Option A — Railway Dashboard (easiest)
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Select your `forge` repo
3. Set **Root Directory** to `forge-platform`
4. Railway auto-detects Node.js and runs `npm install && npm run build` then `node dist/index.js`
5. Add these environment variables in Railway → Variables:

```
PORT=3000
NODE_ENV=production
JWT_SECRET=<generate: openssl rand -hex 32>
JWT_EXPIRES_IN=15m
REFRESH_EXPIRES_IN=7d
FRONTEND_URL=https://YOUR_VERCEL_URL.vercel.app
DB_PATH=/data/forge.db
```

6. Enable a **Volume** at `/data` (Railway → Storage → Add Volume → mount path `/data`)
7. Copy the Railway URL (e.g. `https://forge-platform-production.up.railway.app`)

### Option B — Railway CLI
```bash
npm install -g @railway/cli
railway login
cd forge-platform
railway init        # creates project
railway up          # deploys
railway variables set JWT_SECRET=$(openssl rand -hex 32) NODE_ENV=production DB_PATH=/data/forge.db
```

---

## 3. Deploy Frontend to Vercel

### Option A — Vercel Dashboard (easiest)
1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select your `forge` repo
3. Set **Root Directory** to `forge-web-studio`
4. Add environment variable:
```
NEXT_PUBLIC_API_BASE_URL=https://YOUR_RAILWAY_URL.up.railway.app/api
```
5. Deploy → Vercel gives you a URL like `https://forge-web-studio.vercel.app`
6. Go back to Railway and set `FRONTEND_URL=https://forge-web-studio.vercel.app`

### Option B — Vercel CLI
```bash
npm install -g vercel
cd forge-web-studio
vercel --prod
# When prompted, set NEXT_PUBLIC_API_BASE_URL to your Railway URL
```

---

## 4. Verify

```bash
# Health check
curl https://YOUR_RAILWAY_URL.up.railway.app/health
# → {"status":"ok","timestamp":"..."}

# Login
curl -X POST https://YOUR_RAILWAY_URL.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@forge.local","password":"Admin1234!"}'
# → {"success":true,"data":{"accessToken":"...",...}}
```

Then open your Vercel URL and log in with `admin@forge.local` / `Admin1234!`

---

## Default Credentials

| Field | Value |
|-------|-------|
| Email | `admin@forge.local` |
| Password | `Admin1234!` |

> Change the admin password immediately after first login in production.
