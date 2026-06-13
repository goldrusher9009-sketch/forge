$git = "C:\Program Files\Git\cmd\git.exe"
$repo = "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
& $git -C $repo add forge-web-studio/app/components/ForgeApp.tsx
& $git -C $repo commit -m "fix(v6.1): thinking-disappears, morph removed, stop button, queue, 180s timeout, credential vault, live TV status"
& $git -C $repo push
Write-Host "Push complete"
