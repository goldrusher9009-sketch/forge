npm install -g typescript@5.4.5 2>&1 | Select-Object -Last 3
Write-Host "GLOBAL_TS:$LASTEXITCODE"
tsc --version 2>&1
