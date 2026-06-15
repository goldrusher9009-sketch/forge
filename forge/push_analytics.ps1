node "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\add_heatmap_stalethreads.js"
node "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\add_frontend_wiring.js"
& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' add forge/forge-platform/src/index.ts forge/forge-web-studio/app/components/ForgeApp.tsx forge/add_heatmap_stalethreads.js forge/add_frontend_wiring.js forge/push_analytics.ps1
& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' commit -m "feat(forge): Analytics panel UI + heatmap + TL;DR summarizer + stale thread scheduler + pinned messages wiring"
& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' push origin main
