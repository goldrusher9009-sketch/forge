@echo off
set GIT="C:\Program Files\Git\bin\git.exe"
cd "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
%GIT% add forge-web-studio/app/components/ForgeApp.tsx
%GIT% commit -m "feat: v8.1 - ForgeCo tab + mobile responsive + live preview inline + platform buttons fixed + ForgeMulti agent_roles fix"
%GIT% push
echo PUSH_EXIT: %ERRORLEVEL%
pause
