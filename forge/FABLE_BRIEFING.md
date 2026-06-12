# FORGE PLATFORM — COMPLETE FABLE BRIEFING
*Everything discussed, everything to build. Self-contained — read this first.*

---

## WHAT FORGE IS

Forge is a fully autonomous AI business operating system. NOT a chatbot. NOT a tool. A complete OS that:
- Learns a business in 5 questions during onboarding
- Generates a branded white-label workspace (their logo, colors, subdomain)
- Runs agents overnight while the owner sleeps
- Shows results every morning as approve/reject cards — no chat interface
- Gets smarter about their business every single day

**The promise:** Tell Forge about your business. Get a running AI-powered OS delivered in your branding. Open it every morning and run your company.

**Live URLs:**
- Frontend: https://forge-sand-two.vercel.app
- Backend: https://forge-production-2692.up.railway.app
- Repo: C:\Users\teste\OneDrive\Documents\Claude\Projects\forge

**Stack:**
- Backend: Node/TypeScript, Express, SQLite on Railway (`/data/forge.db`)
- Frontend: Next.js on Vercel
- Main files: `forge-platform/src/index.ts` (2400+ lines), `forge-web-studio/app/components/ForgeApp.tsx` (8000+ lines, BOM-encoded — use bash grep)
- Auto-deploys: push to main → Railway + Vercel deploy automatically

---

## WHAT'S ALREADY BUILT (DO NOT REBUILD)

