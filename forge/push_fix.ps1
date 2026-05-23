$git = "C:\Program Files\Git\cmd\git.exe"
$repo = "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"

# Check line count first
$lines = (Get-Content "$repo\forge-web-studio\app\components\ForgeApp.tsx").Count
Write-Host "ForgeApp.tsx lines: $lines"

# Show last 5 lines
$content = Get-Content "$repo\forge-web-studio\app\components\ForgeApp.tsx"
Write-Host "Last 5 lines:"
$content[($lines-5)..($lines-1)] | ForEach-Object { Write-Host $_ }

# Add and commit
& $git -C $repo add forge-web-studio/app/components/ForgeApp.tsx
& $git -C $repo commit -m "fix: repair truncated ForgeApp.tsx - remove duplicate orphaned JSX block"
& $git -C $repo push
Write-Host "Push complete"
