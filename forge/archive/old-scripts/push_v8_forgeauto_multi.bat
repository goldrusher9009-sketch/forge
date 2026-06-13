@echo off
set GIT="C:\Program Files\Git\bin\git.exe"
cd "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
echo Current dir: %CD%
%GIT% status
%GIT% add forge-web-studio/app/components/ForgeApp.tsx
%GIT% commit -m "feat: v8 - ForgeAuto (multi-LLM parallel) + ForgeMulti (agent swarm) tabs fully wired"
%GIT% push
echo PUSH_EXIT: %ERRORLEVEL%
pause
