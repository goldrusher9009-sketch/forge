@echo off
REM === SAFE: deploys ONLY the frontend landing v2 + docs. Does NOT touch backend. ===
REM Backend index.ts is truncated — see READ_ME_FIRST_MORNING.md before deploying it.
cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
set GIT="C:\Program Files\Git\cmd\git.exe"

%GIT% add forge-web-studio/app/landing/page.tsx FORGE_MASTER_PLAN.md FORGE_ROADMAP.md READ_ME_FIRST_MORNING.md PATCH_onboarding_from_sentence.ts archive/
%GIT% commit -m "ForgeOS landing v2 (3D hero + module explorer + video slots); roadmap + plans; repo cleanup (archive 105 files). Backend NOT included - see READ_ME_FIRST_MORNING.md"
%GIT% pull --rebase origin main
%GIT% push origin main

echo.
echo ============================================================
echo Pushed FRONTEND + docs only. Vercel auto-deploys landing.
echo Verify: https://forge-sand-two.vercel.app/landing
echo.
echo Backend (index.ts) was NOT pushed - it is truncated.
echo Fix it first: open READ_ME_FIRST_MORNING.md
echo ============================================================
pause
