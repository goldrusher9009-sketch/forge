@echo off
set GIT="C:\Program Files\Git\bin\git.exe"
cd "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
%GIT% add forge-platform/src/index.ts
%GIT% commit -m "fix: remove token blocks + ForgeCo /chat/completions alias + OpenAI-compat response format"
%GIT% push
echo PUSH_EXIT: %ERRORLEVEL%
pause
