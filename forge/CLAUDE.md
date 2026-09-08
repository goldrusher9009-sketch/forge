# Forge Platform — CLAUDE.md

## ⚠️ READ DEPLOY_MAP.md FIRST
Before any deploy/debug work, read `DEPLOY_MAP.md`. Key facts: the GitHub repo
`goldrusher9009-sketch/forge` is a MONOREPO — real Forge is in the `forge/` subfolder;
`viva/`, `Flash`, etc. are OTHER apps sharing `main`, so deploy commit messages lie.
**Production (since 2026-09-07) is the VPS `ubuntu@135.148.52.149` + Vercel, branch
`sasaky/forge-pi-on-gdl`. Railway is retired.** Details: `FORGE_PI_ON_PRODUCTION_LINE.md`.

## What This Is
Client-portal SaaS where users bring their own LLM API keys (Anthropic, OpenAI, Gemini, Groq, Mistral, OpenRouter). Platform-wide keys come from env (`OPENROUTER_API_KEY` today) or the admin DB table, gated by the commercial BYOK policy in `getUserKey()`.

## Live URLs
- Frontend: https://forge-sand-two.vercel.app (Vercel; `npx vercel deploy --prod --yes` from the monorepo root, main checkout only)
- Backend: VPS 135.148.52.149, `/opt/forge-pi`, `forge-vps.compose.yml`. Public only via the secret-gated gateway
  `https://forge-api.135-148-52-149.sslip.io`; direct calls without `X-Forge-Gateway-Secret` get 404 by design.
  Browsers reach it through Vercel's same-origin `/api` proxy (`forge-web-studio/app/api/_forgeProxy.ts`).
- Local repo: `D:\zjh\self\Hash\forge` (branch `sasaky/forge-pi-on-gdl`)

## Folder Structure
```
forge/
├── forge-platform/            # Backend (Node/TypeScript, Express, SQLite); src/index.ts has all routes
├── forge-pi-worker/           # Isolated Pi SDK worker (Node 24)
├── forge-sandbox-orchestrator/# Docker-socket boundary for per-Run sandboxes; egress proxy
├── forge-sandbox-runtime/     # Sandbox container image (shell/browser tools)
├── forge-web-studio/          # Frontend (Next.js); app/components/ForgeApp.tsx is BOM-encoded, use bash grep
├── forge-vps.compose.yml      # Production stack
└── deploy/vps/                # deploy.sh, nginx vhost, ops/ (backup + monitor timers)
```

## Current State
- Agent engine: Pi (`forge-platform/src/pi-runtime.ts` gateway + `forge-pi-worker`); sandbox Runs with Class A/B/C approvals
- Billing live: Stripe subscriptions (`forge_starter/pro/agency`) + prepaid overage; `BILLING_REQUIRED=true`
- Google Drive import/write-back (drive.file scope, approval-gated)
- SQLite at `/data/forge.db` in volume `forge-pi-platform-data`; daily verified backups in `/opt/forge-pi/backups`

## Architecture
- `getUserKey(userId, provider, allowPlatform)`: per-user DB key → `platform_api_keys` → `PROVIDER_ENV_KEYS`; with billing on, non-admins need an active paid plan for BYOK and only metered paths may use platform keys
- `/api/models` and `/api/models/available` resolve keys exactly like execution
- Model auto-select order: Anthropic → OpenAI → Gemini → Groq → Mistral → OpenRouter

## Common Mistakes to Avoid
- **ForgeApp.tsx has BOM encoding** — use `bash grep` not the Grep tool
- **Never truncate index.ts** — it's ~250k lines; narrow exact-match edits only
- **Read before edit** — always read the target section before editing large files
- **Deploying**: sync + `deploy/vps/deploy.sh` on the VPS (see `DEPLOY_MAP.md`); the Dockerfiles' China mirrors hang on the overseas VPS and the script rewrites them
- **dist/ is tracked** for forge-platform: rebuild with esbuild (index, sandbox-contract, sqlite-backup, pi-runtime; `--format=cjs`) before committing src changes
- **SQLite DB is persistent** in the VPS volume; don't drop tables without a migration plan
- **Line endings**: shell scripts and systemd units under `deploy/vps` must be LF (`.gitattributes` enforces it)
- **Local dev needs Node 20** for the platform (better-sqlite3 ABI) and Node 24 for the Pi worker
- Use a task list for multi-step work; keep messages short
