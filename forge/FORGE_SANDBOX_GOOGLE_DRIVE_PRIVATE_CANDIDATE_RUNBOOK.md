# Forge Sandbox Agent + Google Drive Private Candidate Runbook

Status: **CONDITIONAL GO — invitation-only private candidate**
Not authorized: **public production, self-service signup, Paid Beta, hostile multi-tenant execution, or real-money Minera**

This runbook is the shortest evidence-based path from the current code to an invited-user Forge computer agent. It deliberately uses gate-driven steps instead of calendar promises.

## 1. Product being launched

```text
Invited user in Forge web UI
        |
        v
Forge control plane and durable Run ledger
        |
        +--> encrypted Google OAuth vault
        |        |
        |        +--> verified Drive file/folder selection
        |        +--> import copy into a persistent Workspace
        |        +--> approved create-new-file write-back
        |
        v
dedicated Orchestrator on a trusted Docker host
        |
        +--> ephemeral Shell container, network=none
        +--> ephemeral Browser container, controlled egress proxy
        +--> persistent logical Workspace and immutable Artifacts
```

Google Drive is user-owned persistent storage, not compute. Cloud PCs remain a later, on-demand tier. Pi is not required for this candidate.

The Google Drive data flow is intentionally narrow:

```text
OAuth + PKCE
→ user explicitly selects an input file or output folder
→ Forge verifies the selected Drive IDs independently
→ Forge imports a versioned copy into the Workspace
→ an ephemeral sandbox processes the copy
→ Forge commits an immutable Artifact with bytes and SHA-256
→ the user approves the exact destination and file
→ Forge creates a new Drive file
```

Forge does not expose Drive overwrite, move, share, permission-change, or delete operations in this release.

## 2. Non-negotiable security boundary

- Google access and refresh tokens remain encrypted in the Forge control plane.
- Tokens must never enter model context, Run prompts, tool inputs/results, the Orchestrator, Shell containers, Browser containers, SSE payloads, transfer ledgers, or logs.
- The Picker receives only a short-lived Google Identity Services access token in the current browser call stack. It is not persisted in React state, browser storage, logs, or backend requests.
- Manual `gdrive` access-token entry through the generic BYOS route is rejected.
- Shell Runs have no network.
- Browser Runs use the dedicated egress proxy; private, loopback, link-local, and cloud-metadata targets are rejected.
- The Orchestrator is the sole Docker-socket boundary and must run on a dedicated trusted host. Never expose its port publicly.
- Class A tools may run automatically. Class B external mutation pauses for exact human approval. Class C payments, credential changes, and privileged/destructive actions are blocked.
- A Run is not complete until at least one immutable Artifact has been committed.
- Cancellation must terminate model work, active tools, pending approvals, and per-Run containers while preserving the Workspace and committed Artifacts.

## 3. Deployment gates

### Gate A — freeze an identifiable candidate

Record without secrets:

- Git branch, HEAD, and dirty-file manifest;
- source and `dist` hashes;
- frontend build identity;
- `forge-platform`, Orchestrator, and runtime image IDs/digests;
- Compose files and their hashes;
- last-known-good image IDs;
- host, ports, networks, volumes, reverse proxy, DNS, and TLS owners.

Do not deploy from an unrecorded mutable tag.

### Gate B — allocate a dedicated sandbox host

The fastest acceptable host is a dedicated Linux Docker host or isolated VM controlled by the Forge operator. It must have:

- supported Docker Engine and Compose;
- no unrelated customer workloads on the same Docker daemon;
- enough CPU, RAM, PID, and disk capacity for the invited-user limit;
- an encrypted or otherwise approved persistent-disk policy;
- host firewall rules that keep the Orchestrator and Forge backend ports private;
- central logs and host/container monitoring;
- a tested volume snapshot/restore path.

Ordinary Docker isolation is accepted only for this invitation-only candidate. A public or hostile shared service requires a stronger runtime boundary such as gVisor, Kata, Firecracker, or an equivalent managed sandbox, plus a separate security review.

### Gate C — configure secrets outside Git

Generate separate high-entropy values for JWT signing, credential encryption, and Forge-to-Orchestrator HMAC. Do not reuse them. Supply all values through the approved secret store or the deployment environment.

Required control-plane variables:

