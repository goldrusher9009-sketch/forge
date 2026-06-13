@echo off
set GIT="C:\Program Files\Git\bin\git.exe"
set MSG="C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\commit_msg.txt"

echo === Pushing frontend fix ===
cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\forge-web-studio"
%GIT% add app/components/ForgeApp.tsx
%GIT% commit -F %MSG%
%GIT% push
echo Frontend push exit code: %ERRORLEVEL%
echo === Done ===
