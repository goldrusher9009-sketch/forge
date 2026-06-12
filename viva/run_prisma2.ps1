Set-Location 'C:\Users\teste\OneDrive\Documents\Claude\Projects\viva\apps\api'
npm install prisma@5.13.0 @prisma/client@5.13.0 --save-exact --legacy-peer-deps 2>&1 | Select-String 'added|error' | Select-Object -Last 2
Write-Host 'INSTALL_DONE'
$env:DATABASE_URL = "file:./dev.db"
npx prisma generate 2>&1 | Select-String 'Generated|error' | Select-Object -Last 3
Write-Host 'GENERATE_DONE'
npx prisma db push --skip-generate --accept-data-loss 2>&1 | Select-String 'Your database|pushed|error' | Select-Object -Last 5
Write-Host 'DBPUSH_DONE'
