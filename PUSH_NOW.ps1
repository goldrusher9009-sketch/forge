$git = "C:\Program Files\Git\cmd\git.exe"
$root = "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"

$lock = "$root\.git\index.lock"
if (Test-Path $lock) { Remove-Item $lock -Force; Write-Host "Removed stale index.lock" }

# Sync backend + build CJS dist for Railway
Write-Host "Syncing and building Railway dist..."
Copy-Item "$root\forge-platform\src\index.ts" "$root\forge\forge-platform\src\index.ts" -Force
$esbuild = "$root\forge-platform\node_modules\@esbuild\win32-x64\esbuild.exe"
& $esbuild "$root\forge\forge-platform\src\index.ts" --bundle=false --platform=node --target=node18 --format=cjs "--outfile=$root\forge\forge-platform\dist\index.js"
Write-Host "Done."

& $git -C $root add `
  forge-web-studio/app/components/ForgeApp.tsx `
  forge-web-studio/app/components/WaveComponents.tsx `
  forge-web-studio/package.json `
  forge-platform/src/index.ts `
  forge/forge-platform/src/index.ts `
  VERSION.md `
  PUSH_NOW.ps1; & $git -C $root add -f "forge/forge-platform/dist/index.js"

$ver = (Get-Content "$root\VERSION.md" | Select-String -Pattern "^## v" | Select-Object -First 1).ToString().Split(' ')[1]
& $git -C $root commit -m "$ver - auto deploy"

& $git -C $root push origin main

Write-Host "DONE - deploying. Check: https://forge-sand-two.vercel.app"
