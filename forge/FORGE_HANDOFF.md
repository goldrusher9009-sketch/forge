# Forge Platform — Development Handoff

**Updated:** 2026-07-25  
**Purpose:** Source-of-truth and product-direction handoff for a fresh Codex development session  
**Status:** Read this file and `DEPLOY_MAP.md` before inspecting, changing, testing, committing, or deploying Forge

---

## 1. Open This Folder in the New Codex Window

Open:

```text
D:\zjh\self\Hash\forge\forge
```

This is the real Forge subproject inside the Git monorepo. Git will still discover the parent repository at:

```text
D:\zjh\self\Hash\forge\.git
```

Opening the `forge\forge` subfolder reduces the risk of accidentally modifying the unrelated `viva`, `Flash`, `LocalZilla`, or `VentBuddy` applications that share the same repository and `main` branch.

Do not use these root-level legacy duplicates as the production source:

```text
D:\zjh\self\Hash\forge\forge-platform
D:\zjh\self\Hash\forge\forge-web-studio
```

The production Forge paths have the extra `forge` directory:

```text
D:\zjh\self\Hash\forge\forge\forge-platform
D:\zjh\self\Hash\forge\forge\forge-web-studio
```

---

## 2. Current Source of Truth

| Item | Current truth |
|---|---|
| GitHub | https://github.com/goldrusher9009-sketch/forge |
| Branch | `main` |
| Verified remote HEAD on 2026-07-25 | `eb7e6ef8737331452ddd4b57bb8ade84d959abd3` |
| Recommended local Git root | `D:\zjh\self\Hash\forge` |
| Recommended Codex workspace | `D:\zjh\self\Hash\forge\forge` |
| Real backend | `forge-platform/src/index.ts` |
| Real frontend | `forge-web-studio/app/components/ForgeApp.tsx` |
| Deployment map | `DEPLOY_MAP.md` |

At the time of verification:

```text
local HEAD = local origin/main = GitHub remote main = eb7e6ef8
branch = main
Forge worktree = clean
```

Always re-run a read-only remote comparison at the start of a new session because `main` may have advanced:

```powershell
$git = 'C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe'
& $git status --short --branch
& $git log -1 --date=iso-strict --format='%H %ad %s'
& $git ls-remote origin refs/heads/main
```

Do not assume the commit above is still current after 2026-07-25.

---

## 3. Relationship to the Boss-Provided ZIP

The original handoff package was:

```text
forge-source.zip
├── index.ts
└── ForgeApp.tsx
```

It is a valid historical snapshot of Git commit:

```text
47544e9f398594c2f1f39bbecf4308621436a271
feat(forge): smart model router — forge-cheap/forge-premium + cost-mode pills UI
```

Byte-level comparison proved:

- ZIP `ForgeApp.tsx` is identical to both commit `47544e9f` and current GitHub `main` at `eb7e6ef8`.
- ZIP `index.ts` is identical to commit `47544e9f` but older than current GitHub `main`.
- Current GitHub contains three later Forge fixes:
  - `39af910e` — exclude tests from TypeScript build and bump v1273.
  - `51ef6e86` — synchronize `/api/version` to v1273.
  - `eb7e6ef8` — remove duplicate `PORT` declarations that broke esbuild.

Therefore:

> GitHub `main` is the development baseline. Keep the ZIP only as an audit/reference snapshot. Never overwrite the current GitHub backend with the ZIP backend because that would restore stale version strings and duplicate `PORT` declarations.

The older local project at the following path is also not the production source:

```text
D:\zjh\self\Hash\forge_coder_package
```

It was an incomplete source package used for local product, security, workflow, and browser experiments. Its useful ideas may be compared against the official source, but its files must not be copied wholesale into the GitHub repository.

---

## 4. Live Services and Deployment

| Service | URL |
|---|---|
| Frontend — Vercel | https://forge-sand-two.vercel.app |
| Backend — Railway | https://forge-production-2692.up.railway.app |
| GitHub | https://github.com/goldrusher9009-sketch/forge |
| Railway project | https://railway.app/project/hearty-contentment |

Railway details:

```text
Project: hearty-contentment
Service: forge
Environment: production
Root directory: /forge/forge-platform/
Persistent database: /data/forge.db
Volume: forge-volume
```

Deployment flow:

