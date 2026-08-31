# Forge deployment map — current release path

Verified for the Vercel release branch on 2026-08-28. Provider state can drift;
re-inspect Vercel and Git before each release claim.

## Current state

- Git repository: `git@github.com:goldrusher9009-sketch/forge.git`.
- Release branch: `sasaky/forge-google-drive-launch`.
- Release SHA: resolve with `git rev-parse HEAD` and verify the same SHA exists on
  `origin/sasaky/forge-google-drive-launch` before making any deployment claim.
- Vercel project: `forge`.
- Last verified pre-hardening build candidate at this snapshot: protected
  Preview `dpl_6Tdg9fQnMFFU8NRyeeJquAJrs61z` (`Ready`, not Production). Re-inspect
  the branch's newest deployment after every pushed commit.
- Public production origin: `https://forge-sand-two.vercel.app`.
- Production still points to older `main` commit `219395f1`; it is not the
  current sandbox-agent candidate.
- The private VPS control plane is deployed. Its final public DNS hostname and
  isolated Cloudflare Tunnel are not provisioned yet.

## Architecture

```text
Vercel website and same-origin /api gateway
  -> Cloudflare HTTPS + named Tunnel
  -> internal secret-gated Caddy gateway
  -> Forge control plane with durable SQLite volume
  -> private Docker-socket Orchestrator
  -> isolated per-run sandbox containers
```

Vercel hosts the website and server-side gateway only. It does not host the
Docker Socket, persistent SQLite database, long-running Agent loop, Socket.IO
process, or user sandboxes.

## Files that define this release

- `forge-web-studio/app/api/[...path]/route.ts`: Vercel catch-all API route.
- `forge-web-studio/app/api/_forgeProxy.ts`: upstream validation, secret
  injection, SSE/body forwarding, and fail-closed behavior.
- `forge-sandbox.compose.yml`: runtime image, Orchestrator, egress proxy, and
  private networks.
- `forge-private-candidate.compose.yml`: Forge control plane and durable data.
- `forge-vps-caddy.compose.yml`: direct public HTTPS edge for a dedicated host
  whose ports 80/443 are available.
- `forge-vps-cloudflare-tunnel.compose.yml`: isolated edge for the current
  shared VPS, where Apptopia Nginx already owns ports 80/443.
- `forge-control-plane.Caddyfile`: direct-host TLS gateway.
- `forge-control-plane-tunnel.Caddyfile`: internal HTTP gateway reached only by
  the named Tunnel and protected by the same `/api/*` gateway secret.
- `FORGE_CLOUDFLARE_TUNNEL_RUNBOOK.md`: domain, token, secret, acceptance, and
  rollback procedure that does not modify Apptopia Nginx.
- `FORGE_SANDBOX_GOOGLE_DRIVE_PRIVATE_CANDIDATE_RUNBOOK.md`: required gates and
  acceptance evidence.

## Mandatory release sequence

1. Commit and push only `sasaky/forge-google-drive-launch`.
2. Register the final domain, create the remotely managed named Tunnel, and map
   its public hostname to `http://forge-control-plane-tunnel-gateway:8080`.
3. Store the Tunnel token and gateway secret outside Git, then deploy
   `forge-vps-cloudflare-tunnel.compose.yml` beside the existing private Forge
   stack. Do not start the direct Caddy edge on this shared VPS.
4. Verify the Tunnel gateway rejects missing/wrong secrets and non-API paths,
   publishes no host ports, and leaves Apptopia Nginx unchanged.
5. Add `FORGE_CONTROL_PLANE_API_URL` and
   `FORGE_CONTROL_PLANE_GATEWAY_SECRET` to Vercel server environments.
6. Redeploy the protected Vercel Preview.
7. Complete sandbox, Google Drive, security, recovery, and human-approval E2E.
8. Promote the exact accepted Preview only after explicit authorization.
9. Verify Production status, public HTTP behavior, aliases, and deployed Git SHA.

## Safety boundary

Do not push `main`: a legacy provider is still connected to it. Do not run old
`PUSH_*.bat`, `push*.ps1`, archived deployment scripts, or historical runbooks as
release automation. `deploy.sh` is the only root release helper for this branch;
it creates Vercel Preview deployments only and refuses `main`.