| Variable | Requirement |
|---|---|
| `NODE_ENV` | Must be `production` |
| `JWT_SECRET` | Unique high-entropy signing secret; must not equal the development default |
| `ADMIN_EMAIL` | Named invitation-only bootstrap administrator |
| `ADMIN_PASSWORD` | Unique bootstrap password; rotate after initial handoff if policy requires |
| `FRONTEND_URL` | Exact HTTPS frontend origin; used for CORS and callbacks |
| `CREDENTIAL_ENCRYPTION_KEY` | Separate high-entropy key material for encrypted provider/OAuth credentials |
| `DB_PATH` | `/data/forge.db` in the candidate Compose topology |
| `FORGE_SANDBOX_ORCHESTRATOR_URL` | Internal-only `http://forge-sandbox-orchestrator:3001` |
| `FORGE_SANDBOX_HMAC_SECRET` | Shared only by Forge and the Orchestrator; never exposed to a Run container |
| `FORGE_SANDBOX_MAX_ACTIVE` | Global admission ceiling; candidate default is `3` active per-Run sandbox pairs |
| `FORGE_SANDBOX_MAX_ACTIVE_PER_TENANT` | Per-tenant admission ceiling; candidate default is `1` active per-Run sandbox pair so one tenant cannot consume the global pool |
| `FORGE_SANDBOX_MAX_CONCURRENT_TOOLS` | Global Docker-exec ceiling; candidate default is `1` until higher concurrency passes the full Browser/Artifact E2E |

Required Vercel-to-control-plane gateway variables:

| Variable | Requirement |
|---|---|
| `FORGE_CONTROL_PLANE_API_URL` | Server-only Vercel value such as `https://api.example.com/api/`; never prefix with `NEXT_PUBLIC_` |
| `FORGE_CONTROL_PLANE_GATEWAY_SECRET` | One generated high-entropy value stored in both Vercel and the Caddy deployment environment |
| `FORGE_CONTROL_PLANE_DOMAIN` | Public control-plane hostname on the dedicated Docker host; DNS must point to that host |
| `ACME_EMAIL` | Named operational contact for automatic TLS certificate issuance |

Required Google variables:

| Variable | Meaning |
|---|---|
| `GOOGLE_DRIVE_CLIENT_ID` | OAuth 2.0 Web application client ID |
| `GOOGLE_DRIVE_CLIENT_SECRET` | OAuth web client secret, control plane only |
| `GOOGLE_DRIVE_REDIRECT_URI` | Exact public Vercel callback, for example `https://forge.example.com/api/google-drive/oauth/callback` |
| `GOOGLE_DRIVE_DEVELOPER_KEY` | Browser-restricted developer key for Google Picker |
| `GOOGLE_DRIVE_APP_ID` | Numeric Google Cloud project number used by Picker |

Sandbox variables:

| Variable | Candidate policy |
|---|---|
| `FORGE_SANDBOX_RUNTIME_IMAGE` | Immutable approved runtime image, not a floating production tag |
| `FORGE_SANDBOX_EGRESS_ALLOWLIST` | Comma-separated customer/task-specific public hostnames; an empty list permits any public HTTP/HTTPS hostname and is not the preferred customer setting |
| `FORGE_SANDBOX_MEMORY_BYTES` | Default candidate value: 768 MiB per Run container |
| `FORGE_SANDBOX_CPU_NANOS` | Default candidate value: 1 CPU per Run container |
| `FORGE_SANDBOX_PIDS_LIMIT` | Default Shell limit: 128 |
| `FORGE_SANDBOX_BROWSER_PIDS_LIMIT` | Default Browser limit: 256 |

Provider model keys may be stored per invited user through Forge's encrypted Settings path. Do not place a broad organization key in a Run prompt, Workspace file, Google Drive file, frontend environment, or sandbox environment. Set a cost ceiling and tool-call ceiling for every Run.

### Gate D — configure Google Cloud

Use one controlled Google Cloud project for the candidate:

1. Enable **Google Drive API** and **Google Picker API**.
2. Configure the OAuth consent screen with the real application name, support contact, privacy policy, authorized domains, and minimum required scope.
3. Request only `https://www.googleapis.com/auth/drive.file` for this release.
4. While the consent screen is in testing, add only the named invited test users.
5. Create an OAuth 2.0 **Web application** client.
6. Add the Forge frontend as an exact authorized JavaScript origin, with scheme and port if non-default.
7. Add `GOOGLE_DRIVE_REDIRECT_URI` as an exact authorized redirect URI. A trailing-slash or hostname mismatch is a failure.
8. Create a separate developer key for Picker. Restrict it by the exact Forge frontend HTTP referrer/origin and restrict its API access to Google Picker API where Google Cloud permits.
9. Set `GOOGLE_DRIVE_APP_ID` to the numeric project number, not the OAuth client ID.
10. Keep production publishing, verification, brand review, and any Google-requested scope review as external launch gates. Testing-mode success is not production authorization.

