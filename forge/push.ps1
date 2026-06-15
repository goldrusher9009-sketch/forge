Set-Location 'C:\Users\teste\OneDrive\Documents\Claude\Projects'
$git = 'C:\Program Files\Git\cmd\git.exe'
& $git add forge/forge-web-studio/app/components/ForgeApp.tsx
& $git add forge/forge-platform/src/index.ts
& $git add forge/forge-platform/src/__tests__/route-manifest.test.ts
& $git status
& $git commit -m "feat: marketplace 4-tab upgrade + trust ladder + outcome ledger panels"
& $git push origin main
