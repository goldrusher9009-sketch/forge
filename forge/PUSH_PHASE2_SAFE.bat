@echo off
REM ================================================================
REM  PUSH_PHASE2_SAFE.bat — conflict-proof Phase 2 push.
REM  Handles the case where main moved (other commits landed) and a
REM  plain pull --rebase would get stuck on a conflict in index.ts.
REM  Strategy: commit our work first, then rebase; if rebase conflicts,
REM  abort cleanly and do a merge that prefers OUR backend changes.
REM  Never leaves you stuck at a prompt.
REM ================================================================
setlocal
set GIT="C:\Program Files\Git\cmd\git.exe"
cd /d "%~dp0"

echo.
echo === [1/6] Show current state ===
%GIT% status --short
%GIT% rev-parse --abbrev-ref HEAD

echo.
echo === [2/6] Stage + commit our Phase 2 work ===
%GIT% add -A
%GIT% commit -m "Phase 2: Morning Brief engine — login streaks + delta + priority (/api/brief)"
if errorlevel 1 echo (nothing to commit, continuing)

echo.
echo === [3/6] Fetch latest main ===
%GIT% fetch origin main

echo.
echo === [4/6] Try a clean rebase ===
%GIT% rebase origin/main
if errorlevel 1 (
  echo.
  echo !!! Rebase conflicted. Aborting rebase and falling back to merge.
  %GIT% rebase --abort
  echo === [4b] Merge origin/main, preferring OUR version on conflict ===
  %GIT% merge -X ours --no-edit origin/main
  if errorlevel 1 (
    echo !!! Merge also failed. Leaving repo clean — run: git merge --abort
    %GIT% merge --abort
    echo Please tell Claude; do NOT push in this state.
    pause
    exit /b 1
  )
)

echo.
echo === [5/6] Push ===
%GIT% push origin HEAD:main
if errorlevel 1 (
  echo !!! Push failed. Repo is committed locally but not pushed.
  pause
  exit /b 1
)

echo.
echo === [6/6] DONE. Pushed. Railway + Vercel auto-deploy. ===
echo Wait ~3-5 min then check: forge-production-2692.up.railway.app/api/brief (401 = live)
pause
endlocal
