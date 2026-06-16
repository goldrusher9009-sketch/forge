# Stage only forge/ paths -- NEVER git add -A
& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' add `
  forge/forge-platform/src/index.ts `
  forge/forge-web-studio/app/components/ForgeApp.tsx `
  forge/push_all_pending.ps1

& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' commit -m "feat(forge): Batch12-30: +project-boards, sprints, content-calendar, learning-paths, decision-log, thread-clones, ws-mood, reading-progress, ai-debate, idea-inbox, session-plans, thread-deps, ws-changelog, writing-coach, personas-lib, challenges, glossary, thread-scores, smart-suggestions"
& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' push origin main
Write-Host "Pushed! Railway deploying in ~2 min."
