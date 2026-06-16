# Stage only forge/ paths -- NEVER git add -A
& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' add `
  forge/forge-platform/src/index.ts `
  forge/forge-web-studio/app/components/ForgeApp.tsx `
  forge/push_all_pending.ps1

& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' commit -m "feat(forge): Batch12-43: +ai-evals, ws-events, response-templates, thread-archives-v3, user-badges"
& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' push origin main
Write-Host "Pushed! Railway deploying in ~2 min."
