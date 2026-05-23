@echo off
cd /d C:\Users\teste\OneDrive\Documents\Claude\Projects\forge
git add -A
git commit -m "v6.10: restore truncated index.ts with app.listen fix Railway 502"
git push origin main
echo EXIT_CODE=%ERRORLEVEL%
