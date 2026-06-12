Set-Location 'C:\Users\teste\OneDrive\Documents\Claude\Projects\viva\apps\web'
vercel --prod --yes --name viva-platform 2>&1
Write-Host "VERCEL_EXIT:$LASTEXITCODE"
