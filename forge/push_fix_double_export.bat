@echo off
set GIT="C:\Program Files\Git\bin\git.exe"

echo === Fix: Remove duplicate export default ===

cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
%GIT% add forge-web-studio/app/components/ForgeApp.tsx
%GIT% commit -m "fix: remove duplicate export default (caused multiple exports build error)"
%GIT% push
echo Push exit: %ERRORLEVEL%

echo === Done. Check Vercel for deployment ===
pause
