$git = "C:\Program Files\Git\cmd\git.exe"
$root = "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"

$lock = "$root\.git\index.lock"
if (Test-Path $lock) { Remove-Item $lock -Force; Write-Host "Removed stale index.lock" }

# Rebuild dist/index.js on Windows so Railway gets new backend
Write-Host "Building dist/index.js..."
$node = "C:\Program Files\nodejs\node.exe"
$esbuild = "$root\forge-platform\node_modules\.bin\esbuild.cmd"
& $esbuild "$root\forge-platform\src\index.ts" --bundle=false --platform=node --target=node18 "--outfile=$root\forge-platform\dist\index.js"
Write-Host "Build done."

& $git -C $root add `
  forge-web-studio/app/components/ForgeApp.tsx `
  forge-web-studio/app/components/WaveComponents.tsx `
  forge-web-studio/package.json `
  forge-platform/src/index.ts `
  VERSION.md `
  patch_all_waves.js `
  patch_wave119.js `
  PUSH_NOW.ps1

& $git -C $root add -f forge-platform/dist/index.js

& $git -C $root commit -m "v328.00 - Waves 120-126: 35 new tools + Windows-built dist"

& $git -C $root push origin main

Write-Host "DONE - v328 deploying. Check: https://forge-sand-two.vercel.app"
