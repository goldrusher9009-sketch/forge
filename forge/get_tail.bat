@echo off
set GIT="C:\Program Files\Git\bin\git.exe"
cd "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
%GIT% show HEAD:forge/forge-web-studio/app/components/ForgeApp.tsx > forge_head_full.txt
powershell -command "Get-Content forge_head_full.txt | Select-Object -Last 30 | Set-Content forge_tail.txt"
type forge_tail.txt
del forge_head_full.txt
pause
