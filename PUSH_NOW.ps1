$git = "C:\Program Files\Git\cmd\git.exe"
$root = "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"

$lock = "$root\.git\index.lock"
if (Test-Path $lock) { Remove-Item $lock -Force; Write-Host "Removed stale index.lock" }

& $git -C $root add `
  forge-platform/src/index.ts `
  forge-platform/dist/index.js `
  forge-web-studio/app/components/ForgeApp.tsx `
  VERSION.md `
  patch_all_waves.js `
  PUSH_NOW.ps1

& $git -C $root commit -m "v320.00 - Fix ForgeApp.tsx + apply waves 99-118 (100 tools) - TypeScript clean"

& $git -C $root push origin main

Write-Host "DONE - v320 deploying. Check: https://forge-production-2692.up.railway.app/health"
