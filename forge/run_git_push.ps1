Set-Location "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
$result = & "C:\Program Files\Git\cmd\git.exe" log --oneline -5 2>&1
$result | Out-File "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\git_output.txt"
$push = & "C:\Program Files\Git\cmd\git.exe" push origin main 2>&1
$push | Out-File "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\git_output.txt" -Append
Write-Host "Done"