```text
verified change in forge/ only
→ narrow commit on main
→ push main
→ Railway auto-deploys backend
→ Vercel auto-deploys frontend
→ wait several minutes
→ verify live behavior and logs
```

The live backend health endpoint returned `v1273.00` on 2026-07-25:

```text
GET https://forge-production-2692.up.railway.app/health
```

The previously documented `/api/version` endpoint currently returns `Cannot GET /api/version`. Treat that as a deployment/runtime inconsistency to diagnose later; do not use it as the only deployment signal.

Never judge deployment state from a monorepo commit message alone. Other applications share `main`, and deploys take time.

---

## 5. Monorepo Safety Rules

1. Read `DEPLOY_MAP.md` first.
2. The real Forge is the `forge/` subfolder of the Git root.
3. Never run `git add -A` or stage the monorepo root.
4. Stage only explicitly reviewed Forge files.
5. Preserve unrelated local changes; never reset, clean, or overwrite them.
6. Do not push or deploy until the intended Forge diff, tests, and live verification plan are clear.
7. Railway deploys automatically from `main`; broken TypeScript can break production.
8. SQLite data persists on `forge-volume`; never drop tables or delete the volume without a migration, backup, and rollback plan.
9. `ForgeApp.tsx` is BOM-encoded and very large. Read targeted sections before editing; never rewrite the whole file.
10. `index.ts` is approximately 244,000 lines. Make narrow, source-grounded edits only; never truncate or replace the whole file.
11. Do not copy the old local package or ZIP over current GitHub files.
12. Do not claim a feature is live because a route, table, component, or comment exists. Verify the real execution path.

### China-accessible build sources

This development environment is in China. Docker image pulls and dependency installation must use China-accessible domestic mirrors when the default upstream source is slow or unavailable.

- Prefer an approved Docker registry mirror or domestic image mirror; do not embed registry credentials in Dockerfiles, Compose files, or Git.
- Preserve the existing lockfile and dependency versions. For npm recovery, prefer `npm ci --registry=https://registry.npmmirror.com` rather than changing packages or regenerating the lockfile.
- Treat mirror changes as build-infrastructure changes only. Verify that the resulting image and application behavior remain equivalent to the official-source build.

---

## 6. Boss's Product Definition

Forge is not meant to be another chatbot, prompt wrapper, agent builder, or collection of disconnected AI tools.

The intended product is:

> A fully autonomous, result-oriented orchestration platform that uses the models, agents, tools, devices, channels, people, and services connected to it to complete a measurable objective.

The customer should be able to define:

- the desired result;
- success criteria;
- budget and deadline;
- permissions and prohibited actions;
- required approval points;
- customer or stakeholder contacts;
- preferred models, or automatic model selection.

Forge should then be able to:

1. Break the objective into work.
2. Select the appropriate model, agent, and tool for each step.
3. Use customer-provided models and platform models.
4. Let advanced users choose which model performs which task.
5. In Auto Mode, choose models and tools automatically based on quality, cost, latency, permissions, and task type.
6. Operate through authorized computers, browsers, phones, email, SMS, APIs, and connected services.
7. Ask customers or stakeholders questions when required information is missing.
8. Wait for responses and resume the objective without losing state.
9. Recover from failed steps and select an alternative path.
10. Produce an artifact or real-world result with evidence, cost, status, unresolved risks, and an audit trail.

Autonomy means making decisions and continuing work within defined authority. It does not mean bypassing permissions, spending limits, customer consent, security controls, or human approval requirements.

---

## 7. Model Strategy

Customers must be able to add and use their own models and provider keys. Forge should support both user-directed and automatic routing.

Expected modes:

```text
Manual mode:
The user chooses the model or assigns different models to different tasks.

Policy mode:
The user defines rules such as cheapest, fastest, private, Chinese-language, US-hosted, or premium quality.

Auto mode:
Forge selects the model for each step and can change models when quality, cost, latency, availability, or tool support requires it.
```

Chinese and US models should be usable through the same provider-neutral contract where legally and operationally permitted. Routing must consider data location, privacy, language, price, context size, multimodal/tool support, and provider availability—not just benchmark score.

The platform already contains BYOK, platform keys, direct models, OpenRouter support, cost modes, and auto-routing foundations. Audit and reuse those paths before creating new routing code.

---

## 8. Agent Digital ID and Digital Twin Direction

Anything created in Forge must be associated with the authenticated creator and the agents involved in producing it.

Each durable agent should have a persistent digital identity containing or referencing:

