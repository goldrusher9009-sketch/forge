@echo off
cd /d C:\Users\teste\OneDrive\Documents\Claude\Projects\forge
git add -A
git commit -m "v6.11: fix OR models no-key display and stuck thinking timeout"
git push origin main
echo EXIT_CODE=%ERRORLEVEL%
