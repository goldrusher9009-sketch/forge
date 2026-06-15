Set-Location 'C:\Users\teste\OneDrive\Documents\Claude\Projects'
$git = 'C:\Program Files\Git\cmd\git.exe'
& $git add forge/forge-web-studio/app/components/ForgeApp.tsx
& $git commit -m "feat(forge): moat layer 4 - agency nav + BYO-key savings banner in sidebar"
& $git push origin main
