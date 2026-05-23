@echo off
cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\forge-platform"
npm install
npx tsc -p tsconfig.build.json --noEmit 2>&1
echo EXIT:%ERRORLEVEL%
