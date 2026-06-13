@echo off
set GIT="C:\Program Files\Git\bin\git.exe"
cd "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
%GIT% add forge-platform/src/index.ts
%GIT% commit -m "fix: token limit 10k→1M + monthly auto-reset — stop false TOKEN_LIMIT_EXCEEDED on all models"
%GIT% push
echo PUSH_EXIT: %ERRORLEVEL%
pause
