Set-Location "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
$git = "C:\Program Files\Git\cmd\git.exe"
$out = @()
$out += "ADD:" + (& $git add "forge-web-studio/app/components/ForgeApp.tsx" "VERSION.md" 2>&1 | Out-String)
$out += "COMMIT:" + (& $git commit -m "chore: v6.33 smoke test complete" 2>&1 | Out-String)
$out += "PUSH:" + (& $git push origin main 2>&1 | Out-String)
$out += "LOG:" + (& $git log --oneline -3 2>&1 | Out-String)
$out | Set-Content "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\gitout3.txt" -Encoding UTF8
