$git = "C:\Program Files\Git\cmd\git.exe"
$repo = "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
& $git -C $repo add forge-web-studio/app/components/ForgeApp.tsx
& $git -C $repo commit -m "fix: wake-ping Railway on mount, default forge-pro model, 100s safety timer to always clear thinking"
& $git -C $repo push
Write-Host "Push complete"
