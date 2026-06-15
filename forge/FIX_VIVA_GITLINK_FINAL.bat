@echo off
REM ================================================================
REM  FIX_VIVA_GITLINK_FINAL.bat
REM  Force the viva-platform-repo gitlink in the index back to the
REM  ORIGINAL value 99f3a181f9f683b8d1a8b90193645a91285c870e using
REM  update-index --cacheinfo (does NOT touch the submodule working
REM  dir), then amend + force-push. Net viva change = ZERO.
REM ================================================================
setlocal
set GIT="C:\Program Files\Git\cmd\git.exe"
cd /d "%~dp0\.."
%GIT% rev-parse --show-toplevel

echo.
echo === [1/4] Set gitlink in index to original commit (mode 160000) ===
%GIT% update-index --cacheinfo 160000,99f3a181f9f683b8d1a8b90193645a91285c870e,viva-platform-repo

echo.
echo === [2/4] Amend commit with corrected index ===
%GIT% commit --amend -m "Phase 2: Morning Brief engine (/api/brief) - forge backend only"

echo.
echo === [3/4] Show commit files — expect NO viva-platform-repo now ===
%GIT% show --stat --oneline HEAD

echo.
echo === [4/4] Force-push corrected tip ===
%GIT% push --force-with-lease origin main
echo.
echo === DONE. If viva-platform-repo is gone above, viva is fully clean. ===
pause
endlocal
