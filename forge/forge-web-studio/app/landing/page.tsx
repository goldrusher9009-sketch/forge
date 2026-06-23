'use client';
import React, { useState, useEffect, useRef } from 'react';
// FORGE_LANDING_V3 — rebuilt 2026-06-23: interactive step-by-step explainer + features grid

const APP_URL = 'https://forge-sand-two.vercel.app';

function NeuralCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    type P = { x: number; y: number; z: number; vx: number; vy: number };
    let pts: P[] = [];
    const COUNT = 70;
    let mx = 0.5, my = 0.5;
    function resize() {
      w = canvas!.clientWidth; h = canvas!.clientHeight;
      canvas!.width = w * dpr; canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed() {
      pts = Array.from({ length: COUNT }, () => ({
        x: Math.random() * w, y: Math.random() * h, z: Math.random(),
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      }));
    }
    const onMove = (e: MouseEvent) => { mx = e.clientX / window.innerWidth; my = e.clientY / window.innerHeight; };
    const onResize = () => { resize(); seed(); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', onResize);
    function frame() {
      ctx!.clearRect(0, 0, w, h);
      const horizon = h * 0.62;
      ctx!.strokeStyle = 'rgba(255,31,53,0.05)';
      ctx!.lineWidth = 1;
      for (let i = 0; i < 14; i++) {
        const t = i / 14;
        const y = horizon + t * t * (h - horizon);
        ctx!.beginPath(); ctx!.moveTo(0, y); ctx!.lineTo(w, y); ctx!.stroke();
      }
      for (let i = -10; i <= 10; i++) {
        const vx = w / 2 + i * (w / 8) * 0.2;
        ctx!.beginPath(); ctx!.moveTo(w / 2 + i * 6, horizon); ctx!.lineTo(vx, h); ctx!.stroke();
      }
      const par = (mx - 0.5) * 30, par2 = (my - 0.5) * 20;
      for (const p of pts) {
        p.x += p.vx + par * 0.01 * p.z; p.y += p.vy + par2 * 0.01 * p.z;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.hypot(dx, dy);
          if (d < 130) {
            ctx!.strokeStyle = `rgba(255,80,100,${(1 - d / 130) * 0.18})`;
            ctx!.beginPath(); ctx!.moveTo(pts[i].x, pts[i].y); ctx!.lineTo(pts[j].x, pts[j].y); ctx!.stroke();
          }
        }
      }
      for (const p of pts) {
        const r = 1 + p.z * 2;
        ctx!.fillStyle = `rgba(255,${100 + p.z * 100},${110 + p.z * 60},${0.4 + p.z * 0.5})`;
        ctx!.beginPath(); ctx!.arc(p.x, p.y, r, 0, Math.PI * 2); ctx!.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    resize(); seed(); frame();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
    };
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

function TypewriterText() {
  const PHRASES = [
    'Run your business on autopilot.',
    'Your AI team, always on.',
    'From idea to revenue in minutes.',
    'The operating system for modern business.',
  ];
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const phrase = PHRASES[idx];
    if (!deleting && displayed.length < phrase.length) {
      const t = setTimeout(() => setDisplayed(phrase.slice(0, displayed.length + 1)), 45); return () => clearTimeout(t);
    }
    if (!deleting && displayed.length === phrase.length) {
      const t = setTimeout(() => setDeleting(true), 2200); return () => clearTimeout(t);
    }
    if (deleting && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 22); return () => clearTimeout(t);
    }
    if (deleting && displayed.length === 0) { setDeleting(false); setIdx((idx + 1) % PHRASES.length); }
  }, [displayed, deleting, idx]);
  return <span style={{ color: '#ff1f35' }}>{displayed}<span style={{ animation: 'blink 1s step-end infinite' }}>|</span></span>;
}

function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0; const step = target / 60;
        const t = setInterval(() => { start += step; if (start >= target) { setCount(target); clearInterval(t); } else setCount(Math.floor(start)); }, 16);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return <div ref={ref}>{count.toLocaleString()}{suffix}</div>;
}

