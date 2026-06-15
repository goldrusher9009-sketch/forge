$f = 'C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\forge-web-studio\app\components\ForgeApp.tsx'
$lines = [System.IO.File]::ReadAllLines($f)
$idx = 0
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match 'SENTINEL_END') { $idx = $i; break }
}
Write-Host "sentinel at line $($idx + 1) of $($lines.Length)"
$out = $lines[0..($idx - 1)]
[System.IO.File]::WriteAllLines($f, $out)
Write-Host "done: $($out.Length) lines"
