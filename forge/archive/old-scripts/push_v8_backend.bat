@echo off
set GIT="C:\Program Files\Git\bin\git.exe"
cd "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
%GIT% add forge-platform/src/index.ts
%GIT% commit -m "feat: v8 backend - ForgeAuto + ForgeMulti routes, forgemulti role param"
%GIT% push
echo PUSH_EXIT: %ERRORLEVEL%
pause
