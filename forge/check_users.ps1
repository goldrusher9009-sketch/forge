$base = 'https://forge-production-2692.up.railway.app'
$out = 'C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\health_result.txt'

# Login
$loginBody = '{"email":"ssetest@forge.dev","password":"TestPass123!"}'
$loginResp = Invoke-WebRequest -Uri "$base/api/auth/login" -Method POST -Body $loginBody -ContentType 'application/json' -UseBasicParsing
"LOGIN RAW: $($loginResp.Content)" | Set-Content $out

$loginJson = $loginResp.Content | ConvertFrom-Json
$token = $loginJson.data.accessToken
if (-not $token) {
    "NO TOKEN in: $($loginResp.Content)" | Add-Content $out
    exit
}
"TOKEN OK: $($token.Substring(0,20))" | Add-Content $out

# Create thread
$threadResp = Invoke-WebRequest -Uri "$base/api/threads" -Method POST -Body '{"title":"SSE Fix Test"}' -ContentType 'application/json' -Headers @{Authorization="Bearer $token"} -UseBasicParsing
$threadId = ($threadResp.Content | ConvertFrom-Json).data.id
"THREAD: $threadId" | Add-Content $out

# Send SSE message
$msgBody = [System.Text.Encoding]::UTF8.GetBytes('{"content":"hello"}')
$req = [System.Net.HttpWebRequest]::Create("$base/api/threads/$threadId/messages")
$req.Method = 'POST'
$req.ContentType = 'application/json'
$req.Headers.Add('Authorization', "Bearer $token")
$req.Timeout = 15000
$req.ReadWriteTimeout = 15000
$reqStream = $req.GetRequestStream()
$reqStream.Write($msgBody, 0, $msgBody.Length)
$reqStream.Close()

$startTime = [DateTime]::Now
$resp = $req.GetResponse()
$elapsed = ([DateTime]::Now - $startTime).TotalSeconds
"RESPONSE in ${elapsed}s: $($resp.StatusCode) | $($resp.ContentType)" | Add-Content $out

$stream = $resp.GetResponseStream()
$buf = New-Object byte[] 65536
$deadline = [DateTime]::Now.AddSeconds(35)
$allText = ''
while ([DateTime]::Now -lt $deadline) {
    if ($stream.CanRead) {
        $count = $stream.Read($buf, 0, $buf.Length)
        if ($count -gt 0) {
            $chunk = [System.Text.Encoding]::UTF8.GetString($buf, 0, $count)
            $allText += $chunk
            "CHUNK[$count]: $chunk" | Add-Content $out
        } elseif ($count -eq 0) {
            "EOF" | Add-Content $out
            break
        }
    }
    Start-Sleep -Milliseconds 200
}
$stream.Close(); $resp.Close()
"DONE" | Add-Content $out
