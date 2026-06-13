@echo off
cd /d C:\Users\teste\OneDrive\Documents\Claude\Projects\forge
git add -A
git commit -m "v6.13: complete Railway keep-alive fix for Workspace chat endpoint"
git push origin main
echo EXIT_CODE=%ERRORLEVEL%
