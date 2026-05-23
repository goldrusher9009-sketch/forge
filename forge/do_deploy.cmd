@echo off
cd /d C:\Users\teste\OneDrive\Documents\Claude\Projects\forge
git add -A
git commit -m "v6.7: fix Gemini system messages, alternating roles, Gemini 2.5, max_tokens 4096, latest models"
git push origin main
echo EXIT_CODE=%ERRORLEVEL%
