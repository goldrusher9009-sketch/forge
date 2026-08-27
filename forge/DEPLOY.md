# Forge deployment: Vercel + private Docker control plane

Forge's website is deployed only on Vercel. Railway is not part of the release
path. The long-running control plane and per-run Docker sandboxes cannot run in
Vercel functions, so they run on a dedicated Linux Docker host behind HTTPS.

```text
Browser
  -> Vercel /api/* gateway
  -> HTTPS Caddy gateway
  -> private Forge control plane
  -> private sandbox Orchestrator
  -> isolated per-run Docker sandbox
```

The complete operational procedure and acceptance gates are in
`FORGE_SANDBOX_GOOGLE_DRIVE_PRIVATE_CANDIDATE_RUNBOOK.md`.

## Release rules

- Release branch: `sasaky/forge-google-drive-launch`.
- Do not push `main`; it is still connected to a legacy deployment.
- Build a protected Vercel Preview from the release branch first.
- Do not promote a Preview until the external control plane and end-to-end
  acceptance are green.
- Do not put credentials in Git, shell history, build arguments, browser code,
  logs, Agent prompts, Orchestrator requests, or sandboxes.
- Use the domestic Docker, APT, and npm sources already pinned in the Dockerfiles.

## External control plane

Provision a dedicated Linux host and a hostname whose DNS points to it. Install
Docker Engine and Compose, open only TCP 80/443 (and UDP 443 if HTTP/3 is
desired), then use these three Compose files together:

```bash
docker compose \
  -f forge-sandbox.compose.yml \
  -f forge-private-candidate.compose.yml \
  -f forge-vps-caddy.compose.yml \
  config -q

docker compose \
  -f forge-sandbox.compose.yml \
  -f forge-private-candidate.compose.yml \
  -f forge-vps-caddy.compose.yml \
  build

docker compose \
  -f forge-sandbox.compose.yml \
  -f forge-private-candidate.compose.yml \
  -f forge-vps-caddy.compose.yml \
  up -d
```

Supply required values through the approved host secret store. In particular,
the same high-entropy `FORGE_CONTROL_PLANE_GATEWAY_SECRET` must exist only in
the Vercel server environment and the Caddy environment. Forge and the sandbox
Orchestrator ports remain bound to loopback/private networks; only Caddy exposes
80/443.

Before connecting Vercel, verify that the public control-plane hostname returns:

- `404` without the gateway secret;
- `404` with a wrong secret;
- `200` for `/api/health` with the correct secret;
- `404` for a non-`/api/*` path even with the correct secret.

## Vercel Preview

Set these server-only variables for Preview and, after acceptance, Production:

```text
FORGE_CONTROL_PLANE_API_URL=https://<control-plane-host>/api/
FORGE_CONTROL_PLANE_GATEWAY_SECRET=<same value stored by Caddy>
```

Browser traffic remains same-origin under `/api/*`; never prefix these values
with `NEXT_PUBLIC_`. The repository's `deploy.sh` builds and creates a Preview
only. It refuses to run on `main` and cannot promote Production.

```bash
bash deploy.sh
```

Verify the protected Preview through its Vercel-authenticated URL. Required
checks include login, an authenticated `/api/health` path, SSE, one sandbox run,
artifact retrieval, human approval, Google Drive import/write-back/revoke, and
secret non-disclosure.

## Production promotion

Promotion is a separate, explicit operation after Preview acceptance. Confirm
the deployment ID, inspect that it is `target: preview` and `status: Ready`, then
promote that exact deployment through Vercel. Re-inspect until the new deployment
is `target: production` and `status: Ready`, then validate the public production
domain and the deployed Git revision.

Until customer, payment, contract, operational, and acceptance gates are real,
describe the result only as an invitation-only private candidate—not a public or
commercial launch.
