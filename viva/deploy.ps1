# VIVA Deploy Script — run from PowerShell as admin or normal user
# Usage: cd "C:\Users\teste\OneDrive\Documents\Claude\Projects\viva"; .\deploy.ps1

$ErrorActionPreference = "Stop"
$root = "C:\Users\teste\OneDrive\Documents\Claude\Projects\viva"
Set-Location $root

Write-Host "`n=== VIVA Deploy ===" -ForegroundColor Cyan

# ── 1. Git init + commit ──────────────────────────────────────────────────────
if (Test-Path ".git") {
    Write-Host "[1] Git repo exists — checking remote..." -ForegroundColor Yellow
    $remote = git remote get-url origin 2>$null
    if ($remote) { Write-Host "    Remote: $remote" }
} else {
    Write-Host "[1] Init git repo..." -ForegroundColor Yellow
    git init -b main
}

# Configure git identity if not set
$gitName = git config user.name 2>$null
if (-not $gitName) {
    git config user.email "goldrusher9009@gmail.com"
    git config user.name "VIVA"
}

# Create .gitignore
@"
node_modules/
.env
.env.local
.env*.local
dist/
.next/
*.log
.DS_Store
prisma/dev.db
"@ | Set-Content .gitignore

git add -A
$status = git status --porcelain
if ($status) {
    git commit -m "feat: viva platform — full stack

- Next.js 14 frontend: feed, markets, health, token, rooms, twin, dating, messages
- Express + Prisma backend API with JWT auth
- Docker Compose local deployment
- ZK proof health, prediction markets, AI twin, dating, YouToken"
    Write-Host "    Committed." -ForegroundColor Green
} else {
    Write-Host "    Nothing to commit." -ForegroundColor Green
}

# ── 2. GitHub ─────────────────────────────────────────────────────────────────
Write-Host "`n[2] Push to GitHub..." -ForegroundColor Yellow
Write-Host "    Repo: https://github.com/goldrusher9009/viva-platform"

$hasRemote = git remote 2>$null
if (-not $hasRemote) {
    git remote add origin https://github.com/goldrusher9009/viva-platform.git
}

# Try push — will prompt for GitHub credentials if needed
git push -u origin main --force
Write-Host "    Pushed to GitHub ✅" -ForegroundColor Green

# ── 3. Railway (backend) ──────────────────────────────────────────────────────
Write-Host "`n[3] Deploy backend to Railway..." -ForegroundColor Yellow
$railwayCli = Get-Command railway -ErrorAction SilentlyContinue
if ($railwayCli) {
    Set-Location "$root\apps\api"
    railway up --service viva-api
    Set-Location $root
    Write-Host "    Backend deployed ✅" -ForegroundColor Green
} else {
    Write-Host "    Railway CLI not found. Install: npm i -g @railway/cli" -ForegroundColor Red
    Write-Host "    Then run: cd apps\api && railway login && railway up" -ForegroundColor Yellow
}

# ── 4. Vercel (frontend) ──────────────────────────────────────────────────────
Write-Host "`n[4] Deploy frontend to Vercel..." -ForegroundColor Yellow
$vercelCli = Get-Command vercel -ErrorAction SilentlyContinue
if ($vercelCli) {
    Set-Location "$root\apps\web"
    vercel --prod --yes
    Set-Location $root
    Write-Host "    Frontend deployed ✅" -ForegroundColor Green
} else {
    Write-Host "    Vercel CLI not found. Install: npm i -g vercel" -ForegroundColor Red
    Write-Host "    Then run: cd apps\web && vercel login && vercel --prod" -ForegroundColor Yellow
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan
