@echo off
set GIT="C:\Program Files\Git\bin\git.exe"
cd "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
%GIT% add forge-platform/src/index.ts
%GIT% commit -m "fix: token limit check + NO_API_KEY error msg — show clear provider key msg instead of misleading token limit warning"
%GIT% push
echo PUSH_EXIT: %ERRORLEVEL%
pause
