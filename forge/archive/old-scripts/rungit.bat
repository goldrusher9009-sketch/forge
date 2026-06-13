@echo off
cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
"C:\Program Files\Git\cmd\git.exe" add forge-platform/src/index.ts forge-web-studio/app/components/ForgeApp.tsx VERSION.md
"C:\Program Files\Git\cmd\git.exe" commit -m "v6.30 autonomy layer: goals/files/webhooks/reflect/handoff, getUserLLMKey, BodyStreamBuffer fix"
"C:\Program Files\Git\cmd\git.exe" push origin main
"C:\Program Files\Git\cmd\git.exe" log --oneline -3 > gitlog.txt 2>&1
