Set-Location 'C:\Users\teste\OneDrive\Documents\Claude\Projects\viva'

Write-Host "=== Removing tracked node_modules from git ===" -ForegroundColor Cyan
git rm -r --cached apps/web/node_modules 2>&1 | Select-Object -Last 3
git rm -r --cached apps/api/node_modules 2>&1 | Select-Object -Last 3
git rm -r --cached node_modules 2>&1 | Select-Object -Last 3

Write-Host "`n=== Removing garbage file ===" -ForegroundColor Cyan
git rm --cached "apps/web/{src" 2>&1
Remove-Item "apps/web/{src" -Force -ErrorAction SilentlyContinue

Write-Host "`n=== Committing ===" -ForegroundColor Cyan
git add -A
git commit -m "fix: untrack node_modules and garbage files"
git push -u origin main --force 2>&1 | Select-Object -Last 5
Write-Host "PUSH_EXIT:$LASTEXITCODE"
