@echo off
REM ================================================================
REM  PUSH_PHASE3_BRAIN.bat — Phase 3: Forge Brain v2 (memory moat)
REM  Stages ONLY forge/ files explicitly. NEVER git add -A.
REM  NEVER touches viva/ or any other subproject.
REM  Runs from the repo root (Projects/). Pushes only if tests pass.
REM ================================================================
setlocal
set GIT="C:\Program Files\Git\cmd\git.exe"
REM This .bat lives in Projects\forge\ ; repo root is its parent (Projects\).
cd /d "%~dp0\.."
echo Repo root:
%GIT% rev-parse --show-toplevel

echo.
echo === [1/5] Install deps if needed, then run tests via npx ===
cd forge\forge-platform
if not exist "node_modules\.bin\jest" (
  echo Installing dependencies (first run, may take a few minutes)...
  call npm install
)
call npx jest --testPathPattern="__tests__/(auth|route-manifest)" --forceExit --no-coverage
if errorlevel 1 (
  echo.
  echo !!! TESTS FAILED — NOT pushing. Fix first.
  cd ..\..
  pause
  exit /b 1
)
cd ..\..

echo.
echo === [2/5] Stage ONLY forge/ files (explicit; never viva/) ===
%GIT% add forge/forge-platform/src/index.ts
%GIT% add forge/forge-platform/src/__tests__/route-manifest.test.ts
%GIT% add forge/FORGE_MOAT.md
%GIT% add forge/VERSION.md
%GIT% add forge/PUSH_PHASE3_BRAIN.bat

echo.
echo === [3/5] Show EXACTLY what will commit (must be forge/ ONLY) ===
%GIT% status --short

echo.
echo === [4/5] Commit ===
%GIT% commit -m "Phase 3: Forge Brain v2 - categories, confidence, decay, /api/brain/summary (compounding-memory moat) - forge only"

echo.
echo === [5/5] Rebase (no -X ours) then push ===
%GIT% fetch origin main
%GIT% rebase origin/main
if errorlevel 1 (
  echo !!! Rebase conflict. Aborting to stay safe. Tell Claude.
  %GIT% rebase --abort
  pause
  exit /b 1
)
%GIT% push origin HEAD:main
echo.
echo === DONE. Verify: forge-production-2692.up.railway.app/api/brain/summary (401 = live) ===
pause
endlocal
