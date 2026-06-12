Set-Location 'C:\Users\teste\OneDrive\Documents\Claude\Projects\viva\apps\api'
npm install --save-dev typescript ts-node-dev @types/node @types/express @types/cors @types/bcryptjs @types/jsonwebtoken @types/uuid --legacy-peer-deps 2>&1 | Select-String 'added|error' | Select-Object -Last 3
Write-Host 'TSINSTALL_DONE'
npm run build 2>&1 | Select-Object -Last 15
Write-Host 'BUILD_DONE'
