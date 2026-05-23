$git = "C:\Program Files\Git\cmd\git.exe"
$repo = "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
& $git -C $repo add forge-platform/src/index.ts forge-web-studio/app/components/ForgeApp.tsx
& $git -C $repo commit -m "fix: raise LLM timeout 25s->90s, add 95s client abort so chat never sticks on thinking"
& $git -C $repo push
Write-Host "Push complete"
