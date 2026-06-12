Set-Location 'C:\Users\teste\OneDrive\Documents\Claude\Projects\viva'
git remote set-url origin https://github.com/goldrusher9009-sketch/viva-platform.git
git remote -v
git push -u origin main --force 2>&1 | Select-Object -Last 5
Write-Host "PUSH_EXIT:$LASTEXITCODE"