- agent ID and owner ID;
- creator and organization;
- purpose and declared capabilities;
- model and tool permissions;
- creation/version history;
- benchmark and quality history;
- provenance of important outputs;
- approval and delegation boundaries;
- commercial status: private, shareable, sellable, or mineable;
- cryptographic or verifiable signature data when implemented;
- revocation, suspension, and ownership-transfer state.

The long-term concept is an agentic digital twin linked to the person or organization that created it. It learns from approved work, corrections, behavior, habits, preferences, and decisions over time, then acts on the owner's behalf within explicit permissions.

Automated decisions must remain attributable: the system should be able to answer which agent decided, for whom, under what authority, using which model/tools/data, and with what result.

Do not create a second identity system before auditing the existing Agent Passport, user identity, persona, ForgeModel, agent, goal, memory, and tool-history implementations.

---

## 9. Apptopia–Forge–Minera Ecosystem

The three products remain independent products with their own features, users, data, and deployment. They connect through explicit contracts; they must not be merged into one codebase.

Local project locations:

```text
Apptopia Layer: D:\zjh\self\ProjectHash
Forge:           D:\zjh\self\Hash\forge\forge
Minera:          D:\zjh\self\Hash\minera-full-source
```

Product responsibilities:

```text
Apptopia Layer
→ benchmarks and evaluates agents
→ measures task-specific quality and reliability
→ provides evidence for agent/model selection

Forge
→ creates complete agents with different qualities and capabilities
→ gives them identity, ownership, permissions, memory, models, and tools
→ orchestrates work across devices, channels, services, and people
→ turns objectives into verified results
→ can publish a useful creation as a sellable agent

Minera
→ mines, discovers, improves, ranks, rewards, or commercializes useful agents
→ exact mining economics and mechanics must be verified from Minera source and documentation
```

Intended lifecycle:

```text
person or organization logs in
→ creates an agent/project in Forge
→ Forge assigns identity, ownership, policies, tools, and models
→ Apptopia benchmarks the agent for specific tasks
→ Forge uses benchmark evidence during orchestration
→ real outcomes and corrections improve the agent
→ owner may keep it private, share it, make it sellable, or send it to Minera
→ Minera mines/ranks/rewards it under its verified product rules
```

The connector should initially be the smallest stable shared contract, not a speculative shared platform. At minimum it will likely need:

- stable agent ID;
- owner/organization ID;
- version;
- capability manifest;
- benchmark references;
- permissions and commercial status;
- provenance and signature reference;
- lifecycle/revocation status.

Confirm what already exists in all three codebases before adding fields or APIs.

---

## 10. Existing Forge Assets to Reuse

The official source is large and reportedly contains 1,000+ tools. Treat that as an inventory to validate and orchestrate, not a reason to add more tools blindly.

Known foundations include:

- user and organization authentication;
- per-user model keys and platform model keys;
- multi-provider LLM calls;
- model auto-router and cost modes;
- agents, personas, Agent Passport, and ForgeModel;
- goals, autonomy, cron, reflection, memory, and tool history;
- Thread and Message history;
- Dream Mode and Wave tools;
- subscriptions, Stripe, usage, and admin controls;
- BYOS backup/sync;
- computer, browser, external service, and integration foundations;
- Forge Brain and behavioral memory.

Before implementing a new feature, locate the existing route, table, component, helper, and execution caller. Reuse the shortest working path. The current risk is disconnected capability and duplicate implementation, not lack of code volume.

---

## 11. Monthly Package Direction

Do not price Forge by the number of tools. Customers buy autonomous operating capacity and verified outcomes, not a menu of 1,000 features.

Suggested commercial dimensions:

- number of active autonomous goals;
- concurrency;
- monthly execution credits;
- model policy and automatic routing;
- proactive phone/SMS/email/customer outreach;
- computer/browser action access;
- memory retention and ForgeModel depth;
- private agents and sellable agents;
- number of users, organizations, and customer workspaces;
- audit, permissions, SLA, and support;
- Apptopia benchmark access;
- Minera publishing/mining access.

Possible package shape:

```text
Launch
→ one workspace
→ limited active goals and execution credits
→ BYOK and core tools
→ manual model selection plus basic Auto Mode
→ human approval gates

Autonomous
→ more concurrent goals
→ advanced Auto Mode and model policies
→ proactive customer communication
→ browser/computer/phone actions
→ deeper memory and benchmark-based routing

Scale / Agency
→ multiple customer workspaces
→ team roles, policies, audit, private tools, SLA
→ higher execution capacity
→ sellable-agent and ecosystem connectors
```

