@echo off
REM === Forge deploy: landing v2 + backend autonomy fix + repo cleanup ===
REM Run from anywhere on Windows. Pushes to main; Vercel + Railway auto-deploy.
cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"

set GIT="C:\Program Files\Git\cmd\git.exe"

REM stage everything: new landing, backend fix, plan, archived scripts (moves + deletes)
%GIT% add -A

%GIT% commit -m "ForgeOS landing v2 (3D hero + module explorer); fix: wire setupAutonomy (was imported never called - fixes /api/workspace/branding 404s); repo cleanup: archive ~105 throwaway scripts + stale index.js"

%GIT% pull --rebase origin main
%GIT% push origin main

echo.
echo ============================================================
echo Pushed. Vercel (frontend) + Railway (backend) auto-deploy.
echo Verify in ~2-3 min:
echo   Landing : https://forge-sand-two.vercel.app/landing
echo   Backend : https://forge-production-2692.up.railway.app/health
echo   Autonomy: https://forge-production-2692.up.railway.app/api/workspace/branding  (should NOT be 404 anymore)
echo ============================================================
pause
