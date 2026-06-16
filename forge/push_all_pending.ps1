# Stage only forge/ paths -- NEVER git add -A
$root = 'C:\Users\teste\OneDrive\Documents\Claude\Projects'
$git = 'C:\Program Files\Git\cmd\git.exe'

# Show current status first
Write-Host "=== Git Status ===" -ForegroundColor Cyan
& $git -C $root status forge/forge-platform/src/index.ts forge/forge-web-studio/app/components/ForgeApp.tsx

# Force add
& $git -C $root add forge/forge-platform/src/index.ts
& $git -C $root add forge/forge-web-studio/app/components/ForgeApp.tsx
& $git -C $root add forge/push_all_pending.ps1

Write-Host "=== After add ===" -ForegroundColor Cyan
& $git -C $root status --short forge/forge-platform/src/index.ts forge/forge-web-studio/app/components/ForgeApp.tsx

& $git -C $root commit -m "feat(forge): Batch12-77: +confidence-scores, ws-boards, thread-revisions, commitments, question-log"
& $git -C $root push origin main
Write-Host "Pushed! Railway deploying in ~2 min." -ForegroundColor Green
