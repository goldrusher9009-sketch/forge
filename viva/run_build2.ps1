Set-Location 'C:\Users\teste\OneDrive\Documents\Claude\Projects\viva\apps\api'
$env:DATABASE_URL = "file:./dev.db"
npm run build 2>&1
Write-Host 'BUILD_DONE'
