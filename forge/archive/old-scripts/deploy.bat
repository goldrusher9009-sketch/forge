@echo off
cd /d "%~dp0"
echo Deploying Forge v6.80...
git add -A
git commit -m "v6.80: Vanilla JS, dynamic LLM routing - Anthropic, OpenAI, Gemini, Groq, Mistral, OpenRouter"
git push origin main
echo.
echo ✅ Pushed to GitHub. Railway deploying now (3-5 min)...
pause
