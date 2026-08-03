"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var autonomy_exports = {};
__export(autonomy_exports, {
  AGENT_MODES: () => AGENT_MODES,
  AGENT_ROSTER: () => AGENT_ROSTER,
  BUSINESS_TEMPLATES: () => BUSINESS_TEMPLATES,
  FORGE_PLANS: () => FORGE_PLANS,
  setupAutonomy: () => setupAutonomy
});
module.exports = __toCommonJS(autonomy_exports);
const FORGE_PLANS = {
  starter: { name: "Starter", price: 99, workspaces: 1, agents: 3, credits: 20, nightly: false, whitelabel: false },
  pro: { name: "Pro", price: 299, workspaces: 3, agents: 9999, credits: 75, nightly: true, whitelabel: true },
  agency: { name: "Agency", price: 499, workspaces: -1, agents: 9999, credits: 200, nightly: true, whitelabel: true }
};
const OVERAGE_MULTIPLIER = 1.5;
const AUTO_REFILL_THRESHOLD = 10;
const BUSINESS_TEMPLATES = {
  law_firm: {
    label: "Law Firm",
    persona: "Precise, formal, measured. Cite specifics. Never overpromise. Confidentiality-first.",
    agents: [
      { name: "Case Prep Agent", icon: "scale", color: "#8B5CF6", prompt: "You read new client intake, draft a case summary, and flag missing information. Be precise and formal." },
      { name: "Document Agent", icon: "file", color: "#6366F1", prompt: "You process uploaded contracts and filings, extracting key dates, parties and clauses into structured summaries." },
      { name: "Client Comms Agent", icon: "mail", color: "#0EA5E9", prompt: "You draft client update emails in a formal, reassuring tone. Always queue for approval before sending." },
      { name: "Billing Agent", icon: "dollar", color: "#10B981", prompt: "You track billable hours and generate invoice drafts with itemized line entries." },
      { name: "Compliance Agent", icon: "shield", color: "#F59E0B", prompt: "You monitor matter deadlines and send alerts 7 days before each one. Never miss a date." },
      { name: "Review Agent", icon: "star", color: "#EC4899", prompt: "After a case closes, you draft a polite review request to the client." }
    ]
  },
  restaurant: {
    label: "Restaurant",
    persona: "Warm, fast, hospitable. Short sentences. Make people hungry. Community tone.",
    agents: [
      { name: "Menu Agent", icon: "utensils", color: "#F97316", prompt: "You monitor food costs and suggest menu price adjustments with margin math shown." },
      { name: "Review Agent", icon: "star", color: "#EC4899", prompt: "You monitor Google/Yelp reviews and draft warm responses within 2 hours. Thank positives, de-escalate negatives." },
      { name: "Supplier Agent", icon: "truck", color: "#84CC16", prompt: "You track inventory levels and generate supplier reorder emails." },
      { name: "Social Agent", icon: "camera", color: "#8B5CF6", prompt: "You write daily-special posts for Facebook and Instagram. Casual, appetizing, local hashtags." },
      { name: "Reservation Agent", icon: "calendar", color: "#0EA5E9", prompt: "You confirm bookings and send friendly reminder messages." }
    ]
  },
  agency: {
    label: "Agency",
    persona: "Creative, bold, sharp. Confident voice. Show the work. Numbers + flair.",
    agents: [
      { name: "Client Report Agent", icon: "chart", color: "#6366F1", prompt: "You pull campaign metrics and generate monthly client report drafts with insights, not just numbers." },
      { name: "Content Agent", icon: "pen", color: "#8B5CF6", prompt: "You generate 30 days of client social content per brief, platform-tuned." },
      { name: "Proposal Agent", icon: "file", color: "#0EA5E9", prompt: "You generate custom proposals from a client brief: scope, timeline, pricing options." },
      { name: "Invoice Agent", icon: "dollar", color: "#10B981", prompt: "You track project completion and generate invoices." },
      { name: "Competitor Agent", icon: "eye", color: "#F59E0B", prompt: "You monitor each client's competitors weekly and summarize moves worth responding to." }
    ]
  },
  trades: {
    label: "Plumber / Trades",
    persona: "Straight-talking, trustworthy, prompt. No jargon. Quote it, book it, done.",
    agents: [
      { name: "Quote Agent", icon: "wrench", color: "#F97316", prompt: "You generate service quotes from a job description: labor, parts, total, validity window." },
      { name: "Scheduling Agent", icon: "calendar", color: "#0EA5E9", prompt: "You manage the job calendar and send confirmations and reminders." },
      { name: "Follow-up Agent", icon: "message", color: "#8B5CF6", prompt: "You check in 48 hours after a job and ask for a review if the customer is happy." },
      { name: "Invoice Agent", icon: "dollar", color: "#10B981", prompt: "You generate an invoice when a job is marked complete." },
      { name: "Review Agent", icon: "star", color: "#EC4899", prompt: "You route positive feedback to Google reviews and handle complaints privately with an owner alert." }
    ]
  },
  ecom: {
    label: "Ecommerce",
    persona: "Energetic, benefit-led, conversion-focused. Urgency without sleaze.",
    agents: [
      { name: "Product Agent", icon: "tag", color: "#8B5CF6", prompt: "You write and rewrite product descriptions for SEO and conversion." },
      { name: "Inventory Agent", icon: "box", color: "#84CC16", prompt: "You monitor stock levels and alert on low stock with reorder suggestions." },
      { name: "Review Agent", icon: "star", color: "#EC4899", prompt: "You respond to product reviews on all platforms in brand voice." },
      { name: "Email Agent", icon: "mail", color: "#0EA5E9", prompt: "You run abandoned-cart, win-back and post-purchase email sequences." },
      { name: "Ad Agent", icon: "megaphone", color: "#F59E0B", prompt: "You generate ad copy variants for Facebook and Google ads with hooks and CTAs." }
    ]
  },
  other: {
    label: "Other",
    persona: "Helpful, human, competent. Adapt to the owner's voice over time.",
    agents: [
      { name: "Marketing Agent", icon: "megaphone", color: "#8B5CF6", prompt: "You plan campaigns, write copy and maintain the content calendar." },
      { name: "Sales Agent", icon: "target", color: "#F97316", prompt: "You score leads, draft outreach and follow-up sequences." },
      { name: "Ops Agent", icon: "gear", color: "#0EA5E9", prompt: "You map processes, spot bottlenecks and generate SOPs." },
      { name: "Finance Agent", icon: "dollar", color: "#10B981", prompt: "You watch cash flow, chase invoices and categorize expenses." }
    ]
  }
};
const AGENT_ROSTER = [
  // Business operations
  { id: "cfo", name: "CFO Agent", group: "operations", icon: "dollar", color: "#10B981", prompt: "You are a CFO. Cash flow, P&L, invoice chasing, expense categorization. Show the numbers." },
  { id: "coo", name: "COO Agent", group: "operations", icon: "gear", color: "#64748B", prompt: "You are a COO. Process mapping, bottleneck detection, SOP generation." },
  { id: "hr", name: "HR Agent", group: "operations", icon: "users", color: "#F472B6", prompt: "You are an HR lead. Job posts, interview guides, onboarding docs, offer letters." },
  { id: "legal", name: "Legal Agent", group: "operations", icon: "scale", color: "#8B5CF6", prompt: "You review contracts, triage NDAs and run compliance checks. Flag risk, cite clauses. Not legal advice." },
  { id: "sales", name: "Sales Agent", group: "operations", icon: "target", color: "#F97316", prompt: "You score leads, draft outreach and build follow-up sequences." },
  { id: "marketing", name: "Marketing Agent", group: "operations", icon: "megaphone", color: "#EC4899", prompt: "You plan campaigns, build content calendars and write copy." },
  { id: "cs", name: "Customer Success Agent", group: "operations", icon: "heart", color: "#0EA5E9", prompt: "You triage tickets, draft responses and detect churn risk." },
  { id: "procurement", name: "Procurement Agent", group: "operations", icon: "cart", color: "#84CC16", prompt: "You compare vendors, draft negotiation scripts and generate POs." },
  // Execution
  { id: "email", name: "Email Agent", group: "execution", icon: "mail", color: "#0EA5E9", prompt: "You read inbox context, draft replies, flag urgent items." },
  { id: "calendar", name: "Calendar Agent", group: "execution", icon: "calendar", color: "#6366F1", prompt: "You schedule meetings, prep agendas, send reminders." },
  { id: "document", name: "Document Agent", group: "execution", icon: "file", color: "#64748B", prompt: "You generate PDFs, Word docs and presentations on demand." },
  { id: "data", name: "Data Agent", group: "execution", icon: "chart", color: "#10B981", prompt: "You analyze CSVs, build charts, surface anomalies." },
  { id: "scraper", name: "Scraper Agent", group: "execution", icon: "globe", color: "#F59E0B", prompt: "You extract structured data from websites continuously." },
  { id: "monitor", name: "Monitor Agent", group: "execution", icon: "eye", color: "#EF4444", prompt: "You watch competitors, prices and news. Alert only on change." },
  { id: "publisher", name: "Publisher Agent", group: "execution", icon: "send", color: "#8B5CF6", prompt: "You post to LinkedIn, Twitter/X, Instagram and Facebook on schedule, platform-tuned." },
  { id: "outreach", name: "Outreach Agent", group: "execution", icon: "rocket", color: "#F97316", prompt: "You send cold emails, follow up and book meetings. Always queue sends for approval." },
  // Intelligence
  { id: "strategist", name: "Strategist Agent", group: "intelligence", icon: "compass", color: "#6366F1", prompt: "You do market analysis, competitive positioning, GTM plans." },
  { id: "forecaster", name: "Forecaster Agent", group: "intelligence", icon: "trending", color: "#10B981", prompt: "You project revenue, predict churn, model trends with stated assumptions." },
  { id: "risk", name: "Risk Agent", group: "intelligence", icon: "alert", color: "#EF4444", prompt: "You flag legal, financial and operational risks before they land." },
  { id: "auditor", name: "Auditor Agent", group: "intelligence", icon: "check", color: "#84CC16", prompt: "You review all outputs for accuracy, consistency and compliance." },
  { id: "memory", name: "Memory Agent", group: "intelligence", icon: "brain", color: "#8B5CF6", prompt: "You learn everything about the business and never forget. Maintain the knowledge base." },
  { id: "critic", name: "Critic Agent", group: "intelligence", icon: "message", color: "#F59E0B", prompt: "You review other agents' work, find gaps, improve quality." },
  // Moonshots
  { id: "ghost", name: "Ghost Agent", group: "moonshot", icon: "ghost", color: "#94A3B8", prompt: "You live inside email/Slack flows. Replies indistinguishable from the owner. Queue everything for approval." },
  { id: "mentor", name: "Mentor Agent", group: "moonshot", icon: "graduation", color: "#0EA5E9", prompt: "You study how the owner works and coach them to improve, with specific observations." },
  { id: "clone", name: "Clone Agent", group: "moonshot", icon: "copy", color: "#EC4899", prompt: "You learn the owner's exact writing voice and write indistinguishably from them." },
  { id: "watchdog", name: "Watchdog Agent", group: "moonshot", icon: "dog", color: "#F97316", prompt: "You monitor everything 24/7 and wake the owner only when something truly needs attention." },
  { id: "negotiator", name: "Negotiator Agent", group: "moonshot", icon: "handshake", color: "#10B981", prompt: "You handle vendor/client negotiations via email drafts, always with approval gates." },
  { id: "connector", name: "Connector Agent", group: "moonshot", icon: "link", color: "#6366F1", prompt: "You find partnership opportunities, draft intro emails and track follow-ups." }
];
const AGENT_MODES = [
  { id: "auto", name: "Auto", desc: "Forge picks the best route" },
  { id: "cheap", name: "Cheap", desc: "Cheapest capable model" },
  { id: "quality", name: "Quality", desc: "Best available model" },
  { id: "complex", name: "Complex", desc: "Largest context + tools" },
  { id: "solo", name: "Solo", desc: "Single focused agent, no orchestration", system: "Work alone. No sub-agents. Stay tightly focused on the single task." },
  { id: "swarm", name: "Swarm", desc: "5-10 agents in parallel, results merged", system: "Decompose the task and spawn parallel sub-agents (spawn_agent). Merge results into one coherent answer." },
  { id: "pipeline", name: "Pipeline", desc: "Agents run sequentially, each builds on last", system: "Run as a pipeline: plan stages, execute sequentially, each stage consumes the previous output." },
  { id: "debate", name: "Debate", desc: "Two agents argue, best answer wins", system: "Argue both sides: produce position A, then a strong counter-position B, then a judged synthesis picking the winner with reasons." },
  { id: "review", name: "Review", desc: "One works, second critiques", system: "Produce the work, then switch hats and critique it ruthlessly, then ship the corrected version." },
  { id: "stealth", name: "Stealth", desc: "Silent until done", system: "No narration. No progress chatter. Output only the final deliverable." },
  { id: "draft", name: "Draft", desc: "Rough output fast, approval before final", system: "Produce a fast rough draft and explicitly ask for approval before polishing." },
  { id: "teach", name: "Teach", desc: "Explains every step, full reasoning", system: "Teach as you go: explain every step, show your reasoning, define terms." }
];
const SEO_INTENTS = [
  { id: "informational", tpl: (s, c) => `how to ${s.toLowerCase()} \u2014 guide for ${c}` },
  { id: "commercial", tpl: (s, c) => `best ${s.toLowerCase()} in ${c}` },
  { id: "transactional", tpl: (s, c) => `${s.toLowerCase()} cost in ${c}` },
  { id: "local", tpl: (s, c) => `${s.toLowerCase()} near me ${c}` },
  { id: "comparison", tpl: (s, c) => `${s.toLowerCase()} options compared ${c}` }
];
function setupAutonomy(app, db, deps) {
  const { requireAuth, getUserLLMKey, callLLM, uuidv4 } = deps;
  const alters = [
    `ALTER TABLE users ADD COLUMN business_type TEXT`,
    `ALTER TABLE users ADD COLUMN business_cities TEXT`,
    `ALTER TABLE users ADD COLUMN business_services TEXT`,
    `ALTER TABLE users ADD COLUMN business_pain TEXT`,
    `ALTER TABLE users ADD COLUMN brand_logo_url TEXT`,
    `ALTER TABLE users ADD COLUMN brand_colors TEXT`,
    `ALTER TABLE users ADD COLUMN onboarding_complete INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN connected_tools TEXT`,
    `ALTER TABLE users ADD COLUMN subdomain TEXT`,
    `ALTER TABLE users ADD COLUMN custom_domain TEXT`,
    `ALTER TABLE users ADD COLUMN credits REAL DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN auto_refill INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN persona_override TEXT`
  ];
  for (const a of alters) {
    try {
      db.exec(a);
    } catch {
    }
  }
  try {
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_subdomain ON users(subdomain) WHERE subdomain IS NOT NULL`);
  } catch {
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS pending_approvals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      preview_data TEXT DEFAULT '{}',
      content TEXT DEFAULT '',
      platform TEXT,
      scheduled_for TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      resolved_at TEXT
    );
    CREATE TABLE IF NOT EXISTS seo_pages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      keyword TEXT NOT NULL,
      title TEXT,
      url TEXT,
      content TEXT,
      meta_description TEXT,
      published_at TEXT,
      word_count INTEGER DEFAULT 0,
      platform TEXT DEFAULT 'forge',
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS keyword_matrix (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      service TEXT NOT NULL,
      city TEXT NOT NULL,
      intent TEXT NOT NULL,
      keyword TEXT NOT NULL,
      page_id TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS nightly_runs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      started_at TEXT DEFAULT (datetime('now')),
      finished_at TEXT,
      status TEXT DEFAULT 'running',
      summary TEXT DEFAULT '{}'
    );
    CREATE TABLE IF NOT EXISTS review_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      customer_name TEXT,
      customer_contact TEXT,
      channel TEXT DEFAULT 'sms',
      stage TEXT DEFAULT 'queued',
      rating INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS credit_ledger (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      delta REAL NOT NULL,
      reason TEXT,
      balance_after REAL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  function getCredits(userId) {
    const r = db.prepare("SELECT credits FROM users WHERE id=?").get(userId);
    return r?.credits || 0;
  }
  function adjustCredits(userId, delta, reason) {
    const bal = Math.max(0, getCredits(userId) + delta);
    db.prepare("UPDATE users SET credits=? WHERE id=?").run(bal, userId);
    db.prepare("INSERT INTO credit_ledger (id,user_id,delta,reason,balance_after) VALUES (?,?,?,?,?)").run(uuidv4(), userId, delta, reason, bal);
    return bal;
  }
  function chargeApiCost(userId, apiCostUsd, reason) {
    return adjustCredits(userId, -(apiCostUsd * OVERAGE_MULTIPLIER), reason);
  }
  app.forgeCredits = { getCredits, adjustCredits, chargeApiCost };
  function queueApproval(userId, type, title, content, platform, scheduledFor, preview) {
    const id = uuidv4();
    db.prepare("INSERT INTO pending_approvals (id,user_id,type,title,preview_data,content,platform,scheduled_for) VALUES (?,?,?,?,?,?,?,?)").run(id, userId, type, title, JSON.stringify(preview || {}), content, platform || null, scheduledFor || null);
    return id;
  }
  function personaFor(user) {
    if (user?.persona_override)
      return user.persona_override;
    const t = BUSINESS_TEMPLATES[user?.business_type || "other"] || BUSINESS_TEMPLATES.other;
    return t.persona;
  }
  async function llm(userId, system, prompt) {
    const { provider, apiKey, model } = getUserLLMKey(userId);
    if (!apiKey)
      throw new Error("No LLM key available");
    const r = await callLLM(provider, apiKey, model, [
      { role: "system", content: system },
      { role: "user", content: prompt }
    ]);
    const est = (r.promptTokens * 3 + r.completionTokens * 15) / 1e6;
    chargeApiCost(userId, est, "llm_generation");
    return r.content;
  }
  app.use((req, _res, next) => {
    try {
      const host = String(req.headers["x-forwarded-host"] || req.headers.host || "");
      const sub = host.split(".")[0];
      if (sub && !["www", "api", "app", "forge", "localhost", ""].includes(sub)) {
        const u = db.prepare("SELECT id, username, brand_logo_url, brand_colors, business_type, subdomain FROM users WHERE subdomain=? OR custom_domain=?").get(sub, host);
        if (u)
          req.forgeWorkspace = u;
      }
    } catch {
    }
    next();
  });
  app.get("/api/workspace/branding", (req, res) => {
    const w = req.forgeWorkspace;
    if (!w) {
      res.json({ success: true, data: null });
      return;
    }
    res.json({ success: true, data: { subdomain: w.subdomain, logo: w.brand_logo_url, colors: JSON.parse(w.brand_colors || "{}"), businessType: w.business_type } });
  });
  app.get("/api/billing/plans", (_req, res) => {
    res.json({ success: true, data: FORGE_PLANS, trialDays: 7, overageMultiplier: OVERAGE_MULTIPLIER });
  });
  app.get("/api/billing/credits", requireAuth, (req, res) => {
    const userId = req.user.sub;
    const ledger = db.prepare("SELECT delta,reason,balance_after,created_at FROM credit_ledger WHERE user_id=? ORDER BY created_at DESC LIMIT 50").all(userId);
    res.json({ success: true, data: { balance: getCredits(userId), autoRefillThreshold: AUTO_REFILL_THRESHOLD, ledger } });
  });
  app.post("/api/billing/topup", requireAuth, async (req, res) => {
    const userId = req.user.sub;
    const amount = Math.max(10, Math.min(1e3, Number(req.body?.amount) || 50));
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey) {
      try {
        const body = new URLSearchParams({
          "mode": "payment",
          "line_items[0][price_data][currency]": "usd",
          "line_items[0][price_data][product_data][name]": `Forge AI Credits \u2014 $${amount}`,
          "line_items[0][price_data][unit_amount]": String(amount * 100),
          "line_items[0][quantity]": "1",
          "success_url": (req.body?.successUrl || "https://forge-sand-two.vercel.app") + "?topup=success",
          "cancel_url": (req.body?.cancelUrl || "https://forge-sand-two.vercel.app") + "?topup=cancel",
          "metadata[user_id]": userId,
          "metadata[credit_amount]": String(amount),
          "metadata[kind]": "forge_topup"
        });
        const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
          body
        });
        const j = await r.json();
        if (j.url) {
          res.json({ success: true, data: { checkoutUrl: j.url } });
          return;
        }
      } catch {
      }
    }
    const bal = adjustCredits(userId, amount, "topup_dev");
    res.json({ success: true, data: { balance: bal, dev: true } });
  });
  app.post("/api/billing/auto-refill", requireAuth, (req, res) => {
    db.prepare("UPDATE users SET auto_refill=? WHERE id=?").run(req.body?.enabled ? 1 : 0, req.user.sub);
    res.json({ success: true });
  });
  app.forgeBillingHooks = {
    onInvoicePaid(userId, plan) {
      const p = FORGE_PLANS[plan] || FORGE_PLANS.starter;
      adjustCredits(userId, p.credits, `monthly_credit_refresh_${plan}`);
    },
    onSubscriptionDeleted(userId) {
      try {
        db.prepare("UPDATE subscriptions SET plan='free', status='cancelled', updated_at=datetime('now') WHERE user_id=?").run(userId);
      } catch {
      }
    },
    onTopupPaid(userId, amount) {
      adjustCredits(userId, amount, "topup_paid");
    }
  };
  app.get("/api/onboarding", requireAuth, (req, res) => {
    const u = db.prepare("SELECT business_type,business_cities,business_services,business_pain,brand_logo_url,brand_colors,onboarding_complete,connected_tools,subdomain FROM users WHERE id=?").get(req.user.sub);
    res.json({ success: true, data: u, templates: Object.entries(BUSINESS_TEMPLATES).map(([k, v]) => ({ id: k, label: v.label })) });
  });
  const onboardingHandler = (req, res) => {
    const userId = req.user.sub;
    const { businessType = "other", cities = [], services = [], pain = "", logoUrl = "", colors = {}, connectedTools = [], businessName = "" } = req.body || {};
    const tpl = BUSINESS_TEMPLATES[businessType] || BUSINESS_TEMPLATES.other;
    let sub = String(businessName || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
    if (sub) {
      const taken = db.prepare("SELECT id FROM users WHERE subdomain=? AND id<>?").get(sub, userId);
      if (taken)
        sub = `${sub}-${Math.random().toString(36).slice(2, 6)}`;
    }
    db.prepare(`UPDATE users SET business_type=?, business_cities=?, business_services=?, business_pain=?, brand_logo_url=?, brand_colors=?, connected_tools=?, subdomain=COALESCE(NULLIF(?, ''), subdomain), onboarding_complete=1 WHERE id=?`).run(businessType, JSON.stringify(cities), JSON.stringify(services), pain, logoUrl, JSON.stringify(colors), JSON.stringify(connectedTools), sub, userId);
    const existing = new Set(db.prepare("SELECT name FROM workspace_agents WHERE user_id=?").all(userId).map((r) => r.name));
    let created = 0;
    for (const a of tpl.agents) {
      if (existing.has(a.name))
        continue;
      db.prepare("INSERT INTO workspace_agents (id,user_id,name,color,icon,system_prompt,tools,model) VALUES (?,?,?,?,?,?,?,?)").run(uuidv4(), userId, a.name, a.color, a.icon, `${a.prompt}

Brand persona: ${tpl.persona}`, '["web_search","write_file","email_draft"]', "forge-fast");
      created++;
    }
    const svcList = (services.length ? services : [tpl.label]).slice(0, 10);
    const cityList = (cities.length ? cities : ["your area"]).slice(0, 20);
    const ins = db.prepare("INSERT INTO keyword_matrix (id,user_id,service,city,intent,keyword) VALUES (?,?,?,?,?,?)");
    let kws = 0;
    const have = db.prepare("SELECT COUNT(*) c FROM keyword_matrix WHERE user_id=?").get(userId).c;
    if (have === 0) {
      for (const s of svcList)
        for (const c of cityList)
          for (const it of SEO_INTENTS) {
            ins.run(uuidv4(), userId, s, c, it.id, it.tpl(s, c));
            kws++;
          }
    }
    if (getCredits(userId) <= 0)
      adjustCredits(userId, 5, "trial_credits");
    res.json({
      success: true,
      data: {
        subdomain: sub || null,
        agentsCreated: created,
        keywordsQueued: kws,
        persona: tpl.persona,
        steps: ["Learning your business...", "Building your agents...", "Setting up your automations...", "Preparing your morning dashboard..."]
      }
    });
  };
  app.post("/api/onboarding", requireAuth, onboardingHandler);
  app.get("/api/persona", requireAuth, (req, res) => {
    const u = db.prepare("SELECT business_type,persona_override FROM users WHERE id=?").get(req.user.sub);
    res.json({ success: true, data: { businessType: u?.business_type, persona: personaFor(u), override: u?.persona_override || null } });
  });
  app.put("/api/persona", requireAuth, (req, res) => {
    db.prepare("UPDATE users SET persona_override=? WHERE id=?").run(req.body?.persona || null, req.user.sub);
    res.json({ success: true });
  });
  app.forgePersona = personaFor;
  app.get("/api/agents/roster", (_req, res) => {
    res.json({ success: true, data: AGENT_ROSTER });
  });
  app.post("/api/agents/roster/:id/install", requireAuth, (req, res) => {
    const userId = req.user.sub;
    const a = AGENT_ROSTER.find((r) => r.id === req.params.id);
    if (!a) {
      res.status(404).json({ success: false, error: "unknown agent" });
      return;
    }
    const dupe = db.prepare("SELECT id FROM workspace_agents WHERE user_id=? AND name=?").get(userId, a.name);
    if (dupe) {
      res.json({ success: true, data: { id: dupe.id, existed: true } });
      return;
    }
    const u = db.prepare("SELECT business_type,persona_override FROM users WHERE id=?").get(userId);
    const id = uuidv4();
    db.prepare("INSERT INTO workspace_agents (id,user_id,name,color,icon,system_prompt,tools,model) VALUES (?,?,?,?,?,?,?,?)").run(id, userId, a.name, a.color, a.icon, `${a.prompt}

Brand persona: ${personaFor(u)}`, '["web_search","write_file","run_code","email_draft"]', "forge-fast");
    res.json({ success: true, data: { id } });
  });
  app.get("/api/agent-modes", (_req, res) => {
    res.json({ success: true, data: AGENT_MODES });
  });
  app.forgeModeSystem = (modeId) => {
    const m = AGENT_MODES.find((x) => x.id === modeId);
    return m?.system || null;
  };
  app.get("/api/approvals", requireAuth, (req, res) => {
    const rows = db.prepare("SELECT * FROM pending_approvals WHERE user_id=? AND status='pending' ORDER BY created_at DESC LIMIT 100").all(req.user.sub);
    res.json({ success: true, data: rows });
  });
  app.post("/api/approvals/:id/:action", requireAuth, (req, res) => {
    const { id, action } = req.params;
    const userId = req.user.sub;
    const row = db.prepare("SELECT * FROM pending_approvals WHERE id=? AND user_id=?").get(id, userId);
    if (!row) {
      res.status(404).json({ success: false, error: "not found" });
      return;
    }
    if (action === "approve") {
      db.prepare("UPDATE pending_approvals SET status='approved', resolved_at=datetime('now'), content=COALESCE(NULLIF(?, ''), content) WHERE id=?").run(req.body?.content || "", id);
      if (row.type === "seo_page") {
        const pv = JSON.parse(row.preview_data || "{}");
        if (pv.page_id)
          db.prepare("UPDATE seo_pages SET status='published', published_at=datetime('now'), url=COALESCE(url, '/p/' || id) WHERE id=?").run(pv.page_id);
        db.prepare("UPDATE keyword_matrix SET status='published' WHERE page_id=?").run(pv.page_id || "");
      }
      if (row.type === "review_request") {
        const pv = JSON.parse(row.preview_data || "{}");
        if (pv.review_id)
          db.prepare("UPDATE review_requests SET stage='sent', updated_at=datetime('now') WHERE id=?").run(pv.review_id);
      }
    } else if (action === "reject") {
      db.prepare("UPDATE pending_approvals SET status='rejected', resolved_at=datetime('now') WHERE id=?").run(id);
    } else if (action === "edit") {
      db.prepare("UPDATE pending_approvals SET content=?, status='pending' WHERE id=?").run(req.body?.content || row.content, id);
    } else {
      res.status(400).json({ success: false, error: "bad action" });
      return;
    }
    res.json({ success: true });
  });
  app.post("/api/approvals/approve-all", requireAuth, (req, res) => {
    const userId = req.user.sub;
    const rows = db.prepare("SELECT id FROM pending_approvals WHERE user_id=? AND status='pending'").all(userId);
    for (const r of rows)
      db.prepare("UPDATE pending_approvals SET status='approved', resolved_at=datetime('now') WHERE id=?").run(r.id);
    res.json({ success: true, data: { approved: rows.length } });
  });
  app.get("/api/seo/pages", requireAuth, (req, res) => {
    const rows = db.prepare("SELECT id,keyword,title,url,status,word_count,published_at,created_at FROM seo_pages WHERE user_id=? ORDER BY created_at DESC LIMIT 200").all(req.user.sub);
    const matrix = db.prepare("SELECT status, COUNT(*) c FROM keyword_matrix WHERE user_id=? GROUP BY status").all(req.user.sub);
    res.json({ success: true, data: { pages: rows, matrix } });
  });
  app.get("/p/:pageId", (req, res) => {
    const p = db.prepare("SELECT * FROM seo_pages WHERE id=? AND status='published'").get(req.params.pageId);
    if (!p) {
      res.status(404).send("Not found");
      return;
    }
    res.setHeader("Content-Type", "text/html");
    res.send(`<!doctype html><html><head><title>${p.title || p.keyword}</title><meta name="description" content="${(p.meta_description || "").replace(/"/g, "&quot;")}"><script type="application/ld+json">{"@context":"https://schema.org","@type":"LocalBusiness","name":${JSON.stringify(p.title || p.keyword)}}</script></head><body>${p.content}</body></html>`);
  });
  app.post("/api/reviews/request", requireAuth, (req, res) => {
    const userId = req.user.sub;
    const { customerName = "", contact = "", channel = "sms" } = req.body || {};
    const id = uuidv4();
    db.prepare("INSERT INTO review_requests (id,user_id,customer_name,customer_contact,channel) VALUES (?,?,?,?,?)").run(id, userId, customerName, contact, channel);
    queueApproval(
      userId,
      "review_request",
      `Review request \u2192 ${customerName || contact}`,
      `Hi ${customerName || "there"}, how was your experience with us? Reply 1-5.`,
      channel,
      void 0,
      { review_id: id }
    );
    res.json({ success: true, data: { id } });
  });
  app.post("/api/reviews/:id/respond", requireAuth, (req, res) => {
    const rating = Number(req.body?.rating) || 0;
    const r = db.prepare("SELECT * FROM review_requests WHERE id=? AND user_id=?").get(req.params.id, req.user.sub);
    if (!r) {
      res.status(404).json({ success: false });
      return;
    }
    const stage = rating >= 4 ? "google_link_sent" : "owner_alerted";
    db.prepare("UPDATE review_requests SET rating=?, stage=?, updated_at=datetime('now') WHERE id=?").run(rating, stage, r.id);
    res.json({ success: true, data: { stage } });
  });
  app.post("/api/magic-reply", requireAuth, async (req, res) => {
    const userId = req.user.sub;
    const { message = "", sender = "", channel = "email" } = req.body || {};
    if (!message) {
      res.status(400).json({ success: false, error: "message required" });
      return;
    }
    try {
      const u = db.prepare("SELECT business_type,persona_override,username FROM users WHERE id=?").get(userId);
      const mem = db.prepare("SELECT topic,insight FROM forge_memory WHERE user_id=? ORDER BY strength DESC LIMIT 15").all(userId).map((m) => `- ${m.topic}: ${m.insight}`).join("\n");
      const reply = await llm(
        userId,
        `You are Magic Reply for ${u?.username || "the owner"}. Draft the perfect ${channel} reply in the owner's voice. Persona: ${personaFor(u)}. Context about the business:
${mem || "(none yet)"}
Output ONLY the reply body, no preamble.`,
        `From: ${sender}
Message:
${message}`
      );
      res.json({ success: true, data: { reply } });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  });
  app.get("/api/voice/brief", requireAuth, async (req, res) => {
    const userId = req.user.sub;
    try {
      const run = db.prepare("SELECT * FROM nightly_runs WHERE user_id=? ORDER BY started_at DESC LIMIT 1").get(userId);
      const pend = db.prepare("SELECT COUNT(*) c FROM pending_approvals WHERE user_id=? AND status='pending'").get(userId).c;
      const s = run ? JSON.parse(run.summary || "{}") : {};
      const parts = [];
      if (run)
        parts.push(`Last night I published drafts for ${s.seo_pages || 0} new pages, scheduled ${s.social_posts || 0} social posts, and queued ${s.review_requests || 0} review requests.`);
      parts.push(pend > 0 ? `${pend} item${pend === 1 ? "" : "s"} need your approval. Say "approve all" or review them one by one.` : "Nothing needs your approval. You are all clear.");
      res.json({ success: true, data: { text: `Good morning. ${parts.join(" ")}`, pending: pend } });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  });
  app.post("/api/voice/command", requireAuth, async (req, res) => {
    const userId = req.user.sub;
    const cmd = String(req.body?.text || "").toLowerCase();
    if (cmd.includes("approve all")) {
      const rows = db.prepare("SELECT id FROM pending_approvals WHERE user_id=? AND status='pending'").all(userId);
      for (const r of rows)
        db.prepare("UPDATE pending_approvals SET status='approved', resolved_at=datetime('now') WHERE id=?").run(r.id);
      res.json({ success: true, data: { speech: `Done. Approved ${rows.length} items.` } });
      return;
    }
    try {
      const reply = await llm(userId, "You are Forge in voice mode. Answer in 1-3 short spoken sentences, no formatting.", cmd);
      res.json({ success: true, data: { speech: reply } });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  });
  app.get("/api/morning", requireAuth, (req, res) => {
    const userId = req.user.sub;
    const run = db.prepare("SELECT * FROM nightly_runs WHERE user_id=? ORDER BY started_at DESC LIMIT 1").get(userId);
    const approvals = db.prepare("SELECT * FROM pending_approvals WHERE user_id=? AND status='pending' ORDER BY created_at DESC LIMIT 50").all(userId);
    const seo = db.prepare("SELECT COUNT(*) c FROM seo_pages WHERE user_id=? AND status='published'").get(userId).c;
    res.json({ success: true, data: { lastRun: run ? { ...run, summary: JSON.parse(run.summary || "{}") } : null, approvals, publishedPages: seo, credits: getCredits(userId) } });
  });
  async function runNightlyForUser(userId) {
    const runId = uuidv4();
    db.prepare("INSERT INTO nightly_runs (id,user_id) VALUES (?,?)").run(runId, userId);
    const summary = { seo_pages: 0, social_posts: 0, review_requests: 0, errors: [] };
    const u = db.prepare("SELECT * FROM users WHERE id=?").get(userId);
    const tpl = BUSINESS_TEMPLATES[u?.business_type || "other"] || BUSINESS_TEMPLATES.other;
    try {
      const kws = db.prepare("SELECT * FROM keyword_matrix WHERE user_id=? AND status='pending' LIMIT 5").all(userId);
      for (const k of kws) {
        try {
          const out = await llm(
            userId,
            `You write SEO landing pages. Persona: ${tpl.persona}. Output strict JSON: {"title":"...","meta":"...","html":"<h1>...</h1>..."} \u2014 800-1200 words of genuinely useful HTML content with h1/h2/h3, internal-link placeholders like {{link:keyword}}, and a closing call-to-action section.`,
            `Write the page for keyword: "${k.keyword}" (service: ${k.service}, city: ${k.city}, intent: ${k.intent}).`
          );
          let j = {};
          try {
            j = JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1));
          } catch {
            j = { title: k.keyword, meta: "", html: `<h1>${k.keyword}</h1><p>${out}</p>` };
          }
          const pageId = uuidv4();
          const wc = String(j.html || "").split(/\s+/).length;
          db.prepare("INSERT INTO seo_pages (id,user_id,keyword,title,content,meta_description,word_count) VALUES (?,?,?,?,?,?,?)").run(pageId, userId, k.keyword, j.title || k.keyword, j.html || "", j.meta || "", wc);
          db.prepare("UPDATE keyword_matrix SET status='generated', page_id=? WHERE id=?").run(pageId, k.id);
          queueApproval(userId, "seo_page", `New SEO page: ${j.title || k.keyword}`, j.html || "", "site", void 0, { page_id: pageId, keyword: k.keyword, word_count: wc });
          summary.seo_pages++;
        } catch (e) {
          summary.errors.push(`seo:${e.message}`);
        }
      }
    } catch (e) {
      summary.errors.push(`seo_outer:${e.message}`);
    }
    try {
      const platforms = ["instagram", "facebook", "linkedin"];
      const scheduled = db.prepare("SELECT COUNT(*) c FROM pending_approvals WHERE user_id=? AND type='social_post' AND status='pending'").get(userId).c;
      if (scheduled < 6) {
        const out = await llm(
          userId,
          `You are a social media manager. Persona: ${tpl.persona}. Output strict JSON array of ${6 - scheduled} posts: [{"platform":"instagram|facebook|linkedin","caption":"...","hashtags":["..."],"day_offset":1}]. Platform-tuned tone: LinkedIn professional, Instagram casual, Facebook community.`,
          `Business: ${tpl.label}${u?.business_cities ? " in " + u.business_cities : ""}. Pain point focus: ${u?.business_pain || "growth"}. Generate the posts.`
        );
        let posts = [];
        try {
          posts = JSON.parse(out.slice(out.indexOf("["), out.lastIndexOf("]") + 1));
        } catch {
        }
        for (const p of posts.slice(0, 6)) {
          const when = new Date(Date.now() + (Number(p.day_offset) || 1) * 864e5).toISOString();
          queueApproval(userId, "social_post", `${p.platform || platforms[0]} post`, `${p.caption || ""}

${(p.hashtags || []).map((h) => h.startsWith("#") ? h : "#" + h).join(" ")}`, p.platform || platforms[0], when);
          summary.social_posts++;
        }
      }
    } catch (e) {
      summary.errors.push(`social:${e.message}`);
    }
    try {
      const queued = db.prepare("SELECT COUNT(*) c FROM review_requests WHERE user_id=? AND stage='queued'").all ? db.prepare("SELECT COUNT(*) c FROM review_requests WHERE user_id=? AND stage='queued'").get(userId).c : 0;
      summary.review_requests = queued;
    } catch {
    }
    db.prepare("UPDATE nightly_runs SET finished_at=datetime('now'), status=?, summary=? WHERE id=?").run(summary.errors.length ? "partial" : "complete", JSON.stringify(summary), runId);
    return summary;
  }
  app.post("/api/nightly/run-now", requireAuth, async (req, res) => {
    try {
      const s = await runNightlyForUser(req.user.sub);
      res.json({ success: true, data: s });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  });
  app.get("/api/nightly/runs", requireAuth, (req, res) => {
    const rows = db.prepare("SELECT * FROM nightly_runs WHERE user_id=? ORDER BY started_at DESC LIMIT 30").all(req.user.sub).map((r) => ({ ...r, summary: JSON.parse(r.summary || "{}") }));
    res.json({ success: true, data: rows });
  });
  setInterval(async () => {
    try {
      const hour = (/* @__PURE__ */ new Date()).getHours();
      if (hour !== 2)
        return;
      const users = db.prepare(`
        SELECT u.id FROM users u
        WHERE u.onboarding_complete=1
        AND NOT EXISTS (SELECT 1 FROM nightly_runs nr WHERE nr.user_id=u.id AND date(nr.started_at)=date('now'))
        LIMIT 50
      `).all();
      for (const u of users) {
        try {
          await runNightlyForUser(u.id);
        } catch {
        }
      }
    } catch {
    }
  }, 30 * 60 * 1e3);
}
;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AGENT_MODES,
  AGENT_ROSTER,
  BUSINESS_TEMPLATES,
  FORGE_PLANS,
  setupAutonomy
});
