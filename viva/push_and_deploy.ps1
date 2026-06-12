Set-Location 'C:\Users\teste\OneDrive\Documents\Claude\Projects\viva'

Write-Host "=== GIT STATUS ===" -ForegroundColor Cyan
git status --short | Select-Object -Last 10

Write-Host "`n=== GIT PUSH ===" -ForegroundColor Cyan
git add -A
git commit -m "fix: clean deploy config" 2>&1 | Select-Object -Last 3
git push -u origin main --force 2>&1
Write-Host "PUSH_EXIT:$LASTEXITCODE"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=== TRIGGERING VERCEL DEPLOY ===" -ForegroundColor Green
    $body = @{
        name = "viva-platform"
        project = "prj_We3nonqaiS7UEXzZDMJbRj9IX87q"
        target = "production"
        gitSource = @{
            type = "github"
            org = "goldrusher9009-sketch"
            repo = "viva-platform"
            ref = "main"
        }
    } | ConvertTo-Json -Depth 5

    $resp = Invoke-RestMethod -Uri "https://api.vercel.com/v13/deployments" `
        -Method POST `
        -Headers @{ Authorization = "Bearer $env:VERCEL_TOKEN"; "Content-Type" = "application/json" } `
        -Body $body

    Write-Host "Deploy ID: $($resp.id)"
    Write-Host "URL: https://$($resp.url)"
    Write-Host "State: $($resp.readyState)"
} else {
    Write-Host "Push failed — fix git auth first" -ForegroundColor Red
}
