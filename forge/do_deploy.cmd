@echo off
cd /d C:\Users\teste\OneDrive\Documents\Claude\Projects\forge
git add -A
git commit -m "v6.10: revert setup routes; fix OR auto-select paid model"
git push origin main
echo EXIT_CODE=%ERRORLEVEL%
