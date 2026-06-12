Set-Location 'C:\Users\teste\OneDrive\Documents\Claude\Projects\viva'
git add -A
git status --short | Select-Object -Last 5
git commit -m "feat: viva platform full stack - prisma sqlite fix" 2>&1 | Select-Object -Last 2
git push -u origin main --force 2>&1 | Select-Object -Last 5
Write-Host "PUSH_EXIT:$LASTEXITCODE"
