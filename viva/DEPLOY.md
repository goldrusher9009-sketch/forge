# VIVA — Deploy Guide

## Step 1: Push to GitHub

Open PowerShell in `C:\Users\teste\OneDrive\Documents\Claude\Projects\viva` and run:

```powershell
git init -b main
git config user.email "goldrusher9009@gmail.com"
git config user.name "VIVA"
git add -A
git commit -m "feat: viva platform full stack"
git remote add origin https://github.com/goldrusher9009/viva-platform.git
git push -u origin main --force
```

> If the repo doesn't exist yet: go to https://github.com/new → name it `viva-platform` → private → Create (no README) → then push above.

---

## Step 2: Deploy Backend → Railway

1. Go to https://railway.app → New Project → Deploy from GitHub repo → pick `viva-platform`
2. Set **Root Directory**: `apps/api`
3. Add environment variables (Settings → Variables):
   ```
   DATABASE_URL      = (from Supabase or Railway Postgres)
   JWT_SECRET        = your-secret-min-32-chars
   JWT_REFRESH_SECRET = your-refresh-secret
   FRONTEND_URL      = https://viva-platform.vercel.app
   NODE_ENV          = production
   ```
4. Railway auto-detects Node + runs `npm run build` then `node dist/index.js`
5. Copy the Railway URL (e.g. `https://viva-api.up.railway.app`)

**Add Postgres on Railway:**
- New Service → Database → PostgreSQL → copy the `DATABASE_URL` into API variables

---

## Step 3: Deploy Frontend → Vercel

1. Go to https://vercel.com → Add New Project → Import `viva-platform`
2. Set **Root Directory**: `apps/web`
3. Framework: Next.js (auto-detected)
4. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL  = https://viva-api.up.railway.app
   NEXT_PUBLIC_WS_URL   = wss://viva-api.up.railway.app
   ```
5. Deploy → get URL (e.g. `https://viva-platform.vercel.app`)
6. Go back to Railway → update `FRONTEND_URL` to the Vercel URL → redeploy

---

## Step 4: Local Dev

```powershell
# Terminal 1 — backend
cd apps\api
copy .env.example .env   # fill in values
npm install
npm run db:generate
npm run db:migrate
npm run dev

# Terminal 2 — frontend
cd apps\web
copy .env.example .env.local  # set NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev
```

Visit http://localhost:3000

---

## One-click deploy script

```powershell
.\deploy.ps1
```

Requires: `npm i -g @railway/cli vercel` and login to both.