### Gate E — build only through China-accessible sources

Approved sources in the current candidate:

- npm: `https://registry.npmmirror.com`;
- Node images: `docker.m.daocloud.io/library/node:20-*`;
- Debian packages: Aliyun Debian mirrors.

From the repository root:

```powershell
$env:npm_config_registry='https://registry.npmmirror.com'

docker compose `
  -f forge-sandbox.compose.yml `
  -f forge-private-candidate.compose.yml `
  -f forge-vps-caddy.compose.yml `
  config -q

docker compose `
  -f forge-sandbox.compose.yml `
  -f forge-private-candidate.compose.yml `
  build sandbox-runtime forge-sandbox-orchestrator forge-platform
```

The Compose overlay intentionally requires every production and Google variable. A missing value must fail configuration rather than silently disable the target capability.

### Gate F — build and configure the Vercel frontend

Browser requests must remain same-origin under `/api/*`. Configure the external control plane only through Vercel server-side variables:

```powershell
$env:NEXT_PUBLIC_API_BASE_URL='/api'
$env:FORGE_CONTROL_PLANE_API_URL='https://api.example.com/api/'
$env:FORGE_CONTROL_PLANE_GATEWAY_SECRET='<same generated secret as Caddy>'
$env:npm_config_registry='https://registry.npmmirror.com'
npm run build
```

Push only the accepted release branch and wait for its protected Vercel Preview to become Ready. Do not push `main` or promote the Preview until the external control plane, secret, and acceptance checks pass. Keep signup closed or operationally inaccessible; distribute access only to named invited users. The backend `FRONTEND_URL`, Google authorized JavaScript origin, and Google redirect URI must use the exact Vercel production origin.

The active frontend uses a platform-native system font stack and makes no Google Fonts request. Keep this zero-external-font property in the release scan unless approved local font files are added later.

### Gate G — start the candidate behind TLS

Start only the project-scoped services:

```powershell
docker compose `
  -f forge-sandbox.compose.yml `
  -f forge-private-candidate.compose.yml `
  -f forge-vps-caddy.compose.yml `
  up -d forge-sandbox-egress forge-sandbox-orchestrator forge-platform forge-control-plane-proxy

docker compose `
  -f forge-sandbox.compose.yml `
  -f forge-private-candidate.compose.yml `
  -f forge-vps-caddy.compose.yml `
  ps
```

The Compose files bind Forge to `127.0.0.1:${FORGE_PRIVATE_BACKEND_PORT:-3401}` and the Orchestrator to `127.0.0.1:3301`. Only Caddy publishes ports 80/443. It accepts `/api/*` only when the request carries the shared Vercel gateway secret; all other public paths return 404. Do not publish port 3301 or the Forge backend port.

Verify separately:

- Forge `/health` returns 200;
- Vercel `/api/health` reaches Forge `/api/health` through Caddy and returns 200;
- a direct control-plane request without the gateway secret returns 404;
- production startup did not fall back to the development database path or development credentials;
- Orchestrator `/health` is healthy from the control network;
- the runtime image exists locally by the approved immutable identity;
- the persistent Forge and sandbox volumes are mounted;
- an unapproved frontend Origin receives no CORS authorization;
- unauthenticated Run details, SSE, Workspace, Artifact, Drive selection, transfer, and write-back routes return 401;
- the egress proxy rejects loopback, RFC1918, link-local, and metadata targets.

## 4. Invitation-only acceptance script

Run these checks with a non-customer Workspace and a named test account.

### 4.1 Workspace and normal Run

- Create a persistent Workspace.
- Upload a non-sensitive binary file no larger than the current 10 MiB UI limit.
- Record the returned path, byte count, and SHA-256.
- Start a sandbox Run with an explicit model, cost ceiling, and tool-call ceiling.
- Confirm an immutable Run attempt appears immediately.
- Confirm authenticated SSE becomes live and can resume from the latest event ID.
- Confirm the Run provisions a unique per-Run container.
- Confirm the typed tool ledger records inputs, approval class, state, and terminal evidence.
- Confirm the final Artifact is committed before the Run becomes complete.
- Download through the authenticated Artifact route and recompute SHA-256 over the returned bytes.
- Confirm `sandbox_destroyed` occurs before the SSE stream completes.
- Confirm the Workspace file and Artifact remain available after container teardown.

### 4.2 Approval rejection

- Start a Run whose next step is a Class B browser mutation.
- Confirm the external action does not execute before approval.
- Confirm the UI shows the exact action summary and inputs.
- Reject the action.
- Confirm the tool is terminally `rejected`, the Run safely continues, an Artifact is committed, and the sandbox is destroyed.

### 4.3 Cancellation

- Test cancellation during model work, Shell work, Browser work, and waiting approval.
- Each case must end with Run `cancelled`, sandbox `destroyed`, and any active tool/approval terminally `cancelled`.
- A cancelled tool must never later become `failed` or `completed`.

### 4.4 Google Drive import

- Connect one named Google test user through Authorization Code + PKCE.
- Confirm Forge reports the connected Google account without returning tokens.
- Open Picker and choose one input file.
- Confirm Forge independently retrieves metadata for that exact Drive file ID and resource key.
- Import the file into the selected Workspace.
- Record Drive version, modified time, MIME type, Workspace path, bytes, SHA-256, status, and timestamps.
- Repeat the same version and require `deduplicated` without a second Workspace upload.
- Test Google-native Docs export and a regular binary file.
- Test a Shared Drive item with its resource key.

### 4.5 Google Drive write-back

- Select an output folder through Picker.
- Choose one completed immutable Artifact.
- Request write-back and confirm the request remains `pending` with zero Drive uploads.
- Review the exact Artifact, SHA-256, byte count, target folder, and create-new-file statement.
- Approve.
- Confirm exactly one new Drive file is created and record its Drive file ID, version, link, bytes, and source Artifact SHA-256.
- Replay approval and require an idempotent response with no second upload.
- Confirm no overwrite, move, share, permission change, or deletion endpoint exists in the candidate UI.

### 4.6 Disconnect and audit

- Disconnect Google Drive and require remote token-revocation attempt plus local credential removal.
- Confirm prior selections are marked revoked.
- Confirm `/api/google-drive/transfers` remains readable for the owner and exposes transfer evidence only.
- Exercise `workspaceId` and `direction=import|writeback` filters.
- Confirm OAuth secrets, access tokens, refresh tokens, developer keys, and raw API responses are absent from the route and logs.
- Confirm another user cannot read the connection, selections, transfers, write-backs, Workspaces, Runs, or Artifacts.

## 5. Operational minimum

Monitor and alert on:

- Forge and Orchestrator health;
- Docker daemon availability to the Orchestrator;
- active/provisioning/waiting/cancelling Run counts;
- Run duration, model usage, cost, tool count, terminal state, and cleanup state;
- container-create/destroy failures and orphan scans;
- egress denials and unusual destination volume;
- Workspace and Artifact volume capacity;
- SQLite WAL growth, backup age, and restore status;
- Google OAuth refresh/revocation failures;
- import/write-back failures, bytes, hashes, versions, deduplication, and approval latency;
- secret rotation and invited-user access reviews.

Logs must not contain authorization headers, cookies, passwords, OAuth codes/verifiers, access or refresh tokens, Google client secrets, developer keys, provider API keys, unnecessary customer content, or full Workspace files.

## 6. Backup, rollback, and cleanup

### Backup gate

Before replacing the Forge image or configuration:

1. Stop new Run intake.
2. Wait for active Runs to become terminal or explicitly cancel them.
3. Record remaining cleanup states and orphan containers.
4. Take an application-safe SQLite backup including WAL state, or stop Forge before a volume-level snapshot.
5. Snapshot the Forge data volume and sandbox Workspace/Artifact volume through the approved host/infrastructure mechanism.
6. Restore both into an isolated environment.
7. Verify user count, Workspace count, Run/event/tool/approval/Artifact counts, Drive connection metadata, transfer ledger counts, and Artifact hashes.

A copied file without an isolated restore check is not a completed backup.

### Service rollback

1. Stop new intake and preserve logs, current image IDs, configuration identity, latest Run states, and the incident reason.
2. Replace only `forge-platform` with the approved last-known-good source/dist/image/config combination.
3. Do not delete or downgrade the persistent volumes automatically.
4. If the Orchestrator/runtime changed, stop new Runs, remove only confirmed orphan per-Run containers, and replace only the Orchestrator/runtime images.
5. Reapply the matching secret-store configuration.
6. Verify health, authentication, one read-only Workspace/Artifact query, an unauthorized path, and existing audit history before reopening intake.
7. Reconcile `requested`, `provisioning`, `running`, `waiting_approval`, `cancelling`, and `cleanup_failed` Runs explicitly.

### Reversible shutdown

The normal shutdown retains named volumes:

```powershell
docker compose `
  -f forge-sandbox.compose.yml `
  -f forge-private-candidate.compose.yml `
  down
```

Never add `--volumes` during rollback. Volume deletion is a separate, explicitly authorized decommission action after verified backup and retention approval.

## 7. Current evidence

Verified on the candidate branch and candidate VPS with Node 20 and domestic sources:

- sandbox contract: 6/6 passed;
- production startup/configuration/migration/security regression: 10/10 passed;
- Agent Run/Apptopia regression: 1 passed, 1 skipped by the existing real-provider-key contract;
- restart recovery: 1/1 passed;
- Google Drive OAuth/Picker selection/import/deduplication/approved write-back/revocation/transfer-ledger regression: 1/1 passed;
- Orchestrator unit tests: 9/9 passed;
- sandbox runtime path-containment unit tests: 2/2 passed;
- real Orchestrator E2E: passed Shell, Browser, File, spreadsheet, PDF, egress, persistence, integrity, and active-tool cancellation checks;
- VPS concurrency/capacity E2E: three parallel full sandbox lifecycle runs completed with a six-runtime-container peak; a fourth provisioning request failed closed with HTTP 429 `SANDBOX_CAPACITY_EXCEEDED`; a second concurrent sandbox for the same tenant failed closed with HTTP 429 `SANDBOX_TENANT_CAPACITY_EXCEEDED`; managed containers, managed volumes, and idempotency state returned to their exact baselines;
- candidate inbound-content policy: verified on the candidate branch and current candidate VPS. Browser Workspace uploads and Google Drive imports converge on the Orchestrator file-ingress boundary. Policy `forge-inbound-v1` rejects clearly executable/installer/disk-image/macro-enabled extensions and renamed native executable signatures with HTTP 422 before any Workspace volume helper is created; ordinary documents, source files, PDFs, standard Office files, and archives remain supported. The isolated Google Drive regression proves that a rejected import is returned as HTTP 422, records a `failed` transfer ledger row with the policy error, and creates no successful Workspace write. Real Orchestrator E2E proved the blocked extension, a safe upload carrying `contentPolicy=forge-inbound-v1`, public egress, private-address blocking, and cleanup. A live Forge API acceptance returned the same policy error as HTTP 422 and left zero managed containers and zero managed volumes;
- the same concurrency test passed twice on the candidate VPS. During the instrumented run the outer nested-Docker service peaked at about 107% CPU and 264.5 MiB memory, the Orchestrator at about 8% CPU and 128.7 MiB, and Forge at about 3.7% CPU and 367.6 MiB on a 16-vCPU host with about 62 GiB available memory. This is evidence for the configured invited-user ceiling of three active sandboxes, not a public-scale capacity claim;
- SQLite backup regression: an online backup taken while the source used WAL restored with `integrity_check=ok`, identical user/Workspace/Artifact counts, and the exact Artifact SHA-256; the backup path now awaits `better-sqlite3.backup()` before starting gzip;
- live candidate backup/restore: both a pre-release raw snapshot and a post-release `/api/admin/backup` gzip were exported outside the application data volume to the VPS host with `0600 root:root` permissions and recorded SHA-256 values, then restored in a network-disabled container with a read-only root filesystem. Integrity and all Run/Workspace/Event/Tool/Approval/Artifact/Drive table counts matched the online database. Immediately before the `cdbd81af` switch, a new 21,028,864-byte application-level snapshot was verified with `integrity_check=ok`, matching key-table counts, and SHA-256 `73a9a32dca74aea7cb0f336b0d337fca88b88b367c6ac46503a46ebc7ea56c47`;
- refresh-token collision regression: four production logins issued in the same second all returned HTTP 200 and stored four distinct refresh tokens. After deployment, internal edge readiness passed three consecutive executions without the previous unique-token HTTP 500;
- current VPS release `cdbd81affc24356634d91fe610fe176c40f8af5c`: Forge, Orchestrator, Sandbox Docker, and internal gateway are healthy with zero restarts. Only Forge and Orchestrator were recreated; Sandbox Docker, the internal gateway, ProjectHash, and Nginx retained their exact container/process identities. Post-switch concurrency again completed three parallel lifecycles, failed closed at global and per-tenant capacity with HTTP 429, returned managed containers and volumes to zero, and preserved the idempotency count at 17;
- Forge API → real Orchestrator integrated regression: passed with Artifact SHA-256 verification, authenticated SSE ordering, rejected Class B continuation, and cancellation during model, Shell, Browser, and waiting approval;
- targeted strict TypeScript check for `SandboxAgentConsole.tsx`: passed;
- Next.js production build: passed, 20/20 pages and API routes generated;
- frontend font independence: `npm run build` now runs `scripts/font-independence-regression.cjs`; the gate scans the active `app`/`public` sources and fresh `.next/server`/`.next/static` production output and rejects `fonts.googleapis.com`, `fonts.gstatic.com`, or `next/font/google`. Forge uses local system font stacks and does not require a font CDN at runtime or build time;
- frontend and control-plane production dependency audits: 0 known vulnerabilities;
- Node 20 control-plane image build: passed through DaoCloud Node, Aliyun APT, and npmmirror npm sources;
- Caddy configuration validation: passed with `docker.m.daocloud.io/library/caddy:2.10.2-alpine`;
- local Vercel gateway → secret-gated Caddy → production Forge smoke: correct secret 200, missing/wrong secret 404, non-API path 404;
- forged incoming gateway-secret header regression: passed because the Vercel route deletes the browser-supplied value and injects its server-side value;
- real browser acceptance: Workspace creation and upload, normal file-tool Run, immutable history, authenticated SSE, Artifact display, Class B rejection, safe continuation, cancellation, sandbox teardown, dedicated Drive OAuth card, disabled-unconfigured state, and removal of Google from the generic token form all passed;
- browser console: no task-related warning or error entries.
- production-mode control-plane smoke under the Compose security settings: `/health` reported `production`, unauthenticated Drive config returned 401, and authenticated Drive config reported OAuth and Picker configured but not connected.

The Artifact button issued its authenticated client-side fetch with no console error. Because the browser-control layer did not surface the programmatic Blob download event, download integrity is claimed from the independently passed authenticated binary endpoint and SHA-256 integrated regression, not from the click alone.

## 8. Known limitations and external gates

The following remain open and must not be relabelled as completed:

- a real Google account Picker/import/write-back browser acceptance using the intended Google Cloud project;
- Google consent-screen publishing and any required production verification;
- approved production DNS, TLS, reverse proxy, firewall, host, secret store, automated off-host/geographically independent backup retention and restore drills, monitoring, and on-call ownership. The current VPS-local host backup is verified and usable for candidate rollback, but it is not geographic disaster recovery;
- customer security review, data-processing terms, retention/deletion policy, and customer acceptance;
- stronger-than-Docker hostile multi-tenant isolation;
- full signature-based malware scanning, archive inspection, DLP, and organization-specific content policy remain open. Candidate policy `forge-inbound-v1` blocks a narrow high-risk executable/active-content set at the shared Workspace/Drive ingress boundary, but it must not be described as antivirus or comprehensive DLP;
- capacity/load evidence beyond the current three-active-sandbox invited-user ceiling. The candidate has a global admission limit, a one-active-sandbox-per-tenant limit, and a global tool limiter, but those controls must not be described as public-scale capacity;
- public signup, public self-service, Paid Beta, or real-money Minera;
- Cloud PC/mobile-device control. The current target is a mobile-friendly web control plane driving cloud sandboxes, not a full persistent cloud desktop.

## 9. Responsibility split

Codex can implement code, tests, Compose, configuration templates, browser acceptance with test credentials, regression evidence, runbooks, and release audits.

Named humans or authorized external systems must provide and approve:

- Google Cloud ownership, OAuth credentials, test users, consent-screen publication, and verification;
- production host/DNS/TLS/firewall/secret-store authority;
- real provider credentials and budget/data-use policy;
- security, privacy, legal, customer-data, retention, and incident decisions;
- invited customer identity, acceptance, contracting, and payment;
- GO/NO-GO authority for Paid Beta or public launch.

The linked Forge × Apptopia × Minera commercial path remains governed by `FORGE_APPTOPIA_MINERA_GATE_DRIVEN_LAUNCH_PLAN_EN.md`, `FORGE_APPTOPIA_MINERA_LAUNCH_EXECUTION_LEDGER.md`, and `FORGE_APPTOPIA_MINERA_PRIVATE_BETA_RUNBOOK.md`. This sandbox + Drive candidate can feed that path, but does not bypass its approval, evidence, Owner Review, customer acceptance, or payment gates.
