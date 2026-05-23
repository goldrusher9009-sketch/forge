# Check Vercel deployments to see what's happening
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$token = $env:VERCEL_TOKEN
if (-not $token) {
    Write-Host "No VERCEL_TOKEN env var set"
    # Try to find it in .env or local config
    $envFile = "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\forge-web-studio\.env.local"
    if (Test-Path $envFile) {
        Get-Content $envFile
    } else {
        Write-Host "No .env.local found either"
    }
}
