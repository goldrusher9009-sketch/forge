@echo off
REM ============================================================
REM  PUSH_PHASE0.bat  — Phase 0: route-gap closers + manifest test
REM  Closes 404 gap (agent/run, analytics/summary, billing tiers/
REM  invoices/subscribe, forge-tools/catalog, marketplace/install,
REM  orgs, tokens) + adds route-manifest test so demos never 404.
REM  Run this from Windows (double-click or run in terminal).
REM ============================================================
setlocal
set GIT="C:\Program Files\Git\cmd\git.exe"
cd /d "%~dp0"

echo.
echo === [1/4] Running route-manifest + auth tests ===
cd forge-platform
call npm test
if errorlevel 1 (
  echo.
  echo !!! TESTS FAILED — NOT pushing. A frontend route would 404. Fix first.
  cd ..
  pause
  exit /b 1
)
cd ..

echo.
echo === [2/4] git add ===
%GIT% add -A

echo.
echo === [3/4] git commit ===
%GIT% commit -m "Phase 0: close route-gap 404s + add route-manifest demo guard"

echo.
echo === [4/4] git pull --rebase then push ===
%GIT% pull --rebase origin main
%GIT% push origin main

echo.
echo === DONE. Railway (backend) + Vercel (frontend) auto-deploy from main. ===
echo === Watch: https://railway.app  and  https://vercel.com  dashboards. ===
pause
endlocal
