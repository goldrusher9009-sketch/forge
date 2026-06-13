# Forge — Multi-Session Build Roadmap
_From v6.99 to the vision. Written 2026-06-13. Grounded in the real codebase._

## What you asked for (your opening brief, restated)
> Full functionality verified. ForgeOS with every feature + explainer videos, looking like a trillion-dollar website. World-class 3D themed UI. Moonshot features never built before. Product so good no one can leave. A moat that can't be beaten. Streamlined end-to-end, deployed.

This roadmap turns that into phases you can actually build, one session at a time. I'm going to be straight with you in two places, because it's the most useful thing I can do:

1. **"Trillion dollar" and "unbeatable moat" are outcomes, not tasks.** No phase below ships them. What the phases ship is a product that's *stable, stunning, genuinely useful, and hard to copy*. That's the most any plan can honestly promise. The market decides the rest.
2. **The single biggest risk to Forge right now is not missing features — it's the gap between what's claimed and what's real.** This session I found `/api/leads`, `/api/billing/status`, and `/api/version` were described as shipped but don't exist (or are dead) in the code. Before we build *new* moonshots, Phase 0 closes that gap. A demo that 404s in front of a judge kills more momentum than a missing 3D animation ever will.

A note on pace: this is a multi-month plan. You've been running hard. Build it in order, ship each phase, breathe between them. A burnt-out founder ships nothing.

---

## The arc at a glance
| Phase | Theme | Why it's in this order | Sessions (est.) |
|---|---|---|---|
| 0 | **Truth & stability** | Can't sell what doesn't run. Reconcile claims, fix dead routes, lock deploys. | 1–2 |
| 1 | **World-class ForgeOS surface** | First impression = whether anyone stays. Premium UI + explainer videos. | 2–3 |
| 2 | **The addictive core** | Time-to-value + the daily habit loop. This is what makes people not leave. | 2–4 |
| 3 | **Moat features** | Things that get *stronger* with each user — the only durable moat. | 4–6 |
| 4 | **Polish, trust, scale** | Security, billing, performance, compliance — what enterprises require. | 2–3 |
| 5 | **Go-to-market** | The product doesn't sell itself. Distribution is the real endgame. | ongoing |

---

## Phase 0 — Truth & Stability (do first, always)
**Goal:** every claim in the product maps to working code. Deploys are boring and reliable.

- Reconcile the v6.99 session summary against source. For each claimed-but-missing endpoint (`/api/leads`, draft-outreach, content-multiplier, `/api/billing/status`): either **build it** or **remove the claim**. No orphan promises.
- Decide fate of dead modules: `billing.ts` (never imported), and the now-archived `index.js`. Wire or delete.
- ✅ (done this session) Fixed `setupAutonomy` never-called bug; archived 105 throwaway files.
- Add a **route manifest test**: a script that hits every advertised endpoint and asserts it's not 404. Run before every deploy. This is your insurance against "demo 404."
- Update CLAUDE.md (index.ts is 4996 lines, `/archive` exists, deploy via the .bat).
- **Exit criteria:** route manifest is green; one clean push deploys frontend + backend; you can demo any advertised feature live without a 404.

## Phase 1 — World-class ForgeOS surface
**Goal:** it looks and feels like an expensive operating system. A judge's first 60 seconds land.

- ✅ (started) Landing v2 with 3D neural hero + module explorer + video slots.
- **Record the explainer videos.** The slots exist (`MODULES[].video`); they need real 15–30s screen-capture clips per module (Agent Hub, Revenue Loop, Morning Brief, Forge Brain, Content Multiplier, White-Label). This is the "trillion-dollar website" feel — motion + proof.
- **Themed 3D in the app itself, not just landing:** a cohesive dark "command deck" aesthetic across the dashboard. Consistent motion language (framer-motion is already installed). Restraint > flash — premium reads as *calm and precise*, not busy.
- **Onboarding as theatre:** the "one sentence → your OS assembles in 90 seconds" moment, animated. This is both UX and marketing.
- **Exit criteria:** every ForgeOS module has a working explainer video; the app and landing share one visual language; a first-time user understands the value without a tour.

