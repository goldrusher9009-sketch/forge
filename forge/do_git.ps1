$git = 'C:\Program Files\Git\cmd\git.exe'
$repo = 'C:\Users\teste\OneDrive\Documents\Claude\Projects\forge'
$out = @()
$out += (& $git -C $repo add -A 2>&1)
$out += (& $git -C $repo commit -m 'sse-fix-5-safety-timeout-25s' 2>&1)
$out += (& $git -C $repo push origin main 2>&1)
$out -join "`n" | Set-Content ($repo + '\git_result.txt')
