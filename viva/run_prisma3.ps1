Set-Location 'C:\Users\teste\OneDrive\Documents\Claude\Projects\viva\apps\api'
$env:DATABASE_URL = "file:./dev.db"
npx prisma@5.13.0 generate 2>&1 | Select-Object -Last 5
Write-Host 'GENERATE_DONE'
npx prisma@5.13.0 db push --skip-generate --accept-data-loss 2>&1 | Select-Object -Last 5
Write-Host 'DBPUSH_DONE'
