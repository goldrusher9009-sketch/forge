[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$r = (New-Object System.Net.WebClient).DownloadString('https://forge-sand-two.vercel.app')
Write-Host "LENGTH: $($r.Length)"
# Find v6 or version references in the HTML
$lines = $r -split "`n"
foreach ($line in $lines) {
    if ($line -match "v6\.|v5\.|chunk|_next/static") {
        Write-Host $line.Trim()
    }
}
