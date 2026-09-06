# Forge VPS deployment

Host: the Forge VPS `ubuntu@135.148.52.149` (Ubuntu 24.04, Docker 29, nginx + certbot on the host). It also runs the older `forge-private-isolated` stack on 3401 and Apptopia on 80/443; this stack sits beside them on loopback 3400. The China mirrors in the Dockerfiles hang from this overseas host, so deploy.sh rewrites them to official sources.
Everything lives in `/opt/forge-pi` (a copy of this `forge/` folder without node_modules).

## Files
- `forge-vps.compose.yml` — platform, Pi worker, sandbox orchestrator/egress, runtime image.
- `deploy/vps/nginx-forge-api.conf` — TLS vhost for `forge-api.135-148-52-149.sslip.io` → `127.0.0.1:3400`.
- `deploy/vps/deploy.sh` — build images and start the stack on the VPS.
- `/opt/forge-pi/.env.forge-vps` — secrets (never committed). Required keys:
  `JWT_SECRET CREDENTIAL_ENCRYPTION_KEY ADMIN_EMAIL ADMIN_PASSWORD FRONTEND_URL
   FORGE_PI_WORKER_TOKEN FORGE_SANDBOX_HMAC_SECRET FORGE_SANDBOX_EGRESS_ALLOWLIST`
  (the allowlist may be empty = any public host; private IPs are always blocked).

## Sync + deploy from a workstation
```bash
cd forge
tar --exclude=node_modules --exclude=.next --exclude=dist --exclude=.omc --exclude=.git \
    -czf /tmp/forge-sync.tgz forge-platform forge-pi-worker forge-sandbox-orchestrator forge-sandbox-runtime forge-vps.compose.yml deploy
scp /tmp/forge-sync.tgz ubuntu@135.148.52.149:/opt/forge-pi/
ssh ubuntu@135.148.52.149 'cd /opt/forge-pi && tar xzf forge-sync.tgz && rm forge-sync.tgz && bash deploy/vps/deploy.sh'
```

## Verify
```bash
curl https://forge-api.135-148-52-149.sslip.io/ready
```
Then run the user benchmark against it:
```bash
FORGE_BENCH_BASE=https://forge-api.135-148-52-149.sslip.io FORGE_BENCH_EMAIL=... FORGE_BENCH_PASSWORD=... \
FORGE_BENCH_MODEL=claude-sonnet-4-6 FORGE_BENCH_ANTHROPIC_KEY=... node forge-platform/scripts/forge-user-benchmark.cjs
```

## Frontend
Vercel project `forge` (root `forge/forge-web-studio`) with
`NEXT_PUBLIC_API_BASE_URL=https://forge-api.135-148-52-149.sslip.io/api` and `NEXT_PUBLIC_API_URL=https://forge-api.135-148-52-149.sslip.io`.
`FRONTEND_URL` in `.env.forge-vps` must equal the Vercel production origin (CORS).
