$git = "C:\Program Files\Git\cmd\git.exe"
$root = "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"

$lock = "$root\.git\index.lock"
if (Test-Path $lock) { Remove-Item $lock -Force; Write-Host "Removed stale index.lock" }

& $git -C $root add `
  forge-platform/src/index.ts `
  forge-platform/dist/index.js `
  forge-web-studio/app/components/ForgeApp.tsx `
  VERSION.md `
  add_wave101.js `
  add_wave102.js `
  add_wave103.js `
  add_wave104.js `
  add_wave105.js `
  add_wave106.js `
  add_wave107.js `
  add_wave108.js `
  add_wave109.js `
  add_wave110.js `
  add_wave111.js `
  add_wave112.js `
  add_wave113.js `
  add_wave114.js `
  add_wave115.js `
  add_wave116.js `
  PUSH_NOW.ps1

& $git -C $root commit -m "Waves 101-116: 80 new tools (v318.00) - Ops+HR, Content+SEO, Product Strategy, Analytics, AI/ML + all prior waves"

& $git -C $root push origin main

Write-Host "DONE - v318 deploying. Check: https://forge-production-2692.up.railway.app/health"
