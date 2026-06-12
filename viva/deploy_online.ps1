# Install CLIs
npm install -g @railway/cli vercel 2>&1 | Select-String 'added|error' | Select-Object -Last 2
Write-Host "CLI_INSTALL:$LASTEXITCODE"

# Vercel deploy frontend
Set-Location 'C:\Users\teste\OneDrive\Documents\Claude\Projects\viva\apps\web'
Write-Host "--- Vercel deploy ---"
vercel --prod --yes --name viva-platform 2>&1 | Select-Object -Last 10
Write-Host "VERCEL_EXIT:$LASTEXITCODE"

# Railway deploy backend
Set-Location 'C:\Users\teste\OneDrive\Documents\Claude\Projects\viva\apps\api'
Write-Host "--- Railway deploy ---"
railway up --detach 2>&1 | Select-Object -Last 10
Write-Host "RAILWAY_EXIT:$LASTEXITCODE"
