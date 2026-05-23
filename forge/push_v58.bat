@echo off
set GIT="C:\Program Files\Git\bin\git.exe"

echo === Forge v5.8 Push ===
echo Pushing frontend (forge-web-studio)...
cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\forge-web-studio"
%GIT% add app/components/ForgeApp.tsx package.json
%GIT% commit -m "v5.8 — Full OR model list (358 models grouped by provider), proxy browser, ForgeAgent tab (web search+fetch tool loop)"
%GIT% push
echo Frontend exit: %ERRORLEVEL%

echo Pushing backend (forge-platform)...
cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\forge-platform"
%GIT% add src/index.ts package.json 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo forge-platform has no separate git remote, checking root...
  cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
  %GIT% add forge-platform/src/index.ts forge-platform/package.json 2>nul
  %GIT% commit -m "v5.8 backend — browser proxy, ForgeAgent SSE loop, web_search+web_fetch tools" 2>nul
  %GIT% push 2>nul
)

echo === Done. Check Railway + Vercel for deployment status ===
pause
