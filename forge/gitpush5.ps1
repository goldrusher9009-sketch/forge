Set-Location "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
$git = "C:\Program Files\Git\cmd\git.exe"
$out = @()
$out += "ADD:" + (& $git add "forge-web-studio/app/components/ForgeApp.tsx" "forge-platform/src/index.ts" "VERSION.md" 2>&1 | Out-String)
$out += "COMMIT:" + (& $git commit -m "fix: OpenRouter 429 rate-limit friendly error + bump v6.35" 2>&1 | Out-String)
$out += "PUSH:" + (& $git push origin main 2>&1 | Out-String)
$out += "LOG:" + (& $git log --oneline -4 2>&1 | Out-String)
$out | Set-Content "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\gitout7.txt" -Encoding UTF8
