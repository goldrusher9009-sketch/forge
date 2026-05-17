# Forge: The Full Project Briefing (For AI Coding Agents)

## 1. What is Forge?

**Forge is the world's first full-stack AI business foundry.**

It is a single platform where anyone — a non‑technical founder, a professional developer, an enterprise CTO — can describe a software idea in plain language (voice or text) and get a live, hosted, monetizable software product in minutes.

Crucially, Forge does not just generate code; it delivers complete, deployed businesses. The platform handles everything:

- Idea validation and product strategy (a "Cursor for Product Managers")
- Full‑stack code generation by autonomous AI agent swarms
- Intelligent model selection across 500+ LLMs (free open‑source models for simple work, premium models for complex work)
- One‑click deployment to managed cloud, the user's own cloud accounts, or completely self‑hosted servers
- A marketplace where creators sell templates and specialised agents
- A token economy where users earn real value for contributing to the ecosystem

## 2. The Market Context (Why Now)

- The AI coding tools market is $7.88 B in 2025, projected to reach $34.58 B in 2026 with 17‑27 % CAGR.
- 92 % of US developers use AI coding tools daily, yet 63 % of "vibe coders" are non‑technical founders who cannot go from idea to live product.
- Existing tools are severely fragmented:
  - **Cursor / Copilot**: single‑model, no deployment, no mobile, no monetisation.
  - **Claude Code**: terminal‑only, Claude‑exclusive, extreme token burn, Mac‑only computer control.
  - **Lovable / Bolt**: only front‑end or limited back‑end, no enterprise governance.
  - **OpenRouter**: pure API proxy – no IDE, no agents, no deployment.
- The industry is shifting from per‑seat pricing to outcome‑based models. Enterprise clients are willing to pay $25k‑$150k for delivered business results.
- No platform combines model‑agnostic routing, agentic coding, one‑click deploy, marketplace, and tokenized ownership across desktop and mobile. **That is Forge.**

## 3. The Unfair Moat – Why Forge Cannot Be Easily Copied

Forge's defensibility rests on four compounding layers:

### 1. Proprietary Multi‑Model Router
We are building our own router (not relying on OpenRouter) that classifies every prompt by complexity and routes it to the cheapest model capable of doing the job well. This router generates a unique data asset: which model works best for which real‑world coding task. No competitor can accumulate this multi‑prompt‑to‑production‑outcome dataset.

### 2. Clean‑Room Agent Harness
We implement an agent‑orchestration engine with capabilities equivalent to Claude Code (DAG‑based task decomposition, 40 tools, three‑tier memory, background daemon, deep‑reasoning mode) legally, in Rust, from behavioural specifications – giving us world‑class autonomy with no provider lock‑in.

### 3. 3‑Tier Hosting (Managed / BYOC / Self‑Hosted)
Users can run on our cloud (with a 30 % margin), deploy to their own AWS/GCP/Azure accounts (platform fee), or self‑host the entire open‑core engine for free. This eliminates vendor lock‑in and unlocks the enterprise market that demands data sovereignty.

### 4. Community Ownership via Tokenomics
FORGE tokens reward contributors (template creators, plugin developers, active community members). Tokens can be staked for premium features and governance, and the platform uses 20 % of net revenue to buy back and burn FORGE, creating deflationary pressure. This aligns the incentives of users, creators, and the platform in a way centralised competitors cannot match.

## 4. Core Product Components (What Gets Built)

### Desktop IDEA
Fork of Eclipse Theia (VS Code) with an Agent Canvas (visual swarm overview), a model‑router dashboard, and a computer‑control module that can take over the mouse, keyboard, and GUI applications just like Claude Code Computer Use, but cross‑platform (macOS, Windows, Linux) and with cost‑aware routing.

### Web Creator Studio
A chat‑based, voice‑first interface for non‑technical founders. Prompt a complete app, preview it, tweak it, and deploy it – all without opening a code editor.

