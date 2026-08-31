# Forge Cloudflare Tunnel ingress runbook

## Purpose and boundary

Use this ingress on a Forge VPS where another product already owns public ports
80/443. It does not replace or modify the existing Nginx service, does not
publish Forge ports 3301/3401, and does not attach `cloudflared` directly to the
Forge control network.

```text
Vercel same-origin /api route
  -> Cloudflare HTTPS hostname
  -> remotely managed named Tunnel
  -> cloudflared on forge-private-edge only
  -> secret-gated internal Caddy gateway
  -> forge-platform:3000 on forge-sandbox-control
```

This is an alternative to `forge-vps-caddy.compose.yml`. Never start both edge
stacks for the same hostname. The direct Caddy stack is for a dedicated host
whose ports 80/443 are available; this Tunnel stack is for a shared host.

## Pinned domestic images

- Caddy: `docker.m.daocloud.io/library/caddy:2.10.2-alpine@sha256:4c6e91c6ed0e2fa03efd5b44747b625fec79bc9cd06ac5235a779726618e530d`
- cloudflared: `docker.m.daocloud.io/cloudflare/cloudflared:2026.8.2@sha256:0aa26e284f05e6c77ae375b8c9c11d9eb6a448fb7bcd8d40f31cb6176189eb38`

The cloudflared digest is a multi-architecture manifest; the VPS deployment is
explicitly pinned to `linux/amd64`. Do not replace either digest with `latest`.

## External prerequisites

1. Register the final domain and manage the relevant DNS zone in Cloudflare.
2. Create a remotely managed named Tunnel in Cloudflare Zero Trust.
3. Add one public hostname, for example `api-forge.example.com`.
4. Set that hostname's service to
   `http://forge-control-plane-tunnel-gateway:8080`.
5. Obtain the named Tunnel token. Do not use a Quick Tunnel for a candidate or
   production deployment.
6. Choose the final Vercel frontend hostname, for example
   `forge.example.com`.

The Tunnel hostname is an infrastructure endpoint. Browser traffic must remain
same-origin under the Vercel frontend's `/api/*` route.

## Secret storage

Store the Tunnel token outside every Git checkout and release directory:

```text
/opt/forge-private-isolated/shared/cloudflared-token
```

The file must be owned by UID/GID `65532:65532`, which is the non-root identity
in the pinned cloudflared image, and must have mode `0400`. Enter or provision
the token through the approved secret store; do not put it in a command line,
shell history, Compose environment, Git, logs, or chat.

The edge environment must contain only references and the independently
generated gateway secret:

```dotenv
CLOUDFLARE_TUNNEL_TOKEN_FILE=/opt/forge-private-isolated/shared/cloudflared-token
FORGE_CONTROL_PLANE_GATEWAY_SECRET=<high-entropy value shared with Vercel>
FORGE_EXPECTED_NGINX_CONFIG_SHA256=<approved sha256 of sudo nginx -T>
```

Keep this environment file outside the release directory with mode `0600`.
The Tunnel token and gateway secret are different credentials and must not be
reused as JWT, encryption, Google, provider, or administrator secrets.
The Nginx hash is not a secret; it freezes the already accepted Apptopia Nginx
configuration so any later drift blocks the Forge public-readiness audit.

## Preflight

Before starting the edge stack, verify all of the following:

- `forge-private-isolated-forge-platform-1` is healthy;
- `forge-private-isolated-forge-sandbox-orchestrator-1` is healthy;
- the external Docker network `forge-sandbox-control` exists;
- the token file is a regular non-empty file with owner `65532:65532` and mode
  `0400`;
- the edge environment file has mode `0600`;
- the public hostname is configured in the named Tunnel;
- the Compose-rendered services have no `ports` entries;
- the existing Nginx configuration and listeners are unchanged.

Render and validate before starting:

```bash
docker compose \
  --env-file /opt/forge-private-isolated/shared/forge-edge.env \
  -f forge-vps-cloudflare-tunnel.compose.yml \
  config --quiet
```

The configuration must fail closed when either the token-file path or gateway
secret is missing. Do not print the fully rendered configuration because it
contains the expanded gateway secret.

Run the repeatable internal gateway regression before deploying any edge
change:

```bash
node scripts/cloudflare-tunnel-gateway-regression.cjs
```

On the VPS, record the approved existing Nginx configuration hash in the edge
environment as `FORGE_EXPECTED_NGINX_CONFIG_SHA256`, then run the read-only
internal readiness audit:

```bash
bash scripts/forge-edge-readiness.sh internal
```

## Start and observe

```bash
docker compose \
  --env-file /opt/forge-private-isolated/shared/forge-edge.env \
  -f forge-vps-cloudflare-tunnel.compose.yml \
  up -d

docker compose \
  --env-file /opt/forge-private-isolated/shared/forge-edge.env \
  -f forge-vps-cloudflare-tunnel.compose.yml \
  ps
```

Keep cloudflared at `info` log level. Debug logging may include request headers
and is prohibited for this candidate. Never print the rendered container
environment or token file.

## Required acceptance

From outside the VPS, verify independently:

1. `/` on the Tunnel hostname returns 404.
2. `/api/health` without the gateway secret returns 404.
3. `/api/health` with an incorrect gateway secret returns 404.
4. `/api/health` with the correct secret returns 200.
5. The upstream response does not receive `X-Forge-Gateway-Secret`.
6. VPS ports 3301 and 3401 remain externally unreachable.
7. The cloudflared container is attached only to `forge-private-edge`.
8. The Caddy gateway is the only service attached to both
   `forge-private-edge` and `forge-sandbox-control`.
9. Apptopia/ProjectHash frontend, backend health, database health, Nginx
   configuration hash, and public domains remain unchanged.

After the named Tunnel is running and its public hostname has propagated, run
the strict public audit. It requires the token file, cloudflared network
isolation, public secret gate, Google configuration, Forge, Orchestrator,
ProjectHash, and Nginx continuity to pass together:

```bash
FORGE_CONTROL_PLANE_PUBLIC_ORIGIN=https://api-forge.example.com \
  bash scripts/forge-edge-readiness.sh public
```

Then configure Vercel server-only variables:

```dotenv
FORGE_CONTROL_PLANE_API_URL=https://api-forge.example.com/api/
FORGE_CONTROL_PLANE_GATEWAY_SECRET=<same independent gateway secret>
```

Do not prefix either variable with `NEXT_PUBLIC_`. Redeploy only the protected
Preview and verify `/api/health` through the Vercel origin before performing the
real Google OAuth/Picker/import/approved-writeback browser acceptance.

## Google and production gates

The Google OAuth redirect URI and authorized JavaScript origin must use the
exact final Vercel frontend origin, not the Tunnel hostname. Restrict the Google
Picker developer key to that same frontend origin.

A healthy Tunnel does not authorize Vercel Production, Google consent-screen
publication, public signup, Paid Beta, or real customer data. Promote only the
exact accepted Preview after separate explicit approval.

## Rollback

Stopping this edge stack does not stop Forge or delete its data:

```bash
docker compose \
  --env-file /opt/forge-private-isolated/shared/forge-edge.env \
  -f forge-vps-cloudflare-tunnel.compose.yml \
  down
```

Do not add `--volumes`. Preserve logs and the Cloudflare Tunnel event history,
then confirm Apptopia/ProjectHash and the private Forge services remain healthy.
