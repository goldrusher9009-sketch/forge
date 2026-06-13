'use client';
import React, { useState, useEffect, useRef } from 'react';

const HERO_PHRASES = [
  'Run your business on autopilot.',
  'Close deals while you sleep.',
  'Your AI team, always on.',
  'From idea to revenue in minutes.',
  'The operating system for modern business.',
];

function TypewriterText() {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const phrase = HERO_PHRASES[idx];
    if (!deleting && displayed.length < phrase.length) {
      const t = setTimeout(() => setDisplayed(phrase.slice(0, displayed.length + 1)), 45);
      return () => clearTimeout(t);
    }
    if (!deleting && displayed.length === phrase.length) {
      const t = setTimeout(() => setDeleting(true), 2200);
      return () => clearTimeout(t);
    }
    if (deleting && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 22);
      return () => clearTimeout(t);
    }
    if (deleting && displayed.length === 0) {
      setDeleting(false);
      setIdx((idx + 1) % HERO_PHRASES.length);
    }
  }, [displayed, deleting, idx]);
  return (
    <span style={{ color: '#ff1f35' }}>
      {displayed}<span style={{ animation: 'blink 1s step-end infinite', opacity: 1 }}>|</span>
    </span>
  );
}

function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = target / 60;
        const t = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(t); }
          else setCount(Math.floor(start));
        }, 16);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return <div ref={ref}>{count.toLocaleString()}{suffix}</div>;
}

const FEATURES = [
  { icon: '🤖', title: 'Agent Hub', desc: '30+ specialized AI agents for every business function — sales, legal, ops, marketing and more.' },
  { icon: '💸', title: 'Revenue Loop', desc: 'Autonomous 8-stage pipeline from cold lead to closed deal. Agents draft outreach, book meetings, chase invoices.' },
  { icon: '🌅', title: 'Morning Dashboard', desc: 'Wake up to a full business briefing. Approve AI actions in one tap — no chat interface needed.' },
  { icon: '🧠', title: 'Forge Brain', desc: 'Persistent memory across every conversation. Your AI knows your business as well as you do.' },
  { icon: '🛒', title: 'Marketplace', desc: 'Install vertical agent packs for law, restaurants, agencies, trades. One click, instantly live.' },
  { icon: '🚀', title: 'Moonshot Agents', desc: 'Ghost Writer, Business Mentor, Clone Agent, Negotiator, Competitor Watchdog — elite AI specialists.' },
  { icon: '✨', title: 'Content Multiplier', desc: 'One idea becomes 8 platform-optimized posts. Twitter, LinkedIn, Instagram, TikTok, email and more.' },
  { icon: '⚡', title: 'Cascade Pipeline', desc: 'Chain agents in sequence. Each agent hands off to the next. Complex workflows run automatically.' },
];

const AGENTS = [
  'DebtChaser','ReputationGuard','CompetitorWatch','LeadNurturer','GhostWriter','BusinessMentor',
  'CloneAgent','Negotiator','Watchdog','Connector','LawBot','MenuGenius','AgencyOps',
  'TradesManager','ContentEngine','InboxZero','SEOEngine','ReviewRequester','InvoiceChaser',
  'OnboardingBot','ContractDrafter','SocialScheduler','CashFlowBot','HiringAssistant',
  'CustomerSuccess','RefundHandler','UpsellBot','ChurnPredictor',
];

const STEPS = [
  { num: '01', title: 'One sentence setup', desc: 'Tell Forge your business in one sentence. AI builds your entire operating system in 90 seconds.' },
  { num: '02', title: 'Agents go to work', desc: 'Your agent team starts immediately — generating leads, creating content, monitoring competitors.' },
  { num: '03', title: 'Approve in the morning', desc: 'Wake up to a dashboard of completed work. Approve, reject, or let it auto-run.' },
  { num: '04', title: 'Revenue compounds', desc: 'Every approved action trains your system. Forge gets smarter and more autonomous every day.' },
];

