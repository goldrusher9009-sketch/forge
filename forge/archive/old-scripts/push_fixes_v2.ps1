$git = "C:\Program Files\Git\cmd\git.exe"
$repo = "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
& $git -C $repo add forge-web-studio/app/components/ForgeApp.tsx
& $git -C $repo commit -m "feat: stop button, parallel queue, 180s timeout, hide morph, live TV status, website credential vault"
& $git -C $repo push
Write-Host "Push complete"
