$git = "C:\Program Files\Git\cmd\git.exe"
$repo = "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
$lines = & $git -C $repo show HEAD:forge/forge-web-studio/app/components/ForgeApp.tsx
$total = $lines.Count
Write-Host "Total lines: $total"
$lines[($total-100)..($total-1)] | ForEach-Object { Write-Host $_ }
