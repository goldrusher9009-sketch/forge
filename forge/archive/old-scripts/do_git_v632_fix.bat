@echo off
cd /d C:\Users\teste\OneDrive\Documents\Claude\Projects\forge
echo === Git Status ===
git status
echo === Git Log ===
git log --oneline -5
echo === Git Push ===
git push origin main
echo === Done ===
pause
