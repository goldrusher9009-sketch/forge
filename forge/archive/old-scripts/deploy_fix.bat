@echo off
cd /d "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
git add forge-platform/tsconfig.build.json forge-platform/src/index.ts
git commit -m "fix: add ES2022 lib so AbortSignal.timeout compiles on Railway (fixes build failure)"
git push origin main
echo DONE
