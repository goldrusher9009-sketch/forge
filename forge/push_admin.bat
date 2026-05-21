@echo off
set GIT="C:\Program Files\Git\bin\git.exe"

echo === Pushing frontend (admin panel) ===
cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\forge-web-studio"
%GIT% add app/components/ForgeApp.tsx
%GIT% commit -m "feat: admin panel with stats users platform keys model toggles"
%GIT% push
echo Frontend exit: %ERRORLEVEL%

echo === Pushing backend (admin routes + platform tables) ===
cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\forge-platform"
%GIT% add src/index.ts
%GIT% commit -m "feat: admin routes platform_models platform_api_keys DB persistence"
%GIT% push
echo Backend exit: %ERRORLEVEL%

echo === All done ===
