Set-Location "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
$git = "C:\Program Files\Git\cmd\git.exe"
$out = @()
$out += "LOG:" + (& $git log --oneline -4 2>&1 | Out-String)
$out += "STATUS:" + (& $git status --short 2>&1 | Out-String)
$out | Set-Content "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\gitcheck_out.txt" -Encoding UTF8
