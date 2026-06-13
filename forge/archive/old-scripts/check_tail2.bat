@echo off
set GIT="C:\Program Files\Git\bin\git.exe"
cd "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
%GIT% show HEAD:forge/forge-web-studio/app/components/ForgeApp.tsx > forge_head.txt
echo Lines in HEAD version:
find /c /v "" forge_head.txt
echo.
echo Last 25 lines of HEAD:
powershell -command "Get-Content forge_head.txt | Select-Object -Last 25"
del forge_head.txt
pause
