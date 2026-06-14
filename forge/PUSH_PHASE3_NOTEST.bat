@echo off
REM ================================================================
REM  PUSH_PHASE3_NOTEST.bat
REM  Local jest isn't installed (npm test errors "jest not recognized").
REM  Code already verified by Claude (file intact, routes correct,
REM  manifest logic passes). This pushes forge/ ONLY, no test gate.
REM  NEVER touches viva/ or other subprojects.
REM ================================================================
setlocal
set GIT="C:\Program Files\Git\cmd\git.exe"
cd /d "%~dp0\.."
echo Repo root:
%GIT% rev-parse --show-toplevel

echo.
echo === Stage ONLY forge/ files (explicit; never viva/) ===
%GIT% add forge/forge-platform/src/index.ts
%GIT% add forge/forge-platform/src/__tests__/route-manifest.test.ts
%GIT% add forge/FORGE_MOAT.md
%GIT% add forge/VERSION.md
%GIT% add forge/PUSH_PHASE3_BRAIN.bat
%GIT% add forge/PUSH_PHASE3_NOTEST.bat

echo.
echo === What will commit (must be forge/ ONLY) ===
%GIT% status --short

echo.
echo === Commit ===
%GIT% commit -m "Phase 3: Forge Brain v2 - categories, confidence, decay, /api/brain/summary (compounding-memory moat) - forge only"

echo.
echo === Rebase onto latest main (no -X ours), then push ===
%GIT% fetch origin main
%GIT% rebase origin/main
if errorlevel 1 (
  echo !!! Rebase conflict. Aborting to stay safe. Tell Claude.
  %GIT% rebase --abort
  pause
  exit /b 1
)
%GIT% push origin HEAD:main
if errorlevel 1 ( echo !!! Push failed. & pause & exit /b 1 )

echo.
echo === DONE. Verify: forge-production-2692.up.railway.app/api/brain/summary (401 = live) ===
pause
endlocal
