// ─── FORGE AUTONOMY OS ───────────────────────────────────────────────────────
// End-to-end autonomous business OS: onboarding, templates, credits/plans,
// nightly pipeline, approval inbox, subdomains, personas, voice brief,
// magic reply, agent roster + modes, programmatic SEO matrix.
// Mounted from index.ts via setupAutonomy(app, db, deps).

import { Express, Request, Response, NextFunction } from 'express';

type Deps = {
  requireAuth: any;
  getUserLLMKey: (userId: string) => { provider: string; apiKey: string; model: string };
  callLLM: (provider: string, apiKey: string, model: string, messages: any[], language?: string) => Promise<{ content: string; promptTokens: number; completionTokens: number }>;
  uuidv4: () => string;
};

// ─── Plans & credits ─────────────────────────────────────────────────────────
export const FORGE_PLANS: Record<string, any> = {
  starter: { name: 'Starter', price: 99,  workspaces: 1,  agents: 3,    credits: 20,  nightly: false, whitelabel: false },
  pro:     { name: 'Pro',     price: 299, workspaces: 3,  agents: 9999, credits: 75,  nightly: true,  whitelabel: true  },
  agency:  { name: 'Agency',  price: 499, workspaces: -1, agents: 9999, credits: 200, nightly: true,  whitelabel: true  },
};
const OVERAGE_MULTIPLIER = 1.5; // $1.50 charged per $1 API cost
const AUTO_REFILL_THRESHOLD = 10;

// ─── Business templates ──────────────────────────────────────────────────────
export const BUSINESS_TEMPLATES: Record<string, { label: string; persona: string; agents: { name: string; icon: string; color: string; prompt: string }[] }> = {
  law_firm: {
    label: 'Law Firm',
    persona: 'Precise, formal, measured. Cite specifics. Never overpromise. Confidentiality-first.',
    agents: [
      { name: 'Case Prep Agent', icon: 'scale', color: '#8B5CF6', prompt: 'You read new client intake, draft a case summary, and flag missing information. Be precise and formal.' },
      { name: 'Document Agent', icon: 'file', color: '#6366F1', prompt: 'You process uploaded contracts and filings, extracting key dates, parties and clauses into structured summaries.' },
      { name: 'Client Comms Agent', icon: 'mail', color: '#0EA5E9', prompt: 'You draft client update emails in a formal, reassuring tone. Always queue for approval before sending.' },
      { name: 'Billing Agent', icon: 'dollar', color: '#10B981', prompt: 'You track billable hours and generate invoice drafts with itemized line entries.' },
      { name: 'Compliance Agent', icon: 'shield', color: '#F59E0B', prompt: 'You monitor matter deadlines and send alerts 7 days before each one. Never miss a date.' },
      { name: 'Review Agent', icon: 'star', color: '#EC4899', prompt: 'After a case closes, you draft a polite review request to the client.' },
    ],
  },
  restaurant: {
    label: 'Restaurant',
    persona: 'Warm, fast, hospitable. Short sentences. Make people hungry. Community tone.',
    agents: [
      { name: 'Menu Agent', icon: 'utensils', color: '#F97316', prompt: 'You monitor food costs and suggest menu price adjustments with margin math shown.' },
      { name: 'Review Agent', icon: 'star', color: '#EC4899', prompt: 'You monitor Google/Yelp reviews and draft warm responses within 2 hours. Thank positives, de-escalate negatives.' },
      { name: 'Supplier Agent', icon: 'truck', color: '#84CC16', prompt: 'You track inventory levels and generate supplier reorder emails.' },
      { name: 'Social Agent', icon: 'camera', color: '#8B5CF6', prompt: 'You write daily-special posts for Facebook and Instagram. Casual, appetizing, local hashtags.' },
      { name: 'Reservation Agent', icon: 'calendar', color: '#0EA5E9', prompt: 'You confirm bookings and send friendly reminder messages.' },
    ],
  },
  agency: {
    label: 'Agency',
    persona: 'Creative, bold, sharp. Confident voice. Show the work. Numbers + flair.',
    agents: [
      { name: 'Client Report Agent', icon: 'chart', color: '#6366F1', prompt: 'You pull campaign metrics and generate monthly client report drafts with insights, not just numbers.' },
      { name: 'Content Agent', icon: 'pen', color: '#8B5CF6', prompt: 'You generate 30 days of client social content per brief, platform-tuned.' },
      { name: 'Proposal Agent', icon: 'file', color: '#0EA5E9', prompt: 'You generate custom proposals from a client brief: scope, timeline, pricing options.' },
      { name: 'Invoice Agent', icon: 'dollar', color: '#10B981', prompt: 'You track project completion and generate invoices.' },
      { name: 'Competitor Agent', icon: 'eye', color: '#F59E0B', prompt: 'You monitor each client\'s competitors weekly and summarize moves worth responding to.' },
    ],
  },
  trades: {
    label: 'Plumber / Trades',
    persona: 'Straight-talking, trustworthy, prompt. No jargon. Quote it, book it, done.',
    agents: [
      { name: 'Quote Agent', icon: 'wrench', color: '#F97316', prompt: 'You generate service quotes from a job description: labor, parts, total, validity window.' },
      { name: 'Scheduling Agent', icon: 'calendar', color: '#0EA5E9', prompt: 'You manage the job calendar and send confirmations and reminders.' },
      { name: 'Follow-up Agent', icon: 'message', color: '#8B5CF6', prompt: 'You check in 48 hours after a job and ask for a review if the customer is happy.' },
      { name: 'Invoice Agent', icon: 'dollar', color: '#10B981', prompt: 'You generate an invoice when a job is marked complete.' },
      { name: 'Review Agent', icon: 'star', color: '#EC4899', prompt: 'You route positive feedback to Google reviews and handle complaints privately with an owner alert.' },
    ],
  },
  ecom: {
    label: 'Ecommerce',
    persona: 'Energetic, benefit-led, conversion-focused. Urgency without sleaze.',
    agents: [
      { name: 'Product Agent', icon: 'tag', color: '#8B5CF6', prompt: 'You write and rewrite product descriptions for SEO and conversion.' },
      { name: 'Inventory Agent', icon: 'box', color: '#84CC16', prompt: 'You monitor stock levels and alert on low stock with reorder suggestions.' },
      { name: 'Review Agent', icon: 'star', color: '#EC4899', prompt: 'You respond to product reviews on all platforms in brand voice.' },
      { name: 'Email Agent', icon: 'mail', color: '#0EA5E9', prompt: 'You run abandoned-cart, win-back and post-purchase email sequences.' },
      { name: 'Ad Agent', icon: 'megaphone', color: '#F59E0B', prompt: 'You generate ad copy variants for Facebook and Google ads with hooks and CTAs.' },
    ],
  },
  other: {
    label: 'Other',
    persona: 'Helpful, human, competent. Adapt to the owner\'s voice over time.',
    agents: [
      { name: 'Marketing Agent', icon: 'megaphone', color: '#8B5CF6', prompt: 'You plan campaigns, write copy and maintain the content calendar.' },
      { name: 'Sales Agent', icon: 'target', color: '#F97316', prompt: 'You score leads, draft outreach and follow-up sequences.' },
      { name: 'Ops Agent', icon: 'gear', color: '#0EA5E9', prompt: 'You map processes, spot bottlenecks and generate SOPs.' },
      { name: 'Finance Agent', icon: 'dollar', color: '#10B981', prompt: 'You watch cash flow, chase invoices and categorize expenses.' },
    ],
  },
};

