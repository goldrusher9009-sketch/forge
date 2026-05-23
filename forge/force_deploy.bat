@echo off
cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
git commit --allow-empty -m "chore: force Railway redeploy"
git push origin main
echo DONE
