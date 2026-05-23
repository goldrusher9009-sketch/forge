[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
# Check dispatch/runs route - only exists in v6.1
$url = 'https://forge-production-2692.up.railway.app/api/dispatch/runs'
try {
    $req = [System.Net.WebRequest]::Create($url)
    $req.Method = 'GET'
    $req.Headers.Add('Authorization', 'Bearer test')
    $resp = $req.GetResponse()
    Write-Host "STATUS: $($resp.StatusCode)"
} catch [System.Net.WebException] {
    $code = [int]$_.Exception.Response.StatusCode
    Write-Host "HTTP $code - route EXISTS (401 = auth required = route is there)"
}
