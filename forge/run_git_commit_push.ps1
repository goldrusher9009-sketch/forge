Set-Location "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
$git = "C:\Program Files\Git\cmd\git.exe"
$results = [System.Collections.Generic.List[string]]::new()

$results.Add("=== ADD ===")
& $git add "forge-web-studio/app/components/ForgeApp.tsx" "VERSION.md" 2>&1 | ForEach-Object { $results.Add($_) }

$results.Add("=== COMMIT ===")
& $git commit -m "chore: bump to v6.33, full smoke test passed, backend tool infrastructure" 2>&1 | ForEach-Object { $results.Add($_) }

$results.Add("=== PUSH ===")
& $git push origin main 2>&1 | ForEach-Object { $results.Add($_) }

$results.Add("=== LOG ===")
& $git log --oneline -3 2>&1 | ForEach-Object { $results.Add($_) }

$results | Set-Content "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\git_output2.txt" -Encoding UTF8
Write-Host "DONE"
