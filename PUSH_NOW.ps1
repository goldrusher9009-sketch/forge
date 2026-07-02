$git = "C:\Program Files\Git\cmd\git.exe"
$root = "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"

$lock = "$root\.git\index.lock"
if (Test-Path $lock) { Remove-Item $lock -Force; Write-Host "Removed stale index.lock" }

# Sync backend source — Railway builds dist via tsc in nixpacks.toml
Write-Host "Syncing forge-platform/src/index.ts → forge/forge-platform/src/index.ts..."
Copy-Item "$root\forge-platform\src\index.ts" "$root\forge\forge-platform\src\index.ts" -Force
Write-Host "Sync done. Railway will build dist via tsc."

& $git -C $root add `
  forge-web-studio/app/components/ForgeApp.tsx `
  forge-web-studio/app/components/WaveComponents.tsx `
  forge-web-studio/package.json `
  forge-platform/src/index.ts `
  forge/forge-platform/src/index.ts `
  forge/forge-platform/nixpacks.toml `
  VERSION.md `
  PUSH_NOW.ps1

$ver = (Get-Content "$root\VERSION.md" | Select-String -Pattern "^## v" | Select-Object -First 1).ToString().Split(' ')[1]
& $git -C $root commit -m "$ver - auto deploy"

& $git -C $root push origin main

Write-Host "DONE - deploying. Check: https://forge-sand-two.vercel.app"
