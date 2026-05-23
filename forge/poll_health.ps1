$out = 'C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\health_result.txt'
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep 10
    $r = Invoke-WebRequest -Uri 'https://forge-production-2692.up.railway.app/health' -UseBasicParsing
    $r.Content | Set-Content $out
    if ($r.Content -match 'sse-fix-6') { break }
}
