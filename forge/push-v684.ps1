$git = 'C:\Program Files\Git\cmd\git.exe'
Set-Location "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"

# Build check first
Set-Location forge-web-studio
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "BUILD FAILED - not pushing" -ForegroundColor Red; exit 1 }
Set-Location ..

# Push
& $git add -A
& $git commit -m "v6.84: bug fixes - thread menus, live preview, hook persist, search, router, MVP duplicate, run-code, toasts"
& $git pull --rebase origin main
& $git push origin main
Write-Host "Done! Railway + Vercel will auto-deploy." -ForegroundColor Green
