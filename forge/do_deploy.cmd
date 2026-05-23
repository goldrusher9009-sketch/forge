@echo off
cd /d C:\Users\teste\OneDrive\Documents\Claude\Projects\forge
git add -A
git commit -m "v6.10: fix OR auto-select to prefer paid model over slow free models"
git push origin main
echo EXIT_CODE=%ERRORLEVEL%
