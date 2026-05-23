@echo off
set GIT="C:\Program Files\Git\bin\git.exe"

echo === Forge v5.9 Push ===

echo Pushing frontend (forge-web-studio)...
cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\forge-web-studio"
%GIT% add app/components/ForgeApp.tsx package.json
%GIT% commit -m "v5.9 — Per-thread memory, SuperAgent IQ score, live preview fix, model param"
%GIT% push
echo Frontend exit: %ERRORLEVEL%

echo Pushing backend (forge-platform)...
cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\forge-platform"
%GIT% add src/index.ts package.json 2>nul
if %ERRORLEVEL% NEQ 0 (
  cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
  %GIT% add forge-platform/src/index.ts forge-platform/package.json 2>nul
  %GIT% commit -m "v5.9 backend — thread_memories table, superagent/stats, harvest++, emitAgentActivity in chat, browser proxy complete, app.listen restored" 2>nul
  %GIT% push 2>nul
) else (
  %GIT% commit -m "v5.9 backend — thread_memories table, superagent/stats, harvest++, emitAgentActivity in chat, browser proxy complete, app.listen restored"
  %GIT% push
)

echo === Done. Check Railway + Vercel for deployment status ===
pause
