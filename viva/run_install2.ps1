Set-Location 'C:\Users\teste\OneDrive\Documents\Claude\Projects\viva\apps\api'
npm install typescript@5.4.5 --save-dev --legacy-peer-deps 2>&1 | Select-Object -Last 3
Write-Host "TS_INSTALLED:$LASTEXITCODE"
Test-Path ".\node_modules\typescript\bin\tsc"
