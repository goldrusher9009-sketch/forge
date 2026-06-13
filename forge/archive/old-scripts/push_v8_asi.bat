@echo off
set GIT="C:\Program Files\Git\bin\git.exe"
cd "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
%GIT% add forge-web-studio/app/components/ForgeApp.tsx
%GIT% add forge-platform/src/index.ts
%GIT% commit -m "feat: v8.2 - ForgeASI (multi-phase reasoning chain) front+back, ForgeASI route, agent_roles backend"
%GIT% push
echo PUSH_EXIT: %ERRORLEVEL%
pause