const MODULES = [
  { icon: '🤖', title: 'Agent Hub', tag: 'CORE', desc: '30+ specialized agents for sales, ops, legal, marketing & support. Hire one in a click.', video: '' },
  { icon: '💸', title: 'Revenue Loop', tag: 'GROWTH', desc: 'Autonomous 8-stage pipeline: cold lead → drafted outreach → booked meeting → chased invoice → closed.', video: '' },
  { icon: '🌅', title: 'Morning Brief', tag: 'CONTROL', desc: 'Wake to a dashboard of overnight work. Approve everything in one tap — no chat required.', video: '' },
  { icon: '🧠', title: 'Forge Brain', tag: 'MEMORY', desc: 'Persistent memory across every conversation and agent. Your AI learns your business over time.', video: '' },
  { icon: '✨', title: 'Content Multiplier', tag: 'CREATE', desc: 'One idea → 8 platform-optimized posts. Twitter, LinkedIn, Instagram, TikTok, email & more.', video: '' },
  { icon: '🏷️', title: 'White-Label', tag: 'AGENCY', desc: 'Run Forge under your own brand and domain. Resell the whole OS to your clients.', video: '' },
];

const AGENTS = ['DebtChaser','ReputationGuard','CompetitorWatch','LeadNurturer','GhostWriter','BusinessMentor','CloneAgent','Negotiator','Watchdog','Connector','LawBot','MenuGenius','AgencyOps','TradesManager','ContentEngine','InboxZero','SEOEngine','ReviewRequester','InvoiceChaser','OnboardingBot','ContractDrafter','SocialScheduler','CashFlowBot','HiringAssistant','CustomerSuccess','RefundHandler','UpsellBot','ChurnPredictor'];

const PLANS = [
  { name: 'Starter', price: 99, annualPrice: 79, color: '#6366f1', features: ['1 workspace','3 active agents','Morning dashboard','Basic marketplace','Email support'] },
  { name: 'Pro', price: 299, annualPrice: 239, color: '#ff1f35', popular: true, features: ['3 workspaces','All 30+ agents','White-label ready','Full marketplace','Revenue Loop','Priority support'] },
  { name: 'Agency', price: 499, annualPrice: 399, color: '#059669', features: ['Unlimited workspaces','Resell to clients','Custom domain','API access','Dedicated success manager','SLA guarantee'] },
];

const VERTICALS = [
  { icon: '⚖️', name: 'Law Firms', agents: 'LawBot, ContractDrafter, DeadlineTracker' },
  { icon: '🍕', name: 'Restaurants', agents: 'MenuGenius, ReviewBot, ReservationAgent' },
  { icon: '🎨', name: 'Agencies', agents: 'AgencyOps, ClientReporter, CampaignRunner' },
  { icon: '🔧', name: 'Trades', agents: 'JobScheduler, QuoteBot, InvoiceChaser' },
  { icon: '🏥', name: 'Healthcare', agents: 'AppointmentBot, FollowUpAgent, ComplianceBot' },
  { icon: '🏡', name: 'Real Estate', agents: 'LeadQualifier, ListingWriter, ShowingScheduler' },
];

