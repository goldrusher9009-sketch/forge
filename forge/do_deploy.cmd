@echo off
cd /d C:\Users\teste\OneDrive\Documents\Claude\Projects\forge
git add -A
git commit -m "v6.10: fix TS return types in setup routes; OR auto-select paid model"
git push origin main
echo EXIT_CODE=%ERRORLEVEL%
