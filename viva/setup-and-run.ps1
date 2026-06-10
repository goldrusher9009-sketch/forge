# VIVA Platform — Local Setup + GitHub Push
# Run from PowerShell:
#   cd "C:\Users\teste\OneDrive\Documents\Claude\Projects\viva"
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\setup-and-run.ps1

param(
    [switch]$Docker,    # use Docker Compose instead of bare Node
    [switch]$SkipGit,   # skip GitHub push
    [switch]$SkipInstall # skip npm install (if already done)
)

$ErrorActionPreference = "Continue"
$root = $PSScriptRoot
Set-Location $root

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  VIVA Platform — Setup & Run" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ── Git ───────────────────────────────────────────────────────────────────────
if (-not $SkipGit) {
    Write-Host "[GIT] Init + push to GitHub..." -ForegroundColor Yellow

    if (-not (Test-Path ".git")) { git init -b main }
    git config user.email "goldrusher9009@gmail.com"
    git config user.name "VIVA"

    git add -A
    $changes = git status --porcelain
    if ($changes) {
        git commit -m "feat: viva platform — full stack frontend + backend + infra"
    }

    $remotes = git remote
    if ($remotes -notcontains "origin") {
        git remote add origin https://github.com/goldrusher9009/viva-platform.git
    }

    Write-Host "  Pushing (you may be prompted for GitHub credentials)..." -ForegroundColor Gray
    git push -u origin main --force
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  GitHub ✅  https://github.com/goldrusher9009/viva-platform" -ForegroundColor Green
    } else {
        Write-Host "  GitHub push failed — check credentials or create repo first" -ForegroundColor Red
        Write-Host "  Create at: https://github.com/new (name: viva-platform, private, no README)" -ForegroundColor Yellow
    }
}

# ── Docker path ───────────────────────────────────────────────────────────────
if ($Docker) {
    Write-Host "`n[DOCKER] Starting with Docker Compose..." -ForegroundColor Yellow
    $dockerExists = Get-Command docker -ErrorAction SilentlyContinue
    if (-not $dockerExists) {
        Write-Host "  Docker not found. Install Docker Desktop first." -ForegroundColor Red
        exit 1
    }
    docker compose up --build -d
    Write-Host "  Docker up ✅" -ForegroundColor Green
    Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  Backend:  http://localhost:4000" -ForegroundColor Cyan
    Start-Sleep 3
    Start-Process "http://localhost:3000"
    exit 0
}

# ── Install deps ──────────────────────────────────────────────────────────────
if (-not $SkipInstall) {
    Write-Host "`n[INSTALL] Frontend..." -ForegroundColor Yellow
    Set-Location "$root\apps\web"
    npm install --legacy-peer-deps
    Write-Host "  Frontend deps ✅" -ForegroundColor Green

    Write-Host "`n[INSTALL] Backend..." -ForegroundColor Yellow
    Set-Location "$root\apps\api"
    npm install --legacy-peer-deps
    Write-Host "  Backend deps ✅" -ForegroundColor Green
}

# ── Backend .env ──────────────────────────────────────────────────────────────
Set-Location "$root\apps\api"
if (-not (Test-Path ".env")) {
    Write-Host "`n[ENV] Creating backend .env (SQLite for local)..." -ForegroundColor Yellow
@"
DATABASE_URL="file:./dev.db"
JWT_ACCESS_SECRET="viva-access-secret-local-dev-change-in-prod"
JWT_REFRESH_SECRET="viva-refresh-secret-local-dev-change-in-prod"
FRONTEND_URL="http://localhost:3000"
PORT=4000
NODE_ENV=development
"@ | Set-Content .env
    Write-Host "  .env created ✅" -ForegroundColor Green
}

# ── Frontend .env.local ───────────────────────────────────────────────────────
Set-Location "$root\apps\web"
if (-not (Test-Path ".env.local")) {
@"
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
"@ | Set-Content .env.local
    Write-Host "  .env.local created ✅" -ForegroundColor Green
}

# ── Prisma — switch to SQLite for local dev ───────────────────────────────────
Set-Location "$root\apps\api"
$schema = Get-Content "prisma\schema.prisma" -Raw
if ($schema -match 'provider = "postgresql"') {
    Write-Host "`n[DB] Switching Prisma to SQLite for local..." -ForegroundColor Yellow
    $schema = $schema -replace 'provider = "postgresql"', 'provider = "sqlite"'
    $schema | Set-Content "prisma\schema.prisma"
}

Write-Host "[DB] Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "[DB] Pushing schema to SQLite..." -ForegroundColor Yellow
npx prisma db push --skip-generate
Write-Host "  DB ready ✅" -ForegroundColor Green

# ── Build backend ─────────────────────────────────────────────────────────────
Write-Host "`n[BUILD] Compiling backend TypeScript..." -ForegroundColor Yellow
npm run build
Write-Host "  Build ✅" -ForegroundColor Green

# ── Launch both servers ───────────────────────────────────────────────────────
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Starting VIVA servers..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Backend
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Write-Host 'VIVA API' -ForegroundColor Cyan; Set-Location '$root\apps\api'; node dist/index.js"
) -WindowStyle Normal

Start-Sleep 2

# Frontend
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Write-Host 'VIVA Web' -ForegroundColor Cyan; Set-Location '$root\apps\web'; npm run dev"
) -WindowStyle Normal

Write-Host ""
Write-Host "  Servers starting..." -ForegroundColor Gray
Start-Sleep 4
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:4000/health" -ForegroundColor Green
Write-Host ""
Write-Host "  For Docker instead: .\setup-and-run.ps1 -Docker" -ForegroundColor Gray
Write-Host "  Skip install next time: .\setup-and-run.ps1 -SkipInstall" -ForegroundColor Gray
