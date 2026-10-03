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

- Release branch: `sasaky/forge-commercial-launch-candidate`.
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

## Optional business cloud-number calls

`FORGE_INCOMING_CALL_PUBLIC_URL` is an optional server-only exact HTTPS origin,
for example `https://<public-Forge-app-host>`, with no path, query or fragment.
The candidate and VPS Compose files forward it to the control plane; leaving it
empty keeps authenticated incoming-call routes unavailable (`503`) without
affecting other authenticated features. Setting the origin alone does not enable
a number or authorize any call processing.

Before an Owner enables a binding, verify the existing published-Agent Pi worker
is healthy and the public origin reaches Forge's `/api/incoming-call/webhooks/*`
routes. Twilio must reach these form POST callbacks without an interactive login
page. A protected Preview alone does not prove that provider reachability. Keep
the control-plane gateway secret server-side; Twilio callbacks authenticate with
their own signatures, while the web gateway supplies its internal gateway secret.
The shared web proxy preserves signed form bytes and limits these requests to
32 KiB.

The Owner saves their own Twilio credentials in Forge's encrypted connector store,
prepares a Voice-enabled business cloud number, configures the displayed voice and
status POST URLs in Twilio, and explicitly confirms webhook setup, background
draft generation and unverified telephone costs. New bindings start disabled.
The service receives one spoken need and prepares an Owner-reviewed draft after
the call ends; it does not handle the phone's SIM calls, provide live model voice
conversation, call back or send a reply automatically. Model spending is capped
at $0 with no paid fallback; telephone and speech-recognition costs remain unknown.
Acceptance still requires a reachable provider callback and an explicitly
authorized real cloud-number call. Local signed fixtures are not that acceptance.

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

Before enabling `FORGE_BILLING_PURCHASES_ENABLED`, confirm the live Stripe
merchant is approved for Forge, its Checkout branding and statement descriptor
identify the seller clearly, and its support contact receives mail. Verify the
configured monthly prices and webhook, then complete an operator-approved live
purchase, entitlement, invoice, cancellation, and refund check. Confirm the
managed model provider has enough funded balance for the advertised credit.
Keep new purchases paused until these checks pass; an enabled Stripe account or
a successful test-mode payment alone is insufficient.

## Production promotion

Promotion is a separate, explicit operation after Preview acceptance. Confirm
the deployment ID, inspect that it is `target: preview` and `status: Ready`, then
promote that exact deployment through Vercel. Re-inspect until the new deployment
is `target: production` and `status: Ready`, then validate the public production
domain and the deployed Git revision.

Until customer, payment, contract, operational, and acceptance gates are real,
describe the result only as an invitation-only private candidate—not a public or
commercial launch.
