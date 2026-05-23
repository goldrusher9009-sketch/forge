@echo off
cd /d C:\Users\teste\OneDrive\Documents\Claude\Projects\forge
git add -A
git commit -m "v6.9: fix OpenRouter default model and add setup endpoint"
git push origin main
echo EXIT_CODE=%ERRORLEVEL%
