# Forge — Master Plan & Full Work List
_Generated 2026-06-13 · v6.99 baseline · honest scope, no hype_

## 0. Reality check (read first)
Forge is a real, live, working product. That is genuinely impressive for a solo build. But a few things need to be said plainly so the work serves you instead of burning you:

- **"Trillion dollar" / "moat no one can beat" / "without fail" are not engineering targets.** No feature ships those. What ships them — if anything does — is users, retention, and revenue compounding over years. The job this session is to make the product *provably excellent and demo-ready*, not to declare it a trillion-dollar company.
- **The bottleneck is no longer features.** Forge already has ~40 backend modules and a deep frontend. The bottleneck is: (1) is it stable, (2) does the first-run experience land, (3) can a judge/user understand the value in 60 seconds. That's what a premium ForgeOS landing + clean flows actually buy you.
- **Repo hygiene is now a real risk.** ~150 throwaway `.bat`/`.ps1`/`.txt` push scripts and 3 `index.ts.broken*` files are in the root. This makes the project look unfinished to anyone who opens it, and makes deploys error-prone. Cleanup is on the list.

## 1. Verified current state (checked live 2026-06-13)
| Surface | URL | Status |
|---|---|---|
| Backend health | forge-production-2692.up.railway.app/health | ✅ `v6.99` |
| Frontend app | forge-sand-two.vercel.app | ✅ 200 |
| Landing | /landing | ✅ 200 (370-line typewriter page) |
| Login | /login | ✅ 200 |
| DB | Railway SQLite /data/forge.db | ✅ persistent |

Backend `index.ts` is **4996 lines** (CLAUDE.md says ~2350 — that note is stale and should be updated). Frontend has framer-motion already; no Three.js yet.

## 2. ForgeOS landing rebuild — THIS SESSION (priority 1)
Goal: a landing page that *looks* like an expensive, world-class operating-system product. Concretely:
- Animated 3D-feel hero (Three.js starfield/grid + parallax), not just typewriter text
- Clear one-line value prop + sub-headline + primary CTA
- "The OS" section: live feature tiles (agents, revenue loop, email, content, white-label) each with a **slot for an explainer video** (embed-ready `<video>`/iframe placeholder so real clips drop in later)
- Pricing (pull real tiers from SubscriptionTiers)
- Agents showcase, social-proof/stats band, footer
- Fully responsive, dark premium theme, real working Next.js route, deploys on push
- **No fake claims** in copy (no invented customer logos, no fabricated revenue numbers)

## 3. Full functionality list (what exists — to verify, not rebuild)
Backend modules present: autonomy, billing, metering, monetization, multi-model, router, webhooks, whitelabel, enterprise, compliance, governance, zkp, memory, personas, retention-analytics, rate-limiting, realtime, search-index, tokenomics, harness, genesis, doc-gen, data-export, batch-jobs, advanced-analytics, advanced-security, reply-suggestions, mobile-offline, prompt-cache, launch-readiness + more.

**Action:** smoke-test the headline endpoints (leads CRUD, draft-outreach, email campaign gen, content multiplier, /api/brand/config) against the live backend and record pass/fail. Do NOT assume green because health is green.

## 4. Moonshot shortlist — rated by real feasibility
Honest ratings. "Build now" = doable + high impact. "Later" = real but multi-session. "Skip" = hype without payoff.

| Idea | Verdict | Why |
|---|---|---|
| Premium ForgeOS landing w/ video slots | **Build now** | Highest demo ROI; this session |
| Smoke-test + fix any red endpoints | **Build now** | Stability beats features |
| Repo cleanup (archive throwaway scripts) | **Build now** | Makes project look finished |
| "One prompt → working agent" onboarding flow | **Build next** | This is the actual addictive hook — time-to-value |
| Live agent activity theatre (watch agents work in real time) | **Build next** | Genuinely differentiating, partly exists |
| Template marketplace with 1-click install | Later | Real moat (network effects) but needs content |
| Usage-based viral referral loop | Later | Good growth lever, needs billing wired |
| On-chain/zkp "verifiable agent runs" | Skip for demo | zkp.ts exists but it's complexity for no judge payoff |
| Voice/3D avatar OS desktop metaphor | Skip | Cool, but huge effort, distracts from core value |

## 5. Deploy discipline (from memory — keep)
- Run `npm run build` locally before every push; broken TS = broken backend for all users.
- Edit `ForgeApp.tsx` / `index.ts` in chunks (Edit, never full Write); ForgeApp.tsx is BOM-encoded → use bash grep.
- Sandbox can't git (OneDrive lock) → push runs Windows-side.
- Workflow: build → `git pull --rebase` → `git push` → verify live.

## 6. This-session order of work
1. ✅ This plan
2. Rebuild ForgeOS landing (3D hero + video-slot feature OS + pricing + agents)
3. `npm run build` locally, fix errors
4. Provide push command (Windows-side) + verify live
5. Smoke-test headline backend endpoints, log results
6. (If time) repo cleanup into `/archive`

---
_One thing done world-class beats ten half-built. We build the landing right, ship it, then move down the list._
