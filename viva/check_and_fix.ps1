Set-Location 'C:\Users\teste\OneDrive\Documents\Claude\Projects\viva'

Write-Host "=== What's tracked in git? ===" -ForegroundColor Cyan
git ls-files apps/web/node_modules | Select-Object -First 5
git ls-files apps/web/ | Select-Object -First 20

Write-Host "`n=== Force remove node_modules from cache ===" -ForegroundColor Yellow
git rm -r --cached apps/web/node_modules/ --force 2>&1
git rm -r --cached apps/api/node_modules/ --force 2>&1

Write-Host "`n=== Check .gitignore ===" -ForegroundColor Cyan
Get-Content .gitignore

Write-Host "`n=== Commit + push ===" -ForegroundColor Green
git add -A
git status --short | Select-Object -First 10
git commit -m "fix: remove node_modules from git tracking"
git push origin main --force
Write-Host "DONE: $LASTEXITCODE"