const TESTIMONIALS = [
  { name: 'Sarah K.', role: 'Agency Owner', text: 'Forge replaced 3 contractors. My agents run client campaigns, chase invoices and handle support 24/7.' },
  { name: 'Marcus T.', role: 'Restaurant Owner', text: 'The MenuGenius agent doubled our review responses and the ReputationGuard catches every bad review instantly.' },
  { name: 'Priya M.', role: 'Law Firm Partner', text: 'LawBot drafts NDAs, the Revenue Loop fills our pipeline, and the morning dashboard keeps me in control without micromanaging.' },
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
  const [activeFeat, setActiveFeat] = useState(0);

  return (
    <div style={{ background: '#0a0a0f', color: '#e0e0e0', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(255,31,53,0.3)} 50%{box-shadow:0 0 40px rgba(255,31,53,0.6)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes breathe { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
        * { box-sizing: border-box; }
        a { color: inherit; text-decoration: none; }
        ::selection { background: rgba(255,31,53,0.3); }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #111; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
      `}</style>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
          <span style={{ color: '#ff1f35' }}>Forge</span><span style={{ color: '#555', fontSize: 12, marginLeft: 6, fontWeight: 400 }}>AI OS</span>
        </div>
        <div style={{ display: 'flex', gap: 28, fontSize: 14, color: '#888' }}>
          {['Features','Agents','Pricing','Marketplace'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{ transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color='#fff')} onMouseLeave={e => (e.currentTarget.style.color='#888')}>{l}</a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="https://forge-sand-two.vercel.app" style={{ padding: '8px 18px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, fontSize: 13, color: '#ccc', transition: 'border-color 0.2s' }}>Log in</a>
          <a href="https://forge-sand-two.vercel.app" style={{ padding: '8px 18px', background: '#ff1f35', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', animation: 'glow 3s ease-in-out infinite' }}>Start free</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: 140, paddingBottom: 100, textAlign: 'center', padding: '140px 5% 100px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(255,31,53,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'inline-block', background: 'rgba(255,31,53,0.1)', border: '1px solid rgba(255,31,53,0.3)', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: '#ff6b7a', marginBottom: 24, fontWeight: 600 }}>
          NOW IN BETA — LIMITED ACCESS
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: -2, margin: '0 auto 24px', maxWidth: 900 }}>
          <TypewriterText />
        </h1>
        <p style={{ fontSize: 18, color: '#888', maxWidth: 580, margin: '0 auto 40px', lineHeight: 1.7 }}>
          Forge is the AI operating system for small businesses. 30+ specialized agents handle sales, ops, legal, marketing and support — while you focus on what matters.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="https://forge-sand-two.vercel.app" style={{ padding: '14px 32px', background: '#ff1f35', borderRadius: 10, fontSize: 16, fontWeight: 700, color: '#fff', animation: 'glow 3s ease-in-out infinite', display: 'inline-block' }}>
            Start free — no credit card
          </a>
          <a href="#features" style={{ padding: '14px 32px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, fontSize: 16, color: '#ccc', display: 'inline-block' }}>
            See how it works
          </a>
        </div>

        {/* Mock dashboard card */}
        <div style={{ marginTop: 70, display: 'inline-block', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, textAlign: 'left', maxWidth: 480, width: '100%', animation: 'float 4s ease-in-out infinite' }}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 14 }}>FORGE MORNING BRIEF — TODAY</div>
          {[
            { icon: '✅', label: '14 tasks completed overnight', color: '#16a34a' },
            { icon: '💸', label: '3 invoices chased automatically', color: '#d97706' },
            { icon: '📧', label: '7 outreach emails drafted', color: '#6366f1' },
            { icon: '⭐', label: '2 new 5-star reviews requested', color: '#eab308' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: `1px solid ${item.color}22` }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span style={{ fontSize: 13, color: '#ccc' }}>{item.label}</span>
            </div>
          ))}
          <button style={{ width: '100%', marginTop: 8, padding: '10px', background: '#ff1f35', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Approve all — 1 tap
          </button>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '60px 5%', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40, maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          {[
            { val: 2400, suffix: '+', label: 'Businesses using Forge' },
            { val: 340, suffix: 'K+', label: 'Tasks automated' },
            { val: 98, suffix: '%', label: 'Approval rate' },
            { val: 20, suffix: 'hrs', label: 'Saved per week' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 42, fontWeight: 900, color: '#ff1f35', lineHeight: 1 }}>
                <CountUp target={s.val} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '100px 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, marginBottom: 16 }}>Everything your business needs</h2>
          <p style={{ color: '#666', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>One platform. Infinite leverage.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, maxWidth: 1200, margin: '0 auto' }}>
          {FEATURES.map((f, i) => (
            <div key={i} onClick={() => setActiveFeat(i)}
              style={{ padding: 24, background: activeFeat === i ? 'rgba(255,31,53,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeFeat===i ? 'rgba(255,31,53,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '100px 5%', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, marginBottom: 16 }}>Up and running in 90 seconds</h2>
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
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, marginBottom: 16 }}>30+ agents, ready to hire</h2>
          <p style={{ color: '#666', fontSize: 16 }}>Specialists for every business function</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 900, margin: '0 auto 60px' }}>
          {AGENTS.map((a, i) => (
            <span key={i} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, fontSize: 12, color: '#aaa', transition: 'all 0.2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,31,53,0.1)'; e.currentTarget.style.borderColor='rgba(255,31,53,0.4)'; e.currentTarget.style.color='#ff6b7a'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#aaa'; }}>
              {a}
            </span>
          ))}
        </div>
      </section>

      {/* Revenue Loop */}
      <section style={{ padding: '100px 5%', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, marginBottom: 16 }}>Autonomous Revenue Loop</h2>
          <p style={{ color: '#666', fontSize: 16, marginBottom: 50 }}>From cold lead to closed deal — agents handle every stage automatically</p>
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto', paddingBottom: 12 }}>
            {['Cold','Outreach','Sent','Meeting','Call Done','Invoice','Won'].map((stage, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ padding: '10px 18px', background: `hsl(${200 + i*20},70%,${20+i*3}%)`, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' as const, color: '#fff' }}>
                  {stage}
                </div>
                {i < 6 && <div style={{ color: '#333', fontSize: 18, margin: '0 4px' }}>→</div>}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16 }}>
            {['Draft outreach in seconds','Book meetings automatically','Chase invoices on schedule','Follow up without lifting a finger'].map((t, i) => (
              <div key={i} style={{ padding: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, fontSize: 13, color: '#aaa' }}>
                <span style={{ color: '#ff1f35', marginRight: 8 }}>✓</span>{t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '100px 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800 }}>Trusted by real businesses</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24, maxWidth: 1000, margin: '0 auto' }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{ padding: 28, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
              <div style={{ fontSize: 24, color: '#ff1f35', marginBottom: 14 }}>"</div>
              <p style={{ fontSize: 14, color: '#aaa', lineHeight: 1.7, marginBottom: 20 }}>{t.text}</p>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: '#555' }}>{t.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '100px 5%', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, marginBottom: 16 }}>Simple, transparent pricing</h2>
          <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 4, gap: 4 }}>
            <button onClick={() => setAnnual(false)} style={{ padding: '8px 20px', background: !annual ? '#ff1f35' : 'transparent', border: 'none', borderRadius: 7, color: !annual ? '#fff' : '#888', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Monthly</button>
            <button onClick={() => setAnnual(true)} style={{ padding: '8px 20px', background: annual ? '#ff1f35' : 'transparent', border: 'none', borderRadius: 7, color: annual ? '#fff' : '#888', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
              Annual <span style={{ fontSize: 11, color: annual ? '#ffcdd0' : '#555' }}>save 20%</span>
            </button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 24, maxWidth: 950, margin: '0 auto' }}>
          {PLANS.map((p, i) => (
            <div key={i} style={{ padding: 32, background: p.popular ? 'rgba(255,31,53,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${p.popular ? 'rgba(255,31,53,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 16, position: 'relative' as const }}>
              {p.popular && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#ff1f35', borderRadius: 20, padding: '3px 14px', fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' as const }}>MOST POPULAR</div>}
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{p.name}</div>
              <div style={{ fontSize: 42, fontWeight: 900, color: p.color, lineHeight: 1, marginBottom: 4 }}>
                ${annual ? p.annualPrice : p.price}
              </div>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 24 }}>per month{annual ? ', billed annually' : ''}</div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10, marginBottom: 28 }}>
                {p.features.map((f, j) => (
                  <div key={j} style={{ fontSize: 13, color: '#aaa', display: 'flex', gap: 8 }}>
                    <span style={{ color: p.color }}>✓</span>{f}
                  </div>
                ))}
              </div>
              <a href="https://forge-sand-two.vercel.app" style={{ display: 'block', textAlign: 'center', padding: '12px', background: p.popular ? '#ff1f35' : 'rgba(255,255,255,0.07)', border: p.popular ? 'none' : '1px solid rgba(255,255,255,0.1)', borderRadius: 9, fontSize: 14, fontWeight: 600, color: '#fff' }}>
                Get started
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Marketplace */}
      <section id="marketplace" style={{ padding: '100px 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, marginBottom: 16 }}>Built for your industry</h2>
          <p style={{ color: '#666', fontSize: 16 }}>Vertical agent packs — one click install</p>
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
      <section style={{ padding: '100px 5%', textAlign: 'center', background: 'rgba(255,31,53,0.04)', borderTop: '1px solid rgba(255,31,53,0.1)' }}>
        <h2 style={{ fontSize: 'clamp(28px,4vw,56px)', fontWeight: 900, marginBottom: 20 }}>Your AI team is waiting.</h2>
        <p style={{ color: '#777', fontSize: 18, marginBottom: 40 }}>Join 2,400+ businesses running on Forge.</p>
        <a href="https://forge-sand-two.vercel.app" style={{ padding: '16px 40px', background: '#ff1f35', borderRadius: 12, fontSize: 18, fontWeight: 700, color: '#fff', animation: 'glow 3s ease-in-out infinite', display: 'inline-block' }}>
          Start free today
        </a>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 5%', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}><span style={{ color: '#ff1f35' }}>Forge</span> <span style={{ color: '#333', fontSize: 12 }}>AI OS</span></div>
        <div style={{ fontSize: 12, color: '#444' }}>© 2026 Forge. All rights reserved.</div>
        <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#555' }}>
          <a href="#">Privacy</a><a href="#">Terms</a><a href="https://forge-production-2692.up.railway.app/health">Status</a>
        </div>
      </footer>
    </div>
  );
}
