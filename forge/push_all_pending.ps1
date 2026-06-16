# Stage only forge/ paths -- NEVER git add -A
& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' add `
  forge/forge-platform/src/index.ts `
  forge/forge-web-studio/app/components/ForgeApp.tsx `
  forge/push_all_pending.ps1

& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' commit -m "feat(forge): Batch12-54: +ai-task-queue, ws-glossary, ai-routing-rules, thread-reactions, ws-integrations"
& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' push origin main
Write-Host "Pushed! Railway deploying in ~2 min."
