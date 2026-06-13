@echo off
cd /d "%~dp0apps\api"
echo Deploying from: %CD%
railway up --service viva-platform
