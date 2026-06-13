@echo off
set REPO=C:\Users\teste\OneDrive\Documents\Claude\Projects\forge
set GIT=C:\Program Files\Git\bin\git.exe
"%GIT%" -C "%REPO%" add forge-platform/src/index.ts forge-platform/package.json
"%GIT%" -C "%REPO%" status
"%GIT%" -C "%REPO%" commit -m "fix: v5.8.1 restore truncated index.ts + remove all token limit blocks"
"%GIT%" -C "%REPO%" push
echo EXIT: %ERRORLEVEL%
pause