### Mobile App (iOS + Android)
Voice‑first creation, full app lifecycle management, and a one‑click App Store / Google Play publishing pipeline. The app can compile and submit native builds.

### One‑Click Deployment
Auto‑detects the tech stack, containerises it, and deploys to Forge Cloud, or directly into the user's own AWS/GCP/Azure account (BYOC). Provides auto‑HTTPS, domains, monitoring, and CI/CD with rollback.

### Marketplace & Templates
A marketplace where developers sell specialised templates, connectors, and custom agents. Template creators earn 70‑80 % revenue share + FORGE tokens every time their template is deployed.

### Enterprise Command Center
A dashboard for compliance (SOC 2, GDPR, LGPD), FIDO‑compatible agent identity (every action cryptographically attributable), immutable audit trails, and role‑based access control.

### Token Launchpad (FOMO)
Allows creators to tokenise their applications as fractional assets, raise funds, and share revenue with token holders.

## 5. The Six Moonshots (Long‑Term Differentiators)

- **Living Apps** – Every deployed application includes a Lifecycle Agent that self‑heals, auto‑scales, and implements user‑requested changes.
- **Product Strategy Agent** – Validates ideas, defines MVPs, and estimates market size before any code is written.
- **Multi‑Verified Agent Swarms** – For high‑stakes tasks, independent agents (Security, QA, Architecture) cross‑check every output.
- **Agent‑to‑Agent Commerce** – Autonomous agents can pay each other for services using FORGE tokens.
- **Company Brain** – Observes internal company docs and communications to build a knowledge graph that informs every agent.
- **Tokenized Application Ownership** – Any app can mint fractional ownership tokens.

## 6. Revenue Streams (8 Streams, No Token Pre‑Sale)

| Stream | Model | Unit Economics |
|--------|-------|-----------------|
| **Subscriptions** | Free / Pro ($29/mo) / Business ($79/user/mo) | ~$29 ARPU |
| **API Routing** | 5 % margin on premium tokens; credit packs | $50‑200/dev/mo |
| **Outcome‑as‑a‑Service** | Fixed‑price app delivery ($5k‑$150k) | Captures enterprise AI spend |
| **Marketplace Commissions** | 15‑25 % on template/plugin sales | Recurring $47‑297/mo |
| **Deployment Margin** | 20‑30 % on Forge Cloud infrastructure | $3‑50/mo per app |
| **White‑Label Licensing** | $5k‑50k/mo to agencies | High‑volume, sticky |
| **Consultancy** | $5k‑25k custom sprint builds | Immediate cash, pipeline |
| **Token Economy** | Network fees, buyback‑and‑burn | Deflationary, rewards community |

**Year 1 ARR target: $3‑5 M. Year 3: $50 M+.**

## 7. Technical Architecture – The "Forge Core"

The entire platform is centred on a Rust crate called **forge-core**. This is the engine. Everything else — the IDE, the web studio, the mobile app, the CLI — is a thin skin that calls forge-core.

### forge-core crate structure:

```
forge-core/
├── Cargo.toml
├── src/
│   ├── lib.rs
│   ├── router/
│   │   ├── mod.rs
│   │   ├── classifier.rs         # Complexity classification (heuristic → SLM)
│   │   ├── routing_table.rs      # Tier→model mappings
│   │   ├── fallback.rs           # Cascade logic
│   │   ├── decorator.rs          # SmartRoutingDecorator
│   │   └── observability.rs      # Structured metrics
│   ├── agent/
│   │   ├── mod.rs
│   │   ├── tool_registry.rs      # ~40 permission‑gated tools
│   │   ├── coordinator.rs        # DAG‑based multi‑agent orchestrator
│   │   ├── memory.rs             # Working, Episodic (LanceDB), Semantic (knowledge graph)
│   │   └── query_engine.rs       # LLM abstraction layer
│   └── deploy/
│       ├── mod.rs
│       └── container.rs          # Docker/Terraform helpers
```

### Router architecture (what we are building right now):

