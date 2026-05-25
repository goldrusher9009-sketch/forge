@echo off
cd /d C:\Users\teste\OneDrive\Documents\Claude\Projects\forge
"C:\Program Files\Git\cmd\git.exe" add forge-web-studio/app/components/ForgeApp.tsx forge-platform/src/index.ts
"C:\Program Files\Git\cmd\git.exe" commit -m "v6.18 - live tool toggles, wired hooks/runs/files pages, schedules+files backend"
"C:\Program Files\Git\cmd\git.exe" push origin main
echo DONE > v618_push_result.txt
"C:\Program Files\Git\cmd\git.exe" log --oneline -3 >> v618_push_result.txt
