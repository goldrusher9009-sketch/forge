Set-Location 'C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\forge-web-studio'
& npx tsc --noEmit 2>&1 | Select-Object -First 50