**1. Classification Layer** – Heuristic classifier (token count, keyword patterns) that scores prompts as Trivial | Simple | Moderate | Complex. Later a lightweight on‑device model (e.g., ModernBERT) for higher accuracy.

**2. Routing Table** – Configurable mapping from complexity tier → model (e.g., Trivial → Llama 3.3, Complex → Claude Opus 4.6).

**3. Failover Cascades** – If the primary model fails or rate‑limits, the router automatically fails over through secondary, tertiary, and finally local fallback models.

**4. Observability** – Every routing decision logged with structured reasoning. This data becomes the proprietary training set for a smarter classifier, building the data flywheel.

### Agent harness architecture:

- **ToolRegistry**: A permissioned list of ~40 tools (file operations, terminal commands, git, web browsing, computer control, sub‑agent spawning).
- **Coordinator**: Takes a high‑level goal, decomposes it into a DAG of tasks, assigns tasks to agents, monitors progress, and dynamically re‑plans on failure.
- **Memory**: Three tiers – in‑context working memory, episodic memory (via LanceDB with semantic search), and a semantic knowledge graph.
- **QueryEngine**: Abstraction for all LLM calls, including retries, cost tracking, and circuit breaking.

### Deployment pipeline:

forge-core's deploy module will produce Terraform/Packer scripts and container builds that can be executed against Forge Cloud, user‑supplied cloud accounts, or exported for self‑hosting.

## 8. What We Are Building Right This Minute

We are starting with **forge-core** – the Rust engine that houses the router, the agent framework, and the deployment pipeline. This mirrors the path Claude Code took: build the execution engine first, expose it via CLI, then wrap it in an IDE and web interface later.

### Immediate task for the AI coding agent (Claude/Cursor):

Create a new Rust project **forge-core** with the module structure shown above. Implement the following:

1. **ComplexityClassifier** – A heuristic classifier that uses token count thresholds and keyword detection to score a prompt into one of four tiers. Hard‑code initial keyword lists for known complex tasks (e.g., "refactor", "architecture", "memory leak").

2. **RoutingTable** – A struct that loads a TOML configuration mapping complexity tiers to provider/model pairs.

3. **SmartRoutingDecorator** – A composable wrapper around a generic `LlmProvider` trait that classifies incoming prompts, selects the model from the routing table, and forwards the request. Include structured logging (tracing crate) that records the classification, chosen model, latency, and cost estimate.

4. **FallbackHandler** – A cascade mechanism that intercepts errors/timeouts and retries with the next model in the tier's fallback list.

5. **Observability** – Log every routing decision to stdout/OpenTelemetry with a unique correlation ID.

Once forge-core's router can accept a prompt and return a model selection with failover, we will add the agent tool registry and coordinator.

## 9. The Complete Data Flywheel

Every prompt that passes through the router is logged. Over time, we collect millions of (prompt, complexity_score, model_used, success, real_world_outcome) data points. This data is impossible for any single‑model provider to replicate. It will train a proprietary classifier that continuously improves routing decisions, further optimising cost and quality, which attracts more users, which generates more data. **This is the central moat.**

## 10. The Open‑Source Strategy

- **forge-core** (router, agent runtime, memory system, deployment DSL): MIT or Apache 2.0 – fully open source, community can contribute, host themselves, and build their own tools.
- **Enterprise governance layer, Product Strategy Agent**: Source‑available (BSL) – visible for audit, but not to be offered as a competing service.
- **Forge Cloud, token launchpad, consultancy**: Proprietary – this funds the whole open ecosystem.

---

## Ready to Build?

This briefing is complete, self‑contained, and ready to be pasted directly into Claude, Cursor, or any AI coding assistant.

**Next step:** Copy everything above and feed it to Claude. It now has the full context of what we are building, why, and exactly what the first code commit should contain.

If Claude still stumbles, just tell it:

> "Start by implementing the ComplexityClassifier enum and the RoutingTable struct in a new Rust lib crate. I'll feed you the rest step by step."