/* ── Interactive step-by-step explainer ── */
const EXPLAINER_STEPS = [
  {
    num: '01', icon: '✍️', title: 'Tell Forge about your business', subtitle: "One sentence. That's it.",
    desc: 'Type what you do — "I run a 4-person law firm in Austin" or "I sell handmade candles on Etsy." Forge reads it, picks your agent team, and builds your workspace in under 90 seconds.',
    tag: 'SETUP', color: '#6366f1', preview: 'onboarding',
  },
  {
    num: '02', icon: '🤖', title: 'Your agents start working immediately', subtitle: 'No configuration. No prompts. Just results.',
    desc: 'Debt Chaser chases invoices. Content Engine writes posts. Competitor Watch tracks rivals. Lead Nurturer follows up with prospects. All running in parallel, overnight, while you sleep.',
    tag: 'AUTOMATION', color: '#ff1f35', preview: 'agents',
  },
  {
    num: '03', icon: '🌅', title: 'Wake to a Morning Brief', subtitle: 'Everything done. One screen. One tap.',
    desc: 'Your Morning Brief shows exactly what your agents did overnight — drafted emails, found leads, flagged risks, created content. Approve the whole queue in one tap or review individually.',
    tag: 'CONTROL', color: '#f59e0b', preview: 'brief',
  },
  {
    num: '04', icon: '🧠', title: 'Forge learns your business', subtitle: 'Gets smarter every single day.',
    desc: 'Every approval, correction, and outcome trains Forge Brain — your permanent business memory. The longer you use it, the more it knows your voice, your customers, your rules. Switching means starting cold.',
    tag: 'MEMORY', color: '#10b981', preview: 'brain',
  },
];

const FEATURES = [
  { icon: '⚡', title: 'Bring Your Own Keys', badge: 'BYOK', badgeColor: '#6366f1', desc: 'Connect your own Anthropic, OpenAI, or Gemini keys. You pay providers directly — Forge takes zero token markup. Structurally cheaper than every seat-priced competitor.' },
  { icon: '🔁', title: 'Autonomous Revenue Loop', badge: 'REVENUE', badgeColor: '#ff1f35', desc: '8-stage pipeline runs itself: cold lead → outreach drafted → email sent → meeting booked → call followed up → invoice sent → invoice chased → deal closed.' },
  { icon: '✨', title: 'Content Multiplier', badge: 'CREATE', badgeColor: '#f59e0b', desc: 'One idea becomes 8 platform-optimized pieces: Twitter thread, LinkedIn post, Instagram caption, TikTok hook, email newsletter, blog intro, YouTube script, and a press angle.' },
  { icon: '🏷️', title: 'White-Label for Agencies', badge: 'AGENCY', badgeColor: '#10b981', desc: 'Run the entire ForgeOS under your own brand and domain. Resell to clients at $800–$10k/mo. Each client gets their own workspace with their own Forge Brain.' },
  { icon: '📊', title: 'Approval Queue', badge: 'CONTROL', badgeColor: '#8b5cf6', desc: 'Every agent action lands in a queue before it fires. Review, edit, or approve in batch. Grant full autonomy to trusted flows. You\'re always in control — until you choose not to be.' },
  { icon: '🌐', title: 'Marketplace', badge: 'NETWORK', badgeColor: '#0ea5e9', desc: 'Install pre-built agent packs for your vertical. Agencies publish their own packs and earn revenue share. The catalog grows with every user.' },
];

