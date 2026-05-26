@echo off
cd /d C:\Users\teste\OneDrive\Documents\Claude\Projects\forge
git add forge-platform/src/index.ts
git commit -m "fix httpServer undefined"
git push origin main
