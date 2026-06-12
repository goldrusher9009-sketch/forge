$root = 'C:\Users\teste\OneDrive\Documents\Claude\Projects\viva'
# Launch API
Start-Process powershell -ArgumentList "-NoExit -NoProfile -Command `"Set-Location '$root\apps\api'; `$env:DATABASE_URL='file:./dev.db'; `$env:JWT_ACCESS_SECRET='viva-access-secret-local-dev-abc123'; `$env:JWT_REFRESH_SECRET='viva-refresh-secret-local-dev-xyz789'; `$env:FRONTEND_URL='http://localhost:3000'; `$env:PORT='4000'; node dist\index.js`"" -WindowStyle Normal
Start-Sleep 3
# Launch Web
Start-Process powershell -ArgumentList "-NoExit -NoProfile -Command `"Set-Location '$root\apps\web'; `$env:NEXT_PUBLIC_API_URL='http://localhost:4000'; npm run dev`"" -WindowStyle Normal
Start-Sleep 6
Start-Process 'http://localhost:3000'
Write-Host 'SERVERS_LAUNCHED'
