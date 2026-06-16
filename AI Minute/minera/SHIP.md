# Ship Minera — GitHub + Vercel

Run these on YOUR computer (PowerShell), inside the `minera` folder.
You're already logged into GitHub + Vercel, so this is copy-paste.

## 1. Push to GitHub (PRIVATE)
1. Go to https://github.com/new
2. Name it `minera`
3. **⚠️ Select "Private"** (not Public)
4. Do NOT add a README, .gitignore, or license (keep it empty)
5. Create repository, then run:

```powershell
cd "C:\Users\teste\OneDrive\Documents\Claude\Projects\AI Minute\minera"
git init
git add -A
git commit -m "Minera v0.1.0"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/minera.git
git push -u origin main
```

### Alternative: GitHub CLI (creates it private in one step)
```powershell
gh repo create minera --private --source . --remote origin --push
```

## 2. Deploy the frontend to Vercel
The frontend is a Vite app in `frontend/`. Two ways:

### A) Vercel dashboard (easiest)
1. vercel.com → Add New → Project → import your `minera` repo.
2. Set **Root Directory** = `frontend`.
3. Framework preset: **Vite**. Build: `npm run build`. Output: `dist`.
4. Deploy.

### B) Vercel CLI
```powershell
npm i -g vercel
cd "C:\Users\teste\OneDrive\Documents\Claude\Projects\AI Minute\minera\frontend"
vercel --prod
# When asked for settings: framework = Vite, build = npm run build, output = dist
```

## 3. Point the frontend at a backend
The frontend calls `/api/*`. For a live site you also need the backend running
(Render, Railway, Fly, or any Node host):

```powershell
cd "...\minera\backend"
# deploy this folder to Render/Railway; start command:  node src/index.js
```
Then in Vercel project settings add env var:
`VITE_API_URL = https://your-backend-url`

…or edit `frontend/vercel.json` rewrites to proxy `/api` to your backend URL.

> Tip: to demo the frontend instantly without a backend, it still loads in
> OFFLINE demo mode — but live data needs the backend deployed too.
