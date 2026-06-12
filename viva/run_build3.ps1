Set-Location 'C:\Users\teste\OneDrive\Documents\Claude\Projects\viva\apps\api'
$env:DATABASE_URL = "file:./dev.db"
.\node_modules\.bin\tsc -p tsconfig.json 2>&1 | Select-Object -Last 20
Write-Host "EXIT:$LASTEXITCODE"
Write-Host 'BUILD_DONE'
