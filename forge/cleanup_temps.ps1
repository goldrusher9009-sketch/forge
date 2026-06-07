$files = @(
  'forge-web-studio/app/components/ForgeApp_4223461.tsx',
  'forge-web-studio/app/components/ForgeApp_old.tsx',
  'forge-web-studio/app/components/ForgeApp_orig.tsx',
  'forge-web-studio/app/components/ForgeApp_5603.tsx',
  'forge-web-studio/app/components/ForgeApp_d8f.tsx'
)
foreach ($f in $files) {
  $p = "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\$f"
  if (Test-Path $p) { Remove-Item $p; Write-Host "Deleted $f" }
}
