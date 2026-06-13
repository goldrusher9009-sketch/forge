# Read me first — morning brief (2026-06-13)

## TL;DR
I did real, verified work — and I found a problem you need to fix before deploying anything. **Do not deploy the backend until step 1 below is done.** Your live site is fine right now; nothing broken has been pushed.

## ✅ What's done and safe to ship
1. **ForgeOS landing v2** — `forge-web-studio/app/landing/page.tsx`. 3D animated hero + interactive module explorer with explainer-video slots. Type-checks clean. Fabricated stats/testimonials removed (legal/credibility risk). **Frontend-only — safe to deploy on its own.**
2. **Repo cleanup** — 105 throwaway files archived to `/archive/old-scripts/`. Root is clean.
3. **Plans written** — `FORGE_MASTER_PLAN.md` (this-session list + findings) and `FORGE_ROADMAP.md` (the full multi-session build plan you asked for).
4. **One-sentence onboarding endpoint** — added to `forge-platform/src/index.ts` (lines ~1903–1970): `POST /api/onboarding/from-sentence`. Type one sentence → LLM parses it → workspace provisions. This is the "fast first 60 seconds" retention hook. The code block itself is clean.

## ⚠️ The problem you must fix first (Step 1)
**`forge-platform/src/index.ts` is TRUNCATED on disk.** It ends mid-statement at line 4983:
```
app.post('/api/content/sms/send', requireAuth, async (req: any, res) =
```
Everything after that is missing — the rest of the SMS routes, other Phase-3 routes, the `setupAutonomy` wiring fix I made last session, and **`httpServer.listen()`**. Earlier this session the file was 4996 lines and intact; it got truncated during editing over the OneDrive mount (this is the "never truncate index.ts" hazard in CLAUDE.md, made worse by OneDrive sync).

**I deliberately did NOT reconstruct the missing tail from memory** — I never saw those exact lines in full, and guessing them would risk shipping a backend that won't start for all users. The clean fix is a git restore.

## Step 1 — Recover index.ts (Windows, in the repo)
```
cd C:\Users\teste\OneDrive\Documents\Claude\Projects\forge
"C:\Program Files\Git\cmd\git.exe" status
REM confirm the last GOOD committed index.ts is intact:
"C:\Program Files\Git\cmd\git.exe" show HEAD:forge-platform/src/index.ts | findstr /C:"httpServer.listen"
REM if that prints the listen line, the committed version is good. Restore it:
"C:\Program Files\Git\cmd\git.exe" checkout -- forge-platform/src/index.ts
```
Now the file is back to the last committed (intact) version. **It will NOT have my two new edits** — that's expected; re-apply them in Step 2.

## Step 2 — Re-apply my two backend edits to the restored file
Both are small, surgical, and documented here so you (or I, next session) can re-add them cleanly:

**Edit A — wire setupAutonomy** (fixes `/api/workspace/branding` 404s). Find the line `// ── Server Bootstrap ─` near the end and insert ABOVE it:
```ts
// Autonomy module routes (was imported but never wired)
try {
  setupAutonomy(app, db, { requireAuth, getUserLLMKey, callLLM, uuidv4 });
  console.log('✅ setupAutonomy wired');
} catch (e: any) { console.error('setupAutonomy failed:', e?.message || e); }
```

**Edit B — one-sentence onboarding.** The full endpoint is preserved in `PATCH_onboarding_from_sentence.ts` in the repo root (I saved it there). Paste its contents right after the existing `POST /api/onboarding` handler closes (after its `});`, before the `// ── CREDITS ─` comment).

## Step 3 — Verify, then deploy (awake)
```
cd forge-platform && npx tsc --noEmit --skipLibCheck -p tsconfig.json
```
Expect zero errors in index.ts. Then push with `PUSH_FORGE.bat`. Watch the Railway deploy go green. Verify:
- https://forge-production-2692.up.railway.app/health  → v6.99
- https://forge-production-2692.up.railway.app/api/workspace/branding → NOT 404

## Why I didn't just push it for you tonight
Pushing a truncated `index.ts` would take the backend down for every user the moment Railway redeployed, with no one awake to roll back. The landing page is frontend-only and safe, but the backend needs your eyes for 5 minutes. That's the difference between shipping and breaking — and I'd rather hand you a working product in the morning than a broken one at 4am.
