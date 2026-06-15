@echo off
REM Diagnose ONLY. Stages nothing, commits nothing, pushes nothing.
setlocal
set GIT="C:\Program Files\Git\cmd\git.exe"
cd /d "%~dp0"

echo ===== where am I =====
cd
echo.
echo ===== git root =====
%GIT% rev-parse --show-toplevel
echo.
echo ===== remote(s) =====
%GIT% remote -v
echo.
echo ===== current branch + last 3 commits =====
%GIT% rev-parse --abbrev-ref HEAD
%GIT% log -3 --oneline
echo.
echo ===== do my files exist here? (real paths) =====
if exist "forge-platform\src\index.ts" (echo FOUND forge-platform\src\index.ts) else (echo MISSING forge-platform\src\index.ts)
if exist "CLAUDE.md" (echo FOUND CLAUDE.md) else (echo MISSING CLAUDE.md)
if exist "DEPLOY_MAP.md" (echo FOUND DEPLOY_MAP.md) else (echo MISSING DEPLOY_MAP.md)
echo.
echo ===== working tree status (short) =====
%GIT% status --short
echo.
echo ===== DIAGNOSE ONLY — nothing changed. Paste this whole output to Claude. =====
pause
endlocal