function ExplainerPreview({ type }: { type: string }) {
  if (type === 'onboarding') return (
    <div style={{ background: '#0d0d14', borderRadius: 12, padding: 28, fontFamily: 'monospace', fontSize: 13 }}>
      <div style={{ color: '#555', marginBottom: 16, fontSize: 11 }}>forge.app — onboarding</div>
      <div style={{ color: '#aaa', marginBottom: 20, fontSize: 15, fontWeight: 600 }}>What does your business do?</div>
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.5)', borderRadius: 8, padding: '12px 16px', color: '#c4b5fd', marginBottom: 20, fontSize: 13 }}>
        I run a small law firm in Austin, we do real estate closings and contracts
        <span style={{ animation: 'blink 1s step-end infinite', color: '#6366f1' }}>|</span>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {['⚖️ Law', '📄 Contracts', '🏡 Real Estate', '👥 Small Team'].map(t => (
          <span key={t} style={{ padding: '4px 10px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, fontSize: 11, color: '#a5b4fc' }}>{t}</span>
        ))}
      </div>
      <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: 12, fontSize: 12, color: '#818cf8' }}>
        🤖 Assembling your workspace... LawBot, ContractDrafter, InvoiceChaser, DeadlineTracker ready
      </div>
    </div>
  );

  if (type === 'agents') return (
    <div style={{ background: '#0d0d14', borderRadius: 12, padding: 20, fontSize: 12 }}>
      <div style={{ color: '#555', marginBottom: 14, fontSize: 11 }}>forge.app — agent hub · 4 running</div>
      {[
        { name: 'DebtChaser', status: 'running', task: 'Sent reminder to 3 overdue clients', color: '#ff1f35' },
        { name: 'ContentEngine', status: 'running', task: 'Drafted 4 LinkedIn posts for this week', color: '#ff1f35' },
        { name: 'CompetitorWatch', status: 'done', task: 'Found 2 new competitor case studies', color: '#10b981' },
        { name: 'LeadNurturer', status: 'waiting', task: 'Waiting for approval on 6 follow-ups', color: '#f59e0b' },
      ].map(a => (
        <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, flexShrink: 0, boxShadow: a.status === 'running' ? `0 0 8px ${a.color}` : 'none' }} />
          <div style={{ flex: 1 }}>
            <div style={{ color: '#ddd', fontWeight: 600, marginBottom: 2 }}>{a.name}</div>
            <div style={{ color: '#666', fontSize: 11 }}>{a.task}</div>
          </div>
          <div style={{ fontSize: 10, color: a.color, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{a.status}</div>
        </div>
      ))}
    </div>
  );

  if (type === 'brief') return (
    <div style={{ background: '#0d0d14', borderRadius: 12, padding: 20, fontSize: 12 }}>
      <div style={{ color: '#555', marginBottom: 6, fontSize: 11 }}>forge.app — morning brief</div>
      <div style={{ color: '#f59e0b', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🌅 Good morning. 11 things done overnight.</div>
      {[
        { icon: '💰', text: 'Chased 3 invoices — $8,400 outstanding', action: 'View' },
        { icon: '📝', text: '4 LinkedIn posts drafted and ready', action: 'Approve all' },
        { icon: '🔍', text: 'Competitor Austin Legal Co. dropped prices 10%', action: 'See report' },
        { icon: '📧', text: '6 lead follow-ups queued', action: 'Review' },
      ].map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ fontSize: 14 }}>{item.icon}</span>
          <div style={{ flex: 1, color: '#bbb' }}>{item.text}</div>
          <button style={{ padding: '3px 10px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, color: '#f59e0b', fontSize: 10, cursor: 'pointer' }}>{item.action}</button>
        </div>
      ))}
      <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#92400e', fontSize: 12 }}>Approve all 11 actions</span>
        <button style={{ padding: '6px 16px', background: '#f59e0b', border: 'none', borderRadius: 6, color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✓ Approve all</button>
      </div>
    </div>
  );

  if (type === 'brain') return (
    <div style={{ background: '#0d0d14', borderRadius: 12, padding: 20, fontSize: 12 }}>
      <div style={{ color: '#555', marginBottom: 14, fontSize: 11 }}>forge.app — forge brain · 47 days of memory</div>
      <div style={{ color: '#10b981', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>🧠 What Forge knows about your business</div>
      {[
        { label: 'Your voice', value: 'Professional but warm. No jargon. Short paragraphs.' },
        { label: 'Top clients', value: 'Henderson family (RE), Austin Co-op, 4 regulars' },
        { label: 'Do not contact', value: 'Fridays after 3pm, never on weekends' },
        { label: 'Invoice style', value: 'NET 30, reminder at day 25 and day 45' },
        { label: 'Competitors', value: 'Austin Legal, Quick-Close LLC (tracked weekly)' },
      ].map((item, i) => (
        <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ color: '#555', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 3 }}>{item.label}</div>
          <div style={{ color: '#ccc' }}>{item.value}</div>
        </div>
      ))}
      <div style={{ marginTop: 12, fontSize: 11, color: '#374151' }}>Memory grows with every session. Leaving Forge means starting cold.</div>
    </div>
  );

  return null;
}

function InteractiveExplainer() {
  const [active, setActive] = useState(0);
  const step = EXPLAINER_STEPS[active];

  return (
    <section style={{ padding: '100px 5%', background: 'rgba(255,255,255,0.015)' }}>
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <div style={{ display: 'inline-block', padding: '4px 14px', background: 'rgba(255,31,53,0.1)', border: '1px solid rgba(255,31,53,0.25)', borderRadius: 20, fontSize: 11, color: '#ff6b7a', letterSpacing: 1, fontWeight: 700, marginBottom: 18 }}>HOW IT WORKS</div>
        <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 900, margin: 0 }}>From setup to autopilot in 4 steps</h2>
        <p style={{ color: '#666', fontSize: 16, marginTop: 14 }}>No configuration. No complexity. Just results.</p>
      </div>

      {/* Step tabs */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 48, flexWrap: 'wrap' }}>
        {EXPLAINER_STEPS.map((s, i) => (
          <button key={i} onClick={() => setActive(i)} style={{ padding: '10px 22px', background: active === i ? s.color : 'rgba(255,255,255,0.04)', border: `1px solid ${active === i ? s.color : 'rgba(255,255,255,0.08)'}`, borderRadius: 30, fontSize: 13, fontWeight: active === i ? 700 : 400, color: active === i ? '#fff' : '#777', cursor: 'pointer', transition: 'all 0.2s' }}>
            {s.icon} {s.num}. {s.title}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, maxWidth: 1100, margin: '0 auto', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-block', padding: '3px 12px', background: `${step.color}22`, border: `1px solid ${step.color}44`, borderRadius: 20, fontSize: 11, color: step.color, letterSpacing: 1, fontWeight: 700, marginBottom: 16 }}>{step.tag}</div>
          <div style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 900, lineHeight: 1.2, marginBottom: 14 }}>{step.icon} {step.title}</div>
          <div style={{ fontSize: 15, color: step.color, fontWeight: 600, marginBottom: 16 }}>{step.subtitle}</div>
          <p style={{ color: '#888', fontSize: 15, lineHeight: 1.8, marginBottom: 28 }}>{step.desc}</p>
          <div style={{ display: 'flex', gap: 10 }}>
            {EXPLAINER_STEPS.map((_, i) => (
              <button key={i} onClick={() => setActive(i)} style={{ width: i === active ? 28 : 8, height: 8, borderRadius: 4, background: i === active ? step.color : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>
        <div style={{ border: `1px solid ${step.color}33`, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ background: `${step.color}11`, borderBottom: `1px solid ${step.color}22`, padding: '10px 16px', display: 'flex', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
          </div>
          <ExplainerPreview type={step.preview} />
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 60 }}>
        <a href={APP_URL} style={{ display: 'inline-block', padding: '14px 36px', background: '#ff1f35', borderRadius: 10, fontSize: 15, fontWeight: 700, color: '#fff', animation: 'glow 3s ease-in-out infinite' }}>Start free — see it for yourself →</a>
      </div>
    </section>
  );
}

function FeaturesGrid() {
  return (
    <section style={{ padding: '100px 5%' }}>
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <div style={{ display: 'inline-block', padding: '4px 14px', background: 'rgba(255,31,53,0.1)', border: '1px solid rgba(255,31,53,0.25)', borderRadius: 20, fontSize: 11, color: '#ff6b7a', letterSpacing: 1, fontWeight: 700, marginBottom: 18 }}>FEATURES</div>
        <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 900, margin: 0 }}>Everything your business needs</h2>
        <p style={{ color: '#666', fontSize: 16, marginTop: 14 }}>One OS. All the tools. None of the seat-pricing.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, maxWidth: 1100, margin: '0 auto' }}>
        {FEATURES.map((f, i) => (
          <div key={i} style={{ padding: 28, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, transition: 'all 0.2s', cursor: 'default' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.055)'; (e.currentTarget as HTMLDivElement).style.borderColor = `${f.badgeColor}44`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 22 }}>{f.icon}</span>
              <span style={{ padding: '2px 10px', background: `${f.badgeColor}18`, border: `1px solid ${f.badgeColor}33`, borderRadius: 20, fontSize: 10, color: f.badgeColor, fontWeight: 700, letterSpacing: 0.5 }}>{f.badge}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{f.title}</div>
            <div style={{ fontSize: 13, color: '#777', lineHeight: 1.7 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function LandingPage() {
  const [annual, setAnnual] = useState(false);
  const [activeMod, setActiveMod] = useState(0);
  const mod = MODULES[activeMod];

  return (
    <div style={{ background: '#07070b', color: '#e0e0e0', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(255,31,53,0.3)} 50%{box-shadow:0 0 44px rgba(255,31,53,0.6)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        * { box-sizing: border-box; }
        a { color: inherit; text-decoration: none; }
        ::selection { background: rgba(255,31,53,0.3); }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0a0a0f; } ::-webkit-scrollbar-thumb { background: #2a2a33; border-radius: 3px; }
        .mod-tab:hover { background: rgba(255,255,255,0.06) !important; }
        @media (max-width: 760px) { .os-grid { grid-template-columns: 1fr !important; } .navlinks { display: none !important; } }
      `}</style>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(7,7,11,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
          <span style={{ color: '#ff1f35' }}>Forge</span><span style={{ color: '#555', fontSize: 12, marginLeft: 6, fontWeight: 400 }}>OS</span>
        </div>
        <div className="navlinks" style={{ display: 'flex', gap: 28, fontSize: 14, color: '#888' }}>
          {['ForgeOS','Agents','Pricing','Industries'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} onMouseEnter={e => (e.currentTarget.style.color='#fff')} onMouseLeave={e => (e.currentTarget.style.color='#888')}>{l}</a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href={`${APP_URL}/login`} style={{ padding: '8px 18px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, fontSize: 13, color: '#ccc' }}>Log in</a>
          <a href={`${APP_URL}/register`} style={{ padding: '8px 18px', background: '#ff1f35', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', animation: 'glow 3s ease-in-out infinite' }}>Start free</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 5% 80px', textAlign: 'center' }}>
        <NeuralCanvas />
        <div style={{ position: 'absolute', top: '18%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 700, background: 'radial-gradient(circle, rgba(255,31,53,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,31,53,0.1)', border: '1px solid rgba(255,31,53,0.3)', borderRadius: 20, padding: '5px 16px', fontSize: 12, color: '#ff6b7a', marginBottom: 28, fontWeight: 600, letterSpacing: 0.5 }}>
            ● LIVE BETA — THE AI OPERATING SYSTEM
          </div>
          <h1 style={{ fontSize: 'clamp(38px, 6.5vw, 80px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: -2.5, margin: '0 auto 26px', maxWidth: 960, minHeight: '1.1em' }}>
            <TypewriterText />
          </h1>
          <p style={{ fontSize: 19, color: '#9a9aa5', maxWidth: 600, margin: '0 auto 42px', lineHeight: 1.7 }}>
            Forge is the AI operating system for small business. 30+ specialized agents run sales, ops, legal, marketing and support — you stay in control with one-tap approvals.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={`${APP_URL}/register`} style={{ padding: '15px 34px', background: '#ff1f35', borderRadius: 11, fontSize: 16, fontWeight: 700, color: '#fff', animation: 'glow 3s ease-in-out infinite', display: 'inline-block' }}>Start free — no card</a>
            <a href="#forgeos" style={{ padding: '15px 34px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 11, fontSize: 16, color: '#ccc', display: 'inline-block' }}>See how it works ↓</a>
          </div>
          <div style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: 60, flexWrap: 'wrap' }}>
            {[{ n: 30, s: '+', label: 'AI Agents' }, { n: 6000, s: '+', label: 'Data endpoints' }, { n: 90, s: 's', label: 'Setup time' }].map((stat, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: '#ff1f35', lineHeight: 1 }}>
                  <CountUp target={stat.n} suffix={stat.s} />
                </div>
                <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ForgeOS module explorer */}
      <section id="forgeos" style={{ padding: '100px 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 900, margin: 0 }}>Six systems. One OS.</h2>
          <p style={{ color: '#666', fontSize: 16, marginTop: 14 }}>Each module is an autonomous workflow — click to explore</p>
        </div>
        <div className="os-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, maxWidth: 1100, margin: '0 auto', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {MODULES.map((m, i) => (
              <button key={i} className="mod-tab" onClick={() => setActiveMod(i)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: activeMod === i ? 'rgba(255,31,53,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeMod === i ? 'rgba(255,31,53,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                <span style={{ fontSize: 22 }}>{m.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: activeMod === i ? '#fff' : '#ccc', marginBottom: 2 }}>{m.title}</div>
                  <div style={{ fontSize: 11, color: activeMod === i ? '#ff6b7a' : '#555', fontWeight: 600, letterSpacing: 0.5 }}>{m.tag}</div>
                </div>
                {activeMod === i && <span style={{ color: '#ff1f35', fontSize: 16 }}>&#x2192;</span>}
              </button>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 28, minHeight: 360 }}>
            <div style={{ aspectRatio: '16/9', width: '100%', borderRadius: 12, background: 'linear-gradient(135deg, #14141c 0%, #1c1118 100%)', border: '1px solid rgba(255,31,53,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, marginBottom: 22, position: 'relative', overflow: 'hidden' }}>
              {mod.video ? (
                <video src={mod.video} controls style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
              ) : (
                <>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,31,53,0.15)', border: '1px solid rgba(255,31,53,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>&#x25B6;</div>
                  <div style={{ fontSize: 13, color: '#777' }}>Explainer video — {mod.title}</div>
                  <div style={{ fontSize: 11, color: '#444' }}>video slot ready</div>
                  <div style={{ position: 'absolute', top: 12, left: 14, fontSize: 28, opacity: 0.15 }}>{mod.icon}</div>
                </>
              )}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{mod.icon} {mod.title}</div>
            <p style={{ fontSize: 14, color: '#9a9aa5', lineHeight: 1.7, marginBottom: 18 }}>{mod.desc}</p>
            <a href="https://forge-sand-two.vercel.app/register" style={{ display: 'inline-block', padding: '10px 22px', background: '#ff1f35', borderRadius: 9, fontSize: 13, fontWeight: 600, color: '#fff' }}>Try {mod.title} &#x2192;</a>
          </div>
        </div>
      </section>

      <InteractiveExplainer />
      <FeaturesGrid />

      <section id="agents" style={{ padding: '100px 5%', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 800, marginBottom: 16 }}>30+ agents, ready to hire</h2>
          <p style={{ color: '#666', fontSize: 16 }}>Specialists for every business function</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 900, margin: '0 auto' }}>
          {AGENTS.map((a, i) => (
            <span key={i} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, fontSize: 12, color: '#aaa', cursor: 'default' }}>{a}</span>
          ))}
        </div>
      </section>

      <section style={{ padding: '100px 5%' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 800, marginBottom: 16 }}>Autonomous Revenue Loop</h2>
          <p style={{ color: '#666', fontSize: 16, marginBottom: 44 }}>From cold lead to closed deal</p>
          <div style={{ display: 'flex', overflowX: 'auto', paddingBottom: 12 }}>
            {['Cold','Outreach','Sent','Meeting','Call Done','Invoice','Won'].map((stage, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ padding: '10px 18px', background: `hsl(${200 + i*20},70%,${20+i*3}%)`, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', color: '#fff' }}>{stage}</div>
                {i < 6 && <div style={{ color: '#333', fontSize: 18, margin: '0 4px' }}>&#x2192;</div>}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 36, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16 }}>
            {['Draft outreach in seconds','Book meetings automatically','Chase invoices on schedule','Follow up without lifting a finger'].map((t, i) => (
              <div key={i} style={{ padding: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, fontSize: 13, color: '#aaa' }}>
                <span style={{ color: '#ff1f35', marginRight: 8 }}>&#x2713;</span>{t}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" style={{ padding: '100px 5%', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 800, marginBottom: 16 }}>Simple, transparent pricing</h2>
          <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 4, gap: 4 }}>
            <button onClick={() => setAnnual(false)} style={{ padding: '8px 20px', background: !annual ? '#ff1f35' : 'transparent', border: 'none', borderRadius: 7, color: !annual ? '#fff' : '#888', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Monthly</button>
            <button onClick={() => setAnnual(true)} style={{ padding: '8px 20px', background: annual ? '#ff1f35' : 'transparent', border: 'none', borderRadius: 7, color: annual ? '#fff' : '#888', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Annual <span style={{ fontSize: 11, color: annual ? '#ffcdd0' : '#555' }}>save 20%</span></button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 24, maxWidth: 950, margin: '0 auto' }}>
          {PLANS.map((p, i) => (
            <div key={i} style={{ padding: 32, background: p.popular ? 'rgba(255,31,53,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${p.popular ? 'rgba(255,31,53,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 16, position: 'relative' }}>
              {p.popular && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#ff1f35', borderRadius: 20, padding: '3px 14px', fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>MOST POPULAR</div>}
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{p.name}</div>
              <div style={{ fontSize: 42, fontWeight: 900, color: p.color, lineHeight: 1, marginBottom: 4 }}>${annual ? p.annualPrice : p.price}</div>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 24 }}>per month{annual ? ', billed annually' : ''}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {p.features.map((f, j) => (<div key={j} style={{ fontSize: 13, color: '#aaa', display: 'flex', gap: 8 }}><span style={{ color: p.color }}>&#x2713;</span>{f}</div>))}
              </div>
              <a href="https://forge-sand-two.vercel.app/register" style={{ display: 'block', textAlign: 'center', padding: 12, background: p.popular ? '#ff1f35' : 'rgba(255,255,255,0.07)', border: p.popular ? 'none' : '1px solid rgba(255,255,255,0.1)', borderRadius: 9, fontSize: 14, fontWeight: 600, color: '#fff' }}>Get started</a>
            </div>
          ))}
        </div>
      </section>

      <section id="industries" style={{ padding: '100px 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 800, marginBottom: 16 }}>Built for your industry</h2>
          <p style={{ color: '#666', fontSize: 16 }}>Vertical agent packs — one-click install</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20, maxWidth: 1000, margin: '0 auto' }}>
          {VERTICALS.map((v, i) => (
            <div key={i} style={{ padding: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, cursor: 'pointer' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{v.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{v.name}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{v.agents}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '110px 5%', textAlign: 'center', background: 'rgba(255,31,53,0.04)', borderTop: '1px solid rgba(255,31,53,0.1)' }}>
        <h2 style={{ fontSize: 'clamp(28px,4vw,60px)', fontWeight: 900, marginBottom: 20 }}>Your AI team is waiting.</h2>
        <p style={{ color: '#777', fontSize: 18, marginBottom: 16 }}>Spin up your ForgeOS workspace free — no credit card.</p>
        <p style={{ color: '#555', fontSize: 14, marginBottom: 40 }}>Already have an account? <a href="https://forge-sand-two.vercel.app/login" style={{ color: '#ff6b7a', textDecoration: 'underline' }}>Log in &#x2192;</a></p>
        <a href="https://forge-sand-two.vercel.app/register" style={{ padding: '17px 44px', background: '#ff1f35', borderRadius: 12, fontSize: 18, fontWeight: 700, color: '#fff', display: 'inline-block' }}>Start free today</a>
      </section>

      <footer style={{ padding: '40px 5%', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}><span style={{ color: '#ff1f35' }}>Forge</span> <span style={{ color: '#333', fontSize: 12 }}>OS</span></div>
        <div style={{ fontSize: 12, color: '#444' }}>&#169; 2026 Forge. All rights reserved.</div>
        <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#555' }}>
          <a href="#">Privacy</a><a href="#">Terms</a><a href="https://forge-production-2692.up.railway.app/health">Status</a>
        </div>
      </footer>
    </div>
  );
}