// ─── Expanded agent roster ───────────────────────────────────────────────────
export const AGENT_ROSTER = [
  // Business operations
  { id: 'cfo', name: 'CFO Agent', group: 'operations', icon: 'dollar', color: '#10B981', prompt: 'You are a CFO. Cash flow, P&L, invoice chasing, expense categorization. Show the numbers.' },
  { id: 'coo', name: 'COO Agent', group: 'operations', icon: 'gear', color: '#64748B', prompt: 'You are a COO. Process mapping, bottleneck detection, SOP generation.' },
  { id: 'hr', name: 'HR Agent', group: 'operations', icon: 'users', color: '#F472B6', prompt: 'You are an HR lead. Job posts, interview guides, onboarding docs, offer letters.' },
  { id: 'legal', name: 'Legal Agent', group: 'operations', icon: 'scale', color: '#8B5CF6', prompt: 'You review contracts, triage NDAs and run compliance checks. Flag risk, cite clauses. Not legal advice.' },
  { id: 'sales', name: 'Sales Agent', group: 'operations', icon: 'target', color: '#F97316', prompt: 'You score leads, draft outreach and build follow-up sequences.' },
  { id: 'marketing', name: 'Marketing Agent', group: 'operations', icon: 'megaphone', color: '#EC4899', prompt: 'You plan campaigns, build content calendars and write copy.' },
  { id: 'cs', name: 'Customer Success Agent', group: 'operations', icon: 'heart', color: '#0EA5E9', prompt: 'You triage tickets, draft responses and detect churn risk.' },
  { id: 'procurement', name: 'Procurement Agent', group: 'operations', icon: 'cart', color: '#84CC16', prompt: 'You compare vendors, draft negotiation scripts and generate POs.' },
  // Execution
  { id: 'email', name: 'Email Agent', group: 'execution', icon: 'mail', color: '#0EA5E9', prompt: 'You read inbox context, draft replies, flag urgent items.' },
  { id: 'calendar', name: 'Calendar Agent', group: 'execution', icon: 'calendar', color: '#6366F1', prompt: 'You schedule meetings, prep agendas, send reminders.' },
  { id: 'document', name: 'Document Agent', group: 'execution', icon: 'file', color: '#64748B', prompt: 'You generate PDFs, Word docs and presentations on demand.' },
  { id: 'data', name: 'Data Agent', group: 'execution', icon: 'chart', color: '#10B981', prompt: 'You analyze CSVs, build charts, surface anomalies.' },
  { id: 'scraper', name: 'Scraper Agent', group: 'execution', icon: 'globe', color: '#F59E0B', prompt: 'You extract structured data from websites continuously.' },
  { id: 'monitor', name: 'Monitor Agent', group: 'execution', icon: 'eye', color: '#EF4444', prompt: 'You watch competitors, prices and news. Alert only on change.' },
  { id: 'publisher', name: 'Publisher Agent', group: 'execution', icon: 'send', color: '#8B5CF6', prompt: 'You post to LinkedIn, Twitter/X, Instagram and Facebook on schedule, platform-tuned.' },
  { id: 'outreach', name: 'Outreach Agent', group: 'execution', icon: 'rocket', color: '#F97316', prompt: 'You send cold emails, follow up and book meetings. Always queue sends for approval.' },
  // Intelligence
  { id: 'strategist', name: 'Strategist Agent', group: 'intelligence', icon: 'compass', color: '#6366F1', prompt: 'You do market analysis, competitive positioning, GTM plans.' },
  { id: 'forecaster', name: 'Forecaster Agent', group: 'intelligence', icon: 'trending', color: '#10B981', prompt: 'You project revenue, predict churn, model trends with stated assumptions.' },
  { id: 'risk', name: 'Risk Agent', group: 'intelligence', icon: 'alert', color: '#EF4444', prompt: 'You flag legal, financial and operational risks before they land.' },
  { id: 'auditor', name: 'Auditor Agent', group: 'intelligence', icon: 'check', color: '#84CC16', prompt: 'You review all outputs for accuracy, consistency and compliance.' },
  { id: 'memory', name: 'Memory Agent', group: 'intelligence', icon: 'brain', color: '#8B5CF6', prompt: 'You learn everything about the business and never forget. Maintain the knowledge base.' },
  { id: 'critic', name: 'Critic Agent', group: 'intelligence', icon: 'message', color: '#F59E0B', prompt: 'You review other agents\' work, find gaps, improve quality.' },
  // Moonshots
  { id: 'ghost', name: 'Ghost Agent', group: 'moonshot', icon: 'ghost', color: '#94A3B8', prompt: 'You live inside email/Slack flows. Replies indistinguishable from the owner. Queue everything for approval.' },
  { id: 'mentor', name: 'Mentor Agent', group: 'moonshot', icon: 'graduation', color: '#0EA5E9', prompt: 'You study how the owner works and coach them to improve, with specific observations.' },
  { id: 'clone', name: 'Clone Agent', group: 'moonshot', icon: 'copy', color: '#EC4899', prompt: 'You learn the owner\'s exact writing voice and write indistinguishably from them.' },
  { id: 'watchdog', name: 'Watchdog Agent', group: 'moonshot', icon: 'dog', color: '#F97316', prompt: 'You monitor everything 24/7 and wake the owner only when something truly needs attention.' },
  { id: 'negotiator', name: 'Negotiator Agent', group: 'moonshot', icon: 'handshake', color: '#10B981', prompt: 'You handle vendor/client negotiations via email drafts, always with approval gates.' },
  { id: 'connector', name: 'Connector Agent', group: 'moonshot', icon: 'link', color: '#6366F1', prompt: 'You find partnership opportunities, draft intro emails and track follow-ups.' },
];

