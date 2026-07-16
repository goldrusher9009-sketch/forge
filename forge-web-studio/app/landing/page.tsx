'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';

// ── Forge Landing v5 — Interactive + Animated Explainer ──

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

const LIVE_FEED = [
  { agent: 'DebtChaser', icon: '💸', action: 'Sent reminder to Apex Co — $4,200 overdue', color: '#7C3AED', time: '2s ago' },
  { agent: 'ContentEngine', icon: '✍️', action: 'Published Monday LinkedIn post — 847 views', color: '#10B981', time: '14s ago' },
  { agent: 'LeadNurturer', icon: '📧', action: 'Follow-up sent to 6 warm leads', color: '#F97316', time: '31s ago' },
  { agent: 'CompetitorWatch', icon: '🔍', action: 'Flagged: Rival dropped price by 15%', color: '#EF4444', time: '1m ago' },
  { agent: 'LawBot', icon: '⚖️', action: 'Contract review complete — 2 risks flagged', color: '#7C3AED', time: '2m ago' },
  { agent: 'SEOEngine', icon: '📈', action: '3 keyword gaps vs competitor identified', color: '#10B981', time: '4m ago' },
  { agent: 'CashFlowBot', icon: '💰', action: 'Q3 projection updated — on track', color: '#0EA5E9', time: '6m ago' },
  { agent: 'InvoiceChaser', icon: '🧾', action: 'Henley Corp paid — $8,500 received', color: '#10B981', time: '9m ago' },
];

const MODULES = [
  { icon: '🤖', tag: 'CORE', title: 'Agent Hub', desc: '30+ specialized agents for every business function. Hire in one click, approve outputs in batch.', color: '#7C3AED' },
  { icon: '💸', tag: 'GROWTH', title: 'Revenue Loop', desc: 'Cold lead → outreach → meeting → invoice → closed. Fully autonomous 8-stage pipeline.', color: '#F97316' },
  { icon: '🌅', tag: 'CONTROL', title: 'Morning Brief', desc: 'Wake to a summary of overnight work. Approve everything in one tap — no digging required.', color: '#10B981' },
  { icon: '🧠', tag: 'MEMORY', title: 'Forge Brain', desc: 'Persistent memory across every agent and session. Learns your business voice over time.', color: '#EC4899' },
  { icon: '✨', tag: 'CREATE', title: 'Content Multiplier', desc: 'One idea → 8 platform-optimized pieces for Twitter, LinkedIn, email, TikTok and more.', color: '#0EA5E9' },
  { icon: '🏷️', tag: 'AGENCY', title: 'White-Label', desc: 'Run ForgeOS under your own brand. Sell to clients at $800–$10k/month per seat.', color: '#F59E0B' },
];

const FEATURES = [
  { icon: '⚡', badge: 'BYOK', color: '#7C3AED', title: 'Bring Your Own Keys', desc: 'Connect Anthropic, OpenAI, or Gemini keys. Zero markup — you pay providers at cost.' },
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

const EXPLAINER_STEPS = [
  { icon: '🔑', title: 'Connect your keys', desc: 'Add your Anthropic or OpenAI API key. ForgeOS routes every request to the cheapest capable model — you pay zero markup.', color: '#7C3AED', demo: 'API_KEY_DEMO' },
  { icon: '🤖', title: 'Hire your first agent', desc: 'Choose from 30+ specialists. DebtChaser, ContentEngine, LeadNurturer — each is a complete autonomous workflow, not just a chatbot.', color: '#F97316', demo: 'AGENT_DEMO' },
  { icon: '📋', title: 'Approve in one tap', desc: 'Agents work while you sleep. Wake up to a Morning Brief — a ranked list of completed actions and decisions waiting for your approval.', color: '#10B981', demo: 'BRIEF_DEMO' },
  { icon: '📈', title: 'Watch revenue grow', desc: 'The Revenue Loop pipeline runs 24/7. Cold leads enter one end — closed deals and paid invoices come out the other.', color: '#0EA5E9', demo: 'REVENUE_DEMO' },
];

// ── Hooks ──

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useCounter(target: number, duration = 1800, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [target, duration, active]);
  return count;
}

