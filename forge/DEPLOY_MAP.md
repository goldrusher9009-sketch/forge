# Forge Deploy Map — READ THIS FIRST

Saved 2026-06-13. The single source of truth for how Forge deploys. Verified live in production.

## TL;DR
- **Live backend:** https://forge-production-2692.up.railway.app
- **Live frontend:** https://forge-sand-two.vercel.app
- **GitHub repo:** https://github.com/goldrusher9009-sketch/forge (branch: `main`)
- Push to `main` → Railway auto-builds backend, Vercel auto-builds frontend.
- A deploy takes a few minutes. **Re-check the live endpoint before concluding a deploy failed.**

## CRITICAL: the repo is a MONOREPO
`goldrusher9009-sketch/forge` contains MULTIPLE separate apps in subfolders:
- `forge/`            ← **THE REAL FORGE** (Express + SQLite backend, Next.js frontend)
- `viva/`, `viva-platform-repo/`  ← VIVA (dating/twin/markets, Prisma/Next.js) — NOT Forge, do not touch
- `Flash`, `Flash_Backup`, `LocalZilla/nova-llm`, `VentBuddy`  ← other apps

Because every app shares one `main` branch, **the deploy commit messages often say "VIVA" / "notifications" / "feed/markets/twin" even when Forge code changed.** Don't be fooled by commit messages — check the actual file contents.

## Backend (Railway)
- Railway project name: **hearty-contentment** (random name — NOT "forge")
  - project id: `7f6bf5a3-d0ea-4469-b2a1-02e0b4330861`
  - service: **forge**  (id `dd4b75bd-ff82-4e8b-a3cb-f3b73d74e8a5`)
  - environment: **production** (id `b52fe1b6-e576-40f7-af17-983b2e406984`)
  - Railway build config: `/forge/forge-platform/railway.json`
  - Root dir served: `forge/forge-platform/`
- Backend source file (the big one, all routes): **`forge/forge-platform/src/index.ts`** in the repo
  - = local `C:\Users\teste\OneDrive\Documents\Claude\Projects\forge\forge-platform\src\index.ts`
- `npm run build` is a NO-OP (start runs ts-node on source). Verify with `tsc --noEmit` or the jest tests.

## Other Railway projects in this account (so I don't confuse them again)
17 projects total. Forge = hearty-contentment ONLY. Ignore:
- talented-purpose → viva-platform + Postgres
- motivated-intuition / positive-transformation → aacg-platform
- spectacular-gratitude, welcoming-art, pleasing-youth, grand-empathy, hearty-strength, satisfied-abundance → web/worker (other)
- glistening-flow → Redis/Postgres ; friendly-renewal → nexus-platform

## How to VERIFY a deploy (do this, don't assume)
From a browser on the railway.com origin you can read deploy status via GraphQL:
`backboard.railway.com/graphql/v2` → query `deployments(input:{projectId,environmentId,serviceId})`.
Simplest: just hit a live endpoint. GET `/api/forge-tools/catalog` (public) should return 200 JSON.
Auth-required routes return 401 (= route exists). A missing route returns `Cannot GET ...` (real 404).
POST-only routes (agent/run, tokens/stake, marketplace/install) return 404 on a GET — that's expected, test with POST.

## Push path (sandbox CANNOT git — must run Windows-side)
Run `PUSH_PHASE0.bat` (repo root) by double-clicking in File Explorer. It runs tests then pushes.
Sandbox git is blocked (stale config.lock on OneDrive mount). The bash mount also LAGS behind
real file writes — trust the Read/Edit tools and GitHub raw, not the bash mount's stale view.

## STATUS as of 2026-06-13
Phase 0 = DONE + DEPLOYED. Commit `7fe2fba` live at 22:41 UTC. Verified in prod:
forge-tools/catalog 200; tokens/balance, orgs, analytics/summary, billing/tiers, billing/invoices → 401 (live).
