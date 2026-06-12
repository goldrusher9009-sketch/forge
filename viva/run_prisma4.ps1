Set-Location 'C:\Users\teste\OneDrive\Documents\Claude\Projects\viva\apps\api'
$env:DATABASE_URL = "file:./dev.db"
npx prisma@5.13.0 validate 2>&1
Write-Host 'VALIDATE_DONE'
