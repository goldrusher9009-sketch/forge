# Forge Deploy Map — READ THIS FIRST

Updated 2026-09-29. Railway is retired. This map describes the deployed VPS/Vercel topology; `DEPLOY.md` defines the candidate Preview and promotion gates.

## TL;DR
- **Deployed line:** `sasaky/forge-pi-on-gdl` (Google Drive + Pi). The current commercial candidate is `sasaky/forge-commercial-launch-candidate`; verify its HEAD and acceptance evidence before deployment.
- **Backend:** VPS `ubuntu@135.148.52.149` (OVH, Ubuntu 24.04, Docker 29). Stack `/opt/forge-pi/forge-vps.compose.yml`, project `forge-pi`.
  Public hostname `https://forge-api.135-148-52-149.sslip.io` → nginx → Caddy gateway (loopback 3400) → platform.
  The gateway only forwards `/api/*` requests carrying `X-Forge-Gateway-Secret` (Vercel) or `Stripe-Signature` (webhook). Everything else is 404 by design. `/healthz` is open.
- **Frontend:** Vercel project `forge` (root `forge/forge-web-studio`), alias `forge-sand-two.vercel.app`.
  Browsers call same-origin `/api/*`; `app/api/[...path]/route.ts` proxies to the gateway using `FORGE_CONTROL_PLANE_API_URL` + `FORGE_CONTROL_PLANE_GATEWAY_SECRET` (Vercel prod env). There is no `NEXT_PUBLIC_API_*`.
- **Secrets:** `/opt/forge-pi/.env.forge-vps` (root, 0600). Contains admin, JWT, `CREDENTIAL_ENCRYPTION_KEY`, Pi worker token, sandbox HMAC, gateway secret, Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER/PRO/AGENCY`), `BILLING_REQUIRED=true`, `OPENROUTER_API_KEY` (platform model key), Google Drive OAuth.

## The repo is a MONOREPO
`goldrusher9009-sketch/forge` has other apps (`viva/`, `Flash`, `LocalZilla`, `VentBuddy`) sharing `main`. Real Forge is `forge/`. Never `git add -A` at the root.

## Deploy the backend
```bash
cd forge
tar --exclude=node_modules --exclude=.next --exclude=dist --exclude=.omc --exclude=.git \
    -czf /tmp/forge-sync.tgz forge-platform forge-pi-worker forge-sandbox-orchestrator forge-sandbox-runtime forge-vps.compose.yml forge-control-plane-tunnel.Caddyfile deploy
scp /tmp/forge-sync.tgz ubuntu@135.148.52.149:/opt/forge-pi/
ssh ubuntu@135.148.52.149 'cd /opt/forge-pi && tar xzf forge-sync.tgz && rm forge-sync.tgz && sudo bash deploy/vps/deploy.sh'
```
`deploy.sh` keeps the pinned domestic Docker, APT, and npm sources, builds the four images, and restarts with health waits. If building on the VPS is slow, transfer locally built images after verifying their identities; do not rewrite dependency sources during deployment.

## Deploy the frontend
Follow `DEPLOY.md`: build a protected Preview from the candidate branch, verify the external control plane and browser acceptance, then promote the exact accepted deployment. Direct production deployment is not the candidate release path.

## Verify
```bash
curl https://forge-api.135-148-52-149.sslip.io/healthz          # 200
curl https://forge-sand-two.vercel.app/api/health               # 200 via proxy
# full acceptance through the real path:
FORGE_BENCH_BASE=https://forge-sand-two.vercel.app FORGE_BENCH_EMAIL=... FORGE_BENCH_PASSWORD=... \
FORGE_BENCH_MODEL=anthropic/claude-sonnet-4.6 node forge-platform/scripts/forge-user-benchmark.cjs
```

## Ops on the VPS
- Backup: `forge-pi-backup.timer` daily 03:15 UTC → `/opt/forge-pi/backups/forge-auto-*.db.gz` (+sha256), each verified by an isolated restore drill.
- Monitor: `forge-pi-monitor.timer` every 5 min → `journalctl -t forge-pi-monitor`.
- Install/refresh: `sudo bash /opt/forge-pi/deploy/vps/ops/install-forge-pi-operations.sh`.
- Old stack `forge-private-isolated` (port 3401) and Apptopia (`api.apptopia.ai`, 80/443) also run on this host. Do not touch them.

## Stripe
Live account `acct_1TGr8NCJZMFTCOYk` (shared with Apptopia/NEXUS). Prices: `forge_starter` $29, `forge_pro` $99, `forge_agency` $299 monthly (lookup keys; see `1-STRIPE_PRODUCTION_SETUP.md` for the plan semantics). Webhook `we_1UDMKLCJZMFTCOYksmb42YlZ` → `/api/billing/webhook`, event `checkout.session.completed`.

## History
- 2026-06 → 2026-08: Railway backend `forge-production-2692.up.railway.app` (project `hearty-contentment`). Retired; do not deploy there.
- 2026-08-31: old line went to this VPS as `forge-private-isolated` (Cloudflare tunnel edge never received a token).
- 2026-09-07: Pi engine merged onto the old line, DB migrated, same-origin gateway live.
