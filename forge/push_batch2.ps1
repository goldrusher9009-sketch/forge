node "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\add_batch2.js"
node "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\add_batch2_frontend.js"
& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' add forge/forge-platform/src/index.ts forge/forge-web-studio/app/components/ForgeApp.tsx forge/add_batch2.js forge/add_batch2_frontend.js forge/push_batch2.ps1
& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' commit -m "feat(forge): Message search, prompt improver, thread mood tracker, auto-tag threads"
& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' push origin main
