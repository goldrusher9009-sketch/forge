@echo off
REM ============================================================
REM  PUSH_PHASE2.bat — Phase 2: Morning Brief engine (daily hook)
REM  Adds login streaks, since-last-visit delta, and the ONE
REM  priority action via GET /api/brief. Updates route-manifest test.
REM  Run from Windows (double-click). Pushes only if tests pass.
REM ============================================================
setlocal
set GIT="C:\Program Files\Git\cmd\git.exe"
cd /d "%~dp0"

echo.
echo === [1/4] Running tests (auth + route-manifest) ===
cd forge-platform
call npm test
if errorlevel 1 (
  echo.
  echo !!! TESTS FAILED — NOT pushing. Fix first.
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
%GIT% commit -m "Phase 2: Morning Brief engine — login streaks + since-last-visit delta + priority action (/api/brief)"

echo.
echo === [4/4] git pull --rebase then push ===
%GIT% pull --rebase origin main
%GIT% push origin main

echo.
echo === DONE. Railway + Vercel auto-deploy from main. Wait a few min, ===
echo === then check: forge-production-2692.up.railway.app/api/brief (401 = live, route exists) ===
pause
endlocal
