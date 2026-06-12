'use client';
// ─── FORGE AUTONOMY UI ───────────────────────────────────────────────────────
// Onboarding wizard, approval inbox, morning dashboard, credit badge,
// voice-first Forge ("Hey Forge"), magic reply, agent cinema, agent roster,
// living-workspace pulse styles. Self-contained — mounted from ForgeApp.tsx.
import React, { useState, useEffect, useRef, useCallback } from 'react';

type Api = (path: string, opts?: RequestInit) => Promise<any>;

export const LIVING_STYLES = `
@keyframes fg-breathe { 0%,100%{box-shadow:0 0 0 0 rgba(255,31,53,0.0);} 50%{box-shadow:0 0 24px 2px rgba(255,31,53,0.10);} }
@keyframes fg-pulse-bg { 0%,100%{opacity:0.35;} 50%{opacity:0.7;} }
@keyframes fg-tool-spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
@keyframes fg-card-in { from{opacity:0; transform:translateY(8px);} to{opacity:1; transform:none;} }
@keyframes fg-ghost-blink { 0%,100%{opacity:0.45} 50%{opacity:0.9} }
.fg-living { animation: fg-breathe 4s ease-in-out infinite; }
.fg-living-active { position:relative; }
.fg-living-active::before { content:''; position:absolute; inset:-1px; border-radius:inherit; background:radial-gradient(ellipse at top,rgba(255,31,53,0.12),transparent 70%); animation: fg-pulse-bg 2.2s ease-in-out infinite; pointer-events:none; }
.fg-approval-card { animation: fg-card-in 0.25s ease both; }
.fg-tool-running { display:inline-block; animation: fg-tool-spin 1.2s linear infinite; }
.fg-ghost-text { animation: fg-ghost-blink 1.8s ease-in-out infinite; }
`;

const S = {
  panel: { position: 'fixed' as const, inset: 0, zIndex: 9000, background: 'rgba(5,5,7,0.82)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { width: 'min(960px, 94vw)', maxHeight: '90vh', overflow: 'auto', background: 'var(--fg-bg2, #0d0d0f)', border: '1px solid var(--fg-border2, rgba(255,255,255,0.11))', borderRadius: 16, padding: 20 },
  h: { fontSize: 16, fontWeight: 800 as const, color: 'var(--fg-text, #f0f1f5)', margin: '0 0 4px' },
  sub: { fontSize: 12, color: 'var(--fg-text3, #888)', margin: '0 0 14px' },
  btn: { padding: '7px 14px', borderRadius: 8, border: 'none', fontWeight: 700 as const, fontSize: 12, cursor: 'pointer' },
  primary: { background: 'var(--fg-orange, #ff1f35)', color: '#fff' },
  ghostBtn: { background: 'transparent', color: 'var(--fg-text3, #888)', border: '1px solid var(--fg-border2, rgba(255,255,255,0.11))' },
  card: { background: 'var(--fg-bg3, #131316)', border: '1px solid var(--fg-border, rgba(255,255,255,0.06))', borderRadius: 12, padding: 14, marginBottom: 10 },
  input: { width: '100%', padding: '9px 12px', background: 'var(--fg-bg4, #1a1a1e)', border: '1px solid var(--fg-border2, rgba(255,255,255,0.11))', borderRadius: 8, color: 'var(--fg-text, #f0f1f5)', fontSize: 13 },
  tag: { display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700 as const, background: 'var(--fg-odim, rgba(255,31,53,0.12))', color: 'var(--fg-orange2, #ff4d5e)', marginRight: 6 },
};

// ─── Credit badge (top bar) ──────────────────────────────────────────────────
export function CreditBadge({ api, onTopup }: { api: Api; onTopup?: () => void }) {
  const [bal, setBal] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    const load = async () => { try { const d = await api('/billing/credits'); if (live && d?.success) setBal(d.data.balance); } catch {} };
    load();
    const t = setInterval(load, 60000);
    return () => { live = false; clearInterval(t); };
  }, [api]);
  if (bal === null) return null;
  const low = bal < 10;
  return (
    <div onClick={onTopup} title="AI credits — click to top up"
      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, cursor: 'pointer', flexShrink: 0,
        background: low ? 'rgba(248,113,113,0.12)' : 'var(--fg-bg4, #1a1a1e)', border: `1px solid ${low ? 'rgba(248,113,113,0.5)' : 'var(--fg-border2, rgba(255,255,255,0.11))'}` }}>
      <span style={{ fontSize: 10 }}>🪙</span>
      <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: low ? '#f87171' : 'var(--fg-text2, #ccc)' }}>${bal.toFixed(2)}</span>
    </div>
  );
}

// ─── Onboarding wizard ───────────────────────────────────────────────────────
const BIZ_TYPES = [
  { id: 'restaurant', label: '🍽️ Restaurant' }, { id: 'law_firm', label: '⚖️ Law Firm' },
  { id: 'agency', label: '🎨 Agency' }, { id: 'trades', label: '🔧 Plumber / Trades' },
  { id: 'ecom', label: '🛒 Ecommerce' }, { id: 'other', label: '✨ Other' },
];
const PAINS = ['Following up with clients', 'Getting reviews', 'Marketing', 'Admin & paperwork', 'Finding new customers'];
const TOOLS = ['Stripe', 'PayPal', 'Square', 'Gmail', 'Google Calendar', 'WordPress', 'Facebook', 'Instagram', 'LinkedIn', 'Twilio'];

