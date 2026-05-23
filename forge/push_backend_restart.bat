@echo off
set REPO=C:\Users\teste\OneDrive\Documents\Claude\Projects\forge
set GIT=C:\Program Files\Git\bin\git.exe
"%GIT%" -C "%REPO%" add forge-platform/src/index.ts
"%GIT%" -C "%REPO%" commit -m "fix: dispatch routes, agent 400, LLM timeouts, DB fallback, expanded memory harvest"
"%GIT%" -C "%REPO%" push
echo EXIT: %ERRORLEVEL%
pause
