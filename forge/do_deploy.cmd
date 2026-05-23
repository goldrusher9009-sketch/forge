@echo off
cd /d C:\Users\teste\OneDrive\Documents\Claude\Projects\forge
git add -A
git commit -m "v6.12: fix deepseek routed to Groq instead of OpenRouter"
git push origin main
echo EXIT_CODE=%ERRORLEVEL%
