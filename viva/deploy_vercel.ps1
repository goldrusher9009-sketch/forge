$t = "$env:VERCEL_TOKEN"
Set-Location "C:\Users\teste\OneDrive\Documents\Claude\Projects\viva"
git add apps/web/vercel.json
git commit -m "fix vercel.json"
git push origin main
Set-Location "C:\Users\teste\OneDrive\Documents\Claude\Projects\viva\apps\web"
npx vercel --prod --yes --token $t --scope goldrusher9009-2266s-projects
