@echo off
set GIT="C:\Program Files\Git\bin\git.exe"
cd "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
%GIT% add forge-platform/src/index.ts
%GIT% commit -m "fix: restore truncated index.ts — ForgeMulti/ASI/app.listen were missing, caused Railway build failure + token limit bug"
%GIT% push
echo PUSH_EXIT: %ERRORLEVEL%
pause
