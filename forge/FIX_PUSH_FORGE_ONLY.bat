@echo off
REM ================================================================
REM  FIX_PUSH_FORGE_ONLY.bat
REM  Undo the bad broad commit, then commit + push ONLY forge/ files.
REM  NEVER touches viva/ or any other subproject.
REM  Safe to run after the previous push script left a local commit.
REM ================================================================
setlocal
set GIT="C:\Program Files\Git\cmd\git.exe"
cd /d "%~dp0"

echo.
echo === [1/7] Abort any in-progress rebase/merge (safe if none) ===
%GIT% rebase --abort 2>nul
%GIT% merge --abort 2>nul

echo.
echo === [2/7] Undo my last commit but KEEP all file changes (soft reset) ===
REM Only undoes if the last commit is mine (Phase 2 message). Otherwise skips.
for /f "delims=" %%m in ('%GIT% log -1 --pretty=%%s') do set LASTMSG=%%m
echo Last commit: %LASTMSG%
echo %LASTMSG% | findstr /C:"Phase 2: Morning Brief" >nul
if %errorlevel%==0 (
  %GIT% reset --soft HEAD~1
  echo Undid my Phase 2 commit, kept changes staged.
) else (
  echo Last commit is not mine - not resetting.
)

echo.
echo === [3/7] Unstage EVERYTHING so nothing leaks in ===
%GIT% reset

echo.
echo === [4/7] Stage ONLY forge/ files (never viva/ or others) ===
%GIT% add forge/forge-platform/src/index.ts
%GIT% add forge/forge-platform/src/__tests__/route-manifest.test.ts
%GIT% add forge/forge-platform/package.json
%GIT% add forge/CLAUDE.md
%GIT% add forge/DEPLOY_MAP.md
%GIT% add forge/VERSION.md
%GIT% add "forge/PUSH_PHASE0.bat" "forge/PUSH_PHASE2.bat" "forge/PUSH_PHASE2_SAFE.bat" "forge/FIX_PUSH_FORGE_ONLY.bat" 2>nul

echo.
echo === [5/7] Show EXACTLY what will be committed (review!) ===
%GIT% status --short

echo.
echo === [6/7] Commit forge-only ===
%GIT% commit -m "Phase 2: Morning Brief engine (/api/brief) - forge backend only"

echo.
echo === [7/7] Fetch + rebase (NO -X ours) then push ===
%GIT% fetch origin main
%GIT% rebase origin/main
if errorlevel 1 (
  echo.
  echo !!! Rebase conflict. NOT auto-resolving. Aborting to keep repo safe.
  %GIT% rebase --abort
  echo Tell Claude there is a real conflict to resolve by hand.
  pause
  exit /b 1
)
%GIT% push origin HEAD:main
echo.
echo === DONE if no errors above. Only forge/ was changed. ===
pause
endlocal
