# Run git from INSIDE forge/ -- the Projects root treats forge/ as submodule
$forgedir = 'C:\Users\teste\OneDrive\Documents\Claude\Projects\forge'
$git = 'C:\Program Files\Git\cmd\git.exe'

Write-Host "=== Status ===" -ForegroundColor Cyan
& $git -C $forgedir status --short

& $git -C $forgedir add forge-platform/src/index.ts
& $git -C $forgedir add forge-web-studio/app/components/ForgeApp.tsx
& $git -C $forgedir add push_all_pending.ps1

Write-Host "=== Staged ===" -ForegroundColor Cyan
& $git -C $forgedir status --short

& $git -C $forgedir commit -m "feat(forge): Batch12-77: +confidence-scores, ws-boards, thread-revisions, commitments, question-log"
& $git -C $forgedir push origin main
Write-Host "Pushed! Railway deploying in ~2 min." -ForegroundColor Green
