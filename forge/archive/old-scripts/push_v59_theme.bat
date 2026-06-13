@echo off
set GIT="C:\Program Files\Git\bin\git.exe"

echo === Forge v5.9 Theme Push ===

echo Pushing frontend (forge-web-studio)...
cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\forge-web-studio"
%GIT% add app/components/ForgeApp.tsx
%GIT% commit -m "v5.9 theme — obsidian+orange design system, Syne/DM Mono fonts, CSS vars, 869 color replacements"
%GIT% push
echo Frontend exit: %ERRORLEVEL%

echo === Done. Check Vercel for deployment ===
pause
