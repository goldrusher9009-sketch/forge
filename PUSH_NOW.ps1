$git = "C:\Program Files\Git\cmd\git.exe"
$root = "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"

$lock = "$root\.git\index.lock"
if (Test-Path $lock) { Remove-Item $lock -Force; Write-Host "Removed stale index.lock" }

& $git -C $root add `
  forge-web-studio/app/components/ForgeApp.tsx `
  forge-web-studio/app/components/WaveComponents.tsx `
  forge-platform/src/index.ts `
  VERSION.md `
  patch_all_waves.js `
  patch_wave119.js `
  PUSH_NOW.ps1

& $git -C $root commit -m "v321.00 - Split WaveComponents.tsx to fix Vercel OOM build error (105 tools)"

& $git -C $root push origin main

Write-Host "DONE - v321 deploying. Check: https://forge-sand-two.vercel.app"
