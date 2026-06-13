@echo off
set GIT=C:\Program Files\Git\bin\git.exe
set REPO=C:\Users\teste\OneDrive\Documents\Claude\Projects\forge
"%GIT%" -C "%REPO%" add forge-web-studio/app/components/ForgeApp.tsx forge-web-studio/app/layout.tsx
"%GIT%" -C "%REPO%" status
"%GIT%" -C "%REPO%" commit -F "%REPO%\commitmsg.txt"
"%GIT%" -C "%REPO%" push
echo EXIT: %ERRORLEVEL%
pause
