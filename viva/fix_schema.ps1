$p = 'C:\Users\teste\OneDrive\Documents\Claude\Projects\viva\apps\api\prisma\schema.prisma'
$s = Get-Content $p -Raw
$s2 = $s -replace 'provider = "postgresql"', 'provider = "sqlite"'
Set-Content $p $s2 -NoNewline
Get-Content $p | Select-String 'provider'
Write-Host 'SCHEMA_DONE'
