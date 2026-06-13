'use client';
import React, { useState, useEffect, useRef } from 'react';
// FORGE_LANDING_V2 — rebuilt 2026-06-13: 3D neural hero + interactive ForgeOS module explorer w/ video slots

const APP_URL = 'https://forge-sand-two.vercel.app';

/* 3D-feel animated hero — zero-dependency canvas particle network on a
   perspective grid. Gives the "living OS" feel without Three.js so the
   build can never fail on a missing package. */
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

/* ForgeOS modules — each has a video slot ready for a real explainer clip. */
const MODULES = [
  { icon: '🤖', title: 'Agent Hub', tag: 'CORE', desc: '30+ specialized agents for sales, ops, legal, marketing & support. Hire one in a click.', video: '' },
  { icon: '💸', title: 'Revenue Loop', tag: 'GROWTH', desc: 'Autonomous 8-stage pipeline: cold lead → drafted outreach → booked meeting → chased invoice → closed.', video: '' },
  { icon: '🌅', title: 'Morning Brief', tag: 'CONTROL', desc: 'Wake to a dashboard of overnight work. Approve everything in one tap — no chat required.', video: '' },
  { icon: '🧠', title: 'Forge Brain', tag: 'MEMORY', desc: 'Persistent memory across every conversation and agent. Your AI learns your business over time.', video: '' },
  { icon: '✨', title: 'Content Multiplier', tag: 'CREATE', desc: 'One idea → 8 platform-optimized posts. Twitter, LinkedIn, Instagram, TikTok, email & more.', video: '' },
  { icon: '🏷️', title: 'White-Label', tag: 'AGENCY', desc: 'Run Forge under your own brand and domain. Resell the whole OS to your clients.', video: '' },
];

const AGENTS = ['DebtChaser','ReputationGuard','CompetitorWatch','LeadNurturer','GhostWriter','BusinessMentor','CloneAgent','Negotiator','Watchdog','Connector','LawBot','MenuGenius','AgencyOps','TradesManager','ContentEngine','InboxZero','SEOEngine','ReviewRequester','InvoiceChaser','OnboardingBot','ContractDrafter','SocialScheduler','CashFlowBot','HiringAssistant','CustomerSuccess','RefundHandler','UpsellBot','ChurnPredictor'];

