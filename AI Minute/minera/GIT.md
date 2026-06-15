# Getting Minera onto GitHub

Two ways — pick one.

## Option A — push the working folder directly (simplest)
From inside the `minera/` folder:
```bash
git init
git add -A
git commit -m "Minera v0.1.0"
git branch -M main
git remote add origin https://github.com/YOU/minera.git   # create an EMPTY repo first
git push -u origin main
```
Or just run the helper:
```bash
git init && git add -A && git commit -m "Minera v0.1.0"
bash push.sh https://github.com/YOU/minera.git
```

## Option B — restore from the bundle (full history, already committed)
`minera.bundle` contains the repo with its first commit already made.
```bash
git clone minera.bundle minera-from-bundle
cd minera-from-bundle
git remote add origin https://github.com/YOU/minera.git
git push -u origin main
```

## Notes
- Create the GitHub repo EMPTY (no README/license) so the first push isn't rejected.
- `node_modules/`, `dist/`, and the SQLite `data/` are git-ignored.
- 142 files tracked.
