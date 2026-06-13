@echo off
set GIT="C:\Program Files\Git\bin\git.exe"

echo === Forge v6 - All Bug Fixes ===
echo Fixes: ForgeAgent URL, superStats state, hasKey savedProviders,
echo        Morph in LLM providers, superagent/history route

cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"

%GIT% add forge-web-studio/app/components/ForgeApp.tsx
%GIT% add forge-platform/src/index.ts

%GIT% commit -m "fix: v6 all bugs - agent URL, superStats, hasKey, morph provider, history route"
%GIT% push
echo Push exit: %ERRORLEVEL%

echo === Done. Vercel will auto-deploy the frontend. ===
echo === Railway will auto-deploy the backend. ===
pause
