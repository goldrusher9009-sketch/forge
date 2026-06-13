@echo off
set GIT="C:\Program Files\Git\bin\git.exe"

echo === Fix: rename modal variable mismatch ===

cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
%GIT% add forge-web-studio/app/components/ForgeApp.tsx
%GIT% commit -m "fix: rename modal - use renamingThread state (was referencing undefined renameTitle/doRename)"
%GIT% push
echo Push exit: %ERRORLEVEL%

echo === Done. Check Vercel ===
pause
