node "C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\add_ratings.js"
& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' add forge/forge-platform/src/index.ts forge/forge-web-studio/app/components/ForgeApp.tsx forge/add_ratings.js
& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' commit -m 'feat(forge): Message ratings (thumbs up/down) + usage budget alerts at 80%/100%'
& 'C:\Program Files\Git\cmd\git.exe' -C 'C:\Users\teste\OneDrive\Documents\Claude\Projects' push origin main
