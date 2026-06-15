node "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\add_batch2.js"
node "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\add_batch2_frontend.js"
& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' add forge/forge-platform/src/index.ts forge/forge-web-studio/app/components/ForgeApp.tsx forge/add_batch2.js forge/add_batch2_frontend.js forge/add_frontend_wiring.js forge/add_heatmap_stalethreads.js forge/push_analytics.ps1 forge/push_batch2.ps1 forge/push_fix502.ps1
& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' commit -m "fix(forge): Restore truncated index.ts closing + add batch2 routes (msg search, prompt improver, mood, autotag)"
& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' push origin main
