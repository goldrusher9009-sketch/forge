# Check typescript anywhere in tree
$paths = @(
  'C:\Users\teste\OneDrive\Documents\Claude\Projects\viva\node_modules\typescript',
  'C:\Users\teste\OneDrive\Documents\Claude\Projects\viva\apps\api\node_modules\typescript',
  'C:\Users\teste\OneDrive\Documents\Claude\Projects\viva\apps\api\node_modules\.bin\tsc'
)
foreach ($p in $paths) { Write-Host "$p : $(Test-Path $p)" }
