# Run all pending patch scripts (idempotent)
node "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\add_batch2.js"
node "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\add_batch2_frontend.js"
node "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\add_batch3.js"
node "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\add_batch4.js"

# Stage only forge/ paths — NEVER git add -A
& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' add `
  forge/forge-platform/src/index.ts `
  forge/forge-web-studio/app/components/ForgeApp.tsx `
  forge/add_batch2.js `
  forge/add_batch2_frontend.js `
  forge/add_batch3.js `
  forge/add_batch3_frontend.js `
  forge/add_batch4.js `
  forge/add_frontend_wiring.js `
  forge/add_heatmap_stalethreads.js `
  forge/push_analytics.ps1 `
  forge/push_batch2.ps1 `
  forge/push_batch3.ps1 `
  forge/push_fix502.ps1 `
  forge/push_all_pending.ps1

& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' commit -m "feat(forge): Fix 502 + batch2 (msg search, prompt improver, mood, autotag) + batch3 (token breakdown, smart rename, thread stats) + batch4 (diff summarizer, thread replay, glossary, daily digest)"
& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' push origin main
Write-Host "Pushed! Railway deploying in ~2 min."
