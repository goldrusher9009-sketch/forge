@echo off
set GIT="C:\Program Files\Git\bin\git.exe"
cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\forge"
%GIT% add forge-web-studio/app/components/ForgeApp.tsx
%GIT% commit -m "fix: restore truncated file ending + brace balance delta=0"
%GIT% push
echo PUSH_EXIT: %ERRORLEVEL%
pause
