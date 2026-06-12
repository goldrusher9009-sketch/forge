Set-Location 'C:\Users\teste\OneDrive\Documents\Claude\Projects\viva\apps\api'
$env:DATABASE_URL = "file:./dev.db"
npm run build 2>&1 | Select-String 'error TS|error:|Built|dist' | Select-Object -Last 10
Write-Host 'BUILD_DONE'