export function OnboardingWizard({ api, onDone, onClose }: { api: Api; onDone: () => void; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [bizName, setBizName] = useState('');
  const [bizType, setBizType] = useState('other');
  const [cities, setCities] = useState('');
  const [services, setServices] = useState('');
  const [pain, setPain] = useState(PAINS[0]);
  const [logoUrl, setLogoUrl] = useState('');
  const [primary, setPrimary] = useState('#ff1f35');
  const [secondary, setSecondary] = useState('#0ea5e9');
  const [tools, setTools] = useState<string[]>([]);
  const [building, setBuilding] = useState(false);
  const [buildStep, setBuildStep] = useState(0);
  const [result, setResult] = useState<any>(null);
  const steps = ['Learning your business...', 'Building your agents...', 'Setting up your automations...', 'Preparing your morning dashboard...'];

  const submit = async () => {
    setBuilding(true);
    let i = 0;
    const tick = setInterval(() => { i = Math.min(i + 1, steps.length - 1); setBuildStep(i); }, 1600);
    try {
      const d = await api('/onboarding', { method: 'POST', body: JSON.stringify({
        businessName: bizName, businessType: bizType,
        cities: cities.split(',').map(s => s.trim()).filter(Boolean),
        services: services.split(',').map(s => s.trim()).filter(Boolean),
        pain, logoUrl, colors: { primary, secondary }, connectedTools: tools,
      }) });
      setTimeout(() => { clearInterval(tick); setResult(d?.data || {}); }, 6500);
    } catch (e: any) { clearInterval(tick); setBuilding(false); alert('Setup failed: ' + e.message); }
  };

  if (building) return (
    <div style={S.panel}>
      <div style={{ ...S.modal, width: 'min(520px,94vw)', textAlign: 'center', padding: 40 }} className="fg-living-active">
        {!result ? (<>
          <div style={{ fontSize: 40, marginBottom: 16 }} className="fg-tool-running">⚙️</div>
          <h2 style={S.h}>Forge is building your workspace</h2>
          <p style={{ ...S.sub, fontSize: 14, color: 'var(--fg-orange2, #ff4d5e)' }}>{steps[buildStep]}</p>
          <div style={{ height: 6, background: 'var(--fg-bg4,#1a1a1e)', borderRadius: 99, overflow: 'hidden', marginTop: 18 }}>
            <div style={{ height: '100%', width: `${((buildStep + 1) / steps.length) * 100}%`, background: 'linear-gradient(90deg,var(--fg-orange,#ff1f35),#f97316)', transition: 'width 1.5s ease' }} />
          </div>
        </>) : (<>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🚀</div>
          <h2 style={S.h}>Your AI business OS is live</h2>
          <p style={S.sub}>{result.agentsCreated} agents created · {result.keywordsQueued} SEO keywords queued{result.subdomain ? ` · ${result.subdomain}.forge.app` : ''}</p>
          <p style={{ ...S.sub, fontStyle: 'italic' }}>Persona: {result.persona}</p>
          <button style={{ ...S.btn, ...S.primary, marginTop: 10 }} onClick={() => { onDone(); }}>Open my morning dashboard →</button>
        </>)}
      </div>
    </div>
  );

  const Q = [
    { title: 'What kind of business do you run?', body: (<>
        <input style={{ ...S.input, marginBottom: 12 }} placeholder="Business name (becomes your subdomain)" value={bizName} onChange={e => setBizName(e.target.value)} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {BIZ_TYPES.map(b => (
            <button key={b.id} onClick={() => setBizType(b.id)} style={{ ...S.btn, padding: '14px 8px', background: bizType === b.id ? 'var(--fg-orange,#ff1f35)' : 'var(--fg-bg4,#1a1a1e)', color: bizType === b.id ? '#fff' : 'var(--fg-text2,#ccc)', border: '1px solid var(--fg-border2,rgba(255,255,255,0.11))' }}>{b.label}</button>
          ))}
        </div></>) },
    { title: 'What city or cities do you serve?', body: (<>
        <input style={S.input} placeholder="Austin, Round Rock, Cedar Park" value={cities} onChange={e => setCities(e.target.value)} />
        <p style={{ ...S.sub, marginTop: 10 }}>And what services do you offer? (comma-separated — powers your SEO engine)</p>
        <input style={S.input} placeholder="Drain cleaning, Water heater repair, Leak detection" value={services} onChange={e => setServices(e.target.value)} /></>) },
    { title: "What's your biggest daily headache?", body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PAINS.map(p => (
            <button key={p} onClick={() => setPain(p)} style={{ ...S.btn, textAlign: 'left', padding: '12px 14px', background: pain === p ? 'var(--fg-odim2,rgba(255,31,53,0.22))' : 'var(--fg-bg4,#1a1a1e)', color: 'var(--fg-text,#f0f1f5)', border: `1px solid ${pain === p ? 'var(--fg-orange,#ff1f35)' : 'var(--fg-border2,rgba(255,255,255,0.11))'}` }}>{p}</button>
          ))}
        </div>) },
    { title: 'Your brand', body: (<>
        <input style={{ ...S.input, marginBottom: 12 }} placeholder="Logo URL (optional)" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} />
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: 'var(--fg-text3,#888)' }}>Primary <input type="color" value={primary} onChange={e => setPrimary(e.target.value)} style={{ marginLeft: 6, verticalAlign: 'middle' }} /></label>
          <label style={{ fontSize: 12, color: 'var(--fg-text3,#888)' }}>Secondary <input type="color" value={secondary} onChange={e => setSecondary(e.target.value)} style={{ marginLeft: 6, verticalAlign: 'middle' }} /></label>
        </div></>) },
    { title: 'Connect your tools', body: (<>
        <p style={S.sub}>Pick what you use — Forge wires automations around them.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TOOLS.map(t => (
            <button key={t} onClick={() => setTools(x => x.includes(t) ? x.filter(y => y !== t) : [...x, t])} style={{ ...S.btn, background: tools.includes(t) ? 'var(--fg-orange,#ff1f35)' : 'var(--fg-bg4,#1a1a1e)', color: tools.includes(t) ? '#fff' : 'var(--fg-text2,#ccc)', border: '1px solid var(--fg-border2,rgba(255,255,255,0.11))' }}>{t}</button>
          ))}
        </div></>) },
  ];

  return (
    <div style={S.panel}>
      <div style={{ ...S.modal, width: 'min(560px,94vw)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={S.tag}>Step {step + 1} / {Q.length}</span>
          <button onClick={onClose} style={{ ...S.btn, ...S.ghostBtn, padding: '3px 9px' }}>✕</button>
        </div>
        <h2 style={S.h}>{Q[step].title}</h2>
        <div style={{ margin: '16px 0 20px' }}>{Q[step].body}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button disabled={step === 0} onClick={() => setStep(s => s - 1)} style={{ ...S.btn, ...S.ghostBtn, opacity: step === 0 ? 0.3 : 1 }}>← Back</button>
          {step < Q.length - 1
            ? <button onClick={() => setStep(s => s + 1)} style={{ ...S.btn, ...S.primary }}>Next →</button>
            : <button onClick={submit} style={{ ...S.btn, ...S.primary }}>⚡ Build my workspace</button>}
        </div>
      </div>
    </div>
  );
}

// ─── Approval inbox card ─────────────────────────────────────────────────────
const TYPE_META: Record<string, { icon: string; label: string; verb: string }> = {
  seo_page: { icon: '📄', label: 'New SEO Page Ready', verb: 'Publish' },
  social_post: { icon: '📱', label: 'Social Post', verb: 'Schedule' },
  email: { icon: '📧', label: 'Email Campaign', verb: 'Send' },
  sms: { icon: '💬', label: 'SMS', verb: 'Send' },
  review_request: { icon: '⭐', label: 'Review Request', verb: 'Send' },
};

function ApprovalCard({ a, api, onResolved }: { a: any; api: Api; onResolved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(a.content || '');
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const meta = TYPE_META[a.type] || { icon: '🤖', label: a.type, verb: 'Approve' };
  const pv = (() => { try { return JSON.parse(a.preview_data || '{}'); } catch { return {}; } })();
  const act = async (action: string, body?: any) => {
    setBusy(true);
    try { await api(`/approvals/${a.id}/${action}`, { method: 'POST', body: JSON.stringify(body || {}) }); onResolved(); }
    catch {} finally { setBusy(false); }
  };
  return (
    <div style={S.card} className="fg-approval-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)' }}>{meta.icon} {meta.label}</div>
          <div style={{ fontSize: 12, color: 'var(--fg-text2,#ccc)', marginTop: 3 }}>{a.title}</div>
          <div style={{ fontSize: 10, color: 'var(--fg-text3,#888)', marginTop: 3 }}>
            {a.platform && <span style={S.tag}>{a.platform}</span>}
            {pv.word_count ? `${pv.word_count} words · ` : ''}
            {a.scheduled_for ? `scheduled ${new Date(a.scheduled_for).toLocaleDateString()}` : new Date(a.created_at + 'Z').toLocaleString()}
          </div>
        </div>
      </div>
      {preview && !editing && (
        <div style={{ marginTop: 10, padding: 10, background: 'var(--fg-bg4,#1a1a1e)', borderRadius: 8, fontSize: 12, color: 'var(--fg-text2,#ccc)', maxHeight: 240, overflow: 'auto', whiteSpace: 'pre-wrap' }}
          dangerouslySetInnerHTML={a.type === 'seo_page' ? { __html: content } : undefined}
        >{a.type === 'seo_page' ? undefined : content}</div>
      )}
      {editing && (
        <textarea style={{ ...S.input, marginTop: 10, minHeight: 140, fontFamily: 'inherit' }} value={content} onChange={e => setContent(e.target.value)} />
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button style={{ ...S.btn, ...S.ghostBtn, fontSize: 11 }} onClick={() => setPreview(p => !p)}>{preview ? 'Hide' : 'Preview'}</button>
        {!editing
          ? <button style={{ ...S.btn, ...S.ghostBtn, fontSize: 11 }} onClick={() => { setEditing(true); setPreview(false); }}>✏️ Edit</button>
          : <button style={{ ...S.btn, ...S.ghostBtn, fontSize: 11 }} onClick={async () => { await act('edit', { content }); setEditing(false); }}>💾 Save</button>}
        <div style={{ flex: 1 }} />
        <button disabled={busy} style={{ ...S.btn, fontSize: 11, background: 'rgba(248,113,113,0.15)', color: '#f87171' }} onClick={() => act('reject')}>❌ Skip</button>
        <button disabled={busy} style={{ ...S.btn, ...S.primary, fontSize: 11 }} onClick={() => act('approve', editing ? { content } : {})}>✅ {meta.verb}</button>
      </div>
    </div>
  );
}

// ─── Morning dashboard + approval inbox ──────────────────────────────────────
export function MorningDashboard({ api, username }: { api: Api; username?: string }) {
  const [data, setData] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const load = useCallback(async () => { try { const d = await api('/morning-dashboard'); if (d?.success) setData(d.data); } catch {} }, [api]);
  useEffect(() => { load(); const t = setInterval(load, 45000); return () => clearInterval(t); }, [load]);
  const runNow = async () => {
    setRunning(true);
    try { await api('/nightly/run', { method: 'POST', body: '{}' }); await load(); } catch {} finally { setRunning(false); }
  };
  const s = data?.lastRun?.summary || {};
  const approvals = data?.approvals || [];
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <div>
      <div style={{ ...S.card, background: 'linear-gradient(135deg, rgba(255,31,53,0.10), rgba(14,165,233,0.06))' }} className="fg-living">
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg-text,#f0f1f5)' }}>🌅 {greet}{username ? `, ${username}` : ''}. Here's your day.</div>
        <div style={{ fontSize: 12, color: 'var(--fg-text2,#ccc)', marginTop: 4 }}>
          {approvals.length > 0 ? `${approvals.length} thing${approvals.length === 1 ? '' : 's'} need your approval.` : 'Nothing needs your approval. All clear. ✨'}
        </div>
      </div>
      {data?.lastRun && (
        <div style={S.card}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)', marginBottom: 8 }}>
            Last Night's Run {data.lastRun.status === 'complete' ? '✅' : '⚠️'} <span style={{ fontWeight: 400, color: 'var(--fg-text3,#888)' }}>[{new Date(data.lastRun.started_at + 'Z').toLocaleString()}]</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-text2,#ccc)', lineHeight: 1.9 }}>
            📄 {s.seo_pages || 0} new SEO pages drafted<br />
            📱 {s.social_posts || 0} posts scheduled for this week<br />
            ⭐ {s.review_requests || 0} review requests in flight<br />
            🌐 {data.publishedPages || 0} pages live total
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button disabled={running} style={{ ...S.btn, ...S.ghostBtn }} onClick={runNow}>{running ? <span className="fg-tool-running" style={{ display: 'inline-block' }}>⚙️</span> : '🌙'} {running ? 'Agents working…' : 'Run nightly pipeline now'}</button>
        {approvals.length > 1 && (
          <button style={{ ...S.btn, ...S.primary }} onClick={async () => { await api('/approvals/approve-all', { method: 'POST', body: '{}' }); load(); }}>✅ Approve All {approvals.length}</button>
        )}
      </div>
      {approvals.map((a: any) => <ApprovalCard key={a.id} a={a} api={api} onResolved={load} />)}
      {approvals.length === 0 && !data?.lastRun && (
        <div style={{ ...S.card, textAlign: 'center', color: 'var(--fg-text3,#888)', fontSize: 12 }}>
          No runs yet. Hit "Run nightly pipeline now" to watch Forge work, or finish onboarding so it runs at 2am automatically.
        </div>
      )}
    </div>
  );
}

// ─── Agent roster browser ────────────────────────────────────────────────────
export function AgentRoster({ api }: { api: Api }) {
  const [roster, setRoster] = useState<any[]>([]);
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  useEffect(() => { (async () => { try { const d = await api('/agents/roster'); if (d?.success) setRoster(d.data); } catch {} })(); }, [api]);
  const groups: Record<string, string> = { operations: '💼 Business Operations', execution: '⚡ Execution', intelligence: '🔬 Intelligence', moonshot: '🌌 Moonshots' };
  return (
    <div>
      {Object.entries(groups).map(([g, label]) => (
        <div key={g}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--fg-text2,#ccc)', margin: '14px 0 8px' }}>{label}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 8 }}>
            {roster.filter(r => r.group === g).map(r => (
              <div key={r.id} style={{ ...S.card, marginBottom: 0, borderLeft: `3px solid ${r.color}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)' }}>{r.name}</div>
                <div style={{ fontSize: 10, color: 'var(--fg-text3,#888)', margin: '4px 0 8px', lineHeight: 1.5 }}>{r.prompt.slice(0, 90)}…</div>
                <button style={{ ...S.btn, fontSize: 10, padding: '4px 10px', background: installed.has(r.id) ? 'var(--fg-bg4,#1a1a1e)' : 'var(--fg-odim2,rgba(255,31,53,0.22))', color: installed.has(r.id) ? 'var(--fg-text3,#888)' : 'var(--fg-orange2,#ff4d5e)' }}
                  onClick={async () => { try { await api(`/agents/roster/${r.id}/install`, { method: 'POST', body: '{}' }); setInstalled(x => new Set([...Array.from(x), r.id])); } catch {} }}>
                  {installed.has(r.id) ? '✓ Installed' : '+ Install'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Magic Reply ─────────────────────────────────────────────────────────────
export function MagicReply({ api }: { api: Api }) {
  const [msg, setMsg] = useState('');
  const [sender, setSender] = useState('');
  const [channel, setChannel] = useState('email');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true); setReply('');
    try { const d = await api('/magic-reply', { method: 'POST', body: JSON.stringify({ message: msg, sender, channel }) }); if (d?.success) setReply(d.data.reply); else setReply('⚠️ ' + (d?.error || 'failed')); }
    catch (e: any) { setReply('⚠️ ' + e.message); } finally { setBusy(false); }
  };
  return (
    <div>
      <p style={S.sub}>Paste any email / Slack / DM. Forge drafts the perfect reply in your voice — one tap to copy.</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input style={{ ...S.input, flex: 1 }} placeholder="From (name/email)" value={sender} onChange={e => setSender(e.target.value)} />
        <select style={{ ...S.input, width: 120 }} value={channel} onChange={e => setChannel(e.target.value)}>
          <option value="email">Email</option><option value="slack">Slack</option><option value="dm">DM</option><option value="sms">SMS</option>
        </select>
      </div>
      <textarea style={{ ...S.input, minHeight: 110 }} placeholder="Paste the message you received…" value={msg} onChange={e => setMsg(e.target.value)} />
      <button disabled={busy || !msg.trim()} style={{ ...S.btn, ...S.primary, marginTop: 8 }} onClick={go}>{busy ? <span className="fg-tool-running" style={{ display: 'inline-block' }}>✨</span> : '✨'} Magic Reply</button>
      {reply && (
        <div style={{ ...S.card, marginTop: 12 }} className={busy ? 'fg-ghost-text' : ''}>
          <div style={{ fontSize: 12, whiteSpace: 'pre-wrap', color: 'var(--fg-text,#f0f1f5)', lineHeight: 1.6 }}>{reply}</div>
          <button style={{ ...S.btn, ...S.ghostBtn, fontSize: 11, marginTop: 8 }} onClick={() => { navigator.clipboard?.writeText(reply); }}>📋 Copy</button>
        </div>
      )}
    </div>
  );
}

// ─── Agent Cinema ────────────────────────────────────────────────────────────
export function AgentCinema({ api }: { api: Api }) {
  const [runs, setRuns] = useState<any[]>([]);
  useEffect(() => {
    let live = true;
    const load = async () => { try { const d = await api('/nightly/runs'); if (live && d?.success) setRuns(d.data); } catch {} };
    load(); const t = setInterval(load, 15000);
    return () => { live = false; clearInterval(t); };
  }, [api]);
  return (
    <div>
      <p style={S.sub}>Watch your agents work — every overnight run, through glass.</p>
      {runs.length === 0 && <div style={{ ...S.card, textAlign: 'center', color: 'var(--fg-text3,#888)', fontSize: 12 }}>No runs yet.</div>}
      {runs.map(r => (
        <div key={r.id} style={S.card} className={r.status === 'running' ? 'fg-living-active' : ''}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)' }}>
            <span>{r.status === 'running' ? <span className="fg-tool-running" style={{ display: 'inline-block' }}>⚙️</span> : r.status === 'complete' ? '✅' : '⚠️'} Nightly run</span>
            <span style={{ fontWeight: 400, color: 'var(--fg-text3,#888)' }}>{new Date(r.started_at + 'Z').toLocaleString()}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-text2,#ccc)', marginTop: 6 }}>
            📄 {r.summary?.seo_pages || 0} SEO pages · 📱 {r.summary?.social_posts || 0} posts · ⭐ {r.summary?.review_requests || 0} reviews
            {(r.summary?.errors || []).length > 0 && <div style={{ color: '#f87171', marginTop: 4 }}>⚠ {(r.summary.errors as string[]).slice(0, 3).join(' · ')}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Voice-First Forge ("Hey Forge") ────────────────────────────────────────
export function VoiceForge({ api }: { api: Api }) {
  const [active, setActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speech, setSpeech] = useState('');
  const recRef = useRef<any>(null);
  const speak = (text: string) => {
    try { const u = new SpeechSynthesisUtterance(text); u.rate = 1.05; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch {}
  };
  const handle = useCallback(async (text: string) => {
    setTranscript(text);
    try {
      if (/morning|brief|update/.test(text.toLowerCase())) {
        const d = await api('/voice/brief'); if (d?.success) { setSpeech(d.data.text); speak(d.data.text); return; }
      }
      const d = await api('/voice/command', { method: 'POST', body: JSON.stringify({ text }) });
      if (d?.success) { setSpeech(d.data.speech); speak(d.data.speech); }
    } catch (e: any) { setSpeech('⚠️ ' + e.message); }
  }, [api]);
  const start = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) { setSpeech('Voice not supported in this browser.'); return; }
    const rec = new SR(); recRef.current = rec;
    rec.continuous = true; rec.interimResults = false; rec.lang = 'en-US';
    rec.onresult = (e: any) => {
      const text = Array.from(e.results).slice(e.resultIndex).map((r: any) => r[0].transcript).join(' ').trim();
      if (!active && /hey forge/i.test(text)) { setActive(true); speak('Yes?'); return; }
      if (text) handle(text.replace(/hey forge/i, '').trim() || text);
    };
    rec.onend = () => { try { if (recRef.current === rec) rec.start(); } catch { setListening(false); } };
    try { rec.start(); setListening(true); } catch {}
  };
  const stop = () => { try { const r = recRef.current; recRef.current = null; r?.stop(); } catch {} setListening(false); setActive(false); window.speechSynthesis?.cancel(); };
  useEffect(() => () => { try { recRef.current?.stop(); } catch {} }, []);
  return (
    <div>
      <p style={S.sub}>Say <b style={{ color: 'var(--fg-orange2,#ff4d5e)' }}>"Hey Forge"</b> then talk. Ask for your morning brief, say "approve all", or anything else. Forge answers out loud.</p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {!listening
          ? <button style={{ ...S.btn, ...S.primary }} onClick={start}>🎙️ Start listening</button>
          : <button style={{ ...S.btn, background: 'rgba(248,113,113,0.2)', color: '#f87171' }} onClick={stop}>⏹ Stop</button>}
        {listening && <span className="fg-ghost-text" style={{ fontSize: 11, color: 'var(--fg-orange2,#ff4d5e)' }}>{active ? '● Forge is listening to you' : '○ waiting for "Hey Forge"…'}</span>}
      </div>
      {transcript && <div style={{ ...S.card, marginTop: 12 }}><div style={{ fontSize: 10, color: 'var(--fg-text3,#888)' }}>You said</div><div style={{ fontSize: 12, color: 'var(--fg-text,#f0f1f5)' }}>{transcript}</div></div>}
      {speech && <div style={{ ...S.card, borderLeft: '3px solid var(--fg-orange,#ff1f35)' }}><div style={{ fontSize: 10, color: 'var(--fg-text3,#888)' }}>Forge</div><div style={{ fontSize: 12, color: 'var(--fg-text,#f0f1f5)', lineHeight: 1.6 }}>{speech}</div></div>}
    </div>
  );
}

// ─── Marketplace ─────────────────────────────────────────────────────────────
const MARKET_APPS = [
  { id: 'reputation', name: 'ReputationGuard', icon: '⭐', desc: 'Auto-respond to reviews, flag negatives', category: 'Marketing' },
  { id: 'seo', name: 'SEO Engine', icon: '🔍', desc: 'Nightly content stubs, keyword tracking', category: 'Marketing' },
  { id: 'debt', name: 'DebtChaser', icon: '💰', desc: 'Automated invoice follow-up sequences', category: 'Finance' },
  { id: 'social', name: 'SocialPilot', icon: '📱', desc: 'Schedule & post across all channels', category: 'Marketing' },
  { id: 'leads', name: 'LeadNurturer', icon: '🎯', desc: 'Drip sequences for cold + warm leads', category: 'Sales' },
  { id: 'competitor', name: 'CompetitorWatch', icon: '🔭', desc: 'Monitor rival pricing, reviews, news', category: 'Intel' },
];

export function ForgeMarketplace({ api }: { api: Api }) {
  const [installed, setInstalled] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    api('/marketplace').then(d => { if (live) { setInstalled((d?.data?.installed || []).map((x: any) => x.app_id)); setLoading(false); } }).catch(() => setLoading(false));
    return () => { live = false; };
  }, [api]);

  const toggle = async (id: string) => {
    setBusy(id);
    try {
      const isOn = installed.includes(id);
      await api(`/marketplace/${id}/${isOn ? 'uninstall' : 'install'}`, { method: 'POST' });
      setInstalled(prev => isOn ? prev.filter(x => x !== id) : [...prev, id]);
    } catch (e: any) { alert(e.message); }
    setBusy(null);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 24, color: 'var(--fg-text3,#888)' }}>Loading marketplace…</div>;

  return (
    <div>
      <h3 style={S.h}>App Marketplace</h3>
      <p style={S.sub}>Install AI-powered apps for your workspace</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
        {MARKET_APPS.map(app => {
          const on = installed.includes(app.id);
          return (
            <div key={app.id} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{app.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)' }}>{app.name}</div>
                  <span style={S.tag}>{app.category}</span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--fg-text3,#888)', margin: 0 }}>{app.desc}</p>
              <button
                disabled={busy === app.id}
                onClick={() => toggle(app.id)}
                style={{ ...S.btn, ...(on ? { background: 'rgba(248,113,113,0.15)', color: '#f87171' } : S.primary), marginTop: 4 }}>
                {busy === app.id ? '…' : on ? 'Uninstall' : 'Install'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Universal Agents ─────────────────────────────────────────────────────────
const AGENTS = [
  { id: 'debt_chaser', icon: '💰', name: 'DebtChaser', desc: 'Chase overdue invoices via email/SMS' },
  { id: 'reputation_guard', icon: '⭐', name: 'ReputationGuard', desc: 'Respond to new reviews automatically' },
  { id: 'competitor_watch', icon: '🔭', name: 'CompetitorWatch', desc: 'Scan competitor sites & alert changes' },
  { id: 'content_engine', icon: '✍️', name: 'ContentEngine', desc: 'Generate week of social + blog content' },
  { id: 'lead_nurturer', icon: '🎯', name: 'LeadNurturer', desc: 'Send nurture sequence to cold leads' },
];

export function UniversalAgents({ api }: { api: Api }) {
  const [results, setResults] = useState<Record<string, any>>({});
  const [running, setRunning] = useState<string | null>(null);

  const run = async (id: string) => {
    setRunning(id);
    try {
      const d = await api(`/agents/${id}/run`, { method: 'POST' });
      setResults(prev => ({ ...prev, [id]: d?.data || { message: 'Done' } }));
    } catch (e: any) {
      setResults(prev => ({ ...prev, [id]: { error: e.message } }));
    }
    setRunning(null);
  };

  return (
    <div>
      <h3 style={S.h}>Universal Agents</h3>
      <p style={S.sub}>One-click AI agents that run end-to-end tasks</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {AGENTS.map(a => {
          const res = results[a.id];
          return (
            <div key={a.id} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{a.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)' }}>{a.name}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-text3,#888)' }}>{a.desc}</div>
                {res && (
                  <div style={{ fontSize: 11, marginTop: 4, color: res.error ? '#f87171' : '#4ade80' }}>
                    {res.error ? `Error: ${res.error}` : res.message || `✓ ${JSON.stringify(res).slice(0,60)}`}
                  </div>
                )}
              </div>
              <button
                disabled={running === a.id}
                onClick={() => run(a.id)}
                style={{ ...S.btn, ...S.primary, flexShrink: 0 }}>
                {running === a.id ? <span className="fg-tool-running">⚙️</span> : 'Run'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Forge Modes ─────────────────────────────────────────────────────────────
const MODES = [
  { id: 'default', icon: '🌐', name: 'Standard', desc: 'Full Forge interface' },
  { id: 'focus', icon: '🎯', name: 'Focus', desc: 'Hide distractions, just the chat' },
  { id: 'warroom', icon: '⚡', name: 'War Room', desc: 'Parallel agent runs visible' },
  { id: 'overnight', icon: '🌙', name: 'Overnight', desc: 'Queue tasks, run while you sleep' },
  { id: 'copilot', icon: '🤖', name: 'Co-Pilot', desc: 'AI suggests replies & next actions' },
];

export function ForgeModes({ onModeChange }: { onModeChange?: (mode: string) => void }) {
  const [active, setActive] = useState<string>(() => {
    try { return localStorage.getItem('forge_mode') || 'default'; } catch { return 'default'; }
  });

  const select = (id: string) => {
    setActive(id);
    try { localStorage.setItem('forge_mode', id); } catch {}
    onModeChange?.(id);
  };

  return (
    <div>
      <h3 style={S.h}>Forge Modes</h3>
      <p style={S.sub}>Switch how Forge behaves for your current session</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10 }}>
        {MODES.map(m => {
          const on = active === m.id;
          return (
            <div key={m.id} onClick={() => select(m.id)} style={{
              ...S.card,
              cursor: 'pointer',
              border: on ? '1.5px solid var(--fg-orange,#ff1f35)' : S.card.border,
              background: on ? 'rgba(255,31,53,0.08)' : S.card.background,
              transition: 'all 0.15s',
            }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{m.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: on ? 'var(--fg-orange2,#ff4d5e)' : 'var(--fg-text,#f0f1f5)' }}>{m.name}</div>
              <div style={{ fontSize: 11, color: 'var(--fg-text3,#888)', marginTop: 2 }}>{m.desc}</div>
              {on && <div style={{ fontSize: 10, color: 'var(--fg-orange2,#ff4d5e)', marginTop: 6, fontWeight: 700 }}>● ACTIVE</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Autonomy Hub ─────────────────────────────────────────────────────────────
export function ForgeAutonomyHub({ api, username, onClose, onOpenOnboarding, onModeChange }: {
  api: Api; username?: string; onClose: () => void;
  onOpenOnboarding?: () => void; onModeChange?: (mode: string) => void;
}) {
  const [tab, setTab] = useState<'dashboard'|'approvals'|'agents'|'market'|'modes'|'voice'|'moonshots'|'hub'|'cascade'>('dashboard');
  const tabs: { id: typeof tab; label: string }[] = [
    { id: 'dashboard', label: '🌅 Morning' },
    { id: 'approvals', label: '✅ Approvals' },
    { id: 'agents', label: '🤖 Agents' },
    { id: 'market', label: '🛒 Market' },
    { id: 'modes', label: '⚡ Modes' },
    { id: 'voice', label: '🎙️ Voice' },
    { id: 'moonshots', label: '🚀 Moonshots' },
    { id: 'hub', label: '🤖 All Agents' },
    { id: 'cascade', label: '⚡ Cascade' },
  ];

  return (
    <div style={S.panel} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={S.modal}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ ...S.h, fontSize: 18 }}>Forge Autonomy OS</h2>
            {username && <p style={S.sub}>Welcome back, {username}</p>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {onOpenOnboarding && (
              <button onClick={onOpenOnboarding} style={{ ...S.btn, ...S.ghostBtn, fontSize: 11 }}>
                ⚙️ Setup
              </button>
            )}
            <button onClick={onClose} style={{ ...S.btn, ...S.ghostBtn }}>✕</button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: '1px solid var(--fg-border,rgba(255,255,255,0.06))', paddingBottom: 8, flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              ...S.btn,
              background: tab === t.id ? 'var(--fg-orange,#ff1f35)' : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--fg-text3,#888)',
              border: tab === t.id ? 'none' : '1px solid transparent',
            }}>{t.label}</button>
          ))}
        </div>

        {tab === 'dashboard' && <MorningDashboard api={api} />}
        {tab === 'approvals' && <MorningDashboard api={api} />}
        {tab === 'agents' && <UniversalAgents api={api} />}
        {tab === 'market' && <ForgeMarketplace api={api} />}
        {tab === 'modes' && <ForgeModes onModeChange={onModeChange} />}
        {tab === 'voice' && <VoiceForge api={api} />}
        {tab === 'moonshots' && <MoonshotAgents api={api} />}
        {tab === 'hub' && <AgentHub api={api} />}
        {tab === 'cascade' && <DroidPipeline api={api} />}
      </div>
    </div>
  );
}

// ─── Moonshot Agents ──────────────────────────────────────────────────────────
const MOONSHOTS = [
  { id: 'ghost', icon: '👻', name: 'Ghost Agent', desc: 'Silent email/Slack presence — acts only at 95%+ confidence', endpoint: '/agents/ghost/activate', method: 'POST' },
  { id: 'mentor', icon: '🎓', name: 'Mentor Agent', desc: 'Analyzes your patterns, coaches you to improve', endpoint: '/agents/mentor/analyze', method: 'POST' },
  { id: 'clone', icon: '🧬', name: 'Clone Agent', desc: 'Learns your exact writing voice, indistinguishable from you', endpoint: '/agents/clone/train', method: 'POST' },
  { id: 'watchdog', icon: '🐕', name: 'Watchdog Agent', desc: '24/7 monitor — wakes only when something needs attention', endpoint: '/agents/watchdog/configure', method: 'POST' },
  { id: 'negotiator', icon: '🤝', name: 'Negotiator Agent', desc: 'Handles vendor/client negotiations via email autonomously', endpoint: '/agents/negotiator/draft', method: 'POST' },
  { id: 'connector', icon: '🔗', name: 'Connector Agent', desc: 'Finds partnership opportunities, drafts intros, tracks follow-ups', endpoint: '/agents/connector/find', method: 'POST' },
];

export function MoonshotAgents({ api }: { api: Api }) {
  const [results, setResults] = useState<Record<string, any>>({});
  const [running, setRunning] = useState<string | null>(null);
  const [cloneSample, setCloneSample] = useState('');
  const [negotiatorGoal, setNegotiatorGoal] = useState('');

  const run = async (id: string, extra?: any) => {
    setRunning(id);
    try {
      const m = MOONSHOTS.find(x => x.id === id)!;
      const d = await api(m.endpoint, { method: m.method, body: JSON.stringify(extra || {}) });
      setResults(prev => ({ ...prev, [id]: d?.data || d }));
    } catch (e: any) {
      setResults(prev => ({ ...prev, [id]: { error: e.message } }));
    }
    setRunning(null);
  };

  return (
    <div>
      <h3 style={S.h}>Moonshot Agents</h3>
      <p style={S.sub}>AI agents that operate autonomously at a level users can't distinguish from humans</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {MOONSHOTS.map(m => {
          const res = results[m.id];
          return (
            <div key={m.id} style={{ ...S.card }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{m.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)', marginBottom: 2 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-text3,#888)', marginBottom: 8 }}>{m.desc}</div>

                  {m.id === 'clone' && !res && (
                    <div style={{ marginBottom: 8 }}>
                      <textarea
                        placeholder="Paste a sample of your writing (email, message)…"
                        value={cloneSample}
                        onChange={e => setCloneSample(e.target.value)}
                        style={{ ...S.input, height: 64, resize: 'vertical', marginBottom: 6 } as any}
                      />
                    </div>
                  )}
                  {m.id === 'negotiator' && !res && (
                    <input
                      placeholder="Negotiation goal (e.g. reduce vendor price by 15%)"
                      value={negotiatorGoal}
                      onChange={e => setNegotiatorGoal(e.target.value)}
                      style={{ ...S.input, marginBottom: 8 }}
                    />
                  )}

                  {res && (
                    <div style={{ fontSize: 11, marginTop: 4, padding: '8px 10px', background: 'var(--fg-bg4,#1a1a1e)', borderRadius: 6, color: res.error ? '#f87171' : '#4ade80', maxHeight: 120, overflowY: 'auto' }}>
                      {res.error ? `Error: ${res.error}` :
                        res.draft ? <span style={{ color: 'var(--fg-text,#f0f1f5)', fontSize: 11, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{res.draft.slice(0, 300)}{res.draft.length > 300 ? '…' : ''}</span> :
                        res.insight ? `💡 ${res.insight}` :
                        res.message || JSON.stringify(res).slice(0, 80)}
                    </div>
                  )}
                </div>
                <button
                  disabled={running === m.id}
                  onClick={() => {
                    if (m.id === 'clone') run(m.id, { samples: cloneSample ? [cloneSample] : [] });
                    else if (m.id === 'negotiator') run(m.id, { goal: negotiatorGoal, context: 'Business negotiation' });
                    else run(m.id);
                  }}
                  style={{ ...S.btn, ...S.primary, flexShrink: 0, alignSelf: 'flex-start' }}>
                  {running === m.id ? <span className="fg-tool-running">⚙️</span> : 'Activate'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Content Engine UI ────────────────────────────────────────────────────────
export function ContentEngine({ api }: { api: Api }) {
  const [tab, setTab] = useState<'create'|'schedule'|'publish'|'intel'>('create');
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [scheduled, setScheduled] = useState<any[]>([]);
  const [topPosts, setTopPosts] = useState<any[]>([]);
  const [abResult, setAbResult] = useState<any>(null);
  const [busy, setBusy] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [brandData, setBrandData] = useState<any>(null);

  const loadScheduled = async () => {
    const d = await api('/content/scheduled');
    setScheduled(d?.data?.posts || []);
  };
  const loadTop = async () => {
    const d = await api('/content/top-performers');
    setTopPosts(d?.data?.topPosts || []);
  };

  useEffect(() => { loadScheduled(); loadTop(); }, []);

  const genCaption = async () => {
    setBusy('caption');
    const d = await api('/content/generate-caption', { method: 'POST', body: JSON.stringify({ topic, platform }) });
    setCaption(d?.data?.caption || '');
    setBusy('');
  };

  const genImage = async () => {
    setBusy('image');
    const d = await api('/content/generate-image', { method: 'POST', body: JSON.stringify({ prompt: imagePrompt || topic }) });
    setImageUrl(d?.data?.url || '');
    setBusy('');
  };

  const schedulePost = async () => {
    if (!caption) return;
    setBusy('schedule');
    await api('/content/schedule', { method: 'POST', body: JSON.stringify({ platform, caption, imageUrl }) });
    setCaption(''); setImageUrl(''); setTopic('');
    await loadScheduled();
    setBusy('');
  };

  const runAbTest = async () => {
    if (!topic) return;
    setBusy('ab');
    const d = await api('/content/ab-test', { method: 'POST', body: JSON.stringify({ topic, platform }) });
    setAbResult(d?.data);
    setBusy('');
  };

  const autoBoost = async () => {
    setBusy('boost');
    const d = await api('/content/auto-boost', { method: 'POST', body: '{}' });
    alert(d?.data?.boosted ? `Boosted: ${d.data.boosted.caption}` : d?.error || 'No data yet');
    setBusy('');
    await loadScheduled();
  };

  const scrapeWebsite = async () => {
    if (!websiteUrl) return;
    setBusy('scrape');
    const d = await api('/content/scrape-brand', { method: 'POST', body: JSON.stringify({ websiteUrl }) });
    setBrandData(d?.data);
    setBusy('');
  };

  const tabs = [
    { id: 'create', label: '✍️ Create' },
    { id: 'schedule', label: '📅 Schedule' },
    { id: 'publish', label: '📤 Publish' },
    { id: 'intel', label: '📊 Intelligence' },
  ];

  return (
    <div>
      <h3 style={S.h}>Content Engine</h3>
      <p style={S.sub}>Create → Schedule → Publish → Optimize</p>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} style={{ ...S.btn, background: tab === t.id ? 'var(--fg-orange,#ff1f35)' : 'var(--fg-bg3,#1a1a1e)', color: tab === t.id ? '#fff' : 'var(--fg-text3,#888)', border: 'none' }}>{t.label}</button>
        ))}
      </div>

      {tab === 'create' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Brand scraper */}
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)', marginBottom: 8 }}>🌐 Brand Extractor</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://yourbusiness.com" style={{ ...S.input, flex: 1 }} />
              <button onClick={scrapeWebsite} disabled={busy==='scrape'} style={{ ...S.btn, ...S.primary }}>{busy==='scrape' ? '…' : 'Extract'}</button>
            </div>
            {brandData && <div style={{ marginTop: 8, fontSize: 11, color: '#4ade80' }}>✓ {brandData.brandName} · Colors: {brandData.colors?.slice(0,3).join(', ')}</div>}
          </div>

          {/* Caption gen */}
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)', marginBottom: 8 }}>✍️ Caption Generator</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="What's this post about?" style={{ ...S.input, flex: 1 }} />
              <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ ...S.input, width: 'auto', flexShrink: 0 }}>
                {['instagram','facebook','linkedin','twitter'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <button onClick={genCaption} disabled={busy==='caption'} style={{ ...S.btn, ...S.primary, marginBottom: 8 }}>{busy==='caption' ? '…' : '✨ Generate Caption'}</button>
            {caption && <textarea value={caption} onChange={e => setCaption(e.target.value)} style={{ ...S.input, height: 80, resize: 'vertical' } as any} />}
          </div>

          {/* Image gen */}
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)', marginBottom: 8 }}>🖼️ AI Image (DALL-E 3)</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} placeholder="Describe the image (or leave blank to use topic)" style={{ ...S.input, flex: 1 }} />
              <button onClick={genImage} disabled={busy==='image'} style={{ ...S.btn, ...S.primary }}>{busy==='image' ? '…' : 'Generate'}</button>
            </div>
            {imageUrl && <img src={imageUrl} alt="Generated" style={{ width: '100%', borderRadius: 8, maxHeight: 200, objectFit: 'cover' }} />}
          </div>

          <button onClick={schedulePost} disabled={!caption || busy==='schedule'} style={{ ...S.btn, ...S.primary, fontSize: 13 }}>
            {busy==='schedule' ? '…' : '📅 Schedule Post'}
          </button>
        </div>
      )}

      {tab === 'schedule' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--fg-text,#f0f1f5)' }}>{scheduled.length} posts queued</div>
            <button onClick={loadScheduled} style={{ ...S.btn, ...S.ghostBtn, fontSize: 11 }}>↻ Refresh</button>
          </div>
          {scheduled.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--fg-text3,#888)' }}>No posts scheduled. Create content first.</div>}
          {scheduled.map((p: any) => (
            <div key={p.id} style={{ ...S.card, display: 'flex', gap: 12 }}>
              {p.image_url && <img src={p.image_url} alt="" style={{ width: 60, height: 60, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                  <span style={S.tag}>{p.platform}</span>
                  <span style={{ ...S.tag, background: p.status==='published' ? 'rgba(74,222,128,0.15)' : 'rgba(251,191,36,0.15)', color: p.status==='published' ? '#4ade80' : '#fbbf24' }}>{p.status}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--fg-text2,#ccc)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.caption?.slice(0,80)}…</div>
                <div style={{ fontSize: 10, color: 'var(--fg-text3,#888)', marginTop: 4 }}>📅 {new Date(p.scheduled_for).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'publish' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ ...S.card, borderLeft: '3px solid var(--fg-orange,#ff1f35)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)', marginBottom: 6 }}>📘 Facebook + Instagram (Meta)</div>
            <div style={{ fontSize: 11, color: 'var(--fg-text3,#888)', marginBottom: 8 }}>Connect via Settings → Integrations → Meta. Then use the API directly with your Page Access Token.</div>
            <div style={{ fontSize: 11, color: '#4ade80' }}>Endpoints: POST /api/content/publish/meta</div>
          </div>
          <div style={{ ...S.card, borderLeft: '3px solid #0077b5' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)', marginBottom: 6 }}>💼 LinkedIn</div>
            <div style={{ fontSize: 11, color: 'var(--fg-text3,#888)', marginBottom: 8 }}>Requires LinkedIn OAuth token + authorUrn.</div>
            <div style={{ fontSize: 11, color: '#4ade80' }}>Endpoints: POST /api/content/publish/linkedin</div>
          </div>
          <div style={{ ...S.card, borderLeft: '3px solid #e31118' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)', marginBottom: 6 }}>📱 Twilio SMS</div>
            <div style={{ fontSize: 11, color: 'var(--fg-text3,#888)', marginBottom: 8 }}>Set TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM in Railway env vars.</div>
            <div style={{ fontSize: 11, color: '#4ade80' }}>Endpoints: POST /api/content/sms/send · /api/content/sms/sequence</div>
          </div>
        </div>
      )}

      {tab === 'intel' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={loadTop} style={{ ...S.btn, ...S.ghostBtn }}>↻ Top Performers</button>
            <button onClick={autoBoost} disabled={busy==='boost'} style={{ ...S.btn, ...S.primary }}>{busy==='boost' ? '…' : '⚡ Auto-Boost Best'}</button>
          </div>
          {topPosts.length === 0 && <div style={{ fontSize: 12, color: 'var(--fg-text3,#888)' }}>No performance data yet. Log metrics via API.</div>}
          {topPosts.map((p: any) => {
            const perf = p.performance ? JSON.parse(p.performance) : {};
            return (
              <div key={p.id} style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={S.tag}>{p.platform}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-orange2,#ff4d5e)' }}>Score: {perf.score?.toFixed(0) || 0}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--fg-text2,#ccc)' }}>{p.caption?.slice(0,80)}…</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 10, color: 'var(--fg-text3,#888)' }}>
                  <span>❤️ {perf.likes || 0}</span><span>👁️ {perf.reach || 0}</span><span>🖱️ {perf.clicks || 0}</span><span>🔁 {perf.shares || 0}</span>
                </div>
              </div>
            );
          })}

          {/* A/B Test */}
          <div style={{ ...S.card, marginTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)', marginBottom: 8 }}>🧪 A/B Caption Test</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic for A/B test" style={{ ...S.input, flex: 1 }} />
              <button onClick={runAbTest} disabled={busy==='ab'} style={{ ...S.btn, ...S.primary }}>{busy==='ab' ? '…' : 'Generate'}</button>
            </div>
            {abResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['A','B'].map(v => (
                  <div key={v} style={{ ...S.card, background: 'var(--fg-bg4,#1a1a1e)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-orange2,#ff4d5e)', marginBottom: 4 }}>Version {v}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-text,#f0f1f5)', lineHeight: 1.5 }}>{v==='A' ? abResult.captionA : abResult.captionB}</div>
                  </div>
                ))}
                <div style={{ fontSize: 10, color: 'var(--fg-text3,#888)' }}>Post both, then mark winner via Settings or API.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Agent Roster Full ────────────────────────────────────────────────────────
const AGENT_CATEGORIES = [
  { id: 'business', label: '💼 Business Ops', color: '#6366f1' },
  { id: 'industry', label: '🏭 Industry', color: '#f59e0b' },
  { id: 'execution', label: '⚡ Execution', color: '#22c55e' },
  { id: 'intelligence', label: '🔬 Intelligence', color: '#06b6d4' },
];

const AGENT_LIST = [
  { id:'cfo', name:'CFO', icon:'💰', cat:'business' }, { id:'coo', name:'COO', icon:'⚙️', cat:'business' },
  { id:'hr', name:'HR', icon:'👥', cat:'business' }, { id:'legal', name:'Legal', icon:'⚖️', cat:'business' },
  { id:'sales', name:'Sales', icon:'🎯', cat:'business' }, { id:'marketing', name:'Marketing', icon:'📣', cat:'business' },
  { id:'customer_success', name:'CS', icon:'💬', cat:'business' }, { id:'procurement', name:'Procurement', icon:'📦', cat:'business' },
  { id:'law_firm', name:'Law Firm', icon:'🏛️', cat:'industry' }, { id:'medical', name:'Medical', icon:'🏥', cat:'industry' },
  { id:'real_estate', name:'Real Estate', icon:'🏠', cat:'industry' }, { id:'restaurant', name:'Restaurant', icon:'🍽️', cat:'industry' },
  { id:'construction', name:'Construction', icon:'🏗️', cat:'industry' }, { id:'accounting', name:'Accounting', icon:'📊', cat:'industry' },
  { id:'agency', name:'Agency', icon:'🎨', cat:'industry' }, { id:'ecom', name:'Ecom', icon:'🛒', cat:'industry' },
  { id:'email_agent', name:'Email', icon:'📧', cat:'execution' }, { id:'calendar_agent', name:'Calendar', icon:'📅', cat:'execution' },
  { id:'document_agent', name:'Document', icon:'📄', cat:'execution' }, { id:'data_agent', name:'Data', icon:'📈', cat:'execution' },
  { id:'scraper_agent', name:'Scraper', icon:'🕷️', cat:'execution' }, { id:'monitor_agent', name:'Monitor', icon:'👁️', cat:'execution' },
  { id:'publisher_agent', name:'Publisher', icon:'📤', cat:'execution' }, { id:'outreach_agent', name:'Outreach', icon:'📬', cat:'execution' },
  { id:'strategist', name:'Strategist', icon:'♟️', cat:'intelligence' }, { id:'forecaster', name:'Forecaster', icon:'🔮', cat:'intelligence' },
  { id:'risk', name:'Risk', icon:'⚠️', cat:'intelligence' }, { id:'auditor', name:'Auditor', icon:'🔍', cat:'intelligence' },
  { id:'memory_agent', name:'Memory', icon:'🧠', cat:'intelligence' }, { id:'critic', name:'Critic', icon:'🎭', cat:'intelligence' },
];

const AGENT_MODES = ['solo','swarm','pipeline','debate','review','stealth','draft','teach'];

export function AgentHub({ api }: { api: Api }) {
  const [filterCat, setFilterCat] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [task, setTask] = useState('');
  const [context, setContext] = useState('');
  const [mode, setMode] = useState('solo');
  const [result, setResult] = useState<any>(null);
  const [running, setRunning] = useState(false);
  // Swarm
  const [swarmAgents, setSwarmAgents] = useState<string[]>([]);
  const [swarmTask, setSwarmTask] = useState('');
  const [swarmResult, setSwarmResult] = useState<any>(null);
  const [swarmRunning, setSwarmRunning] = useState(false);
  const [view, setView] = useState<'single'|'swarm'>('single');

  const filtered = filterCat === 'all' ? AGENT_LIST : AGENT_LIST.filter(a => a.cat === filterCat);

  const runAgent = async () => {
    if (!selectedAgent || !task) return;
    setRunning(true); setResult(null);
    try {
      const d = await api(`/agent/${selectedAgent}/run`, { method: 'POST', body: JSON.stringify({ task, context, mode }) });
      setResult(d?.data || d);
    } catch (e: any) { setResult({ error: e.message }); }
    setRunning(false);
  };

  const runSwarm = async () => {
    if (!swarmTask || !swarmAgents.length) return;
    setSwarmRunning(true); setSwarmResult(null);
    try {
      const d = await api('/agents/swarm', { method: 'POST', body: JSON.stringify({ task: swarmTask, agentIds: swarmAgents }) });
      setSwarmResult(d?.data);
    } catch (e: any) { setSwarmResult({ error: e.message }); }
    setSwarmRunning(false);
  };

  const toggleSwarmAgent = (id: string) => setSwarmAgents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id].slice(0, 5));

  return (
    <div>
      <h3 style={S.h}>Agent Hub</h3>
      <p style={S.sub}>30 specialized agents across business, industry, execution & intelligence</p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <button onClick={() => setView('single')} style={{ ...S.btn, background: view==='single' ? 'var(--fg-orange,#ff1f35)' : 'var(--fg-bg3)', color: view==='single' ? '#fff' : 'var(--fg-text3)', border:'none' }}>Single Agent</button>
        <button onClick={() => setView('swarm')} style={{ ...S.btn, background: view==='swarm' ? 'var(--fg-orange,#ff1f35)' : 'var(--fg-bg3)', color: view==='swarm' ? '#fff' : 'var(--fg-text3)', border:'none' }}>🐝 Swarm (parallel)</button>
      </div>

      {view === 'single' && (<>
        {/* Category filter */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
          <button onClick={() => setFilterCat('all')} style={{ ...S.btn, fontSize: 11, background: filterCat==='all' ? 'var(--fg-bg4)' : 'transparent', color: 'var(--fg-text3)', border: '1px solid var(--fg-border)' }}>All</button>
          {AGENT_CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setFilterCat(c.id)} style={{ ...S.btn, fontSize: 11, background: filterCat===c.id ? c.color : 'transparent', color: filterCat===c.id ? '#fff' : 'var(--fg-text3)', border: `1px solid ${filterCat===c.id ? c.color : 'var(--fg-border)'}` }}>{c.label}</button>
          ))}
        </div>

        {/* Agent grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: 8, marginBottom: 16 }}>
          {filtered.map(a => (
            <div key={a.id} onClick={() => setSelectedAgent(a.id)} style={{
              ...S.card, textAlign: 'center', cursor: 'pointer', padding: '10px 6px',
              border: selectedAgent===a.id ? '1.5px solid var(--fg-orange,#ff1f35)' : S.card.border,
              background: selectedAgent===a.id ? 'rgba(255,31,53,0.08)' : S.card.background,
            }}>
              <div style={{ fontSize: 20 }}>{a.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: selectedAgent===a.id ? 'var(--fg-orange2,#ff4d5e)' : 'var(--fg-text2,#ccc)', marginTop: 4 }}>{a.name}</div>
            </div>
          ))}
        </div>

        {selectedAgent && (<>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--fg-text3,#888)', marginBottom: 4 }}>Mode</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {AGENT_MODES.map(m => (
                <button key={m} onClick={() => setMode(m)} style={{ ...S.btn, fontSize: 10, background: mode===m ? 'var(--fg-orange,#ff1f35)' : 'var(--fg-bg4)', color: mode===m ? '#fff' : 'var(--fg-text3)', border:'none' }}>{m}</button>
              ))}
            </div>
          </div>
          <textarea value={task} onChange={e => setTask(e.target.value)} placeholder={`Task for ${AGENT_LIST.find(a=>a.id===selectedAgent)?.name}…`} style={{ ...S.input, height: 72, resize: 'vertical', marginBottom: 8 } as any} />
          <textarea value={context} onChange={e => setContext(e.target.value)} placeholder="Optional context (data, background, constraints)…" style={{ ...S.input, height: 48, resize: 'vertical', marginBottom: 8 } as any} />
          <button onClick={runAgent} disabled={!task || running} style={{ ...S.btn, ...S.primary, width: '100%', marginBottom: 12 }}>
            {running ? <span className="fg-tool-running">⚙️</span> : `▶ Run ${AGENT_LIST.find(a=>a.id===selectedAgent)?.name} [${mode}]`}
          </button>
        </>)}

        {result && (
          <div style={{ ...S.card, borderLeft: '3px solid var(--fg-orange,#ff1f35)' }}>
            {result.error ? <div style={{ color: '#f87171', fontSize: 12 }}>Error: {result.error}</div> : (<>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <span style={S.tag}>{result.agent}</span>
                <span style={{ ...S.tag, background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>{result.mode}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--fg-text,#f0f1f5)', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto' }}>{result.output}</div>
            </>)}
          </div>
        )}
      </>)}

      {view === 'swarm' && (<>
        <p style={{ ...S.sub, marginBottom: 12 }}>Select up to 5 agents to run in parallel on the same task</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: 8, marginBottom: 16 }}>
          {AGENT_LIST.map(a => (
            <div key={a.id} onClick={() => toggleSwarmAgent(a.id)} style={{
              ...S.card, textAlign: 'center', cursor: 'pointer', padding: '10px 6px',
              border: swarmAgents.includes(a.id) ? '1.5px solid #22c55e' : S.card.border,
              background: swarmAgents.includes(a.id) ? 'rgba(34,197,94,0.08)' : S.card.background,
            }}>
              <div style={{ fontSize: 20 }}>{a.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: swarmAgents.includes(a.id) ? '#4ade80' : 'var(--fg-text2,#ccc)', marginTop: 4 }}>{a.name}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--fg-text3,#888)', marginBottom: 8 }}>{swarmAgents.length}/5 agents selected</div>
        <textarea value={swarmTask} onChange={e => setSwarmTask(e.target.value)} placeholder="Task to run across all selected agents…" style={{ ...S.input, height: 72, resize: 'vertical', marginBottom: 8 } as any} />
        <button onClick={runSwarm} disabled={!swarmTask || swarmAgents.length === 0 || swarmRunning} style={{ ...S.btn, ...S.primary, width: '100%', marginBottom: 12 }}>
          {swarmRunning ? <span className="fg-tool-running">⚙️</span> : `🐝 Run Swarm (${swarmAgents.length} agents)`}
        </button>
        {swarmResult && !swarmResult.error && Object.entries(swarmResult.results || {}).map(([id, output]: [string, any]) => (
          <div key={id} style={{ ...S.card, marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-orange2,#ff4d5e)', marginBottom: 6 }}>
              {AGENT_LIST.find(a=>a.id===id)?.icon} {AGENT_LIST.find(a=>a.id===id)?.name || id}
            </div>
            <div style={{ fontSize: 11, color: 'var(--fg-text,#f0f1f5)', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto' }}>{output}</div>
          </div>
        ))}
        {swarmResult?.error && <div style={{ color: '#f87171', fontSize: 12 }}>Error: {swarmResult.error}</div>}
      </>)}
    </div>
  );
}

// ─── CASCADE — multi-agent chain orchestration ─────────────────────────────────
export function DroidPipeline({ api }: { api: Api }) {
  const [task, setTask] = useState('');
  const [context, setContext] = useState('');
  const [maxSteps, setMaxSteps] = useState(5);
  const [planSteps, setPlanSteps] = useState<any[]>([]);
  const [planning, setPlanning] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [tab, setTab] = useState<'plan'|'run'>('plan');

  const previewPlan = async () => {
    if (!task.trim()) return;
    setPlanning(true); setPlanSteps([]); setResult(null);
    try {
      const d = await api('/api/agents/pipeline/plan', { method: 'POST', body: JSON.stringify({ task, maxSteps }) });
      if (d.success) setPlanSteps(d.data.steps || []);
    } catch {}
    setPlanning(false);
  };

  const runPipeline = async () => {
    if (!task.trim()) return;
    setRunning(true); setResult(null); setActiveStep(0); setTab('run');
    try {
      const d = await api('/api/agents/pipeline/run', { method: 'POST', body: JSON.stringify({ task, context, maxSteps }) });
      if (d.success) {
        setResult(d.data);
        setActiveStep(null);
      }
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setRunning(false);
  };

  const AGENT_COLORS: Record<string, string> = {
    cfo:'#f59e0b', coo:'#3b82f6', hr:'#a78bfa', legal:'#f87171',
    sales:'#34d399', marketing:'#fb923c', strategist:'#e879f9',
    forecaster:'#38bdf8', risk:'#f43f5e', auditor:'#fbbf24',
    data_agent:'#67e8f9', scraper_agent:'#4ade80', monitor_agent:'#c084fc',
    critic:'#f9a8d4', memory_agent:'#a5f3fc',
  };

  const stepsToShow = result?.steps || planSteps;
  const hasResult = !!result && !result.error;

  return (
    <div style={{ padding: '0 2px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ fontSize: 22 }}>⚡</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)' }}>Cascade</div>
          <div style={{ fontSize: 11, color: 'var(--fg-text3,#888)' }}>Multi-agent chain — each agent builds on the last, autonomously</div>
        </div>
      </div>

      <textarea
        value={task}
        onChange={e => setTask(e.target.value)}
        placeholder="Describe the task for the droid to execute autonomously…"
        style={{ width: '100%', background: 'var(--fg-bg2,#1a1a2e)', border: '1px solid var(--fg-border,#2a2a3e)', borderRadius: 8, padding: 10, color: 'var(--fg-text,#f0f1f5)', fontSize: 12, resize: 'vertical', height: 72, outline: 'none', boxSizing: 'border-box' } as any}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 4 }}>
        <textarea
          value={context}
          onChange={e => setContext(e.target.value)}
          placeholder="Optional context…"
          style={{ flex: 1, background: 'var(--fg-bg2,#1a1a2e)', border: '1px solid var(--fg-border,#2a2a3e)', borderRadius: 8, padding: 8, color: 'var(--fg-text3,#888)', fontSize: 11, resize: 'none', height: 40, outline: 'none' } as any}
        />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ fontSize: 10, color: 'var(--fg-text3,#888)' }}>Steps</div>
          <select value={maxSteps} onChange={e => setMaxSteps(Number(e.target.value))}
            style={{ background: 'var(--fg-bg2,#1a1a2e)', border: '1px solid var(--fg-border,#2a2a3e)', borderRadius: 6, padding: '4px 8px', color: 'var(--fg-text,#f0f1f5)', fontSize: 12 }}>
            {[2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={previewPlan} disabled={!task.trim() || planning || running}
          style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid var(--fg-border,#2a2a3e)', background: 'var(--fg-bg2,#1a1a2e)', color: 'var(--fg-text,#f0f1f5)', fontSize: 12, cursor: 'pointer' }}>
          {planning ? '⏳ Planning…' : '🗺️ Preview Plan'}
        </button>
        <button onClick={runPipeline} disabled={!task.trim() || running}
          style={{ flex: 2, padding: '8px 0', borderRadius: 8, border: 'none', background: running ? '#3a1a2e' : 'linear-gradient(135deg,#ff1f35,#ff6b35)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          {running ? '⚡ Cascade Running…' : '⚡ Run Cascade'}
        </button>
      </div>

      {stepsToShow.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-text3,#888)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            {hasResult ? `✅ Pipeline Complete — ${result.stepsExecuted} steps` : `📋 Plan — ${stepsToShow.length} steps`}
          </div>
          {stepsToShow.map((step: any, i: number) => {
            const isActive = running && activeStep === i;
            const isDone = hasResult;
            const stepResult = result?.steps?.[i];
            const accentColor = AGENT_COLORS[step.agentId] || '#a78bfa';
            return (
              <div key={i} style={{ marginBottom: 6, borderRadius: 8, border: `1px solid ${isActive ? accentColor : 'var(--fg-border,#2a2a3e)'}`, background: isActive ? 'rgba(255,31,53,0.06)' : 'var(--fg-bg2,#1a1a2e)', overflow: 'hidden', transition: 'border 0.2s' }}>
                <div onClick={() => isDone && setExpandedStep(expandedStep === i ? null : i)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', cursor: isDone ? 'pointer' : 'default' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {isActive ? '⚙' : isDone && stepResult?.status === 'done' ? '✓' : step.stepNum}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-text,#f0f1f5)' }}>{step.title}</div>
                    <div style={{ fontSize: 10, color: accentColor }}>{stepResult?.agentName || step.agentId}</div>
                  </div>
                  {isDone && <div style={{ fontSize: 10, color: 'var(--fg-text3,#888)' }}>{stepResult?.durationMs ? `${(stepResult.durationMs/1000).toFixed(1)}s` : ''} {expandedStep === i ? '▲' : '▼'}</div>}
                </div>
                {expandedStep === i && stepResult && (
                  <div style={{ padding: '0 10px 10px', borderTop: '1px solid var(--fg-border,#2a2a3e)' }}>
                    <div style={{ fontSize: 10, color: 'var(--fg-text3,#888)', marginBottom: 6, marginTop: 8 }}>Instruction: {step.instruction}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-text,#f0f1f5)', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto', background: 'var(--fg-bg,#0f0f1a)', borderRadius: 6, padding: 8 }}>
                      {stepResult.output}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {hasResult && result.finalOutput && (
        <div style={{ borderRadius: 10, border: '1px solid rgba(255,31,53,0.3)', background: 'rgba(255,31,53,0.04)', padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#ff1f35', marginBottom: 8 }}>🏁 Final Output</div>
          <div style={{ fontSize: 12, color: 'var(--fg-text,#f0f1f5)', lineHeight: 1.8, whiteSpace: 'pre-wrap', maxHeight: 400, overflowY: 'auto' }}>
            {result.finalOutput}
          </div>
          {result.totalDurationMs && (
            <div style={{ fontSize: 10, color: 'var(--fg-text3,#888)', marginTop: 8 }}>
              ⏱ {(result.totalDurationMs / 1000).toFixed(1)}s total · {result.stepsExecuted} agents chained
            </div>
          )}
        </div>
      )}

      {result?.error && <div style={{ color: "#f87171", fontSize: 12, padding: 10 }}>Error: {result.error}</div>}
    </div>
  );
}