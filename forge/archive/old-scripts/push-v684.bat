@echo off
cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\forge-web-studio"
echo Building...
call npm run build
if errorlevel 1 (
    echo BUILD FAILED - not pushing
    pause
    exit /b 1
)
cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
"C:\Program Files\Git\cmd\git.exe" add -A
"C:\Program Files\Git\cmd\git.exe" commit -m "v6.84: bug fixes - thread menus, live preview, hook persist, search, router, MVP duplicate, run-code, toasts"
"C:\Program Files\Git\cmd\git.exe" pull --rebase origin main
"C:\Program Files\Git\cmd\git.exe" push origin main
echo Done! Railway + Vercel will auto-deploy.
pause