Phone, SMS, paid data, external APIs, hosted-model consumption, and other direct third-party costs should be metered or passed through separately. Do not set final prices before measuring real unit costs and internal-project usage.

Audit and extend the existing Stripe/subscription implementation instead of creating a second billing system.

---

## 12. Database and Environment

Production database:

```text
Engine: better-sqlite3
Path: /data/forge.db
Railway volume: forge-volume
```

Known core tables include:

- `users`
- `threads` / `messages`
- `api_keys`
- `platform_api_keys`
- `subscriptions`
- `forge_memory`
- `forge_model`
- `personas` / `agents`
- `goals`
- `tool_history`
- `usage_logs`

Known environment variables include:

- `JWT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `ADMIN_EMAIL`
- provider keys such as `ANTHROPIC_API_KEY` and `OPENAI_API_KEY`
- `R2_*` backup credentials

Never print, copy, commit, or expose real secrets. Do not infer production values from examples.

---

## 13. First Session: Read-Only Audit Before Development

The first session in the new Codex window should remain read-only until the following is understood:

1. Read this file and `DEPLOY_MAP.md` completely.
2. Confirm Git remote, branch, HEAD, remote `main`, and worktree status.
3. Inspect recent commits that touched the real Forge files.
4. Verify the live frontend, backend health, and Railway deployment truth.
5. Map the current implementation of:
   - user model keys;
   - manual model selection;
   - Auto Mode/model routing;
   - agent identity/passport;
   - ForgeModel and learning;
   - goals/autonomy/reflection;
   - tool registry and execution;
   - computer/phone/customer communication connectors;
   - Stripe subscriptions and usage;
   - publishing/sellable agents;
   - existing Apptopia or Minera connectors.
6. Distinguish working production paths from partial foundations, dead routes, duplicate code, UI-only claims, and roadmap text.
7. Produce a minimal gap map before proposing implementation.

Do not begin by adding another framework, agent abstraction, identity database, tool registry, billing system, or orchestration engine. The official source probably already contains foundations for each; confirm and connect them first.

---

## 14. Recommended Development Order

After the read-only audit, prioritize the smallest path that proves the Boss's ecosystem vision on one real internal project:

1. Choose one measurable internal objective.
2. Use an existing Forge agent, model router, goal system, and tool execution path.
3. Add only the missing connection required to complete the objective.
4. Record identity, ownership, permissions, actions, cost, evidence, and result.
5. Benchmark the agent through the smallest real Apptopia contract.
6. Verify the Minera handoff or mining contract from source before integrating it.
7. Run the complete Forge test/build gates.
8. Use the internal pilot to determine monthly execution limits and real third-party cost.

One verified end-to-end ecosystem path is more valuable than another hundred disconnected tools.

---

## 15. Definition of Done for Any Forge Change

A change is not complete until:

- it uses the official `forge/` source path;
- it does not overwrite unrelated monorepo applications;
- the existing implementation was searched before new code was added;
- ownership and authentication are enforced;
- permissions, budgets, approvals, and failure behavior are explicit;
- data migration and rollback are defined when schema changes are involved;
- tests cover the smallest critical success and failure path;
- frontend and backend build/type checks pass using existing project scripts;
- the intended files alone are staged;
- live endpoints are rechecked after deployment;
- no fake customer, payment, revenue, benchmark, outcome, or autonomy claim is made.

---

## 16. Suggested Opening Instruction for the New Codex Session

Copy this file into the new Forge workspace and start the session with:

> Read `FORGE_HANDOFF.md` and `DEPLOY_MAP.md` completely before doing anything; if the workspace contains an `AGENTS.md`, read that too. Keep the first phase read-only. Verify GitHub `main`, the live Forge deployment, and the actual implementations of model routing, autonomy, tools, Agent Passport/Digital ID, learning, billing, sellable agents, and any Apptopia/Minera connectors. Do not copy code from `forge_coder_package` or `forge-source.zip`, do not add new tools or abstractions, and do not push or deploy. Use China-accessible Docker and dependency mirrors without changing dependency versions. First produce a source-grounded capability and gap map for the smallest end-to-end internal-project pilot that connects Forge, Apptopia, and Minera.
