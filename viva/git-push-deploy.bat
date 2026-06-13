@echo off
echo === Pushing to GitHub to trigger Railway deploy ===
cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\viva"
git add -A
git commit -m "fix: set Railway root to apps/api, add notifications router"
git push origin main
echo === Done. Railway will auto-deploy in ~2-3 minutes ===
pause
