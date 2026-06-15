$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
Write-Host "=== MINERA launcher ===" -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
  Write-Host "Installing dependencies (first run only)..." -ForegroundColor Yellow
  npm install
}
Write-Host "Starting backend + frontend in new windows..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location '$PSScriptRoot'; npm run dev:backend"
Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location '$PSScriptRoot'; npm run dev:frontend"
Start-Sleep -Seconds 6
Start-Process "http://localhost:5173"
Write-Host "App opening at http://localhost:5173" -ForegroundColor Cyan
