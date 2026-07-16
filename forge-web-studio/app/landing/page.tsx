'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';

// ── Forge Landing v4 — blink.new-inspired redesign ──
// Palette: navy bg, violet primary (#7C3AED), orange accent (#F97316)

const APP = '';

// ──────────────────── CONSTANTS ────────────────────
const PROMPT_TABS = [
  { id: 'agent', icon: '🤖', label: 'Agent', placeholder: 'Hire an agent — e.g. "Chase all overdue invoices"' },
  { id: 'automate', icon: '⚡', label: 'Automate', placeholder: 'Create a workflow — e.g. "Post to LinkedIn every Monday"' },
  { id: 'brief', icon: '🌅', label: 'Morning Brief', placeholder: 'Ask about last night — e.g. "What did my agents do?"' },
  { id: 'build', icon: '🔧', label: 'Build', placeholder: 'Build something — e.g. "Set up a lead pipeline for my law firm"' },
];

const EXAMPLE_PROMPTS: Record<string, string[]> = {
  agent: ['Chase the 3 invoices over $2k', 'Write 5 cold emails for SaaS founders', 'Monitor my top 3 competitors daily'],
  automate: ['Post a LinkedIn update every Mon 9am', 'Send a weekly summary to my team', 'Follow up leads after 48h silence'],
  brief: ['What did my agents do overnight?', 'Summarize yesterday\'s revenue activity', 'Any risks I should know about today?'],
  build: ['Build me a law firm workspace', 'Set up an e-commerce revenue loop', 'Create a content multiplier pipeline'],
};

const AGENTS = [
  { name: 'DebtChaser', icon: '💸', status: 'running', task: 'Sent reminder to Apex Co — $4,200 overdue', color: '#7C3AED' },
  { name: 'ContentEngine', icon: '✍️', status: 'running', task: 'Drafted 4 LinkedIn posts for this week', color: '#7C3AED' },
  { name: 'CompetitorWatch', icon: '🔍', status: 'done', task: '2 new competitor moves flagged', color: '#10B981' },
  { name: 'LeadNurturer', icon: '📧', status: 'waiting', task: '6 follow-ups queued for your approval', color: '#F97316' },
  { name: 'LawBot', icon: '⚖️', status: 'running', task: 'Reviewing contract for Hendersons', color: '#7C3AED' },
  { name: 'SEOEngine', icon: '📈', status: 'done', task: '3 keyword opportunities found', color: '#10B981' },
];

const MODULES = [
  { icon: '🤖', tag: 'CORE', title: 'Agent Hub', desc: '30+ specialized agents for every business function. Hire in one click, approve outputs in batch.' },
  { icon: '💸', tag: 'GROWTH', title: 'Revenue Loop', desc: 'Cold lead → outreach → meeting → invoice → closed. Fully autonomous 8-stage pipeline.' },
  { icon: '🌅', tag: 'CONTROL', title: 'Morning Brief', desc: 'Wake to a summary of overnight work. Approve everything in one tap — no digging required.' },
  { icon: '🧠', tag: 'MEMORY', title: 'Forge Brain', desc: 'Persistent memory across every agent and session. Learns your business voice over time.' },
  { icon: '✨', tag: 'CREATE', title: 'Content Multiplier', desc: 'One idea → 8 platform-optimized pieces for Twitter, LinkedIn, email, TikTok and more.' },
  { icon: '🏷️', tag: 'AGENCY', title: 'White-Label', desc: 'Run ForgeOS under your own brand. Sell to clients at $800–$10k/month per seat.' },
];

const FEATURES = [
  { icon: '⚡', badge: 'BYOK', color: '#7C3AED', title: 'Bring Your Own Keys', desc: 'Connect Anthropic, OpenAI, or Gemini keys directly. Zero token markup — you pay providers at cost.' },
  { icon: '🔁', badge: 'PIPELINE', color: '#F97316', title: 'Revenue Loop', desc: '8-stage autonomous pipeline: cold lead → email → meeting → call → invoice → chase → close.' },
  { icon: '✅', badge: 'CONTROL', color: '#10B981', title: 'Approval Queue', desc: 'Every agent action lands in queue before it fires. Grant full autonomy or review individually.' },
  { icon: '🏷️', badge: 'AGENCY', color: '#0EA5E9', title: 'White-Label Mode', desc: 'Full custom brand + domain. Resell Forge to clients. Each client gets their own workspace + brain.' },
  { icon: '🧠', badge: 'MEMORY', color: '#EC4899', title: 'Forge Brain', desc: 'Permanent business memory. Switching costs go up daily — your AI gets smarter every session.' },
  { icon: '🌐', badge: 'NETWORK', color: '#F59E0B', title: 'Marketplace', desc: 'Install vertical agent packs. Agencies publish and earn rev share. Catalog grows with every user.' },
];

