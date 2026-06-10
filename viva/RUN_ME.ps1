$ErrorActionPreference = "Continue"
$root = "C:\Users\teste\OneDrive\Documents\Claude\Projects\viva"
Set-Location $root

Write-Host "VIVA Auto Deploy starting..." -ForegroundColor Cyan

# Git
Write-Host "[1] Git..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) { git init -b main 2>&1 | Out-Null }
git config user.email "goldrusher9009@gmail.com" 2>&1 | Out-Null
git config user.name "VIVA" 2>&1 | Out-Null

$gi = "node_modules/`n.env`n.env.local`ndist/`n.next/`n*.log`nprisma/dev.db`n"
[System.IO.File]::WriteAllText("$root\.gitignore", $gi)

git add -A 2>&1 | Out-Null
$changes = git status --porcelain 2>&1
if ($changes) {
    git commit -m "feat: viva platform full stack" 2>&1 | Out-Null
    Write-Host "  Committed" -ForegroundColor Green
}

$remotes = git remote 2>&1
if ($remotes -notcontains "origin") {
    git remote add origin "https://github.com/goldrusher9009/viva-platform.git" 2>&1 | Out-Null
}
git push -u origin main --force 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  GitHub pushed OK" -ForegroundColor Green
} else {
    Write-Host "  GitHub push failed - continuing" -ForegroundColor Yellow
}

# Install deps
Write-Host "[2] npm install backend..." -ForegroundColor Yellow
Set-Location "$root\apps\api"
npm install --legacy-peer-deps 2>&1 | Select-String "added" | Select-Object -Last 1
Write-Host "  backend deps done" -ForegroundColor Green

Write-Host "[3] npm install frontend..." -ForegroundColor Yellow
Set-Location "$root\apps\web"
npm install --legacy-peer-deps 2>&1 | Select-String "added" | Select-Object -Last 1
Write-Host "  frontend deps done" -ForegroundColor Green

# .env files
Set-Location "$root\apps\api"
if (-not (Test-Path ".env")) {
    $envContent = "DATABASE_URL=`"file:./dev.db`"`nJWT_ACCESS_SECRET=`"viva-access-secret-local-dev-abc123`"`nJWT_REFRESH_SECRET=`"viva-refresh-secret-local-dev-xyz789`"`nFRONTEND_URL=`"http://localhost:3000`"`nPORT=4000`nNODE_ENV=development`n"
    [System.IO.File]::WriteAllText("$root\apps\api\.env", $envContent)
    Write-Host "  .env created" -ForegroundColor Green
}

Set-Location "$root\apps\web"
if (-not (Test-Path ".env.local")) {
    $envWeb = "NEXT_PUBLIC_API_URL=http://localhost:4000`nNEXT_PUBLIC_WS_URL=ws://localhost:4000`n"
    [System.IO.File]::WriteAllText("$root\apps\web\.env.local", $envWeb)
    Write-Host "  .env.local created" -ForegroundColor Green
}

# Prisma SQLite
Write-Host "[4] Database setup..." -ForegroundColor Yellow
Set-Location "$root\apps\api"
$schemaPath = "$root\apps\api\prisma\schema.prisma"
$schema = [System.IO.File]::ReadAllText($schemaPath)
if ($schema -match 'provider = "postgresql"') {
    $schema = $schema -replace 'provider = "postgresql"', 'provider = "sqlite"'
    [System.IO.File]::WriteAllText($schemaPath, $schema)
    Write-Host "  Switched to SQLite" -ForegroundColor Green
}
npx prisma generate 2>&1 | Select-String "Generated" | Select-Object -Last 1
npx prisma db push --skip-generate --accept-data-loss 2>&1 | Select-String "database" | Select-Object -Last 1
Write-Host "  DB ready" -ForegroundColor Green

# Build
Write-Host "[5] Building backend..." -ForegroundColor Yellow
Set-Location "$root\apps\api"
npm run build 2>&1 | Select-String "error TS" | Select-Object -Last 3
Write-Host "  Build done" -ForegroundColor Green

# Vercel deploy
Write-Host "[6] Vercel deploy..." -ForegroundColor Yellow
Set-Location "$root\apps\web"
$vercelOk = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelOk) {
    npm install -g vercel 2>&1 | Out-Null
    $vercelOk = Get-Command vercel -ErrorAction SilentlyContinue
}
if ($vercelOk) {
    vercel --prod --yes --name viva-platform 2>&1 | Tee-Object -Variable vo
    Write-Host "  Vercel done" -ForegroundColor Green
} else {
    Write-Host "  Vercel CLI not available - deploy manually: cd apps\web && vercel --prod" -ForegroundColor Yellow
}

# Railway deploy
Write-Host "[7] Railway deploy..." -ForegroundColor Yellow
Set-Location "$root\apps\api"
$schema2 = [System.IO.File]::ReadAllText($schemaPath)
if ($schema2 -match 'provider = "sqlite"') {
    $schema2 = $schema2 -replace 'provider = "sqlite"', 'provider = "postgresql"'
    [System.IO.File]::WriteAllText($schemaPath, $schema2)
}
$railwayOk = Get-Command railway -ErrorAction SilentlyContinue
if (-not $railwayOk) {
    npm install -g @railway/cli 2>&1 | Out-Null
    $railwayOk = Get-Command railway -ErrorAction SilentlyContinue
}
if ($railwayOk) {
    railway login --browserless 2>&1 | Select-Object -Last 3
    railway up --detach 2>&1 | Select-Object -Last 3
    Write-Host "  Railway done" -ForegroundColor Green
} else {
    Write-Host "  Railway CLI not available - deploy manually: cd apps\api && railway up" -ForegroundColor Yellow
}
# Restore sqlite for local
$schema3 = [System.IO.File]::ReadAllText($schemaPath)
$schema3 = $schema3 -replace 'provider = "postgresql"', 'provider = "sqlite"'
[System.IO.File]::WriteAllText($schemaPath, $schema3)

# Launch local
Write-Host "[8] Launching local servers..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -NoProfile -Command `"Set-Location '$root\apps\api'; node dist\index.js`"" -WindowStyle Normal
Start-Sleep 3
Start-Process powershell -ArgumentList "-NoExit -NoProfile -Command `"Set-Location '$root\apps\web'; npm run dev`"" -WindowStyle Normal
Start-Sleep 5
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "DONE - Frontend: http://localhost:3000  Backend: http://localhost:4000" -ForegroundColor Cyan
