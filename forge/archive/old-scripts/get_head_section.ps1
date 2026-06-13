$git = "C:\Program Files\Git\cmd\git.exe"
$repo = "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
$lines = & $git -C $repo show HEAD:forge/forge-web-studio/app/components/ForgeApp.tsx
$total = $lines.Count
Write-Host "Total lines: $total"
# Print lines 3688 to end (0-indexed: 3687 to end)
$lines[3687..($total-1)] | ForEach-Object { Write-Host $_ }
