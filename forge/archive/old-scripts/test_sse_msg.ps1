$base = 'https://forge-production-2692.up.railway.app'

# Login
$loginBody = '{"email":"goldrusher9009@gmail.com","password":"testpass123"}'
try {
    $loginResp = Invoke-WebRequest -Uri "$base/api/auth/login" -Method POST -Body $loginBody -ContentType 'application/json' -UseBasicParsing
    $loginJson = $loginResp.Content | ConvertFrom-Json
    $token = $loginJson.data.token
} catch {
    "LOGIN FAILED: $_" | Set-Content 'C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\sse_msg_result.txt'
    exit
}

if (-not $token) {
    "NO TOKEN: $($loginResp.Content)" | Set-Content 'C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\sse_msg_result.txt'
    exit
}

"TOKEN OK: $($token.Substring(0,20))..." | Out-File 'C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\sse_msg_result.txt'

# Get threads
$threadsResp = Invoke-WebRequest -Uri "$base/api/threads" -Headers @{Authorization="Bearer $token"} -UseBasicParsing
$threadsJson = $threadsResp.Content | ConvertFrom-Json
$threads = $threadsJson.data

if ($threads.Count -eq 0) {
    # Create a thread
    $newThread = Invoke-WebRequest -Uri "$base/api/threads" -Method POST -Body '{"title":"SSE Test"}' -ContentType 'application/json' -Headers @{Authorization="Bearer $token"} -UseBasicParsing
    $threadId = ($newThread.Content | ConvertFrom-Json).data.id
} else {
    $threadId = $threads[0].id
}

"THREAD ID: $threadId" | Add-Content 'C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\sse_msg_result.txt'

# Send message and read SSE stream
$msgBody = '{"content":"Say exactly: OK"}'
$req = [System.Net.HttpWebRequest]::Create("$base/api/threads/$threadId/messages")
$req.Method = 'POST'
$req.ContentType = 'application/json'
$req.Headers.Add('Authorization', "Bearer $token")
$req.Timeout = 60000
$req.ReadWriteTimeout = 60000
$bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($msgBody)
$req.ContentLength = $bodyBytes.Length
$reqStream = $req.GetRequestStream()
$reqStream.Write($bodyBytes, 0, $bodyBytes.Length)
$reqStream.Close()

$resp = $req.GetResponse()
"STATUS: $($resp.StatusCode)" | Add-Content 'C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\sse_msg_result.txt'
"CONTENT-TYPE: $($resp.ContentType)" | Add-Content 'C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\sse_msg_result.txt'

$stream = $resp.GetResponseStream()
$reader = New-Object System.IO.StreamReader($stream)
$lines = @()
$timeout = [DateTime]::Now.AddSeconds(40)
while ([DateTime]::Now -lt $timeout) {
    if ($reader.EndOfStream) { break }
    $line = $reader.ReadLine()
    $lines += $line
    "LINE: $line" | Add-Content 'C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\sse_msg_result.txt'
    if ($line -match '"type":"result"') { break }
}
$reader.Close()
$resp.Close()
"DONE" | Add-Content 'C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\sse_msg_result.txt'
