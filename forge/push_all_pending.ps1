# Stage only forge/ paths -- NEVER git add -A
& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' add `
  forge/forge-platform/src/index.ts `
  forge/forge-web-studio/app/components/ForgeApp.tsx `
  forge/push_all_pending.ps1

& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' commit -m "feat(forge): Batch10+11: notes CRUD, goals/lock, token breakdown, session replay, smart rename, diff explain, daily tokens, similar threads"
& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' push origin main
Write-Host "Pushed! Railway deploying in ~2 min."
