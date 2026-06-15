@echo off
REM ================================================================
REM  FIX_VIVA_SUBMODULE_POINTER.bat
REM  HEAD still moves viva-platform-repo gitlink 99f3a18 -> c41af96.
REM  Reset that gitlink back to the parent's value (99f3a18) and amend,
REM  so the commit's net viva change is ZERO. Forge work untouched.
REM ================================================================
setlocal
set GIT="C:\Program Files\Git\cmd\git.exe"
cd /d "%~dp0\.."
%GIT% rev-parse --show-toplevel

echo.
echo === [1/5] Restore the submodule gitlink to parent (HEAD~1) state ===
%GIT% rm --cached viva-platform-repo
%GIT% reset HEAD~1 -- viva-platform-repo
%GIT% checkout HEAD~1 -- viva-platform-repo

echo.
echo === [2/5] Stage the gitlink restoration only ===
%GIT% add viva-platform-repo

echo.
echo === [3/5] Amend commit ===
%GIT% commit --amend -m "Phase 2: Morning Brief engine (/api/brief) - forge backend only"

echo.
echo === [4/5] Show files in commit — expect forge/ ONLY, NO viva ===
%GIT% show --stat --oneline HEAD

echo.
echo === [5/5] Force-push corrected tip ===
%GIT% push --force-with-lease origin main
echo.
echo === DONE. Confirm above: no viva-platform-repo, no viva/ paths. ===
pause
endlocal