const PLANS = [
  { name: 'Starter', price: 99, annual: 79, color: '#6366F1', desc: 'Solo operators & early-stage', features: ['1 workspace', '3 active agents', 'Morning dashboard', 'Marketplace access', 'Email support'] },
  { name: 'Pro', price: 299, annual: 239, color: '#7C3AED', popular: true, desc: 'Growing teams & agencies', features: ['3 workspaces', 'All 30+ agents', 'Revenue Loop', 'White-label ready', 'Priority support', 'Full marketplace'] },
  { name: 'Agency', price: 499, annual: 399, color: '#F97316', desc: 'Resellers & enterprise', features: ['Unlimited workspaces', 'Client resale portal', 'Custom domain + brand', 'API access', 'Dedicated CSM', 'SLA guarantee'] },
];

// ──────────────────── COMPONENTS ────────────────────

function DotGrid() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {/* dot grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px', backgroundPosition: 'center' }} />
      {/* top glow */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.30) 0%, transparent 55%)' }} />
      {/* bottom glow */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 50% 120%, rgba(124,58,237,0.15) 0%, transparent 55%)' }} />
    </div>
  );
}

function ScrollNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 5%', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.3s', background: scrolled ? 'rgba(9,11,22,0.85)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#7C3AED,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚡</div>
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>Forge<span style={{ color: '#7C3AED' }}>OS</span></span>
      </div>
      <nav style={{ display: 'flex', gap: 28, fontSize: 13, color: '#94A3B8' }}>
        {[['Agents', '#agents'], ['Features', '#features'], ['Pricing', '#pricing'], ['Industries', '#industries']].map(([l, h]) => (
          <a key={l} href={h} onMouseEnter={e => (e.currentTarget.style.color = '#E2E8F0')} onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')} style={{ textDecoration: 'none', color: '#94A3B8', transition: 'color 0.15s' }}>{l}</a>
        ))}
      </nav>
      <div style={{ display: 'flex', gap: 8 }}>
        <a href={`${APP}/login`} style={{ padding: '7px 16px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 13, color: '#CBD5E1', textDecoration: 'none' }}>Log in</a>
        <a href={`${APP}/register`} style={{ padding: '7px 16px', background: '#7C3AED', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', textDecoration: 'none', boxShadow: '0 0 24px rgba(124,58,237,0.35)' }}>Start free</a>
      </div>
    </header>
  );
}

function HeroPrompt() {
  const [tab, setTab] = useState('agent');
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const tabData = PROMPT_TABS.find(t => t.id === tab)!;
  const examples = EXAMPLE_PROMPTS[tab];

  return (
    <div style={{ width: '100%', maxWidth: 740, margin: '0 auto' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, marginBottom: -1, paddingLeft: 8 }}>
        {PROMPT_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 16px', background: tab === t.id ? '#111828' : 'rgba(255,255,255,0.025)', border: '1px solid', borderColor: tab === t.id ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)', borderBottom: tab === t.id ? '1px solid #111828' : '1px solid rgba(255,255,255,0.06)', borderRadius: '8px 8px 0 0', fontSize: 12, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? '#E2E8F0' : '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Input card */}
      <div style={{ background: '#111828', border: `1px solid ${focused ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.12)'}`, borderRadius: '0 12px 12px 12px', padding: '16px 18px', transition: 'border-color 0.2s', boxShadow: focused ? '0 0 0 3px rgba(124,58,237,0.12), 0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.4)' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={tabData.placeholder}
          rows={3}
          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: 15, color: '#E2E8F0', lineHeight: 1.6, fontFamily: 'inherit', caretColor: '#7C3AED', placeholderColor: '#475569' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {examples.slice(0, 2).map((ex, i) => (
              <button key={i} onClick={() => setInput(ex)} style={{ padding: '3px 10px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 20, fontSize: 11, color: '#A78BFA', cursor: 'pointer', whiteSpace: 'nowrap' }}>{ex}</button>
            ))}
          </div>
          <a href={`${APP}/register`} style={{ padding: '9px 20px', background: '#7C3AED', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            Run {tabData.icon} <span style={{ fontSize: 16 }}>→</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function AgentTicker() {
  const [offset, setOffset] = useState(0);
  const all = [...AGENTS, ...AGENTS];
  useEffect(() => {
    const t = setInterval(() => setOffset(o => (o + 0.4) % (AGENTS.length * 220)), 16);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ overflow: 'hidden', position: 'relative', marginTop: 56 }}>
      <div style={{ display: 'flex', gap: 12, transform: `translateX(-${offset}px)`, transition: 'none', willChange: 'transform' }}>
        {all.map((a, i) => (
          <div key={i} style={{ flexShrink: 0, width: 210, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: a.color, boxShadow: a.status === 'running' ? `0 0 6px ${a.color}` : 'none', animation: a.status === 'running' ? 'pulse 2s infinite' : 'none' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#CBD5E1' }}>{a.icon} {a.name}</span>
            </div>
            <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>{a.task}</div>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(to right, #090B16, transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(to left, #090B16, transparent)', pointerEvents: 'none' }} />
    </div>
  );
}

function ModuleExplorer() {
  const [active, setActive] = useState(0);
  const mod = MODULES[active];
  return (
    <section style={{ padding: '96px 5%' }}>
      <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <div style={{ display: 'inline-block', padding: '3px 14px', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, fontSize: 11, color: '#A78BFA', letterSpacing: 1, fontWeight: 700, marginBottom: 16 }}>THE PLATFORM</div>
        <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: -1, margin: '0 0 14px' }}>Six systems. One OS.</h2>
        <p style={{ color: '#64748B', fontSize: 15 }}>Every module is an autonomous workflow — click to explore</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24, maxWidth: 1100, margin: '0 auto', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {MODULES.map((m, i) => (
            <button key={i} onClick={() => setActive(i)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: active === i ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${active === i ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s' }}>
              <span style={{ fontSize: 20 }}>{m.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: active === i ? '#E2E8F0' : '#94A3B8', marginBottom: 2 }}>{m.title}</div>
                <div style={{ fontSize: 10, color: active === i ? '#A78BFA' : '#374151', fontWeight: 700, letterSpacing: 0.8 }}>{m.tag}</div>
              </div>
              {active === i && <span style={{ color: '#7C3AED' }}>→</span>}
            </button>
          ))}
        </div>
        <div style={{ background: '#0D1120', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden', position: 'sticky', top: 80 }}>
          {/* mock window chrome */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
            <span style={{ marginLeft: 8, fontSize: 11, color: '#374151' }}>forge.app — {mod.title.toLowerCase()}</span>
          </div>
          {/* video/preview area */}
          <div style={{ aspectRatio: '16/10', background: 'linear-gradient(135deg,#0D1120 0%,#13172A 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, position: 'relative' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{mod.icon}</div>
            <div style={{ fontSize: 13, color: '#475569' }}>Demo — {mod.title}</div>
            <div style={{ position: 'absolute', bottom: 14, right: 14, padding: '4px 10px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, fontSize: 10, color: '#A78BFA', fontWeight: 700 }}>{mod.tag}</div>
          </div>
          <div style={{ padding: '20px 24px 24px' }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: '#E2E8F0' }}>{mod.icon} {mod.title}</div>
            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.75, marginBottom: 18 }}>{mod.desc}</p>
            <a href={`${APP}/register`} style={{ display: 'inline-block', padding: '9px 20px', background: '#7C3AED', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', textDecoration: 'none' }}>Try {mod.title} →</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" style={{ padding: '96px 5%', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <div style={{ display: 'inline-block', padding: '3px 14px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 20, fontSize: 11, color: '#FB923C', letterSpacing: 1, fontWeight: 700, marginBottom: 16 }}>FEATURES</div>
        <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: -1, margin: '0 0 14px' }}>Everything your business needs</h2>
        <p style={{ color: '#64748B', fontSize: 15 }}>One OS. All the tools. No per-seat pricing.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, maxWidth: 1100, margin: '0 auto' }}>
        {FEATURES.map((f, i) => (
          <div key={i}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = f.color + '44'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.035)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.025)'; }}
            style={{ padding: '24px 26px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, cursor: 'default', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 20 }}>{f.icon}</span>
              <span style={{ padding: '2px 9px', background: f.color + '18', border: `1px solid ${f.color}33`, borderRadius: 20, fontSize: 10, color: f.color, fontWeight: 700 }}>{f.badge}</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: '#E2E8F0' }}>{f.title}</div>
            <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AgentShowcase() {
  const ALL = ['DebtChaser','ReputationGuard','CompetitorWatch','LeadNurturer','GhostWriter','BusinessMentor','CloneAgent','Negotiator','Watchdog','Connector','LawBot','MenuGenius','AgencyOps','TradesManager','ContentEngine','InboxZero','SEOEngine','ReviewRequester','InvoiceChaser','OnboardingBot','ContractDrafter','SocialScheduler','CashFlowBot','HiringAssistant','CustomerSuccess','RefundHandler','UpsellBot','ChurnPredictor'];
  const [search, setSearch] = useState('');
  const shown = search ? ALL.filter(a => a.toLowerCase().includes(search.toLowerCase())) : ALL;
  return (
    <section id="agents" style={{ padding: '96px 5%' }}>
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: -1, margin: '0 0 14px' }}>30+ agents, ready to hire</h2>
        <p style={{ color: '#64748B', fontSize: 15, marginBottom: 24 }}>Specialists for every business function</p>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents..." style={{ padding: '10px 16px', background: '#0D1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 13, color: '#E2E8F0', outline: 'none', width: 240 }} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 900, margin: '0 auto' }}>
        {shown.map((a, i) => (
          <span key={i}
            onMouseEnter={e => { (e.currentTarget as HTMLSpanElement).style.background = 'rgba(124,58,237,0.12)'; (e.currentTarget as HTMLSpanElement).style.borderColor = 'rgba(124,58,237,0.35)'; (e.currentTarget as HTMLSpanElement).style.color = '#A78BFA'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLSpanElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLSpanElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLSpanElement).style.color = '#94A3B8'; }}
            style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, fontSize: 12, color: '#94A3B8', cursor: 'pointer', transition: 'all 0.15s' }}>
            {a}
          </span>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  const [annual, setAnnual] = useState(false);
  return (
    <section id="pricing" style={{ padding: '96px 5%', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: -1, margin: '0 0 20px' }}>Simple, transparent pricing</h2>
        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 4, gap: 4 }}>
          {['Monthly', 'Annual'].map(l => (
            <button key={l} onClick={() => setAnnual(l === 'Annual')} style={{ padding: '8px 20px', background: (l === 'Annual') === annual ? '#7C3AED' : 'transparent', border: 'none', borderRadius: 7, color: (l === 'Annual') === annual ? '#fff' : '#64748B', fontSize: 13, cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>
              {l}{l === 'Annual' && <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.7 }}>–20%</span>}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20, maxWidth: 920, margin: '0 auto' }}>
        {PLANS.map((p, i) => (
          <div key={i} style={{ padding: 30, background: p.popular ? 'rgba(124,58,237,0.06)' : 'rgba(255,255,255,0.025)', border: `1px solid ${p.popular ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 16, position: 'relative', transition: 'transform 0.2s' }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'}>
            {p.popular && <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: '#7C3AED', borderRadius: 20, padding: '2px 14px', fontSize: 10, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', letterSpacing: 0.5 }}>MOST POPULAR</div>}
            <div style={{ fontSize: 15, fontWeight: 700, color: '#E2E8F0', marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: '#475569', marginBottom: 16 }}>{p.desc}</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: p.color, lineHeight: 1, marginBottom: 4 }}>${annual ? p.annual : p.price}</div>
            <div style={{ fontSize: 12, color: '#374151', marginBottom: 24 }}>/month{annual ? ', billed annually' : ''}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
              {p.features.map((f, j) => (
                <div key={j} style={{ fontSize: 13, color: '#94A3B8', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: p.color, flexShrink: 0, marginTop: 1 }}>✓</span>{f}
                </div>
              ))}
            </div>
            <a href={`${APP}/register`} style={{ display: 'block', textAlign: 'center', padding: '11px 0', background: p.popular ? '#7C3AED' : 'rgba(255,255,255,0.06)', border: p.popular ? 'none' : '1px solid rgba(255,255,255,0.1)', borderRadius: 9, fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none', transition: 'opacity 0.15s' }}>Get started</a>
          </div>
        ))}
      </div>
    </section>
  );
}

// ──────────────────── MAIN PAGE ────────────────────
export default function LandingPage() {
  return (
    <div style={{ background: '#090B16', color: '#E2E8F0', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; }
        a { color: inherit; text-decoration: none; }
        textarea::placeholder { color: #475569; }
        input::placeholder { color: #475569; }
        input:focus { border-color: rgba(124,58,237,0.5) !important; outline: none; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @media (max-width:768px) { .nav-links { display:none !important; } .grid-2col { grid-template-columns:1fr !important; } }
        ::selection { background: rgba(124,58,237,0.3); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #090B16; }
        ::-webkit-scrollbar-thumb { background: #1E2235; border-radius: 3px; }
      `}</style>

      <DotGrid />
      <ScrollNav />

      {/* ── HERO ── */}
      <section style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 5% 80px', textAlign: 'center' }}>
        {/* badge */}
        <a href={`${APP}/register`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px 5px 6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 99, fontSize: 12, color: '#94A3B8', marginBottom: 32, textDecoration: 'none', animation: 'fadeIn 0.6s ease' }}>
          <span style={{ padding: '2px 8px', background: '#7C3AED', borderRadius: 99, fontSize: 10, color: '#fff', fontWeight: 700, letterSpacing: 0.5 }}>NEW</span>
          Autonomy OS — agents run overnight while you sleep
          <span style={{ color: '#64748B' }}>→</span>
        </a>

        {/* headline */}
        <h1 style={{ fontSize: 'clamp(42px,7vw,88px)', fontWeight: 900, letterSpacing: -3, lineHeight: 1.0, maxWidth: 900, marginBottom: 24, animation: 'fadeIn 0.6s 0.1s ease both' }}>
          Your AI team,<br/>
          <span style={{ background: 'linear-gradient(135deg,#A78BFA 0%,#7C3AED 50%,#F97316 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>always on.</span>
        </h1>

        <p style={{ fontSize: 18, color: '#64748B', maxWidth: 520, margin: '0 auto 52px', lineHeight: 1.7, animation: 'fadeIn 0.6s 0.2s ease both' }}>
          ForgeOS is the AI operating system for small business. 30+ agents run sales, ops, legal, and marketing — you approve in one tap.
        </p>

        {/* interactive prompt box */}
        <div style={{ width: '100%', animation: 'fadeIn 0.6s 0.3s ease both' }}>
          <HeroPrompt />
        </div>

        {/* stats row */}
        <div style={{ display: 'flex', gap: 48, marginTop: 52, animation: 'fadeIn 0.6s 0.4s ease both', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[['30+', 'AI Agents'], ['6k+', 'Data Endpoints'], ['90s', 'Setup Time'], ['100%', 'BYOK — no markup']].map(([n, l], i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#7C3AED', lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: 12, color: '#374151', marginTop: 5 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* live agent ticker */}
        <AgentTicker />
      </section>

      {/* ── MODULE EXPLORER ── */}
      <ModuleExplorer />

      {/* ── FEATURES GRID ── */}
      <Features />

      {/* ── AGENT SHOWCASE ── */}
      <AgentShowcase />

      {/* ── PRICING ── */}
      <Pricing />

      {/* ── CTA ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '100px 5%', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(124,58,237,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontSize: 'clamp(32px,5vw,64px)', fontWeight: 900, letterSpacing: -2, marginBottom: 18 }}>Your AI team is waiting.</h2>
          <p style={{ color: '#64748B', fontSize: 17, marginBottom: 36 }}>Spin up your ForgeOS workspace free — no credit card required.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={`${APP}/register`} style={{ padding: '14px 36px', background: '#7C3AED', borderRadius: 10, fontSize: 16, fontWeight: 700, color: '#fff', textDecoration: 'none', boxShadow: '0 0 40px rgba(124,58,237,0.4)' }}>Start free today</a>
            <a href={`${APP}/login`} style={{ padding: '14px 36px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 16, color: '#94A3B8', textDecoration: 'none' }}>Log in →</a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '32px 5%', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg,#7C3AED,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>⚡</div>
          <span style={{ fontSize: 16, fontWeight: 800 }}>Forge<span style={{ color: '#7C3AED' }}>OS</span></span>
        </div>
        <div style={{ fontSize: 12, color: '#1E293B' }}>© 2026 Forge. All rights reserved.</div>
        <div style={{ display: 'flex', gap: 20, fontSize: 12 }}>
          {['Privacy', 'Terms', 'Status'].map(l => (
            <a key={l} href="#" style={{ color: '#334155', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = '#64748B')} onMouseLeave={e => (e.currentTarget.style.color = '#334155')}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
