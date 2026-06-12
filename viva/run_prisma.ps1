Set-Location 'C:\Users\teste\OneDrive\Documents\Claude\Projects\viva\apps\api'
$env:DATABASE_URL = "file:./dev.db"
npx prisma generate 2>&1 | Select-String 'Generated|error' | Select-Object -Last 3
Write-Host 'GENERATE_DONE'
npx prisma db push --skip-generate --accept-data-loss 2>&1 | Select-String 'Your database|error|warn' | Select-Object -Last 5
Write-Host 'DBPUSH_DONE'
