@echo off
set GIT="C:\Program Files\Git\bin\git.exe"
cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
echo === Root git status ===
%GIT% status
echo.
echo === Log ===
%GIT% log --oneline -5
echo.
echo === Diff stat ForgeApp ===
%GIT% diff --stat forge-web-studio/app/components/ForgeApp.tsx
echo.
echo === Diff stat index.ts ===
%GIT% diff --stat forge-platform/src/index.ts
pause
