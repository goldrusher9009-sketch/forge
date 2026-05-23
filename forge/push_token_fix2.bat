@echo off
set GIT="C:\Program Files\Git\bin\git.exe"
cd "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
%GIT% add forge-platform/src/index.ts
%GIT% commit -m "fix: remove all token limit blocks — billing not live, no more false TOKEN_LIMIT_EXCEEDED on any model"
%GIT% push
echo PUSH_EXIT: %ERRORLEVEL%
pause
