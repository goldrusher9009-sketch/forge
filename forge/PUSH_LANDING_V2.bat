@echo off
REM Deploy ForgeOS landing v2 — run from repo root on Windows
cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
"C:\Program Files\Git\cmd\git.exe" add forge-web-studio/app/landing/page.tsx FORGE_MASTER_PLAN.md
"C:\Program Files\Git\cmd\git.exe" commit -m "ForgeOS landing v2: 3D neural hero + interactive module explorer w/ video slots; remove fabricated stats/testimonials"
"C:\Program Files\Git\cmd\git.exe" pull --rebase origin main
"C:\Program Files\Git\cmd\git.exe" push origin main
echo.
echo Done. Vercel auto-deploys from main in ~2 min.
echo Verify: https://forge-sand-two.vercel.app/landing
pause