function useTypewriter(words: string[], speed = 60, pause = 1800) {
  const [display, setDisplay] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const word = words[wordIdx];
    const timeout = setTimeout(() => {
      if (!deleting) {
        if (charIdx < word.length) { setDisplay(word.slice(0, charIdx + 1)); setCharIdx(c => c + 1); }
        else { setTimeout(() => setDeleting(true), pause); }
      } else {
        if (charIdx > 0) { setDisplay(word.slice(0, charIdx - 1)); setCharIdx(c => c - 1); }
        else { setDeleting(false); setWordIdx(i => (i + 1) % words.length); }
      }
    }, deleting ? speed / 2 : speed);
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, wordIdx, words, speed, pause]);
  return display;
}

// ── Components ──

function DotGrid() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.055) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.28) 0%, transparent 55%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 50% 120%, rgba(124,58,237,0.12) 0%, transparent 55%)' }} />
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
    <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 5%', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.3s', background: scrolled ? 'rgba(9,11,22,0.9)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#7C3AED,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚡</div>
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>Forge<span style={{ color: '#7C3AED' }}>OS</span></span>
      </div>
      <nav style={{ display: 'flex', gap: 28, fontSize: 13, color: '#94A3B8' }}>
        {[['How it works', '#how-it-works'], ['Agents', '#agents'], ['Features', '#features'], ['Pricing', '#pricing']].map(([l, h]) => (
          <a key={l} href={h} style={{ textDecoration: 'none', color: '#94A3B8', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = '#E2E8F0')} onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}>{l}</a>
        ))}
      </nav>
      <div style={{ display: 'flex', gap: 8 }}>
        <a href="/login" style={{ padding: '7px 16px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 13, color: '#CBD5E1', textDecoration: 'none' }}>Log in</a>
        <a href="/register" style={{ padding: '7px 16px', background: '#7C3AED', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', textDecoration: 'none', boxShadow: '0 0 24px rgba(124,58,237,0.4)' }}>Start free →</a>
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
      <div style={{ display: 'flex', gap: 0, marginBottom: -1, paddingLeft: 8 }}>
        {PROMPT_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 16px', background: tab === t.id ? '#111828' : 'rgba(255,255,255,0.025)', border: '1px solid', borderColor: tab === t.id ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)', borderBottom: tab === t.id ? '1px solid #111828' : '1px solid rgba(255,255,255,0.06)', borderRadius: '8px 8px 0 0', fontSize: 12, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? '#E2E8F0' : '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
      <div style={{ background: '#111828', border: `1px solid ${focused ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.12)'}`, borderRadius: '0 12px 12px 12px', padding: '16px 18px', transition: 'border-color 0.2s', boxShadow: focused ? '0 0 0 3px rgba(124,58,237,0.12), 0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.4)' }}>
        <textarea value={input} onChange={e => setInput(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={tabData.placeholder} rows={3} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: 15, color: '#E2E8F0', lineHeight: 1.6, fontFamily: 'inherit', caretColor: '#7C3AED' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {examples.slice(0, 2).map((ex, i) => (
              <button key={i} onClick={() => setInput(ex)} style={{ padding: '3px 10px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 20, fontSize: 11, color: '#A78BFA', cursor: 'pointer' }}>{ex}</button>
            ))}
          </div>
          <a href="/register" style={{ padding: '9px 20px', background: '#7C3AED', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>Run {tabData.icon} →</a>
        </div>
      </div>
    </div>
  );
}

function LiveFeed() {
  const [items, setItems] = useState(LIVE_FEED.slice(0, 4));
  const [animIdx, setAnimIdx] = useState(-1);
  useEffect(() => {
    const t = setInterval(() => {
      setAnimIdx(0);
      setItems(prev => {
        const next = [...LIVE_FEED];
        const rotated = [next[(Math.floor(Math.random() * next.length))], ...prev.slice(0, 3)];
        return rotated;
      });
      setTimeout(() => setAnimIdx(-1), 600);
    }, 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ marginTop: 52, width: '100%', maxWidth: 740, margin: '52px auto 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, justifyContent: 'center' }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981', animation: 'pulse 2s infinite' }} />
        <span style={{ fontSize: 11, color: '#475569', letterSpacing: 0.8, fontWeight: 700 }}>LIVE AGENT ACTIVITY</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => (
          <div key={`${item.agent}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: i === 0 && animIdx === 0 ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.025)', border: `1px solid ${i === 0 && animIdx === 0 ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 10, transition: 'all 0.4s', transform: i === 0 && animIdx === 0 ? 'translateY(-2px)' : 'none' }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: item.color }}>{item.agent}</span>
              <span style={{ fontSize: 12, color: '#64748B', marginLeft: 8 }}>{item.action}</span>
            </div>
            <span style={{ fontSize: 10, color: '#374151', flexShrink: 0 }}>{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnimatedStats() {
  const { ref, inView } = useInView();
  const a = useCounter(30, 1600, inView);
  const b = useCounter(6000, 1800, inView);
  const c = useCounter(90, 1400, inView);
  const d = useCounter(100, 1200, inView);
  return (
    <div ref={ref} style={{ display: 'flex', gap: 48, marginTop: 52, flexWrap: 'wrap', justifyContent: 'center' }}>
      {[[`${a}+`, 'AI Agents'], [`${b.toLocaleString()}+`, 'Data Endpoints'], [`${c}s`, 'Setup Time'], [`${d}%`, 'BYOK — no markup']].map(([n, l], i) => (
        <div key={i} style={{ textAlign: 'center', opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(10px)', transition: `opacity 0.5s ${i * 0.1}s, transform 0.5s ${i * 0.1}s` }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#7C3AED', lineHeight: 1 }}>{n}</div>
          <div style={{ fontSize: 12, color: '#374151', marginTop: 5 }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

function ExplainerVideo() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<any>(null);
  const { ref, inView } = useInView(0.2);

  const STEP_DURATION = 4000;

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            setStep(s => {
              const next = (s + 1) % EXPLAINER_STEPS.length;
              if (next === 0) setPlaying(false);
              return next;
            });
            return 0;
          }
          return p + (100 / (STEP_DURATION / 50));
        });
      }, 50);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing]);

  const current = EXPLAINER_STEPS[step];

  const DemoContent = () => {
    if (current.demo === 'API_KEY_DEMO') return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 11, color: '#475569', marginBottom: 12, fontWeight: 700, letterSpacing: 0.8 }}>CONNECT YOUR AI KEYS</div>
        {[['Anthropic (Claude)', '#7C3AED', '✓'], ['OpenAI (GPT-4)', '#10B981', '✓'], ['Gemini Pro', '#64748B', '+']].map(([name, color, status]) => (
          <div key={name as string} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color as string }} />
              <span style={{ fontSize: 13, color: '#CBD5E1' }}>{name}</span>
            </div>
            <span style={{ fontSize: 13, color: color as string, fontWeight: 700 }}>{status}</span>
          </div>
        ))}
        <div style={{ marginTop: 14, padding: '8px 14px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 8, fontSize: 11, color: '#A78BFA' }}>⚡ Auto-routing to cheapest model per request</div>
      </div>
    );
    if (current.demo === 'AGENT_DEMO') return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 11, color: '#475569', marginBottom: 12, fontWeight: 700, letterSpacing: 0.8 }}>AGENT MARKETPLACE</div>
        {[['💸', 'DebtChaser', 'Finance', '#F97316'], ['✍️', 'ContentEngine', 'Marketing', '#7C3AED'], ['📧', 'LeadNurturer', 'Sales', '#10B981']].map(([icon, name, cat, color]) => (
          <div key={name as string} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 13, color: '#CBD5E1', fontWeight: 600 }}>{name}</div>
                <div style={{ fontSize: 10, color: '#475569' }}>{cat}</div>
              </div>
            </div>
            <button style={{ padding: '4px 12px', background: color as string, border: 'none', borderRadius: 6, fontSize: 11, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Hire</button>
          </div>
        ))}
      </div>
    );
    if (current.demo === 'BRIEF_DEMO') return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0', marginBottom: 4 }}>🌅 Good morning, Scott</div>
        <div style={{ fontSize: 11, color: '#475569', marginBottom: 16 }}>Your agents completed 12 tasks overnight</div>
        {[['💸 DebtChaser', '$8,200 chased, 2 responded', '#10B981'], ['✍️ ContentEngine', '3 posts drafted, ready to publish', '#7C3AED'], ['📧 LeadNurturer', '6 warm leads need follow-up', '#F97316']].map(([agent, result, color]) => (
          <div key={agent as string} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}22`, borderRadius: 8, marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 12, color: '#CBD5E1', fontWeight: 600 }}>{agent}</div>
              <div style={{ fontSize: 11, color: '#475569' }}>{result}</div>
            </div>
            <button style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 10, color: '#94A3B8', cursor: 'pointer' }}>✓ Approve</button>
          </div>
        ))}
      </div>
    );
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 11, color: '#475569', marginBottom: 16, fontWeight: 700, letterSpacing: 0.8 }}>REVENUE LOOP — LIVE</div>
        {[['Lead captured', '$0', '#7C3AED', 100], ['Outreach sent', '$0', '#7C3AED', 100], ['Meeting booked', '$0', '#F97316', 80], ['Proposal sent', '$0', '#F97316', 65], ['Invoice issued', '$4,200', '#10B981', 40], ['Payment received', '$4,200', '#10B981', 20]].map(([stage, val, color, pct]) => (
          <div key={stage as string} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: '#475569', width: 110, flexShrink: 0 }}>{stage}</div>
            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: color as string, borderRadius: 3, transition: 'width 1s' }} />
            </div>
            <div style={{ fontSize: 11, color: val !== '$0' ? '#10B981' : '#374151', width: 52, textAlign: 'right', fontWeight: val !== '$0' ? 700 : 400 }}>{val}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section id="how-it-works" ref={ref} style={{ padding: '96px 5%', position: 'relative', zIndex: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: 52, opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(20px)', transition: 'all 0.6s' }}>
        <div style={{ display: 'inline-block', padding: '3px 14px', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, fontSize: 11, color: '#A78BFA', letterSpacing: 1, fontWeight: 700, marginBottom: 16 }}>HOW IT WORKS</div>
        <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: -1, margin: '0 0 14px' }}>From zero to autonomous<br/>in four steps</h2>
        <p style={{ color: '#64748B', fontSize: 15 }}>Watch the explainer — or click any step</p>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 32, alignItems: 'start', opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(30px)', transition: 'all 0.7s 0.1s' }}>
        {/* Step selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {EXPLAINER_STEPS.map((s, i) => (
            <button key={i} onClick={() => { setStep(i); setProgress(0); setPlaying(false); }} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 18px', background: step === i ? `${s.color}10` : 'rgba(255,255,255,0.02)', border: `1px solid ${step === i ? s.color + '44' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: step === i ? s.color : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, transition: 'all 0.2s' }}>{s.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: step === i ? s.color : '#374151' }}>STEP {i + 1}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: step === i ? '#E2E8F0' : '#64748B', marginBottom: 4 }}>{s.title}</div>
                {step === i && <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>{s.desc}</div>}
                {step === i && (
                  <div style={{ marginTop: 8, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: s.color, borderRadius: 2, transition: 'width 0.05s linear' }} />
                  </div>
                )}
              </div>
            </button>
          ))}

          {/* Play button */}
          <button onClick={() => { setStep(0); setProgress(0); setPlaying(p => !p); }} style={{ marginTop: 8, padding: '11px 0', background: playing ? 'rgba(239,68,68,0.1)' : 'rgba(124,58,237,0.12)', border: `1px solid ${playing ? 'rgba(239,68,68,0.3)' : 'rgba(124,58,237,0.3)'}`, borderRadius: 10, fontSize: 13, fontWeight: 700, color: playing ? '#EF4444' : '#A78BFA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
            {playing ? '⏸ Pause' : '▶ Play explainer'} {!playing && <span style={{ fontSize: 11, opacity: 0.6 }}>~16s</span>}
          </button>
        </div>

        {/* Demo window */}
        <div style={{ background: '#0D1120', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden', position: 'sticky', top: 80 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
            <span style={{ marginLeft: 8, fontSize: 11, color: '#374151' }}>forge.app — {current.title.toLowerCase()}</span>
            <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: current.color, boxShadow: `0 0 6px ${current.color}`, animation: 'pulse 1.5s infinite' }} />
          </div>
          <DemoContent />
          <div style={{ padding: '0 24px 20px', display: 'flex', gap: 8 }}>
            {EXPLAINER_STEPS.map((_, i) => (
              <div key={i} onClick={() => { setStep(i); setProgress(0); setPlaying(false); }} style={{ flex: 1, height: 3, background: i === step ? current.color : i < step ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', borderRadius: 2, cursor: 'pointer', transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FadeSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateY(28px)', transition: `opacity 0.6s ${delay}s, transform 0.6s ${delay}s` }}>
      {children}
    </div>
  );
}

function ModuleExplorer() {
  const [active, setActive] = useState(0);
  const mod = MODULES[active];
  return (
    <FadeSection>
      <section style={{ padding: '96px 5%', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ display: 'inline-block', padding: '3px 14px', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, fontSize: 11, color: '#A78BFA', letterSpacing: 1, fontWeight: 700, marginBottom: 16 }}>THE PLATFORM</div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: -1, margin: '0 0 14px' }}>Six systems. One OS.</h2>
          <p style={{ color: '#64748B', fontSize: 15 }}>Every module is an autonomous workflow — click to explore</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24, maxWidth: 1100, margin: '0 auto', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {MODULES.map((m, i) => (
              <button key={i} onClick={() => setActive(i)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: active === i ? `${m.color}10` : 'rgba(255,255,255,0.02)', border: `1px solid ${active === i ? m.color + '44' : 'rgba(255,255,255,0.06)'}`, borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s' }}>
                <span style={{ fontSize: 20 }}>{m.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: active === i ? '#E2E8F0' : '#94A3B8', marginBottom: 2 }}>{m.title}</div>
                  <div style={{ fontSize: 10, color: active === i ? m.color : '#374151', fontWeight: 700, letterSpacing: 0.8 }}>{m.tag}</div>
                </div>
                {active === i && <span style={{ color: m.color }}>→</span>}
              </button>
            ))}
          </div>
          <div style={{ background: '#0D1120', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden', position: 'sticky', top: 80, transition: 'all 0.3s' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} /><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} /><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
              <span style={{ marginLeft: 8, fontSize: 11, color: '#374151' }}>forge.app — {mod.title.toLowerCase()}</span>
            </div>
            <div style={{ aspectRatio: '16/10', background: `linear-gradient(135deg,#0D1120 0%,${mod.color}08 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, position: 'relative' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${mod.color}18`, border: `1px solid ${mod.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: `0 0 30px ${mod.color}20` }}>{mod.icon}</div>
              <div style={{ fontSize: 13, color: '#475569' }}>{mod.title}</div>
              <div style={{ position: 'absolute', bottom: 14, right: 14, padding: '4px 10px', background: `${mod.color}18`, border: `1px solid ${mod.color}33`, borderRadius: 20, fontSize: 10, color: mod.color, fontWeight: 700 }}>{mod.tag}</div>
            </div>
            <div style={{ padding: '20px 24px 24px' }}>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: '#E2E8F0' }}>{mod.icon} {mod.title}</div>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.75, marginBottom: 18 }}>{mod.desc}</p>
              <a href="/register" style={{ display: 'inline-block', padding: '9px 20px', background: mod.color, borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', textDecoration: 'none' }}>Try {mod.title} →</a>
            </div>
          </div>
        </div>
      </section>
    </FadeSection>
  );
}

function Features() {
  return (
    <FadeSection>
      <section id="features" style={{ padding: '96px 5%', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ display: 'inline-block', padding: '3px 14px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 20, fontSize: 11, color: '#FB923C', letterSpacing: 1, fontWeight: 700, marginBottom: 16 }}>FEATURES</div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: -1, margin: '0 0 14px' }}>Everything your business needs</h2>
          <p style={{ color: '#64748B', fontSize: 15 }}>One OS. All the tools. No per-seat pricing.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, maxWidth: 1100, margin: '0 auto' }}>
          {FEATURES.map((f, i) => (
            <div key={i} onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = f.color + '44'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.035)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; }} onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.025)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }} style={{ padding: '24px 26px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, cursor: 'default', transition: 'all 0.2s' }}>
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
    </FadeSection>
  );
}

function AgentShowcase() {
  const ALL = ['DebtChaser','ReputationGuard','CompetitorWatch','LeadNurturer','GhostWriter','BusinessMentor','CloneAgent','Negotiator','Watchdog','Connector','LawBot','MenuGenius','AgencyOps','TradesManager','ContentEngine','InboxZero','SEOEngine','ReviewRequester','InvoiceChaser','OnboardingBot','ContractDrafter','SocialScheduler','CashFlowBot','HiringAssistant','CustomerSuccess','RefundHandler','UpsellBot','ChurnPredictor'];
  const [search, setSearch] = useState('');
  const [hovered, setHovered] = useState<number | null>(null);
  const shown = search ? ALL.filter(a => a.toLowerCase().includes(search.toLowerCase())) : ALL;
  return (
    <FadeSection>
      <section id="agents" style={{ padding: '96px 5%', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: -1, margin: '0 0 14px' }}>30+ agents, ready to hire</h2>
          <p style={{ color: '#64748B', fontSize: 15, marginBottom: 24 }}>Specialists for every business function</p>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents..." style={{ padding: '10px 16px', background: '#0D1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 13, color: '#E2E8F0', outline: 'none', width: 240 }} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 900, margin: '0 auto' }}>
          {shown.map((a, i) => (
            <span key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ padding: '7px 16px', background: hovered === i ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${hovered === i ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 20, fontSize: 12, color: hovered === i ? '#A78BFA' : '#94A3B8', cursor: 'pointer', transition: 'all 0.15s', transform: hovered === i ? 'scale(1.05)' : 'scale(1)' }}>{a}</span>
          ))}
        </div>
      </section>
    </FadeSection>
  );
}

function Pricing() {
  const [annual, setAnnual] = useState(false);
  return (
    <FadeSection>
      <section id="pricing" style={{ padding: '96px 5%', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 }}>
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
            <div key={i} onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-5px)'} onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'} style={{ padding: 30, background: p.popular ? 'rgba(124,58,237,0.06)' : 'rgba(255,255,255,0.025)', border: `1px solid ${p.popular ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 16, position: 'relative', transition: 'transform 0.2s' }}>
              {p.popular && <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: '#7C3AED', borderRadius: 20, padding: '2px 14px', fontSize: 10, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', letterSpacing: 0.5 }}>MOST POPULAR</div>}
              <div style={{ fontSize: 15, fontWeight: 700, color: '#E2E8F0', marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: '#475569', marginBottom: 16 }}>{p.desc}</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: p.color, lineHeight: 1, marginBottom: 4 }}>${annual ? p.annual : p.price}</div>
              <div style={{ fontSize: 12, color: '#374151', marginBottom: 24 }}>/month{annual ? ', billed annually' : ''}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
                {p.features.map((f, j) => (
                  <div key={j} style={{ fontSize: 13, color: '#94A3B8', display: 'flex', gap: 8 }}><span style={{ color: p.color, flexShrink: 0 }}>✓</span>{f}</div>
                ))}
              </div>
              <a href="/register" style={{ display: 'block', textAlign: 'center', padding: '11px 0', background: p.popular ? '#7C3AED' : 'rgba(255,255,255,0.06)', border: p.popular ? 'none' : '1px solid rgba(255,255,255,0.1)', borderRadius: 9, fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none' }}>Get started</a>
            </div>
          ))}
        </div>
      </section>
    </FadeSection>
  );
}

// ── MAIN ──
export default function LandingPage() {
  const typed = useTypewriter(['your sales team', 'your legal team', 'your finance team', 'your marketing team', 'your ops team'], 55, 2200);

  return (
    <div style={{ background: '#090B16', color: '#E2E8F0', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; }
        a { color: inherit; text-decoration: none; }
        textarea::placeholder { color: #475569; }
        input::placeholder { color: #475569; }
        input:focus { border-color: rgba(124,58,237,0.5) !important; outline: none; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        ::selection { background: rgba(124,58,237,0.3); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #090B16; }
        ::-webkit-scrollbar-thumb { background: #1E2235; border-radius: 3px; }
        html { scroll-behavior: smooth; }
      `}</style>

      <DotGrid />
      <ScrollNav />

      {/* ── HERO ── */}
      <section style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 5% 60px', textAlign: 'center' }}>
        <a href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px 5px 6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 99, fontSize: 12, color: '#94A3B8', marginBottom: 32, animation: 'fadeUp 0.6s ease both' }}>
          <span style={{ padding: '2px 8px', background: '#7C3AED', borderRadius: 99, fontSize: 10, color: '#fff', fontWeight: 700 }}>NEW</span>
          Autonomy OS — agents run overnight while you sleep →
        </a>

        <h1 style={{ fontSize: 'clamp(42px,7vw,88px)', fontWeight: 900, letterSpacing: -3, lineHeight: 1.0, maxWidth: 900, marginBottom: 24, animation: 'fadeUp 0.6s 0.1s ease both' }}>
          AI that replaces<br />
          <span style={{ background: 'linear-gradient(135deg,#A78BFA 0%,#7C3AED 50%,#F97316 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {typed}<span style={{ animation: 'blink 1s infinite', WebkitTextFillColor: '#7C3AED' }}>|</span>
          </span>
        </h1>

        <p style={{ fontSize: 18, color: '#64748B', maxWidth: 520, margin: '0 auto 52px', lineHeight: 1.7, animation: 'fadeUp 0.6s 0.2s ease both' }}>
          ForgeOS is the AI operating system for small business. 30+ agents run sales, ops, legal, and marketing — you approve in one tap.
        </p>

        <div style={{ width: '100%', animation: 'fadeUp 0.6s 0.3s ease both' }}>
          <HeroPrompt />
        </div>

        <AnimatedStats />
        <LiveFeed />
      </section>

      {/* ── EXPLAINER / HOW IT WORKS ── */}
      <ExplainerVideo />

      {/* ── MODULE EXPLORER ── */}
      <ModuleExplorer />

      {/* ── FEATURES ── */}
      <Features />

      {/* ── AGENTS ── */}
      <AgentShowcase />

      {/* ── PRICING ── */}
      <Pricing />

      {/* ── CTA ── */}
      <FadeSection>
        <section style={{ position: 'relative', zIndex: 1, padding: '100px 5%', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(124,58,237,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <h2 style={{ fontSize: 'clamp(32px,5vw,64px)', fontWeight: 900, letterSpacing: -2, marginBottom: 18 }}>Your AI team is waiting.</h2>
            <p style={{ color: '#64748B', fontSize: 17, marginBottom: 36 }}>Spin up your ForgeOS workspace free — no credit card required.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/register" style={{ padding: '14px 36px', background: '#7C3AED', borderRadius: 10, fontSize: 16, fontWeight: 700, color: '#fff', textDecoration: 'none', boxShadow: '0 0 40px rgba(124,58,237,0.4)', transition: 'transform 0.2s' }} onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')} onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>Start free today</a>
              <a href="/login" style={{ padding: '14px 36px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 16, color: '#94A3B8', textDecoration: 'none' }}>Log in →</a>
            </div>
          </div>
        </section>
      </FadeSection>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '32px 5%', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg,#7C3AED,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>⚡</div>
          <span style={{ fontSize: 16, fontWeight: 800 }}>Forge<span style={{ color: '#7C3AED' }}>OS</span></span>
        </div>
        <div style={{ fontSize: 12, color: '#1E293B' }}>© 2026 Forge. All rights reserved.</div>
        <div style={{ display: 'flex', gap: 20, fontSize: 12 }}>
          {['Privacy', 'Terms', 'Status'].map(l => (
            <a key={l} href="#" style={{ color: '#334155' }} onMouseEnter={e => (e.currentTarget.style.color = '#64748B')} onMouseLeave={e => (e.currentTarget.style.color = '#334155')}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