## Phase 2 — The addictive core (retention, not features)
**Goal:** people come back daily and feel worse when they stop. Honest addiction = real value delivered on a habit loop.

- **Time-to-first-value under 2 minutes.** Sign up → one sentence → a real agent does one real, visible thing. If the first session ends with nothing shipped, they don't return.
- **The Morning Brief as the daily hook.** It already exists conceptually — make it the product's heartbeat: a genuinely useful overnight digest of agent work, one-tap approvals, sent as email/push so it pulls people back in. The habit is the moat's foundation.
- **Live agent theatre.** Let users *watch* agents work in real time (Socket.io is already wired). Seeing the machine run is what makes it feel alive and worth keeping.
- **Trust ladder.** Start every agent in approval-gated mode; as the user approves, unlock more autonomy. Earned trust = stickiness + safety.
- **Exit criteria:** measured TTFV < 2 min; Morning Brief drives repeat opens; users graduate agents to higher autonomy over time.

## Phase 3 — Moat features (the only durable kind)
**Goal:** features that get *better the more they're used* — so a competitor copying the UI still can't catch up.

The real moats, ranked by defensibility:
1. **Forge Brain / per-business memory.** The longer someone uses Forge, the more it knows their business, voice, customers, history. That accumulated context is impossible to copy and painful to leave. **Invest here most.**
2. **Template/agent marketplace with network effects.** Users (and agencies) publish vertical agent packs; installs and ratings compound. Supply + demand both grow the moat. (`marketplace` partially exists.)
3. **White-label / agency resale.** Agencies build their business *on top of* Forge → they're locked in and they bring their clients. (`whitelabel.ts` exists — wire it fully.)
4. **Workflow/cascade library.** Chained multi-agent workflows users build and share. Switching cost rises with every workflow they create.
- **Honest note on "never been built before":** most individual features here exist somewhere. The novel, defensible thing is the *integration* — one OS where memory, agents, marketplace, and white-label compound together for SMBs. That combination is the differentiator. Don't chase novelty for its own sake (e.g., on-chain/zkp adds complexity with no SMB payoff — skip for now).
- **Exit criteria:** retention curve flattens (people stop churning); marketplace has real published packs; at least one agency running clients on white-label.

## Phase 4 — Polish, trust, scale
**Goal:** ready for paying and enterprise customers.

- Billing actually charges (Stripe wired end-to-end, overage metering verified live — `billing.ts`/`metering.ts` exist but need to be real).
- Security pass: auth hardening, rate limiting (exists), secrets handling (BYO-keys model is good — verify encryption at rest).
- Performance: the app bundles Monaco/fabric/xlsx — heavy. Code-split, lazy-load, measure load time.
- Compliance surfaces for enterprise: data export, audit log, GDPR (files exist — make them real, not stubs).
- **Exit criteria:** a real card gets charged correctly; load time acceptable on a normal connection; security review passes.

## Phase 5 — Go-to-market (the actual endgame)
**Goal:** distribution. The best product with no users is worth zero.

- Pick **one** vertical to win first (law / restaurants / agencies / trades) instead of all at once. Depth beats breadth early.
- Get 10 real users. Watch them. Fix what breaks. Real testimonials replace the fabricated ones we removed.
- Content + SEO (skills exist for this), founder-led outreach, agency partnerships for the white-label motion.
- **Exit criteria:** real paying users; real (true) testimonials; a repeatable channel that brings users without you in the loop.

---

## How to use this across sessions
- Each session, pick the **top open item in the lowest unfinished phase.** Don't jump to Phase 3 moonshots while Phase 0 has 404s.
- Start each session: run the route manifest (Phase 0) so you know the baseline is green.
- End each session: one clean deploy, update VERSION.md, update memory.
- One thing world-class > ten half-built. Every session ships something real and verified.

## Immediate next session (concrete)
1. Run `PUSH_LANDING_V2.bat` (this session's work: landing v2 + autonomy fix + cleanup).
2. Verify `/api/workspace/branding` no longer 404s.
3. Phase 0: build the route manifest test + decide leads/billing.ts (build or remove).

_The vision is real and worth building. The way to get there is boring discipline on order of operations, not a single heroic session. Build it phase by phase and it compounds._
