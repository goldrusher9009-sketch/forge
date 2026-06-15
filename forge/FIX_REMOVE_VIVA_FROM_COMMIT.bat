@echo off
REM ================================================================
REM  FIX_REMOVE_VIVA_FROM_COMMIT.bat
REM  My commit e4f9a22 wrongly included viva changes. This restores
REM  the viva paths to their state in the PARENT commit (8793a9e),
REM  amends the commit so viva net-change = ZERO, and re-pushes.
REM  Touches ONLY the viva paths I wrongly added. All forge work kept.
REM ================================================================
setlocal
set GIT="C:\Program Files\Git\cmd\git.exe"
cd /d "%~dp0\.."
echo Running from repo root:
%GIT% rev-parse --show-toplevel

echo.
echo === [1/5] Confirm we are on the bad commit ===
%GIT% log -1 --oneline

echo.
echo === [2/5] Restore viva paths to parent (8793a9e) state ===
REM viva-platform-repo is a submodule pointer; viva/apps/api/package.json a file.
%GIT% checkout 8793a9e -- viva/apps/api/package.json
%GIT% checkout 8793a9e -- viva-platform-repo

echo.
echo === [3/5] Stage ONLY those restorations ===
%GIT% add viva/apps/api/package.json viva-platform-repo

echo.
echo === [4/5] Amend the commit (removes viva diff, keeps forge work) ===
%GIT% commit --amend -m "Phase 2: Morning Brief engine (/api/brief) - forge backend only"

echo.
echo === Show files in amended commit (should be forge/ ONLY) ===
%GIT% show --stat --oneline HEAD

echo.
echo === [5/5] Force-push the corrected tip ===
%GIT% push --force-with-lease origin main
echo.
echo === DONE. Verify above that NO viva paths remain in the commit. ===
pause
endlocal
