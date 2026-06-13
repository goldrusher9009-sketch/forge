Set-Location "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
$git = "C:\Program Files\Git\cmd\git.exe"
$out = @()
$out += "ADD:" + (& $git add "forge-platform/src/index.ts" 2>&1 | Out-String)
$out += "COMMIT:" + (& $git commit -m "fix: 429 rate-limit error in callOpenAICompatWithTools (ForgeMagic path)" 2>&1 | Out-String)
$out += "PUSH:" + (& $git push origin main 2>&1 | Out-String)
$out += "LOG:" + (& $git log --oneline -4 2>&1 | Out-String)
$out | Set-Content "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\gitout8.txt" -Encoding UTF8
