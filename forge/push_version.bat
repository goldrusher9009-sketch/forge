@echo off
set GIT="C:\Program Files\Git\bin\git.exe"

echo === Version bump commit ===
cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\forge-web-studio"
%GIT% add app/components/ForgeApp.tsx
%GIT% add ..\VERSION.md
%GIT% add ..\forge-platform\src\index.ts
%GIT% commit -m "chore: bump to v5.1 add VERSION.md"
%GIT% push
echo Exit: %ERRORLEVEL%
echo === Done ===
