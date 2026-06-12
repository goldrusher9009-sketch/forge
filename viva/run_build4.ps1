Set-Location 'C:\Users\teste\OneDrive\Documents\Claude\Projects\viva\apps\api'
$env:DATABASE_URL = "file:./dev.db"
tsc -p tsconfig.json 2>&1 | Select-Object -Last 20
Write-Host "BUILD_EXIT:$LASTEXITCODE"
Test-Path dist\index.js