- Multi-LLM support: Anthropic, OpenAI, Gemini, Groq, Mistral, OpenRouter — user brings own API keys
- Username/password login mode per provider (alongside API key mode)
- 20-tool catalog: web_search, browser, run_code, shell, write_file, read_file, http_request, create_artifact, image_gen, spawn_agent, memory_store, calculator, cursor_edit, data_viz, pdf_gen, spreadsheet, presentation, email_draft, diagram, multi_agent
- localStorage catalog cache (1h TTL + background revalidate)
- Public `/api/forge-tools/catalog` endpoint (Cache-Control: 1h)
- Forge personality system prompt — talks like a human, plans paths, orchestrates agents
- `spawn_agent` tool — spawns sub-agents for parallel work
- Agent mode switcher in top bar: Auto / Cheap / Quality / Complex
- Smart model routing per mode (backend resolves model based on user's available keys)
- `humanizeToolStep()` — converts raw tool calls to warm human narration
- ForgeRouter settings tab — manage all LLM providers
- Workspace agents (Coder, Deployer, Researcher, Designer built-in)
- Projects, threads, message history with SQLite persistence
- Billing infrastructure: Stripe subscriptions + usage-based overage
- Admin revenue dashboard
- Rate limiting, webhooks, RBAC, org/team support
- Chrome extension integration, mobile support, voice mode
- Git integration, terminal, browser tab in workspace

---

## WHAT FABLE NEEDS TO BUILD

Everything below is greenfield. Build in this priority order.

---

### PRIORITY 1 — MONETIZATION (Build First, Nothing Else Matters)

**Stripe Paywall + Pricing Tiers**

No free tier. 7-day trial only. Three plans:

| Plan | Price | Includes |
|---|---|---|
| Starter | $99/mo | 1 workspace, 3 agents, $20 AI credits, core automations |
| Pro | $299/mo | 3 workspaces, all agents, $75 AI credits, nightly runs, white-label |
| Agency | $499/mo | Unlimited workspaces, resell to clients, $200 AI credits, full stack |

**Credit system for heavy AI jobs:**
- Included credits per plan (see above)
- Before heavy jobs (1000+ page analysis, large video processing): show cost estimate, ask approval
- Top-up: $50 adds $50 credit, auto-refill when below $10
- Margin: charge $1.50 per $1 of API cost on overage (50% margin)
- Light tasks (emails, summaries, scheduling): included in subscription, never metered

**Implementation:**
- Add `credits` column to users table
- Deduct credits on heavy operations
- `/api/billing/topup` endpoint
- Frontend: credit balance visible in top bar
- Stripe webhook: `customer.subscription.deleted` → downgrade, `invoice.paid` → refresh credits

---

### PRIORITY 2 — ONBOARDING WIZARD

**5-question setup flow, no tech knowledge required:**

```
Step 1: "What kind of business do you run?"
        [Restaurant] [Law Firm] [Agency] [Plumber] [Ecom] [Other]

Step 2: "What city or cities do you serve?"
        (text input, supports multiple)

Step 3: "What's your biggest daily headache?"
        [Following up with clients] [Getting reviews] [Marketing] 
        [Admin & paperwork] [Finding new customers]

Step 4: Upload your logo + pick brand colors (color picker)

Step 5: "Connect your tools" — show available integrations:
        [Stripe] [PayPal] [Square] [Gmail] [Google Calendar] 
        [WordPress] [Facebook] [Instagram] [LinkedIn] [Twilio]
```

After step 5: Forge spends 90 seconds building their workspace. Show animated progress:
- "Learning your business..." 
- "Building your agents..."
- "Setting up your automations..."
- "Preparing your morning dashboard..."

Delivers: branded subdomain + pre-configured agent stack + first overnight run scheduled.

**Store onboarding data:**
```sql
ALTER TABLE users ADD COLUMN business_type TEXT;
ALTER TABLE users ADD COLUMN business_cities TEXT; -- JSON array
ALTER TABLE users ADD COLUMN business_pain TEXT;
ALTER TABLE users ADD COLUMN brand_logo_url TEXT;
ALTER TABLE users ADD COLUMN brand_colors TEXT; -- JSON {primary, secondary}
ALTER TABLE users ADD COLUMN onboarding_complete INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN connected_tools TEXT; -- JSON array
```

---

### PRIORITY 3 — BUSINESS TYPE TEMPLATES

Pre-wired agent stacks per business type. When user selects type in onboarding, Forge auto-creates these agents and automations:

**Law Firm Template:**
- Case Prep Agent: reads new client intake → drafts case summary → flags missing info
- Document Agent: processes uploaded contracts/filings → extracts key dates/clauses
- Client Comms Agent: drafts client update emails → sends on approval
- Billing Agent: tracks billable hours → generates invoice drafts
- Compliance Agent: monitors deadlines → sends alerts 7 days before
- Review Agent: after case close → sends review request to client

**Restaurant Template:**
- Menu Agent: monitors food costs → suggests price adjustments
- Review Agent: monitors Google/Yelp → drafts responses within 2 hours
- Supplier Agent: tracks inventory → generates reorder emails
- Social Agent: posts daily specials to Facebook/Instagram
- Reservation Agent: confirms bookings → sends reminders

**Agency Template:**
- Client Report Agent: pulls campaign metrics → generates monthly report PDF
- Content Agent: generates 30 days of client social content
- Proposal Agent: generates custom proposals from client brief
- Invoice Agent: tracks project completion → generates invoices
- Competitor Agent: monitors client's competitors weekly

**Plumber/Trades Template:**
- Quote Agent: generates service quotes from job description
- Scheduling Agent: manages job calendar, sends confirmations
- Follow-up Agent: checks in 48hr after job → asks for review
- Invoice Agent: generates invoice on job completion
- Review Agent: routes positive feedback to Google, handles complaints privately

**Ecom Template:**
- Product Agent: writes/rewrites product descriptions for SEO
- Inventory Agent: monitors stock levels → alerts on low stock
- Review Agent: responds to product reviews on all platforms
- Email Agent: abandoned cart, win-back, post-purchase sequences
- Ad Agent: generates copy for Facebook/Google ads

---

### PRIORITY 4 — NIGHTLY AUTONOMOUS PIPELINE

Every night at 2am per-user cron job. This is the core value of Forge.

**Architecture:**
```typescript
// Nightly job runner — one per user who has Pro/Agency plan
interface NightlyJob {
  userId: string;
  businessType: string;
  cities: string[];
  services: string[];
  connectedTools: string[];
}
```

**Job 1: SEO Page Generator**

Runs nightly, generates 5-10 new pages, publishes to their site:

Page types (rotate through nightly):
- `[service] in [city]` — location pages
- `how to [problem they solve]` — educational
- `best [service] near [city]` — buyer intent  
- `[service] cost/price [city]` — commercial intent
- FAQ pages from common questions in their industry
- `[their business] vs [competitor]` — comparison pages

Each page includes:
- 800-1200 words of genuine useful content
- Proper H1/H2/H3 structure
- Meta title + description (SEO optimized)
- Schema.org LocalBusiness markup
- Internal links to other pages on their site
- Call-to-action section

Publishing targets:
- WordPress: REST API → `POST /wp-json/wp/v2/posts`
- Webflow: CMS API → `POST /v1/collections/{id}/items`
- Shopify: Admin API → create blog posts
- Generic: FTP/SFTP file drop + ping Google Search Console

Track published pages in DB, never duplicate:
```sql
CREATE TABLE seo_pages (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  keyword TEXT,
  url TEXT,
  published_at TEXT,
  word_count INTEGER,
  platform TEXT
);
```

**Job 2: Photo Gallery Auto-Population**

Process: user uploads raw photos → Forge brands them → publishes to site gallery

Pipeline per photo:
1. Resize to web dimensions (1200x800, 800x800, 400x400)
2. Overlay logo (bottom-right, 20% width, 80% opacity) using `sharp`
3. Add subtle brand color gradient overlay if specified
4. Write SEO alt text using vision model
5. Write caption
6. Publish to site gallery via CMS API
7. Add schema markup (ImageObject)

Nightly: process any pending uploads + generate 1-2 AI images using DALL-E 3 with their brand style

**Job 3: Video Gallery Auto-Population**

Pipeline per video:
1. Transcribe audio using Whisper API
2. Burn captions into video using ffmpeg
3. Add logo watermark (bottom-right corner) using ffmpeg
4. Generate thumbnail (frame at 10% duration)
5. Compress for web (H.264, target <50MB)
6. Upload to YouTube via YouTube Data API v3 (auto-publish)
7. Embed YouTube player in site gallery
8. Write video description + tags for YouTube SEO

**Job 4: Review Request Automation**

Trigger: payment webhook from Stripe/PayPal/Square
```
On payment.confirmed:
  → wait 48 hours
  → SMS via Twilio: "Hi [name], how was your experience with [business]? Rate 1-5"
  
  If response 4-5:
    → send Google review link immediately
    → log as positive
    
  If response 1-3:
    → alert business owner
    → do NOT send Google review link
    → log as negative, handle privately
    
  If no response after 72 hours:
    → send email follow-up
    
  If still no response after 7 days:
    → final SMS (last attempt)
```

**Job 5: Content Calendar Self-Healing**

Every night check what's scheduled for next 7 days. If any gaps:
- Generate content to fill gap
- Write platform-specific caption (LinkedIn = professional, Instagram = casual, Facebook = community)
- Add relevant hashtags (researched, not generic)
- Schedule at optimal time per platform (pulled from engagement data)
- Queue for social posting

**Morning Dashboard — What Owner Sees at 8am:**
```
Last Night's Run ✅  [2:14am — 8 min 32 sec]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 7 new SEO pages published
🖼️  4 photos branded + added to gallery
🎬  1 video processed → live on YouTube + site  
⭐  3 review requests sent (2 responded: both 5★)
📱  6 posts scheduled for this week
📧  2 emails queued for approval
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[View All]  [Approve Pending]  [See Full Report]
```

---

### PRIORITY 5 — SOCIAL MEDIA POSTING ENGINE

**Platforms:**
- Facebook: Meta Graph API v18+
- Instagram: Instagram Basic Display API + Content Publishing API
- LinkedIn: LinkedIn Marketing API v2
- Twitter/X: Twitter API v2 (optional)
- YouTube: YouTube Data API v3 (video only)

**Content types per platform:**

Facebook:
- Photo posts with caption + link
- Video posts with description
- Carousel (multiple images)
- Stories (image/video)
- Events (if applicable)

Instagram:
- Single image posts
- Carousel posts (up to 10 images)
- Reels (short video, <90 sec)
- Stories

LinkedIn:
- Article posts (long-form, professional)
- Image posts with insight caption
- Video posts
- Document posts (PDF carousel)

**Content multiplication (one piece → many):**
```
Input: one 10-min video or long blog post
Output:
  → 15 short clips (15-60 sec each) for Reels/Shorts/TikTok
  → 5 Twitter/X thread versions
  → LinkedIn article version
  → Facebook long post version
  → Instagram caption + 10 hashtags
  → Email newsletter version
  → 5 story frames (image + text overlay)
```

**Brand asset application:**
- All images: logo overlay (position + opacity configurable)
- All videos: logo watermark + intro/outro brand frames
- Color overlays matching brand palette
- Font overlays matching brand style

---

### PRIORITY 6 — EMAIL + SMS CAMPAIGNS

**Email:**

Connects to: Mailchimp API, SendGrid API, Klaviyo API, or direct SMTP

Campaigns generated automatically:
- Monthly newsletter (auto-built from that month's content + gallery additions)
- Promotional blasts (new service launch, seasonal offer)
- Win-back sequence (no purchase in 60 days → 3-email sequence)
- Post-purchase sequence (thank you → review request → upsell → referral ask)
- Birthday/anniversary (if CRM has dates)
- Re-engagement (cold leads from CRM)

**SMS:**

Connects to: Twilio, TextMagic, SimpleTexting

Messages sent automatically:
- Appointment reminders (24hr before)
- Flash sale alerts
- Review requests (post-purchase, see Priority 4)
- Re-engagement ("Haven't seen you in a while")
- Job completion confirmation (trades businesses)
- Payment reminders (overdue invoices)

All SMS comply with TCPA (opt-in required, STOP unsubscribe honored).

---

### PRIORITY 7 — APPROVAL INBOX (Replace Chat Interface for Business Users)

End users (business owners) should NEVER see a chat interface. They see cards.

**UI concept:**
```
┌─────────────────────────────────────────┐
│ 🌅 Good morning, Mike. Here's your day. │
│ 3 things need your approval.            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📄 New SEO Page Ready                   │
│ "Plumber in Round Rock Texas"           │
│ 847 words • targets "plumber round rock"│
│ [Preview] [✅ Publish] [✏️ Edit] [❌ Skip]│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📱 Instagram Post — Wednesday 2pm       │
│ [Image preview]                         │
│ "New bathroom renovation complete in... │
│ #plumber #austin #bathroom"             │
│ [Preview] [✅ Schedule] [✏️ Edit] [❌ Skip]│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📧 Email to 847 subscribers             │
│ Subject: "Summer plumbing tips + 15%..." │
│ [Preview] [✅ Send] [✏️ Edit] [❌ Skip]   │
└─────────────────────────────────────────┘

[✅ Approve All 3]
```

Implementation:
```sql
CREATE TABLE pending_approvals (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  type TEXT, -- 'seo_page'|'social_post'|'email'|'sms'|'review_request'
  title TEXT,
  preview_data TEXT, -- JSON
  content TEXT,
  platform TEXT,
  scheduled_for TEXT,
  status TEXT DEFAULT 'pending', -- 'pending'|'approved'|'rejected'|'edited'
  created_at TEXT DEFAULT (datetime('now'))
);
```

---

### PRIORITY 8 — WHITE-LABEL SUBDOMAIN GENERATOR

Every Pro/Agency user gets: `[businessname].forge.app`

Implementation:
- Wildcard DNS: `*.forge.app` → Forge server
- Middleware reads subdomain from `Host` header
- Looks up user by subdomain in DB
- Serves their branded workspace (their logo, colors, custom domain feel)
- Agency users can set custom domain: `app.theiragency.com` → CNAME to forge

```sql
ALTER TABLE users ADD COLUMN subdomain TEXT UNIQUE;
ALTER TABLE users ADD COLUMN custom_domain TEXT;
```

---

### PRIORITY 9 — EXPANDED AGENT ROSTER

Build these as selectable agents in the workspace:

**Business Operations:**
- CFO Agent — cash flow, P&L, invoice chasing, expense categorization
- COO Agent — process mapping, bottleneck detection, SOP generation
- HR Agent — job posts, interview guides, onboarding docs, offer letters
- Legal Agent — contract review, NDA triage, compliance checks
- Sales Agent — lead scoring, outreach drafting, follow-up sequences
- Marketing Agent — campaign planning, content calendar, copy generation
- Customer Success Agent — ticket triage, response drafting, churn detection

**Execution Agents:**
- Email Agent — reads inbox, drafts replies, flags urgent
- Calendar Agent — schedules meetings, sends reminders, preps agendas
- Document Agent — generates PDFs, Word docs, presentations
- Data Agent — analyzes CSVs, builds charts, surfaces anomalies
- Scraper Agent — extracts data from any website continuously
- Monitor Agent — watches competitors, prices, news — alerts on change
- Publisher Agent — posts to all social platforms on schedule
- Outreach Agent — sends cold emails, follows up, books meetings

**Intelligence Agents:**
- Strategist Agent — market analysis, competitive positioning, GTM plans
- Forecaster Agent — revenue projections, churn prediction, trend modeling
- Risk Agent — flags legal, financial, operational risks
- Auditor Agent — reviews all outputs for accuracy and consistency
- Memory Agent — learns everything about the business permanently
- Critic Agent — reviews other agents' work, finds gaps

**Agent Modes (beyond existing Auto/Cheap/Quality/Complex):**
- Solo — single focused agent, no orchestration
- Swarm — 5-10 agents parallel, results merged
- Pipeline — agents run sequentially, each builds on last
- Debate — two agents argue positions, best answer wins
- Review — one agent works, second critiques
- Stealth — runs silently, surfaces only when done
- Draft — rough output fast, approval before finalizing
- Teach — explains every step, shows full reasoning

---

### PRIORITY 10 — PROGRAMMATIC SEO AT SCALE

**The one-shot 500-page SEO strategy:**

Onboarding collects: business type + services + cities

Forge generates keyword matrix:
```
Services × Cities × Intent types = Total pages

Example:
10 services × 20 cities × 5 intents = 1,000 target pages
Generated at 5-10/night = 100-200 nights = 3-6 months
After 60 days = 300-600 indexed pages
After 90 days = estimated 50-100 page-1 rankings
```

Intent types per keyword:
- Informational: "how to fix [problem]"
- Commercial: "best [service] in [city]"
- Transactional: "[service] cost [city]"
- Local: "[service] near me [city]"
- Comparison: "[service] vs [alternative]"

Track everything:
```sql
CREATE TABLE keyword_matrix (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  service TEXT,
  city TEXT,
  intent TEXT,
  keyword TEXT,
  page_id TEXT, -- FK to seo_pages when generated
  status TEXT DEFAULT 'pending' -- 'pending'|'generated'|'published'|'indexed'
);
```

---

## MOONSHOTS — FABLE-ONLY (Ultra-Long Context Required)

These cannot be built by smaller models. Need Fable's full context + reasoning:

**1. Full Codebase Autonomous Architect**
Ingest entire repo (100k+ lines), understand all dependencies, autonomously refactor/migrate/add features, ship PRs. Forge becomes an AI CTO.

**2. Self-Improving Forge**
Read all user sessions, identify friction patterns, write UI improvements, A/B test against simulated sessions, ship best version. Forge designs itself.

**3. Multi-Agent Product Factory**
One prompt → 10 specialized agents (designer, backend, frontend, QA, copywriter, SEO) work in parallel, review each other's output, resolve conflicts, ship complete feature.

**4. Live Business Brain**
Persistent monitoring loop: Stripe + Railway logs + Vercel analytics + GitHub. Detects anomalies, writes hotfixes, deploys them. Business watches itself and heals itself.

**5. Competitor Intelligence Engine**
Read 500 competitor pages + 1000 Reddit threads + 200 review sites in one pass. Full competitive map, gap analysis, GTM playbook — one session.

**6. One-Sentence Company Setup**
"I run a 3-person plumbing company in Austin" → Forge builds entire OS: 500 SEO pages queued, 90-day content calendar, review automation, invoicing workflow. Ready in 90 seconds.

**7. Autonomous Revenue Loop**
Monitor pipeline → identify cold leads → write outreach → send (with approval) → book meetings → prep call briefs → follow up after calls → chase invoices. End-to-end revenue on autopilot.

**8. Forge Marketplace**
Builders publish vertical Forge apps. Users browse + install in one click. Forge takes 20% of subscription revenue. Builders make money. Platform makes money on every transaction.

---

## DESIGN PHILOSOPHY

**End users never see a chat interface.**

The product is:
- Morning dashboard showing what agents did overnight
- Approval cards (not chat) for anything needing human sign-off
- One-tap approve/reject
- Results, not conversations

**Forge talks like a human, not a robot.**

Every agent narration:
- ✅ "I found 3 contracts that need your attention by Friday — here's what's in each one"
- ✅ "Your competitor just dropped their prices. I drafted a response strategy."
- ❌ "I have analyzed the provided documents and identified 3 items."
- ❌ "Here is the information you requested."

**Everything happens automatically. Humans only make decisions.**

Agents run, produce, schedule, publish. Humans approve or skip. Never configure, never prompt, never learn the tool.

---

## MARKET POSITIONING

**Target customer:** Small business owners (1-20 employees) who:
- Know AI exists but don't understand how to use it
- Don't have time to learn tools
- Would pay $99-299/month to save 20+ hours/week
- Are currently paying agencies $2,000-5,000/month for what Forge automates

**Competitors and why Forge wins:**
- Claude.ai — blank canvas, user has to figure it out, Anthropic owns the relationship
- Zapier/Make — requires technical setup, breaks constantly, no AI brain
- Bolt/Lovable — builds apps, doesn't run businesses
- Agencies — $5,000-15,000 setup + $2,000-5,000/month, only for enterprises
- Forge — $99-299/month, zero setup, runs itself, owner just approves

**The moat:**
- Anthropic/OpenAI can never white-label their products
- Agencies can never be this cheap
- Zapier can never be this intelligent
- Forge owns the end-user relationship, not the AI provider

---

## TECHNICAL NOTES FOR FABLE

- **ForgeApp.tsx is BOM-encoded** — use `bash grep` not Grep tool
- **index.ts is 2400+ lines** — always Edit not Write, always Read section before Edit
- **Never truncate index.ts** — broken TypeScript = broken backend for all Railway users
- **Railway auto-deploys on push to main** — test TypeScript compiles before pushing
- **SQLite DB is persistent** on Railway volume at `/data/forge.db` — never drop tables without migration
- **Build command:** `cd forge-web-studio && npm run build` — must pass clean before push
- **Git push from Windows side** — sandbox git is blocked (stale config.lock on OneDrive mount)
- **PowerShell git syntax:** `& 'C:\Program Files\Git\cmd\git.exe'` or use cmd shell

---

## SESSION SUMMARY (What Claude Built This Session)

1. Username/password login mode per provider in ForgeRouter
2. Forge personality system prompt — human voice, planning, orchestration
3. `spawn_agent` tool in backend + catalog
4. FORGE_TOOLS_CATALOG expanded 8 → 20 tools
5. Pre-serialized `FORGE_TOOLS_CATALOG_JSON` — zero serialization cost
6. Public `/api/forge-tools/catalog` with 1-hour cache headers
7. Frontend localStorage catalog cache (1h TTL + background revalidate)
8. Skip-if-populated pattern on JSX catalog block
9. Agent mode switcher UI: Auto/Cheap/Quality/Complex (top bar, persisted)
10. Backend `resolveAgentModel()` function — routes to cheapest/best/largest model per mode
11. `agent_mode` sent in every chat request body
12. All changes built (clean Next.js build) and pushed to production

---
*Generated: 2026-06-11 | Version: Forge v6.94*