// ─── Agent modes (extends Auto/Cheap/Quality/Complex) ────────────────────────
export const AGENT_MODES = [
  { id: 'auto',    name: 'Auto',    desc: 'Forge picks the best route' },
  { id: 'cheap',   name: 'Cheap',   desc: 'Cheapest capable model' },
  { id: 'quality', name: 'Quality', desc: 'Best available model' },
  { id: 'complex', name: 'Complex', desc: 'Largest context + tools' },
  { id: 'solo',    name: 'Solo',    desc: 'Single focused agent, no orchestration', system: 'Work alone. No sub-agents. Stay tightly focused on the single task.' },
  { id: 'swarm',   name: 'Swarm',   desc: '5-10 agents in parallel, results merged', system: 'Decompose the task and spawn parallel sub-agents (spawn_agent). Merge results into one coherent answer.' },
  { id: 'pipeline',name: 'Pipeline',desc: 'Agents run sequentially, each builds on last', system: 'Run as a pipeline: plan stages, execute sequentially, each stage consumes the previous output.' },
  { id: 'debate',  name: 'Debate',  desc: 'Two agents argue, best answer wins', system: 'Argue both sides: produce position A, then a strong counter-position B, then a judged synthesis picking the winner with reasons.' },
  { id: 'review',  name: 'Review',  desc: 'One works, second critiques', system: 'Produce the work, then switch hats and critique it ruthlessly, then ship the corrected version.' },
  { id: 'stealth', name: 'Stealth', desc: 'Silent until done', system: 'No narration. No progress chatter. Output only the final deliverable.' },
  { id: 'draft',   name: 'Draft',   desc: 'Rough output fast, approval before final', system: 'Produce a fast rough draft and explicitly ask for approval before polishing.' },
  { id: 'teach',   name: 'Teach',   desc: 'Explains every step, full reasoning', system: 'Teach as you go: explain every step, show your reasoning, define terms.' },
];

const SEO_INTENTS = [
  { id: 'informational', tpl: (s: string, c: string) => `how to ${s.toLowerCase()} — guide for ${c}` },
  { id: 'commercial',    tpl: (s: string, c: string) => `best ${s.toLowerCase()} in ${c}` },
  { id: 'transactional', tpl: (s: string, c: string) => `${s.toLowerCase()} cost in ${c}` },
  { id: 'local',         tpl: (s: string, c: string) => `${s.toLowerCase()} near me ${c}` },
  { id: 'comparison',    tpl: (s: string, c: string) => `${s.toLowerCase()} options compared ${c}` },
];

