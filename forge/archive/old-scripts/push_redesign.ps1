$git = "C:\Program Files\Git\cmd\git.exe"
$repo = "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
& $git -C $repo add forge-web-studio/app/components/ForgeApp.tsx
& $git -C $repo commit -m "feat: fix emoji encoding, red Claude theme, neon color-cycling logo"
& $git -C $repo push
Write-Host "Push complete"
