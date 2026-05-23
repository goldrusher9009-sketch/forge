@echo off
set GIT="C:\Program Files\Git\bin\git.exe"
echo Looking for git repo...
if exist "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\.git" (
  cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
  echo Found at root
) else if exist "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\forge\.git" (
  cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\forge"
  echo Found at forge subfolder
) else (
  echo Could not find .git
  pause
  exit /b 1
)

echo Current dir: %CD%
%GIT% status
%GIT% add forge-web-studio/app/components/ForgeApp.tsx
%GIT% add forge-platform/src/index.ts
%GIT% commit -m "feat: v7 - file fix + projects menu + recent collapse + live inline + mobile + ForgeAuto + ForgeMulti skeleton"
%GIT% push
echo PUSH_EXIT: %ERRORLEVEL%
pause
