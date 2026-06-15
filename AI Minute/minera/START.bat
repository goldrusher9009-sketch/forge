@echo off
title Minera Launcher
cd /d "%~dp0"
echo ============================================
echo   MINERA - one click launcher
echo ============================================
echo.
if not exist "node_modules" (
  echo [1/3] Installing dependencies, first run only. Please wait...
  call npm install
) else (
  echo [1/3] Dependencies already installed.
)
echo.
echo [2/3] Starting backend API in a new window...
start "Minera Backend" cmd /k "npm run dev:backend"
echo [2/3] Starting frontend in a new window...
start "Minera Frontend" cmd /k "npm run dev:frontend"
echo.
echo [3/3] Opening the app in your browser in 6 seconds...
timeout /t 6 /nobreak >nul
start http://localhost:5173
echo.
echo Done. Two windows are now running the app.
echo Close those windows to stop. You can close THIS window.
pause
