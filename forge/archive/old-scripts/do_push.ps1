$git = "C:\Program Files\Git\cmd\git.exe"
$repo = "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge"
& $git -C $repo add forge-web-studio/next.config.js forge-web-studio/app/components/ForgeApp.tsx forge-web-studio/package.json
& $git -C $repo commit -m "chore: v6.1.0 force Vercel rebuild"
& $git -C $repo push
echo done