const STEPS = [
  { num: '01', title: 'One sentence setup', desc: 'Describe your business in one sentence. Forge assembles your agent team and workspace.' },
  { num: '02', title: 'Agents go to work', desc: 'Your team starts immediately — generating leads, drafting content, watching competitors.' },
  { num: '03', title: 'Approve in the morning', desc: 'Review completed work on one screen. Approve, reject, or let trusted flows auto-run.' },
  { num: '04', title: 'It compounds', desc: 'Every approved action tunes your system. Forge gets more autonomous every day.' },
];

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
          <a href={APP_URL} style={{ padding: '8px 18px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, fontSize: 13, color: '#ccc' }}>Log in</a>
          <a href={APP_URL} style={{ padding: '8px 18px', background: '#ff1f35', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', animation: 'glow 3s ease-in-out infinite' }}>Start free</a>
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
            <a href={APP_URL} style={{ padding: '15px 34px', background: '#ff1f35', borderRadius: 11, fontSize: 16, fontWeight: 700, color: '#fff', animation: 'glow 3s ease-in-out infinite', display: 'inline-block' }}>Start free — no card</a>
            <a href="#forgeos" style={{ padding: '15px 34px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 11, fontSize: 16, color: '#ccc', display: 'inline-block' }}>Explore ForgeOS ↓</a>
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 2, marginTop: 64, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 22, textAlign: 'left', maxWidth: 460, width: '100%', animation: 'float 5s ease-in-out infinite', backdropFilter: 'blur(8px)' }}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 14, letterSpacing: 1 }}>FORGE MORNING BRIEF — TODAY</div>
          {[
            { icon: '✅', label: '14 tasks completed overnight', color: '#16a34a' },
            { icon: '💸', label: '3 invoices chased automatically', color: '#d97706' },
            { icon: '📧', label: '7 outreach emails drafted', color: '#6366f1' },
            { icon: '⭐', label: '2 review requests sent', color: '#eab308' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: `1px solid ${item.color}22` }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span><span style={{ fontSize: 13, color: '#ccc' }}>{item.label}</span>
            </div>
          ))}
          <button style={{ width: '100%', marginTop: 6, padding: 10, background: '#ff1f35', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Approve all — 1 tap</button>
          <div style={{ fontSize: 10, color: '#444', marginTop: 10, textAlign: 'center' }}>illustrative — your brief reflects your real workspace</div>
        </div>
      </section>

      {/* Capability stats (honest: capabilities, not fabricated customer counts) */}
      <section style={{ padding: '54px 5%', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 36, maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          {[
            { val: 30, suffix: '+', label: 'Specialized agents' },
            { val: 8, suffix: '', label: 'Revenue Loop stages' },
            { val: 6, suffix: '', label: 'LLM providers, your keys' },
            { val: 90, suffix: 's', label: 'To first agent live' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 42, fontWeight: 900, color: '#ff1f35', lineHeight: 1 }}><CountUp target={s.val} suffix={s.suffix} /></div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ForgeOS interactive module explorer */}
      <section id="forgeos" style={{ padding: '100px 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 800, marginBottom: 16 }}>One OS. Every function.</h2>
          <p style={{ color: '#666', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>ForgeOS runs your business like a machine. Click a module to see it in action.</p>
        </div>
        <div className="os-grid" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(240px, 320px) 1fr', gap: 28, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {MODULES.map((m, i) => (
              <button key={i} className="mod-tab" onClick={() => setActiveMod(i)}
                style={{ textAlign: 'left', padding: '14px 16px', background: activeMod === i ? 'rgba(255,31,53,0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${activeMod===i ? 'rgba(255,31,53,0.45)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.18s' }}>
                <span style={{ fontSize: 22 }}>{m.icon}</span>
                <span>
                  <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: '#fff' }}>{m.title}</span>
                  <span style={{ fontSize: 10, color: '#ff6b7a', letterSpacing: 1 }}>{m.tag}</span>
                </span>
              </button>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 28, minHeight: 360 }}>
            <div style={{ aspectRatio: '16/9', width: '100%', borderRadius: 12, background: 'linear-gradient(135deg, #14141c 0%, #1c1118 100%)', border: '1px solid rgba(255,31,53,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, marginBottom: 22, position: 'relative', overflow: 'hidden' }}>
              {mod.video ? (
                <video src={mod.video} controls style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
              ) : (
                <>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,31,53,0.15)', border: '1px solid rgba(255,31,53,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>▶</div>
                  <div style={{ fontSize: 13, color: '#777' }}>Explainer video — {mod.title}</div>
                  <div style={{ fontSize: 11, color: '#444' }}>video slot ready · set MODULES[].video</div>
                  <div style={{ position: 'absolute', top: 12, left: 14, fontSize: 28, opacity: 0.15 }}>{mod.icon}</div>
                </>
              )}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{mod.icon} {mod.title}</div>
            <p style={{ fontSize: 14, color: '#9a9aa5', lineHeight: 1.7, marginBottom: 18 }}>{mod.desc}</p>
            <a href={APP_URL} style={{ display: 'inline-block', padding: '10px 22px', background: '#ff1f35', borderRadius: 9, fontSize: 13, fontWeight: 600, color: '#fff' }}>Try {mod.title} →</a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '100px 5%', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 800 }}>Up and running in 90 seconds</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 30, maxWidth: 1000, margin: '0 auto' }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: 'rgba(255,31,53,0.2)', marginBottom: 12, fontVariantNumeric: 'tabular-nums' }}>{s.num}</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: '#777', lineHeight: 1.7 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Agents */}
      <section id="agents" style={{ padding: '100px 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 800, marginBottom: 16 }}>30+ agents, ready to hire</h2>
          <p style={{ color: '#666', fontSize: 16 }}>Specialists for every business function</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 900, margin: '0 auto' }}>
          {AGENTS.map((a, i) => (
            <span key={i} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, fontSize: 12, color: '#aaa', transition: 'all 0.2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,31,53,0.1)'; e.currentTarget.style.borderColor='rgba(255,31,53,0.4)'; e.currentTarget.style.color='#ff6b7a'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#aaa'; }}>{a}</span>
          ))}
        </div>
      </section>

      {/* Revenue Loop */}
      <section style={{ padding: '100px 5%', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 800, marginBottom: 16 }}>Autonomous Revenue Loop</h2>
          <p style={{ color: '#666', fontSize: 16, marginBottom: 44 }}>From cold lead to closed deal — agents handle every stage</p>
          <div style={{ display: 'flex', overflowX: 'auto', paddingBottom: 12 }}>
            {['Cold','Outreach','Sent','Meeting','Call Done','Invoice','Won'].map((stage, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ padding: '10px 18px', background: `hsl(${200 + i*20},70%,${20+i*3}%)`, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', color: '#fff' }}>{stage}</div>
                {i < 6 && <div style={{ color: '#333', fontSize: 18, margin: '0 4px' }}>→</div>}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 36, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16 }}>
            {['Draft outreach in seconds','Book meetings automatically','Chase invoices on schedule','Follow up without lifting a finger'].map((t, i) => (
              <div key={i} style={{ padding: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, fontSize: 13, color: '#aaa' }}>
                <span style={{ color: '#ff1f35', marginRight: 8 }}>✓</span>{t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '100px 5%' }}>
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
                {p.features.map((f, j) => (<div key={j} style={{ fontSize: 13, color: '#aaa', display: 'flex', gap: 8 }}><span style={{ color: p.color }}>✓</span>{f}</div>))}
              </div>
              <a href={APP_URL} style={{ display: 'block', textAlign: 'center', padding: 12, background: p.popular ? '#ff1f35' : 'rgba(255,255,255,0.07)', border: p.popular ? 'none' : '1px solid rgba(255,255,255,0.1)', borderRadius: 9, fontSize: 14, fontWeight: 600, color: '#fff' }}>Get started</a>
            </div>
          ))}
        </div>
      </section>

      {/* Industries */}
      <section id="industries" style={{ padding: '100px 5%', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,52px)', fontWeight: 800, marginBottom: 16 }}>Built for your industry</h2>
          <p style={{ color: '#666', fontSize: 16 }}>Vertical agent packs — one-click install</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20, maxWidth: 1000, margin: '0 auto' }}>
          {VERTICALS.map((v, i) => (
            <div key={i} style={{ padding: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, transition: 'border-color 0.2s', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor='rgba(255,31,53,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor='rgba(255,255,255,0.07)')}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{v.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{v.name}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{v.agents}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '110px 5%', textAlign: 'center', background: 'rgba(255,31,53,0.04)', borderTop: '1px solid rgba(255,31,53,0.1)' }}>
        <h2 style={{ fontSize: 'clamp(28px,4vw,60px)', fontWeight: 900, marginBottom: 20 }}>Your AI team is waiting.</h2>
        <p style={{ color: '#777', fontSize: 18, marginBottom: 40 }}>Spin up your ForgeOS workspace free — no credit card.</p>
        <a href={APP_URL} style={{ padding: '17px 44px', background: '#ff1f35', borderRadius: 12, fontSize: 18, fontWeight: 700, color: '#fff', animation: 'glow 3s ease-in-out infinite', display: 'inline-block' }}>Start free today</a>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 5%', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}><span style={{ color: '#ff1f35' }}>Forge</span> <span style={{ color: '#333', fontSize: 12 }}>OS</span></div>
        <div style={{ fontSize: 12, color: '#444' }}>© 2026 Forge. All rights reserved.</div>
        <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#555' }}>
          <a href="#">Privacy</a><a href="#">Terms</a><a href="https://forge-production-2692.up.railway.app/health">Status</a>
        </div>
      </footer>
    </div>
  );
}
