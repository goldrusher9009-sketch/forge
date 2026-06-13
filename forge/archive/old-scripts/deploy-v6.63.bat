@echo off
REM Deploy v6.63 to Vercel
cd /d C:\Users\teste\OneDrive\Documents\Claude\Projects\forge

echo [1/4] Git status
git status

echo [2/4] Building locally
cd forge-web-studio
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo BUILD FAILED
    exit /b 1
)

echo [3/4] Pushing to main
cd ..
git add .
git commit -m "v6.63-verified: onboarding, search, slash, panel, empty state, MVP fix"
git pull --rebase
git push

echo [4/4] Deploy complete
echo Check https://forge-sand-two.vercel.app in 2 min
pause