export function setupAutonomy(app: Express, db: any, deps: Deps) {
  const { requireAuth, getUserLLMKey, callLLM, uuidv4 } = deps;

  // ── Migrations ──────────────────────────────────────────────────────────
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
    `ALTER TABLE users ADD COLUMN persona_override TEXT`,
  ];
  for (const a of alters) { try { db.exec(a); } catch {} }
  try { db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_subdomain ON users(subdomain) WHERE subdomain IS NOT NULL`); } catch {}
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

  // ── Credits helpers ─────────────────────────────────────────────────────
  function getCredits(userId: string): number {
    const r = db.prepare('SELECT credits FROM users WHERE id=?').get(userId) as any;
    return r?.credits || 0;
  }
  function adjustCredits(userId: string, delta: number, reason: string): number {
    const bal = Math.max(0, getCredits(userId) + delta);
    db.prepare('UPDATE users SET credits=? WHERE id=?').run(bal, userId);
    db.prepare('INSERT INTO credit_ledger (id,user_id,delta,reason,balance_after) VALUES (?,?,?,?,?)')
      .run(uuidv4(), userId, delta, reason, bal);
    return bal;
  }
  function chargeApiCost(userId: string, apiCostUsd: number, reason: string): number {
    return adjustCredits(userId, -(apiCostUsd * OVERAGE_MULTIPLIER), reason);
  }
  (app as any).forgeCredits = { getCredits, adjustCredits, chargeApiCost };

  function queueApproval(userId: string, type: string, title: string, content: string, platform?: string, scheduledFor?: string, preview?: any): string {
    const id = uuidv4();
    db.prepare('INSERT INTO pending_approvals (id,user_id,type,title,preview_data,content,platform,scheduled_for) VALUES (?,?,?,?,?,?,?,?)')
      .run(id, userId, type, title, JSON.stringify(preview || {}), content, platform || null, scheduledFor || null);
    return id;
  }

  function personaFor(user: any): string {
    if (user?.persona_override) return user.persona_override;
    const t = BUSINESS_TEMPLATES[user?.business_type || 'other'] || BUSINESS_TEMPLATES.other;
    return t.persona;
  }

  async function llm(userId: string, system: string, prompt: string): Promise<string> {
    const { provider, apiKey, model } = getUserLLMKey(userId);
    if (!apiKey) throw new Error('No LLM key available');
    const r = await callLLM(provider, apiKey, model, [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ]);
    // rough cost estimate: $3/M in, $15/M out worst case → use midband
    const est = (r.promptTokens * 3 + r.completionTokens * 15) / 1_000_000;
    chargeApiCost(userId, est, 'llm_generation');
    return r.content;
  }

  // ── Subdomain / white-label middleware ──────────────────────────────────
  app.use((req: any, _res: Response, next: NextFunction) => {
    try {
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || '');
      const sub = host.split('.')[0];
      if (sub && !['www', 'api', 'app', 'forge', 'localhost', ''].includes(sub)) {
        const u = db.prepare('SELECT id, username, brand_logo_url, brand_colors, business_type, subdomain FROM users WHERE subdomain=? OR custom_domain=?').get(sub, host) as any;
        if (u) req.forgeWorkspace = u;
      }
    } catch {}
    next();
  });
  app.get('/api/workspace/branding', (req: any, res: Response) => {
    const w = req.forgeWorkspace;
    if (!w) { res.json({ success: true, data: null }); return; }
    res.json({ success: true, data: { subdomain: w.subdomain, logo: w.brand_logo_url, colors: JSON.parse(w.brand_colors || '{}'), businessType: w.business_type } });
  });

  // ── Billing: plans, credits, topup, webhook hooks ───────────────────────
  app.get('/api/billing/plans', (_req: Request, res: Response) => {
    res.json({ success: true, data: FORGE_PLANS, trialDays: 7, overageMultiplier: OVERAGE_MULTIPLIER });
  });
  app.get('/api/billing/credits', requireAuth, (req: any, res: Response) => {
    const userId = req.user!.sub;
    const ledger = db.prepare('SELECT delta,reason,balance_after,created_at FROM credit_ledger WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(userId);
    res.json({ success: true, data: { balance: getCredits(userId), autoRefillThreshold: AUTO_REFILL_THRESHOLD, ledger } });
  });
  app.post('/api/billing/topup', requireAuth, async (req: any, res: Response) => {
    const userId = req.user!.sub;
    const amount = Math.max(10, Math.min(1000, Number(req.body?.amount) || 50));
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey) {
      try {
        const body = new URLSearchParams({
          'mode': 'payment',
          'line_items[0][price_data][currency]': 'usd',
          'line_items[0][price_data][product_data][name]': `Forge AI Credits — $${amount}`,
          'line_items[0][price_data][unit_amount]': String(amount * 100),
          'line_items[0][quantity]': '1',
          'success_url': (req.body?.successUrl || 'https://forge-sand-two.vercel.app') + '?topup=success',
          'cancel_url': (req.body?.cancelUrl || 'https://forge-sand-two.vercel.app') + '?topup=cancel',
          'metadata[user_id]': userId,
          'metadata[credit_amount]': String(amount),
          'metadata[kind]': 'forge_topup',
        });
        const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        });
        const j: any = await r.json();
        if (j.url) { res.json({ success: true, data: { checkoutUrl: j.url } }); return; }
      } catch {}
    }
    // No Stripe configured → credit immediately (dev mode)
    const bal = adjustCredits(userId, amount, 'topup_dev');
    res.json({ success: true, data: { balance: bal, dev: true } });
  });
  app.post('/api/billing/auto-refill', requireAuth, (req: any, res: Response) => {
    db.prepare('UPDATE users SET auto_refill=? WHERE id=?').run(req.body?.enabled ? 1 : 0, req.user!.sub);
    res.json({ success: true });
  });
  // Called from the existing Stripe webhook on invoice.paid / topup completion
  (app as any).forgeBillingHooks = {
    onInvoicePaid(userId: string, plan: string) {
      const p = FORGE_PLANS[plan] || FORGE_PLANS.starter;
      adjustCredits(userId, p.credits, `monthly_credit_refresh_${plan}`);
    },
    onSubscriptionDeleted(userId: string) {
      try { db.prepare("UPDATE subscriptions SET plan='free', status='cancelled', updated_at=datetime('now') WHERE user_id=?").run(userId); } catch {}
    },
    onTopupPaid(userId: string, amount: number) {
      adjustCredits(userId, amount, 'topup_paid');
    },
  };

  // ── Onboarding ──────────────────────────────────────────────────────────
  app.get('/api/onboarding', requireAuth, (req: any, res: Response) => {
    const u = db.prepare('SELECT business_type,business_cities,business_services,business_pain,brand_logo_url,brand_colors,onboarding_complete,connected_tools,subdomain FROM users WHERE id=?').get(req.user!.sub) as any;
    res.json({ success: true, data: u, templates: Object.entries(BUSINESS_TEMPLATES).map(([k, v]: any) => ({ id: k, label: v.label })) });
  });

  const onboardingHandler = (req: any, res: Response) => {
    const userId = req.user!.sub;
    const { businessType = 'other', cities = [], services = [], pain = '', logoUrl = '', colors = {}, connectedTools = [], businessName = '' } = req.body || {};
    const tpl = BUSINESS_TEMPLATES[businessType] || BUSINESS_TEMPLATES.other;
    // subdomain from business name
    let sub = String(businessName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    if (sub) {
      const taken = db.prepare('SELECT id FROM users WHERE subdomain=? AND id<>?').get(sub, userId);
      if (taken) sub = `${sub}-${Math.random().toString(36).slice(2, 6)}`;
    }
    db.prepare(`UPDATE users SET business_type=?, business_cities=?, business_services=?, business_pain=?, brand_logo_url=?, brand_colors=?, connected_tools=?, subdomain=COALESCE(NULLIF(?, ''), subdomain), onboarding_complete=1 WHERE id=?`)
      .run(businessType, JSON.stringify(cities), JSON.stringify(services), pain, logoUrl, JSON.stringify(colors), JSON.stringify(connectedTools), sub, userId);

    // Create template agent stack (skip dupes by name)
    const existing = new Set((db.prepare('SELECT name FROM workspace_agents WHERE user_id=?').all(userId) as any[]).map(r => r.name));
    let created = 0;
    for (const a of tpl.agents) {
      if (existing.has(a.name)) continue;
      db.prepare('INSERT INTO workspace_agents (id,user_id,name,color,icon,system_prompt,tools,model) VALUES (?,?,?,?,?,?,?,?)')
        .run(uuidv4(), userId, a.name, a.color, a.icon, `${a.prompt}\n\nBrand persona: ${tpl.persona}`, '["web_search","write_file","email_draft"]', 'forge-fast');
      created++;
    }

    // Generate keyword matrix: services × cities × intents
    const svcList: string[] = (services.length ? services : [tpl.label]).slice(0, 10);
    const cityList: string[] = (cities.length ? cities : ['your area']).slice(0, 20);
    const ins = db.prepare('INSERT INTO keyword_matrix (id,user_id,service,city,intent,keyword) VALUES (?,?,?,?,?,?)');
    let kws = 0;
    const have = (db.prepare('SELECT COUNT(*) c FROM keyword_matrix WHERE user_id=?').get(userId) as any).c;
    if (have === 0) {
      for (const s of svcList) for (const c of cityList) for (const it of SEO_INTENTS) {
        ins.run(uuidv4(), userId, s, c, it.id, it.tpl(s, c)); kws++;
      }
    }
    // 7-day trial credits if none
    if (getCredits(userId) <= 0) adjustCredits(userId, 5, 'trial_credits');

    res.json({
      success: true,
      data: {
        subdomain: sub || null,
        agentsCreated: created,
        keywordsQueued: kws,
        persona: tpl.persona,
        steps: ['Learning your business...', 'Building your agents...', 'Setting up your automations...', 'Preparing your morning dashboard...'],
      },
    });
  };
  app.post('/api/onboarding', requireAuth, onboardingHandler);

  // ── Persona ─────────────────────────────────────────────────────────────
  app.get('/api/persona', requireAuth, (req: any, res: Response) => {
    const u = db.prepare('SELECT business_type,persona_override FROM users WHERE id=?').get(req.user!.sub) as any;
    res.json({ success: true, data: { businessType: u?.business_type, persona: personaFor(u), override: u?.persona_override || null } });
  });
  app.put('/api/persona', requireAuth, (req: any, res: Response) => {
    db.prepare('UPDATE users SET persona_override=? WHERE id=?').run(req.body?.persona || null, req.user!.sub);
    res.json({ success: true });
  });
  (app as any).forgePersona = personaFor;

  // ── Agent roster + modes ────────────────────────────────────────────────
  app.get('/api/agents/roster', (_req: Request, res: Response) => {
    res.json({ success: true, data: AGENT_ROSTER });
  });
  app.post('/api/agents/roster/:id/install', requireAuth, (req: any, res: Response) => {
    const userId = req.user!.sub;
    const a = AGENT_ROSTER.find(r => r.id === req.params.id);
    if (!a) { res.status(404).json({ success: false, error: 'unknown agent' }); return; }
    const dupe = db.prepare('SELECT id FROM workspace_agents WHERE user_id=? AND name=?').get(userId, a.name);
    if (dupe) { res.json({ success: true, data: { id: (dupe as any).id, existed: true } }); return; }
    const u = db.prepare('SELECT business_type,persona_override FROM users WHERE id=?').get(userId) as any;
    const id = uuidv4();
    db.prepare('INSERT INTO workspace_agents (id,user_id,name,color,icon,system_prompt,tools,model) VALUES (?,?,?,?,?,?,?,?)')
      .run(id, userId, a.name, a.color, a.icon, `${a.prompt}\n\nBrand persona: ${personaFor(u)}`, '["web_search","write_file","run_code","email_draft"]', 'forge-fast');
    res.json({ success: true, data: { id } });
  });
  app.get('/api/agent-modes', (_req: Request, res: Response) => {
    res.json({ success: true, data: AGENT_MODES });
  });
  (app as any).forgeModeSystem = (modeId: string): string | null => {
    const m = AGENT_MODES.find(x => x.id === modeId);
    return (m as any)?.system || null;
  };

  // ── Approval inbox ──────────────────────────────────────────────────────
  app.get('/api/approvals', requireAuth, (req: any, res: Response) => {
    const rows = db.prepare("SELECT * FROM pending_approvals WHERE user_id=? AND status='pending' ORDER BY created_at DESC LIMIT 100").all(req.user!.sub);
    res.json({ success: true, data: rows });
  });
  app.post('/api/approvals/:id/:action', requireAuth, (req: any, res: Response) => {
    const { id, action } = req.params;
    const userId = req.user!.sub;
    const row = db.prepare('SELECT * FROM pending_approvals WHERE id=? AND user_id=?').get(id, userId) as any;
    if (!row) { res.status(404).json({ success: false, error: 'not found' }); return; }
    if (action === 'approve') {
      db.prepare("UPDATE pending_approvals SET status='approved', resolved_at=datetime('now'), content=COALESCE(NULLIF(?, ''), content) WHERE id=?").run(req.body?.content || '', id);
      if (row.type === 'seo_page') {
        const pv = JSON.parse(row.preview_data || '{}');
        if (pv.page_id) db.prepare("UPDATE seo_pages SET status='published', published_at=datetime('now'), url=COALESCE(url, '/p/' || id) WHERE id=?").run(pv.page_id);
        db.prepare("UPDATE keyword_matrix SET status='published' WHERE page_id=?").run(pv.page_id || '');
      }
      if (row.type === 'review_request') {
        const pv = JSON.parse(row.preview_data || '{}');
        if (pv.review_id) db.prepare("UPDATE review_requests SET stage='sent', updated_at=datetime('now') WHERE id=?").run(pv.review_id);
      }
    } else if (action === 'reject') {
      db.prepare("UPDATE pending_approvals SET status='rejected', resolved_at=datetime('now') WHERE id=?").run(id);
    } else if (action === 'edit') {
      db.prepare("UPDATE pending_approvals SET content=?, status='pending' WHERE id=?").run(req.body?.content || row.content, id);
    } else { res.status(400).json({ success: false, error: 'bad action' }); return; }
    res.json({ success: true });
  });
  app.post('/api/approvals/approve-all', requireAuth, (req: any, res: Response) => {
    const userId = req.user!.sub;
    const rows = db.prepare("SELECT id FROM pending_approvals WHERE user_id=? AND status='pending'").all(userId) as any[];
    for (const r of rows) db.prepare("UPDATE pending_approvals SET status='approved', resolved_at=datetime('now') WHERE id=?").run(r.id);
    res.json({ success: true, data: { approved: rows.length } });
  });

  // ── SEO pages (published, public read) ──────────────────────────────────
  app.get('/api/seo/pages', requireAuth, (req: any, res: Response) => {
    const rows = db.prepare('SELECT id,keyword,title,url,status,word_count,published_at,created_at FROM seo_pages WHERE user_id=? ORDER BY created_at DESC LIMIT 200').all(req.user!.sub);
    const matrix = db.prepare('SELECT status, COUNT(*) c FROM keyword_matrix WHERE user_id=? GROUP BY status').all(req.user!.sub);
    res.json({ success: true, data: { pages: rows, matrix } });
  });
  app.get('/p/:pageId', (req: Request, res: Response) => {
    const p = db.prepare("SELECT * FROM seo_pages WHERE id=? AND status='published'").get(req.params.pageId) as any;
    if (!p) { res.status(404).send('Not found'); return; }
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!doctype html><html><head><title>${p.title || p.keyword}</title><meta name="description" content="${(p.meta_description || '').replace(/"/g, '&quot;')}"><script type="application/ld+json">{"@context":"https://schema.org","@type":"LocalBusiness","name":${JSON.stringify(p.title || p.keyword)}}</script></head><body>${p.content}</body></html>`);
  });

  // ── Review request automation ───────────────────────────────────────────
  app.post('/api/reviews/request', requireAuth, (req: any, res: Response) => {
    const userId = req.user!.sub;
    const { customerName = '', contact = '', channel = 'sms' } = req.body || {};
    const id = uuidv4();
    db.prepare('INSERT INTO review_requests (id,user_id,customer_name,customer_contact,channel) VALUES (?,?,?,?,?)').run(id, userId, customerName, contact, channel);
    queueApproval(userId, 'review_request', `Review request → ${customerName || contact}`,
      `Hi ${customerName || 'there'}, how was your experience with us? Reply 1-5.`, channel, undefined, { review_id: id });
    res.json({ success: true, data: { id } });
  });
  app.post('/api/reviews/:id/respond', requireAuth, (req: any, res: Response) => {
    const rating = Number(req.body?.rating) || 0;
    const r = db.prepare('SELECT * FROM review_requests WHERE id=? AND user_id=?').get(req.params.id, req.user!.sub) as any;
    if (!r) { res.status(404).json({ success: false }); return; }
    const stage = rating >= 4 ? 'google_link_sent' : 'owner_alerted';
    db.prepare("UPDATE review_requests SET rating=?, stage=?, updated_at=datetime('now') WHERE id=?").run(rating, stage, r.id);
    res.json({ success: true, data: { stage } });
  });

  // ── Magic Reply ─────────────────────────────────────────────────────────
  app.post('/api/magic-reply', requireAuth, async (req: any, res: Response) => {
    const userId = req.user!.sub;
    const { message = '', sender = '', channel = 'email' } = req.body || {};
    if (!message) { res.status(400).json({ success: false, error: 'message required' }); return; }
    try {
      const u = db.prepare('SELECT business_type,persona_override,username FROM users WHERE id=?').get(userId) as any;
      const mem = (db.prepare('SELECT topic,insight FROM forge_memory WHERE user_id=? ORDER BY strength DESC LIMIT 15').all(userId) as any[])
        .map(m => `- ${m.topic}: ${m.insight}`).join('\n');
      const reply = await llm(userId,
        `You are Magic Reply for ${u?.username || 'the owner'}. Draft the perfect ${channel} reply in the owner's voice. Persona: ${personaFor(u)}. Context about the business:\n${mem || '(none yet)'}\nOutput ONLY the reply body, no preamble.`,
        `From: ${sender}\nMessage:\n${message}`);
      res.json({ success: true, data: { reply } });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  // ── Voice-First: morning brief for TTS ──────────────────────────────────
  app.get('/api/voice/brief', requireAuth, async (req: any, res: Response) => {
    const userId = req.user!.sub;
    try {
      const run = db.prepare('SELECT * FROM nightly_runs WHERE user_id=? ORDER BY started_at DESC LIMIT 1').get(userId) as any;
      const pend = (db.prepare("SELECT COUNT(*) c FROM pending_approvals WHERE user_id=? AND status='pending'").get(userId) as any).c;
      const s = run ? JSON.parse(run.summary || '{}') : {};
      const parts: string[] = [];
      if (run) parts.push(`Last night I published drafts for ${s.seo_pages || 0} new pages, scheduled ${s.social_posts || 0} social posts, and queued ${s.review_requests || 0} review requests.`);
      parts.push(pend > 0 ? `${pend} item${pend === 1 ? '' : 's'} need your approval. Say "approve all" or review them one by one.` : 'Nothing needs your approval. You are all clear.');
      res.json({ success: true, data: { text: `Good morning. ${parts.join(' ')}`, pending: pend } });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });
  app.post('/api/voice/command', requireAuth, async (req: any, res: Response) => {
    const userId = req.user!.sub;
    const cmd = String(req.body?.text || '').toLowerCase();
    if (cmd.includes('approve all')) {
      const rows = db.prepare("SELECT id FROM pending_approvals WHERE user_id=? AND status='pending'").all(userId) as any[];
      for (const r of rows) db.prepare("UPDATE pending_approvals SET status='approved', resolved_at=datetime('now') WHERE id=?").run(r.id);
      res.json({ success: true, data: { speech: `Done. Approved ${rows.length} items.` } }); return;
    }
    try {
      const reply = await llm(userId, 'You are Forge in voice mode. Answer in 1-3 short spoken sentences, no formatting.', cmd);
      res.json({ success: true, data: { speech: reply } });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  // ── Morning dashboard ───────────────────────────────────────────────────
  app.get('/api/morning', requireAuth, (req: any, res: Response) => {
    const userId = req.user!.sub;
    const run = db.prepare('SELECT * FROM nightly_runs WHERE user_id=? ORDER BY started_at DESC LIMIT 1').get(userId) as any;
    const approvals = db.prepare("SELECT * FROM pending_approvals WHERE user_id=? AND status='pending' ORDER BY created_at DESC LIMIT 50").all(userId);
    const seo = (db.prepare("SELECT COUNT(*) c FROM seo_pages WHERE user_id=? AND status='published'").get(userId) as any).c;
    res.json({ success: true, data: { lastRun: run ? { ...run, summary: JSON.parse(run.summary || '{}') } : null, approvals, publishedPages: seo, credits: getCredits(userId) } });
  });

  // ── Nightly pipeline ────────────────────────────────────────────────────
  async function runNightlyForUser(userId: string): Promise<any> {
    const runId = uuidv4();
    db.prepare('INSERT INTO nightly_runs (id,user_id) VALUES (?,?)').run(runId, userId);
    const summary: any = { seo_pages: 0, social_posts: 0, review_requests: 0, errors: [] };
    const u = db.prepare('SELECT * FROM users WHERE id=?').get(userId) as any;
    const tpl = BUSINESS_TEMPLATES[u?.business_type || 'other'] || BUSINESS_TEMPLATES.other;

    // Job 1: SEO pages (up to 5/night from keyword matrix)
    try {
      const kws = db.prepare("SELECT * FROM keyword_matrix WHERE user_id=? AND status='pending' LIMIT 5").all(userId) as any[];
      for (const k of kws) {
        try {
          const out = await llm(userId,
            `You write SEO landing pages. Persona: ${tpl.persona}. Output strict JSON: {"title":"...","meta":"...","html":"<h1>...</h1>..."} — 800-1200 words of genuinely useful HTML content with h1/h2/h3, internal-link placeholders like {{link:keyword}}, and a closing call-to-action section.`,
            `Write the page for keyword: "${k.keyword}" (service: ${k.service}, city: ${k.city}, intent: ${k.intent}).`);
          let j: any = {};
          try { j = JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1)); } catch { j = { title: k.keyword, meta: '', html: `<h1>${k.keyword}</h1><p>${out}</p>` }; }
          const pageId = uuidv4();
          const wc = String(j.html || '').split(/\s+/).length;
          db.prepare('INSERT INTO seo_pages (id,user_id,keyword,title,content,meta_description,word_count) VALUES (?,?,?,?,?,?,?)')
            .run(pageId, userId, k.keyword, j.title || k.keyword, j.html || '', j.meta || '', wc);
          db.prepare("UPDATE keyword_matrix SET status='generated', page_id=? WHERE id=?").run(pageId, k.id);
          queueApproval(userId, 'seo_page', `New SEO page: ${j.title || k.keyword}`, j.html || '', 'site', undefined, { page_id: pageId, keyword: k.keyword, word_count: wc });
          summary.seo_pages++;
        } catch (e: any) { summary.errors.push(`seo:${e.message}`); }
      }
    } catch (e: any) { summary.errors.push(`seo_outer:${e.message}`); }

    // Job 2: content calendar self-healing (fill next 7 days, 1 post per platform pair)
    try {
      const platforms = ['instagram', 'facebook', 'linkedin'];
      const scheduled = (db.prepare("SELECT COUNT(*) c FROM pending_approvals WHERE user_id=? AND type='social_post' AND status='pending'").get(userId) as any).c;
      if (scheduled < 6) {
        const out = await llm(userId,
          `You are a social media manager. Persona: ${tpl.persona}. Output strict JSON array of ${6 - scheduled} posts: [{"platform":"instagram|facebook|linkedin","caption":"...","hashtags":["..."],"day_offset":1}]. Platform-tuned tone: LinkedIn professional, Instagram casual, Facebook community.`,
          `Business: ${tpl.label}${u?.business_cities ? ' in ' + u.business_cities : ''}. Pain point focus: ${u?.business_pain || 'growth'}. Generate the posts.`);
        let posts: any[] = [];
        try { posts = JSON.parse(out.slice(out.indexOf('['), out.lastIndexOf(']') + 1)); } catch {}
        for (const p of posts.slice(0, 6)) {
          const when = new Date(Date.now() + (Number(p.day_offset) || 1) * 86400000).toISOString();
          queueApproval(userId, 'social_post', `${(p.platform || platforms[0])} post`, `${p.caption || ''}\n\n${(p.hashtags || []).map((h: string) => h.startsWith('#') ? h : '#' + h).join(' ')}`, p.platform || platforms[0], when);
          summary.social_posts++;
        }
      }
    } catch (e: any) { summary.errors.push(`social:${e.message}`); }

    // Job 3: queued review requests advance
    try {
      const queued = db.prepare("SELECT COUNT(*) c FROM review_requests WHERE user_id=? AND stage='queued'").all ? (db.prepare("SELECT COUNT(*) c FROM review_requests WHERE user_id=? AND stage='queued'").get(userId) as any).c : 0;
      summary.review_requests = queued;
    } catch {}

    db.prepare("UPDATE nightly_runs SET finished_at=datetime('now'), status=?, summary=? WHERE id=?")
      .run(summary.errors.length ? 'partial' : 'complete', JSON.stringify(summary), runId);
    return summary;
  }

  app.post('/api/nightly/run-now', requireAuth, async (req: any, res: Response) => {
    try { const s = await runNightlyForUser(req.user!.sub); res.json({ success: true, data: s }); }
    catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });
  app.get('/api/nightly/runs', requireAuth, (req: any, res: Response) => {
    const rows = (db.prepare('SELECT * FROM nightly_runs WHERE user_id=? ORDER BY started_at DESC LIMIT 30').all(req.user!.sub) as any[])
      .map(r => ({ ...r, summary: JSON.parse(r.summary || '{}') }));
    res.json({ success: true, data: rows });
  });

  // Hourly check: at 02:00-02:59 server time run for eligible users not yet run today
  setInterval(async () => {
    try {
      const hour = new Date().getHours();
      if (hour !== 2) return;
      const users = db.prepare(`
        SELECT u.id FROM users u
        WHERE u.onboarding_complete=1
        AND NOT EXISTS (SELECT 1 FROM nightly_runs nr WHERE nr.user_id=u.id AND date(nr.started_at)=date('now'))
        LIMIT 50
      `).all() as any[];
      for (const u of users) {
        try { await runNightlyForUser(u.id); } catch {}
      }
    } catch {}
  }, 30 * 60 * 1000);

  // ════════════════ MOONSHOTS (Fable-class) ════════════════════════════════

  db.exec(`
    CREATE TABLE IF NOT EXISTS revenue_leads (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT, contact TEXT,
      company TEXT, stage TEXT DEFAULT 'cold', notes TEXT DEFAULT '',
      last_touch TEXT, created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS brain_alerts (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, severity TEXT DEFAULT 'info',
      title TEXT, detail TEXT, status TEXT DEFAULT 'open',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS marketplace_apps (
      id TEXT PRIMARY KEY, builder_user_id TEXT NOT NULL, name TEXT NOT NULL,
      vertical TEXT, description TEXT DEFAULT '', price_monthly REAL DEFAULT 0,
      template_json TEXT DEFAULT '{}', installs INTEGER DEFAULT 0,
      revenue_share REAL DEFAULT 0.20, published INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS marketplace_installs (
      id TEXT PRIMARY KEY, app_id TEXT NOT NULL, user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // ── Moonshot 6: One-Sentence Company Setup ───────────────────────────────
  // "I run a 3-person plumbing company in Austin" → full OS in 90 seconds.
  app.post('/api/genesis', requireAuth, async (req: any, res: Response) => {
    const userId = req.user!.sub;
    const sentence = String(req.body?.sentence || '').trim();
    if (!sentence) { res.status(400).json({ success: false, error: 'sentence required' }); return; }
    try {
      const out = await llm(userId,
        `Extract business facts. Output strict JSON: {"businessName":"...","businessType":"law_firm|restaurant|agency|trades|ecom|other","cities":["..."],"services":["..."],"pain":"...","teamSize":1}. Infer sensible services for the trade if not stated.`,
        sentence);
      let j: any = {};
      try { j = JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1)); } catch { throw new Error('parse failed'); }
      // Reuse onboarding flow internals via direct call
      const fakeReq: any = { user: { sub: userId }, body: {
        businessName: j.businessName || '', businessType: j.businessType || 'other',
        cities: j.cities || [], services: j.services || [], pain: j.pain || '',
        logoUrl: '', colors: {}, connectedTools: [],
      } };
      let payload: any = null;
      const fakeRes: any = { json: (x: any) => { payload = x; } };
      await (onboardingHandler as any)(fakeReq, fakeRes);
      // kick first nightly run async (don't block response)
      runNightlyForUser(userId).catch(() => {});
      res.json({ success: true, data: { extracted: j, workspace: payload?.data, nightlyStarted: true } });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  // ── Moonshot 7: Autonomous Revenue Loop ──────────────────────────────────
  app.post('/api/revenue/leads', requireAuth, (req: any, res: Response) => {
    const userId = req.user!.sub;
    const leads = Array.isArray(req.body?.leads) ? req.body.leads : [req.body];
    const ins = db.prepare('INSERT INTO revenue_leads (id,user_id,name,contact,company,stage,notes) VALUES (?,?,?,?,?,?,?)');
    let n = 0;
    for (const l of leads) { if (l?.name || l?.contact) { ins.run(uuidv4(), userId, l.name || '', l.contact || '', l.company || '', l.stage || 'cold', l.notes || ''); n++; } }
    res.json({ success: true, data: { added: n } });
  });
  app.get('/api/revenue/leads', requireAuth, (req: any, res: Response) => {
    res.json({ success: true, data: db.prepare('SELECT * FROM revenue_leads WHERE user_id=? ORDER BY created_at DESC LIMIT 200').all(req.user!.sub) });
  });
  app.post('/api/revenue/loop/run', requireAuth, async (req: any, res: Response) => {
    const userId = req.user!.sub;
    const summary: any = { outreach_drafted: 0, followups: 0, errors: [] };
    try {
      const u = db.prepare('SELECT * FROM users WHERE id=?').get(userId) as any;
      // Cold leads (no touch in 7d) → outreach drafts
      const cold = db.prepare(`SELECT * FROM revenue_leads WHERE user_id=? AND stage IN ('cold','contacted') AND (last_touch IS NULL OR last_touch < datetime('now','-7 days')) LIMIT 8`).all(userId) as any[];
      for (const l of cold) {
        try {
          const draft = await llm(userId,
            `You write revenue outreach for ${u?.username || 'the owner'}. Persona: ${personaFor(u)}. ${l.stage === 'cold' ? 'Cold open: short, specific, one clear ask for a meeting.' : 'Follow-up: reference prior touch, gentle, propose 2 time slots.'} Output ONLY the message body.`,
            `Lead: ${l.name} at ${l.company}. Notes: ${l.notes || '(none)'}`);
          queueApproval(userId, 'email', `${l.stage === 'cold' ? 'Outreach' : 'Follow-up'} → ${l.name}${l.company ? ' (' + l.company + ')' : ''}`, draft, 'email', undefined, { lead_id: l.id });
          db.prepare("UPDATE revenue_leads SET last_touch=datetime('now'), stage=CASE stage WHEN 'cold' THEN 'contacted' ELSE stage END WHERE id=?").run(l.id);
          l.stage === 'cold' ? summary.outreach_drafted++ : summary.followups++;
        } catch (e: any) { summary.errors.push(e.message); }
      }
      res.json({ success: true, data: summary });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  // ── Moonshot 4: Live Business Brain ──────────────────────────────────────
  function brainScan(userId: string): any[] {
    const alerts: any[] = [];
    const push = (severity: string, title: string, detail: string) => {
      const dupe = db.prepare("SELECT id FROM brain_alerts WHERE user_id=? AND title=? AND status='open'").get(userId, title);
      if (dupe) return;
      const id = uuidv4();
      db.prepare('INSERT INTO brain_alerts (id,user_id,severity,title,detail) VALUES (?,?,?,?,?)').run(id, userId, severity, title, detail);
      alerts.push({ id, severity, title, detail });
    };
    try {
      const lastRun = db.prepare('SELECT * FROM nightly_runs WHERE user_id=? ORDER BY started_at DESC LIMIT 1').get(userId) as any;
      if (lastRun) {
        const errs = JSON.parse(lastRun.summary || '{}').errors || [];
        if (errs.length) push('warn', 'Nightly run had errors', errs.slice(0, 3).join(' | '));
        if (lastRun.started_at < new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 19).replace('T', ' ')) push('warn', 'Nightly pipeline stale', 'No run in 48h+. Check onboarding/credits.');
      }
      const bal = getCredits(userId);
      if (bal < AUTO_REFILL_THRESHOLD) push('critical', 'AI credits low', `Balance $${bal.toFixed(2)} — autonomous jobs will stall. Top up.`);
      const stalePend = (db.prepare("SELECT COUNT(*) c FROM pending_approvals WHERE user_id=? AND status='pending' AND created_at < datetime('now','-3 days')").get(userId) as any).c;
      if (stalePend > 0) push('info', 'Approvals piling up', `${stalePend} items pending 3+ days. Approve or skip to keep agents shipping.`);
      const coldLeads = (db.prepare("SELECT COUNT(*) c FROM revenue_leads WHERE user_id=? AND stage='cold'").get(userId) as any).c;
      if (coldLeads > 5) push('info', 'Cold pipeline detected', `${coldLeads} cold leads. Run the revenue loop.`);
    } catch {}
    return alerts;
  }
  app.post('/api/brain/scan', requireAuth, (req: any, res: Response) => {
    res.json({ success: true, data: brainScan(req.user!.sub) });
  });
  app.get('/api/brain/alerts', requireAuth, (req: any, res: Response) => {
    res.json({ success: true, data: db.prepare("SELECT * FROM brain_alerts WHERE user_id=? AND status='open' ORDER BY created_at DESC LIMIT 50").all(req.user!.sub) });
  });
  app.post('/api/brain/alerts/:id/dismiss', requireAuth, (req: any, res: Response) => {
    db.prepare("UPDATE brain_alerts SET status='dismissed' WHERE id=? AND user_id=?").run(req.params.id, req.user!.sub);
    res.json({ success: true });
  });
  // Brain heartbeat: scan all onboarded users every 6h
  setInterval(() => {
    try {
      const users = db.prepare('SELECT id FROM users WHERE onboarding_complete=1 LIMIT 200').all() as any[];
      for (const u of users) brainScan(u.id);
    } catch {}
  }, 6 * 60 * 60 * 1000);

  // ── Moonshot 5: Competitor Intelligence Engine ───────────────────────────
  app.post('/api/competitor/scan', requireAuth, async (req: any, res: Response) => {
    const userId = req.user!.sub;
    const competitors = (req.body?.competitors || []).slice(0, 10);
    if (!competitors.length) { res.status(400).json({ success: false, error: 'competitors[] required' }); return; }
    try {
      const u = db.prepare('SELECT * FROM users WHERE id=?').get(userId) as any;
      const out = await llm(userId,
        `You are a competitive intelligence engine. Build a full competitive map: per competitor — positioning, likely pricing band, strengths, weaknesses, messaging angle they own. Then: gaps WE can own, 3 GTM plays, 1 counter-positioning statement. Persona: ${personaFor(u)}. Markdown.`,
        `Our business: ${u?.business_type || 'unknown'} in ${u?.business_cities || 'unknown'} offering ${u?.business_services || 'unknown'}. Competitors: ${competitors.join(', ')}`);
      queueApproval(userId, 'email', `Competitive battle map — ${competitors.length} competitors`, out, 'report');
      res.json({ success: true, data: { report: out } });
    } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
  });

  // ── Moonshot 8: Forge Marketplace (20% rev share) ────────────────────────
  app.get('/api/marketplace', (_req: Request, res: Response) => {
    res.json({ success: true, data: db.prepare('SELECT id,name,vertical,description,price_monthly,installs,created_at FROM marketplace_apps WHERE published=1 ORDER BY installs DESC LIMIT 100').all() });
  });
  app.post('/api/marketplace/publish', requireAuth, (req: any, res: Response) => {
    const { name, vertical = 'other', description = '', priceMonthly = 0, template = {} } = req.body || {};
    if (!name) { res.status(400).json({ success: false, error: 'name required' }); return; }
    const id = uuidv4();
    db.prepare('INSERT INTO marketplace_apps (id,builder_user_id,name,vertical,description,price_monthly,template_json) VALUES (?,?,?,?,?,?,?)')
      .run(id, req.user!.sub, name, vertical, description, priceMonthly, JSON.stringify(template));
    res.json({ success: true, data: { id, revenueShare: 0.20 } });
  });
  app.post('/api/marketplace/:id/install', requireAuth, (req: any, res: Response) => {
    const userId = req.user!.sub;
    const a = db.prepare('SELECT * FROM marketplace_apps WHERE id=? AND published=1').get(req.params.id) as any;
    if (!a) { res.status(404).json({ success: false, error: 'not found' }); return; }
    const tplJ = (() => { try { return JSON.parse(a.template_json || '{}'); } catch { return {}; } })();
    let created = 0;
    for (const ag of (tplJ.agents || [])) {
      const dupe = db.prepare('SELECT id FROM workspace_agents WHERE user_id=? AND name=?').get(userId, ag.name || '');
      if (dupe || !ag.name) continue;
      db.prepare('INSERT INTO workspace_agents (id,user_id,name,color,icon,system_prompt,tools,model) VALUES (?,?,?,?,?,?,?,?)')
        .run(uuidv4(), userId, ag.name, ag.color || '#7F77DD', ag.icon || 'robot', ag.prompt || '', '["web_search","write_file"]', 'forge-fast');
      created++;
    }
    db.prepare('INSERT INTO marketplace_installs (id,app_id,user_id) VALUES (?,?,?)').run(uuidv4(), a.id, userId);
    db.prepare('UPDATE marketplace_apps SET installs=installs+1 WHERE id=?').run(a.id);
    res.json({ success: true, data: { agentsCreated: created } });
  });

  console.log('🤖 Forge Autonomy OS mounted: onboarding, templates, nightly pipeline, approvals, credits, personas, voice, magic-reply + MOONSHOTS: genesis, revenue-loop, business-brain, competitor-intel, marketplace');
}
