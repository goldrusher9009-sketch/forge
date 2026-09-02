'use client';
// ΓöÇΓöÇΓöÇ FORGE AUTONOMY UI ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// Onboarding wizard, approval inbox, morning dashboard, credit badge,
// voice-first Forge ("Hey Forge"), magic reply, agent cinema, agent roster,
// living-workspace pulse styles. Self-contained ΓÇö mounted from ForgeApp.tsx.
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

// ΓöÇΓöÇΓöÇ Credit badge (top bar) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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
    <div onClick={onTopup} title="AI credits ΓÇö click to top up"
      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, cursor: 'pointer', flexShrink: 0,
        background: low ? 'rgba(248,113,113,0.12)' : 'var(--fg-bg4, #1a1a1e)', border: `1px solid ${low ? 'rgba(248,113,113,0.5)' : 'var(--fg-border2, rgba(255,255,255,0.11))'}` }}>
      <span style={{ fontSize: 10 }}>≡ƒ¬Ö</span>
      <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: low ? '#f87171' : 'var(--fg-text2, #ccc)' }}>${bal.toFixed(2)}</span>
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Onboarding wizard ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const BIZ_TYPES = [
  { id: 'restaurant', label: '≡ƒì╜∩╕Å Restaurant' }, { id: 'law_firm', label: 'ΓÜû∩╕Å Law Firm' },
  { id: 'agency', label: '≡ƒÄ¿ Agency' }, { id: 'trades', label: '≡ƒöº Plumber / Trades' },
  { id: 'ecom', label: '≡ƒ¢Æ Ecommerce' }, { id: 'other', label: 'Γ£¿ Other' },
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
          <div style={{ fontSize: 40, marginBottom: 16 }} className="fg-tool-running">ΓÜÖ∩╕Å</div>
          <h2 style={S.h}>Forge is building your workspace</h2>
          <p style={{ ...S.sub, fontSize: 14, color: 'var(--fg-orange2, #ff4d5e)' }}>{steps[buildStep]}</p>
          <div style={{ height: 6, background: 'var(--fg-bg4,#1a1a1e)', borderRadius: 99, overflow: 'hidden', marginTop: 18 }}>
            <div style={{ height: '100%', width: `${((buildStep + 1) / steps.length) * 100}%`, background: 'linear-gradient(90deg,var(--fg-orange,#ff1f35),#f97316)', transition: 'width 1.5s ease' }} />
          </div>
        </>) : (<>
          <div style={{ fontSize: 40, marginBottom: 16 }}>≡ƒÜÇ</div>
          <h2 style={S.h}>Your AI business OS is live</h2>
          <p style={S.sub}>{result.agentsCreated} agents created ┬╖ {result.keywordsQueued} SEO keywords queued{result.subdomain ? ` ┬╖ ${result.subdomain}.forge.app` : ''}</p>
          <p style={{ ...S.sub, fontStyle: 'italic' }}>Persona: {result.persona}</p>
          <button style={{ ...S.btn, ...S.primary, marginTop: 10 }} onClick={() => { onDone(); }}>Open my morning dashboard ΓåÆ</button>
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
        <p style={{ ...S.sub, marginTop: 10 }}>And what services do you offer? (comma-separated ΓÇö powers your SEO engine)</p>
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
        <p style={S.sub}>Pick what you use ΓÇö Forge wires automations around them.</p>
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
          <button onClick={onClose} style={{ ...S.btn, ...S.ghostBtn, padding: '3px 9px' }}>Γ£ò</button>
        </div>
        <h2 style={S.h}>{Q[step].title}</h2>
        <div style={{ margin: '16px 0 20px' }}>{Q[step].body}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button disabled={step === 0} onClick={() => setStep(s => s - 1)} style={{ ...S.btn, ...S.ghostBtn, opacity: step === 0 ? 0.3 : 1 }}>ΓåÉ Back</button>
          {step < Q.length - 1
            ? <button onClick={() => setStep(s => s + 1)} style={{ ...S.btn, ...S.primary }}>Next ΓåÆ</button>
            : <button onClick={submit} style={{ ...S.btn, ...S.primary }}>ΓÜí Build my workspace</button>}
        </div>
      </div>
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Approval inbox card ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const TYPE_META: Record<string, { icon: string; label: string; verb: string }> = {
  seo_page: { icon: '≡ƒôä', label: 'New SEO Page Ready', verb: 'Publish' },
  social_post: { icon: '≡ƒô▒', label: 'Social Post', verb: 'Schedule' },
  email: { icon: '≡ƒôº', label: 'Email Campaign', verb: 'Send' },
  sms: { icon: '≡ƒÆ¼', label: 'SMS', verb: 'Send' },
  review_request: { icon: 'Γ¡É', label: 'Review Request', verb: 'Send' },
};

function ApprovalCard({ a, api, onResolved }: { a: any; api: Api; onResolved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(a.content || '');
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const meta = TYPE_META[a.type] || { icon: '≡ƒñû', label: a.type, verb: 'Approve' };
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
            {pv.word_count ? `${pv.word_count} words ┬╖ ` : ''}
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
          ? <button style={{ ...S.btn, ...S.ghostBtn, fontSize: 11 }} onClick={() => { setEditing(true); setPreview(false); }}>Γ£Å∩╕Å Edit</button>
          : <button style={{ ...S.btn, ...S.ghostBtn, fontSize: 11 }} onClick={async () => { await act('edit', { content }); setEditing(false); }}>≡ƒÆ╛ Save</button>}
        <div style={{ flex: 1 }} />
        <button disabled={busy} style={{ ...S.btn, fontSize: 11, background: 'rgba(248,113,113,0.15)', color: '#f87171' }} onClick={() => act('reject')}>Γ¥î Skip</button>
        <button disabled={busy} style={{ ...S.btn, ...S.primary, fontSize: 11 }} onClick={() => act('approve', editing ? { content } : {})}>Γ£à {meta.verb}</button>
      </div>
    </div>
  );
}

// ΓöÇΓöÇΓöÇ v8.31 Agent Scoreboard ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function AgentScoreboard({ api }: { api: Api }) {
  const [board, setBoard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'avg_score'|'total_runs'|'success_rate'>('avg_score');

  const load = async () => {
    setLoading(true);
    const d = await api('/api/agent-scoreboard');
    if (d?.success) setBoard(d.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const sorted = [...board].sort((a, b) => {
    if (sort === 'avg_score') return (b.avg_score ?? -1) - (a.avg_score ?? -1);
    if (sort === 'total_runs') return b.total_runs - a.total_runs;
    return b.success_rate - a.success_rate;
  });

  const Bar = ({ pct, color }: { pct: number; color: string }) => (
    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 999, height: 5, width: 60, overflow: 'hidden', display: 'inline-block', verticalAlign: 'middle', marginLeft: 6 }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: 999 }} />
    </div>
  );

  if (loading) return <p style={{ color: '#888', fontSize: 13 }}>LoadingΓÇª</p>;
  if (!board.length) return <p style={{ color: '#555', fontSize: 13 }}>No agent runs yet.</p>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center' }}>
        <span style={{ color: '#666', fontSize: 11 }}>Sort by:</span>
        {(['avg_score','total_runs','success_rate'] as const).map(s => (
          <button key={s} onClick={() => setSort(s)} style={{ background: sort === s ? '#ff1f35' : 'rgba(255,255,255,0.07)', color: sort === s ? '#fff' : '#aaa', border: 'none', borderRadius: 5, padding: '3px 9px', cursor: 'pointer', fontSize: 11 }}>
            {s === 'avg_score' ? 'Γ¡É Score' : s === 'total_runs' ? '≡ƒöä Runs' : 'Γ£à Success%'}
          </button>
        ))}
        <button onClick={load} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.07)', color: '#888', border: 'none', borderRadius: 5, padding: '3px 9px', cursor: 'pointer', fontSize: 11 }}>Γå╗</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['#','Agent','Runs','Success','Avg Score','Top Score','Last Run'].map(h => (
                <th key={h} style={{ textAlign: 'left', color: '#555', padding: '4px 8px', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={r.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i === 0 ? 'rgba(255,215,0,0.04)' : 'transparent' }}>
                <td style={{ padding: '7px 8px', color: i < 3 ? ['#ffd700','#c0c0c0','#cd7f32'][i] : '#555', fontWeight: 700 }}>{i+1}</td>
                <td style={{ padding: '7px 8px', color: '#fff', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</td>
                <td style={{ padding: '7px 8px', color: '#aaa' }}>{r.total_runs}</td>
                <td style={{ padding: '7px 8px', color: r.success_rate >= 80 ? '#4ade80' : r.success_rate >= 50 ? '#fbbf24' : '#f87171' }}>
                  {r.success_rate}%<Bar pct={r.success_rate} color={r.success_rate >= 80 ? '#22c55e' : r.success_rate >= 50 ? '#f59e0b' : '#ef4444'} />
                </td>
                <td style={{ padding: '7px 8px', color: '#fbbf24', fontWeight: 700 }}>{r.avg_score != null ? `Γÿà ${r.avg_score}` : 'ΓÇö'}</td>
                <td style={{ padding: '7px 8px', color: '#888' }}>{r.top_score != null ? r.top_score : 'ΓÇö'}</td>
                <td style={{ padding: '7px 8px', color: '#555', fontSize: 11 }}>{r.last_run?.slice(0,16) || 'ΓÇö'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ΓöÇΓöÇΓöÇ v8.30 Relay Runner ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function RelayRunner({ api }: { api: Api }) {
  const [chains, setChains] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [steps, setSteps] = useState<{name:string;status:'idle'|'running'|'done'|'error';result:string}[]>([]);
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState<string|null>(null);

  const load = async () => {
    const d = await api('/api/agent-chains');
    if (d?.chains) setChains(d.chains);
  };
  useEffect(() => { load(); }, []);

  const select = (chain: any) => {
    setSelected(chain);
    setSteps((chain.steps || []).map((s: any) => ({ name: s.name, status: 'idle' as const, result: '' })));
    setRunId(null);
  };

  const runRelay = async () => {
    if (!selected) return;
    setRunning(true);
    setSteps(s => s.map(st => ({ ...st, status: 'idle', result: '' })));
    const d = await api(`/api/agent-chains/${selected.id}/run`, { method: 'POST', body: '{}' });
    const newRunId = d?.run_id;
    setRunId(newRunId);
    // Poll chain_runs for step_results
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      const r = await api(`/api/agent-chains/${selected.id}/runs`);
      const run = r?.runs?.[0];
      if (run) {
        const stepResults: string[] = run.step_results || [];
        setSteps(s => s.map((st, i) => ({
          ...st,
          status: i < stepResults.length ? 'done' : (i === stepResults.length && run.status === 'running' ? 'running' : 'idle'),
          result: stepResults[i] || '',
        })));
        if (run.status === 'done' || attempts > 60) {
          clearInterval(poll);
          setRunning(false);
          setSteps(s => s.map((st, i) => ({ ...st, status: stepResults[i] ? 'done' : 'idle', result: stepResults[i] || '' })));
        }
      }
    }, 3000);
  };

  return (
    <div style={{ display: 'flex', gap: 14, height: 480 }}>
      {/* Chain list */}
      <div style={{ width: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ color: '#666', fontSize: 11, margin: '0 0 4px' }}>SELECT CHAIN</p>
        {chains.length === 0 && <p style={{ color: '#555', fontSize: 12 }}>No chains ΓÇö create one in the Γ¢ô∩╕Å Chains tab.</p>}
        {chains.map(c => (
          <div key={c.id} onClick={() => select(c)} style={{
            padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
            background: selected?.id === c.id ? 'rgba(255,31,53,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${selected?.id === c.id ? '#ff1f35' : 'rgba(255,255,255,0.07)'}`,
          }}>
            <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{c.name}</div>
            <div style={{ color: '#555', fontSize: 10 }}>{c.steps?.length || 0} steps ┬╖ {c.run_count || 0} runs</div>
          </div>
        ))}
      </div>
      {/* Step pipeline */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!selected && <p style={{ color: '#555', fontSize: 13 }}>ΓåÉ Select a chain to run</p>}
        {selected && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <h3 style={{ color: '#fff', fontSize: 14, margin: 0 }}>{selected.name}</h3>
              <button onClick={runRelay} disabled={running} style={{ background: running ? '#334155' : '#ff1f35', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: 12 }}>
                {running ? 'ΓÅ│ RunningΓÇª' : 'Γû╢ Run Relay'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {steps.map((st, i) => {
                const colors: Record<string,string> = { idle:'#475569', running:'#f59e0b', done:'#22c55e', error:'#ef4444' };
                const icons: Record<string,string> = { idle:'Γùï', running:'Γùî', done:'Γ£ô', error:'Γ£ò' };
                return (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${colors[st.status]}40`, borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: colors[st.status], fontWeight: 700, fontSize: 14 }}>{icons[st.status]}</span>
                      <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>Step {i+1}: {st.name}</span>
                      {i < steps.length - 1 && <span style={{ color: '#555', fontSize: 10, marginLeft: 'auto' }}>Γåô feeds next</span>}
                    </div>
                    {st.result && <pre style={{ color: '#d1fae5', fontSize: 10, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, background: 'rgba(0,0,0,0.3)', borderRadius: 4, padding: 6 }}>{st.result.slice(0, 400)}</pre>}
                    {st.status === 'running' && <p style={{ color: '#f59e0b', fontSize: 11, margin: '4px 0 0' }}>RunningΓÇª</p>}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ΓöÇΓöÇΓöÇ v8.29 Agent Health Monitor ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function AgentHealthMonitor({ api }: { api: Api }) {
  const [health, setHealth] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const d = await api('/api/schedules/health');
    if (d?.success) setHealth(d.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const badgeStyle = (s: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      healthy: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
      degraded: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
      stale: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
      paused: { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' },
      never: { bg: 'rgba(100,116,139,0.1)', color: '#64748b' },
    };
    return map[s] || map.never;
  };

  if (loading) return <p style={{ color: '#888', fontSize: 13 }}>LoadingΓÇª</p>;
  if (!health.length) return <p style={{ color: '#555', fontSize: 13 }}>No schedules found. Create one in the Schedules tab.</p>;

  const summary = { healthy: 0, degraded: 0, stale: 0, paused: 0, never: 0 };
  health.forEach(h => { (summary as any)[h.statusBadge] = ((summary as any)[h.statusBadge] || 0) + 1; });

  return (
    <div>
      {/* Summary row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {Object.entries(summary).filter(([,v]) => v > 0).map(([k, v]) => {
          const bs = badgeStyle(k);
          return <span key={k} style={{ background: bs.bg, color: bs.color, borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>{v} {k}</span>;
        })}
        <button onClick={load} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.07)', color: '#aaa', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11 }}>Γå╗ Refresh</button>
      </div>
      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Agent', 'Cron', 'Status', 'Last Run', 'Runs', 'Success %'].map(h => (
                <th key={h} style={{ textAlign: 'left', color: '#666', padding: '4px 8px', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {health.map(h => {
              const bs = badgeStyle(h.statusBadge);
              return (
                <tr key={h.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '7px 8px', color: '#fff', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</td>
                  <td style={{ padding: '7px 8px', color: '#888', fontFamily: 'monospace' }}>{h.cron}</td>
                  <td style={{ padding: '7px 8px' }}><span style={{ background: bs.bg, color: bs.color, borderRadius: 4, padding: '2px 7px', fontWeight: 700 }}>{h.statusBadge}</span></td>
                  <td style={{ padding: '7px 8px', color: '#666' }}>{h.last_run ? h.last_run.slice(0,16) : 'ΓÇö'}{h.hoursSince != null ? ` (${h.hoursSince}h ago)` : ''}</td>
                  <td style={{ padding: '7px 8px', color: '#aaa' }}>{h.total_runs}</td>
                  <td style={{ padding: '7px 8px', color: h.successRate !== null && h.successRate < 50 ? '#f87171' : '#4ade80' }}>{h.successRate !== null ? `${h.successRate}%` : 'ΓÇö'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ΓöÇΓöÇΓöÇ v8.28 Goal Autopilot Panel ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function GoalAutopilotPanel({ api }: { api: Api }) {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string|null>(null);

  const load = async () => {
    setLoading(true);
    const d = await api('/api/agent-goals/nudges');
    if (d?.success) setGoals(d.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const runGoal = async (g: any) => {
    setRunning(g.id);
    // Find a matching schedule or just trigger via /api/agent-runs
    await api('/api/agent-runs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal: g.agent_prompt || `Work on goal: ${g.title}`, name: g.title }) });
    setTimeout(() => { setRunning(null); load(); }, 2000);
  };

  if (loading) return <p style={{ color: '#888', fontSize: 13 }}>LoadingΓÇª</p>;
  if (!goals.length) return <p style={{ color: '#555', fontSize: 13 }}>No active goals. Create goals in the Goals tab.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ color: '#888', fontSize: 12, margin: 0 }}>Active goals with progress + staleness ΓÇö nudge any that need a run.</p>
      {goals.map(g => (
        <div key={g.id} style={{ background: g.stale ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.04)', border: `1px solid ${g.stale ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{g.title}</span>
              {g.stale && <span style={{ marginLeft: 8, background: '#7f1d1d', color: '#fca5a5', borderRadius: 4, padding: '1px 6px', fontSize: 10 }}>ΓÜá Stale {g.hoursSince}h</span>}
              {!g.stale && <span style={{ marginLeft: 8, background: 'rgba(34,197,94,0.15)', color: '#4ade80', borderRadius: 4, padding: '1px 6px', fontSize: 10 }}>Γ£ô Active</span>}
            </div>
            <button onClick={() => runGoal(g)} disabled={running === g.id} style={{ background: '#ff1f35', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 11 }}>
              {running === g.id ? 'ΓÇª' : 'Γû╢ Run Now'}
            </button>
          </div>
          {/* Progress bar */}
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 999, height: 6, marginBottom: 6, overflow: 'hidden' }}>
            <div style={{ width: `${g.pct}%`, height: '100%', background: g.pct >= 100 ? '#22c55e' : '#ff1f35', borderRadius: 999, transition: 'width 0.4s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888' }}>
            <span>{g.current_value}{g.unit ? ` ${g.unit}` : ''} / {g.target_value}{g.unit ? ` ${g.unit}` : ''} ({g.pct}%)</span>
            {g.deadline && <span>Due: {g.deadline}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ΓöÇΓöÇΓöÇ v8.27 Run Inspector ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function AgentRunInspector({ api }: { api: Api }) {
  const [runs, setRuns] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    const d = await api('/api/agent-runs?limit=100');
    if (d?.runs) setRuns(d.runs);
  };
  useEffect(() => { load(); }, []);

  const openDetail = async (run: any) => {
    setSelected(run);
    setDetail(null);
    setLoading(true);
    const d = await api(`/api/agent-runs/${run.id}`);
    setDetail(d?.data || run);
    setLoading(false);
  };

  const filtered = runs.filter(r =>
    !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.goal?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor: Record<string, string> = {
    completed: '#22c55e', failed: '#ef4444', running: '#f59e0b', pending: '#64748b',
  };

  return (
    <div style={{ display: 'flex', gap: 12, height: 480 }}>
      {/* List */}
      <div style={{ width: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search runsΓÇª"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', padding: '6px 10px', fontSize: 12, marginBottom: 6 }} />
        {filtered.length === 0 && <p style={{ color: '#555', fontSize: 12 }}>No runs yet.</p>}
        {filtered.map(r => (
          <div key={r.id} onClick={() => openDetail(r)} style={{
            padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
            background: selected?.id === r.id ? 'rgba(255,31,53,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${selected?.id === r.id ? '#ff1f35' : 'rgba(255,255,255,0.07)'}`,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name || r.goal?.slice(0,40) || r.id}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: statusColor[r.status] || '#64748b', fontWeight: 700 }}>ΓùÅ{r.status}</span>
              {r.score != null && <span style={{ fontSize: 10, color: '#f59e0b' }}>Γÿà{r.score}</span>}
              <span style={{ fontSize: 10, color: '#555', marginLeft: 'auto' }}>{r.created_at?.slice(5,16)}</span>
            </div>
          </div>
        ))}
      </div>
      {/* Detail */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 14 }}>
        {!selected && <p style={{ color: '#555', fontSize: 13 }}>ΓåÉ Select a run to inspect</p>}
        {selected && loading && <p style={{ color: '#888', fontSize: 13 }}>LoadingΓÇª</p>}
        {selected && !loading && detail && (
          <>
            <h3 style={{ color: '#fff', fontSize: 14, marginBottom: 8 }}>{detail.name || detail.goal?.slice(0,60)}</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <span style={{ background: statusColor[detail.status] || '#64748b', color: '#fff', borderRadius: 4, padding: '2px 7px', fontSize: 11 }}>{detail.status}</span>
              {detail.score != null && <span style={{ background: '#92400e', color: '#fcd34d', borderRadius: 4, padding: '2px 7px', fontSize: 11 }}>Score: {detail.score}</span>}
              {detail.model && <span style={{ background: 'rgba(255,255,255,0.08)', color: '#aaa', borderRadius: 4, padding: '2px 7px', fontSize: 11 }}>{detail.model}</span>}
            </div>
            {detail.goal && <div style={{ marginBottom: 10 }}><p style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>GOAL</p><p style={{ color: '#ccc', fontSize: 12, whiteSpace: 'pre-wrap' }}>{detail.goal}</p></div>}
            {detail.score_reason && <div style={{ marginBottom: 10 }}><p style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>SCORE REASON</p><p style={{ color: '#ccc', fontSize: 12 }}>{detail.score_reason}</p></div>}
            {detail.error && <div style={{ marginBottom: 10 }}><p style={{ color: '#ef4444', fontSize: 11, marginBottom: 4 }}>ERROR</p><p style={{ color: '#fca5a5', fontSize: 12 }}>{detail.error}</p></div>}
            {detail.result && <div><p style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>RESULT</p><pre style={{ color: '#d1fae5', fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: 10 }}>{typeof detail.result === 'string' ? detail.result : JSON.stringify(detail.result, null, 2)}</pre></div>}
            <p style={{ color: '#444', fontSize: 10, marginTop: 10 }}>ID: {detail.id} ┬╖ {detail.created_at}</p>
          </>
        )}
      </div>
    </div>
  );
}

// --- v9.05 Employee Engagement Survey Builder ---
const Q_TYPE_LABEL: Record<string,string> = { likert5:'1-5 Scale', likert7:'1-7 Scale', yesno:'Yes/No', opentext:'Open Text', multiselect:'Multi-Select', nps:'NPS 0-10' };
function EngagementSurveyPanel({ api }: { api: string }) {
  const [form, setForm] = useState({ company:'', industry:'', companySize:'', surveyGoals:'', currentChallenges:'', previousSurveys:'', anonymity:'fully anonymous', frequency:'annual', provider:'anthropic' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [subtab, setSubtab] = useState<'overview'|'questions'|'pulse'|'admin'|'insights'>('overview');
  const [expandedSection, setExpandedSection] = useState<number|null>(0);
  const run = async () => {
    setLoading(true); setErr(''); setResult(null);
    try {
      const r = await fetch(`${api}/api/engagement-survey`, { method:'POST', headers:{'Content-Type':'application/json',...(localStorage.getItem('forge_token')?{Authorization:`Bearer ${localStorage.getItem('forge_token')}`}:{})}, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || 'Failed');
      setResult(d);
    } catch(e:any) { setErr(e.message); } finally { setLoading(false); }
  };
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-lg font-bold text-white mb-3">📋 Employee Engagement Survey Builder</h2>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[['company','Company Name'],['industry','Industry'],['companySize','Company Size'],['anonymity','Anonymity Level'],['frequency','Survey Frequency']].map(([k,l])=>(
          <div key={k}><label className="text-xs text-gray-400">{l}</label><input className="w-full bg-gray-800 text-white rounded p-2 text-sm mt-1" value={(form as any)[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={l} /></div>
        ))}
        <div><label className="text-xs text-gray-400">Provider</label><select className="w-full bg-gray-800 text-white rounded p-2 text-sm mt-1" value={form.provider} onChange={e=>setForm(f=>({...f,provider:e.target.value}))}><option value="anthropic">Anthropic</option><option value="openai">OpenAI</option><option value="gemini">Gemini</option></select></div>
      </div>
      {[['surveyGoals','Survey Goals'],['currentChallenges','Current Employee Challenges'],['previousSurveys','Previous Survey History / Results']].map(([k,l])=>(
        <div key={k} className="mb-3"><label className="text-xs text-gray-400">{l}</label><textarea className="w-full bg-gray-800 text-white rounded p-2 text-sm mt-1" rows={2} value={(form as any)[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={l} /></div>
      ))}
      <button onClick={run} disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded text-sm disabled:opacity-50">{loading?'Building…':'Build Survey'}</button>
      {err && <p className="text-red-400 text-sm mt-2">{err}</p>}
      {result && (
        <div className="mt-5">
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <p className="text-white font-bold text-base mb-1">{result.surveyTitle}</p>
            <p className="text-gray-300 text-sm mb-3">{result.executiveSummary}</p>
            {result.surveyDesign && (
              <div className="grid grid-cols-4 gap-3">
                {[['Questions',result.surveyDesign.totalQuestions],['Time',result.surveyDesign.estimatedTime],['Anonymity',result.surveyDesign.anonymityLevel],['Frequency',result.surveyDesign.recommendedFrequency]].map(([l,v])=>(
                  <div key={l as string} className="text-center bg-gray-700/50 rounded p-2"><p className="text-xs text-gray-400">{l}</p><p className="text-white text-sm font-medium mt-1">{v}</p></div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {(['overview','questions','pulse','admin','insights'] as const).map(s=><button key={s} onClick={()=>setSubtab(s)} className={`px-3 py-1 rounded text-xs capitalize ${subtab===s?'bg-indigo-600 text-white':'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{s==='admin'?'Admin Guide':s==='insights'?'Sample Insights':s}</button>)}
          </div>
          {subtab==='overview' && (
            <div className="space-y-3">
              {result.eNPS && <div className="bg-gray-800 rounded p-3"><p className="text-xs text-gray-400 mb-2">eNPS Question</p><p className="text-white text-sm mb-1">{result.eNPS.question}</p><p className="text-gray-400 text-xs">Follow-up: {result.eNPS.followUp}</p></div>}
              {result.analysisFramework && (
                <div className="bg-gray-800 rounded p-3">
                  <p className="text-xs text-gray-400 mb-2">Analysis Framework</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-xs text-blue-300 mb-1">Key Metrics</p><ul>{(result.analysisFramework.keyMetrics||[]).map((m:string,i:number)=><li key={i} className="text-gray-300 text-xs">• {m}</li>)}</ul></div>
                    <div><p className="text-xs text-red-300 mb-1">Red Flag Thresholds</p><ul>{(result.analysisFramework.redFlagThresholds||[]).map((m:string,i:number)=><li key={i} className="text-gray-300 text-xs">⚠ {m}</li>)}</ul></div>
                  </div>
                </div>
              )}
              {result.demographicQuestions && result.demographicQuestions.length>0 && (
                <div className="bg-gray-800 rounded p-3"><p className="text-xs text-gray-400 mb-2">Demographic Questions</p><ul className="space-y-1">{result.demographicQuestions.map((q:any,i:number)=><li key={i} className="text-gray-300 text-xs flex gap-2"><span className="text-gray-500">{i+1}.</span><span>{q.text}{q.optional?<span className="text-gray-500 ml-1">(Optional)</span>:null}</span></li>)}</ul></div>
              )}
            </div>
          )}
          {subtab==='questions' && (
            <div className="space-y-2">
              {(result.sections||[]).map((sec:any,i:number)=>(
                <div key={i} className="bg-gray-800 rounded overflow-hidden">
                  <button className="w-full flex items-center justify-between p-3" onClick={()=>setExpandedSection(expandedSection===i?null:i)}>
                    <div><p className="text-white text-sm font-medium">{sec.sectionName}</p><p className="text-gray-400 text-xs">{sec.engagementDimension} · {(sec.questions||[]).length} questions</p></div>
                    <span className="text-gray-400 text-xs">{expandedSection===i?'▲':'▼'}</span>
                  </button>
                  {expandedSection===i && <div className="px-3 pb-3 space-y-2">{(sec.questions||[]).map((q:any,j:number)=>(
                    <div key={j} className="bg-gray-700/50 rounded p-2">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-gray-200 text-xs flex-1">{q.id}. {q.text}</p>
                        <span className="text-xs text-indigo-300 bg-indigo-900/40 px-1.5 py-0.5 rounded whitespace-nowrap">{Q_TYPE_LABEL[q.type]||q.type}</span>
                      </div>
                      {q.options&&q.options.length>0&&<p className="text-gray-500 text-xs">Options: {q.options.join(' · ')}</p>}
                      {q.followUpTrigger&&<p className="text-yellow-400 text-xs">Follow-up if: {q.followUpTrigger}</p>}
                    </div>
                  ))}</div>}
                </div>
              ))}
            </div>
          )}
          {subtab==='pulse' && result.pulseVariant && (
            <div className="bg-gray-800 rounded p-4">
              <p className="text-xs text-gray-400 mb-2">Pulse Survey Variant</p>
              <p className="text-gray-300 text-sm mb-3">{result.pulseVariant.description}</p>
              <ul className="space-y-2">{(result.pulseVariant.questions||[]).map((q:string,i:number)=><li key={i} className="text-gray-200 text-sm flex gap-2"><span className="text-gray-500">{i+1}.</span>{q}</li>)}</ul>
            </div>
          )}
          {subtab==='admin' && result.administrationGuide && (
            <div className="space-y-3">
              <div className="bg-gray-800 rounded p-3"><p className="text-xs text-gray-400 mb-1">Recommended Timing</p><p className="text-gray-200 text-sm">{result.administrationGuide.timing}</p></div>
              <div className="bg-gray-800 rounded p-3"><p className="text-xs text-gray-400 mb-2">Response Rate Target</p><p className="text-gray-200 text-sm">{result.administrationGuide.responseRateTargets}</p></div>
              {(result.administrationGuide.communication||[]).length>0 && <div className="bg-gray-800 rounded p-3"><p className="text-xs text-gray-400 mb-2">Communication Plan</p><div className="space-y-2">{result.administrationGuide.communication.map((c:any,i:number)=><div key={i} className="border-l-2 border-indigo-600 pl-2"><p className="text-white text-xs font-medium">{c.touchpoint}</p><p className="text-gray-400 text-xs">{c.timing} · {c.channel}</p><p className="text-gray-300 text-xs italic mt-0.5">{c.template}</p></div>)}</div></div>}
              {result.actionPlanningGuide && <div className="bg-gray-800 rounded p-3"><p className="text-xs text-gray-400 mb-2">Action Planning</p><div className="space-y-1 text-xs text-gray-300"><p>Share results by: {result.actionPlanningGuide.shareResultsBy}</p><p>Workshop format: {result.actionPlanningGuide.actionWorkshopFormat}</p><p>Follow-up: {result.actionPlanningGuide.followUpTimeline}</p></div></div>}
            </div>
          )}
          {subtab==='insights' && result.sampleInsightReport && (
            <div className="space-y-3">
              <div className="bg-gray-800 rounded p-3 text-center"><p className="text-xs text-gray-400 mb-1">Overall Engagement Score</p><p className="text-3xl font-bold text-indigo-400">{result.sampleInsightReport.overallScore}</p></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800 rounded p-3"><p className="text-xs text-green-400 mb-2">Top Strengths</p><ul>{(result.sampleInsightReport.topStrengths||[]).map((s:string,i:number)=><li key={i} className="text-gray-300 text-xs">✓ {s}</li>)}</ul></div>
                <div className="bg-gray-800 rounded p-3"><p className="text-xs text-yellow-400 mb-2">Areas for Improvement</p><ul>{(result.sampleInsightReport.areasForImprovement||[]).map((s:string,i:number)=><li key={i} className="text-gray-300 text-xs">△ {s}</li>)}</ul></div>
              </div>
              {(result.sampleInsightReport.recommendedActions||[]).length>0 && <div className="bg-gray-800 rounded p-3"><p className="text-xs text-gray-400 mb-2">Recommended Actions</p><ul className="space-y-1">{result.sampleInsightReport.recommendedActions.map((a:string,i:number)=><li key={i} className="text-indigo-300 text-xs">→ {a}</li>)}</ul></div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v9.04 Acquisition Due Diligence Checklist ---
const DD_SEV_COLOR: Record<string,string> = { 'Critical':'text-red-400','High':'text-orange-400','Medium':'text-yellow-400' };
const DD_STATUS_COLOR: Record<string,string> = { 'Complete':'text-green-400','In Progress':'text-blue-400','Not Started':'text-gray-400','Red Flag':'text-red-400' };
const GONOGO_COLOR: Record<string,string> = { 'Proceed':'text-green-400','Proceed with Conditions':'text-yellow-400','Pause':'text-orange-400','Do Not Proceed':'text-red-400' };
function DueDiligencePanel({ api }: { api: string }) {
  const [form, setForm] = useState({ targetCompany:'', acquirerCompany:'', dealType:'Full Acquisition', dealValue:'', industry:'', targetRevenue:'', targetEmployees:'', dealRationale:'', keyRisks:'', provider:'anthropic' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [subtab, setSubtab] = useState<'overview'|'workstreams'|'redflags'|'financial'|'integration'>('overview');
  const [expandedWS, setExpandedWS] = useState<number|null>(null);
  const run = async () => {
    setLoading(true); setErr(''); setResult(null);
    try {
      const r = await fetch(`${api}/api/due-diligence`, { method:'POST', headers:{'Content-Type':'application/json',...(localStorage.getItem('forge_token')?{Authorization:`Bearer ${localStorage.getItem('forge_token')}`}:{})}, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || 'Failed');
      setResult(d);
    } catch(e:any) { setErr(e.message); } finally { setLoading(false); }
  };
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-lg font-bold text-white mb-3">🔬 Acquisition Due Diligence</h2>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[['targetCompany','Target Company'],['acquirerCompany','Acquirer Company'],['dealType','Deal Type'],['dealValue','Deal Value'],['industry','Industry'],['targetRevenue','Target Revenue'],['targetEmployees','Target Employees']].map(([k,l])=>(
          <div key={k}><label className="text-xs text-gray-400">{l}</label><input className="w-full bg-gray-800 text-white rounded p-2 text-sm mt-1" value={(form as any)[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={l} /></div>
        ))}
        <div><label className="text-xs text-gray-400">Provider</label><select className="w-full bg-gray-800 text-white rounded p-2 text-sm mt-1" value={form.provider} onChange={e=>setForm(f=>({...f,provider:e.target.value}))}><option value="anthropic">Anthropic</option><option value="openai">OpenAI</option><option value="gemini">Gemini</option></select></div>
      </div>
      {[['dealRationale','Deal Rationale & Strategic Fit'],['keyRisks','Key Risks Already Identified']].map(([k,l])=>(
        <div key={k} className="mb-3"><label className="text-xs text-gray-400">{l}</label><textarea className="w-full bg-gray-800 text-white rounded p-2 text-sm mt-1" rows={2} value={(form as any)[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={l} /></div>
      ))}
      <button onClick={run} disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded text-sm disabled:opacity-50">{loading?'Analyzing…':'Run Due Diligence'}</button>
      {err && <p className="text-red-400 text-sm mt-2">{err}</p>}
      {result && (
        <div className="mt-5">
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <p className="text-white font-bold text-base mb-1">{result.checklistTitle}</p>
            <p className="text-gray-300 text-sm mb-3">{result.executiveSummary}</p>
            {result.goNoGoSummary && (
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-gray-400">Recommendation:</span>
                <span className={`font-bold text-sm ${GONOGO_COLOR[result.goNoGoSummary.recommendation]||'text-gray-300'}`}>{result.goNoGoSummary.recommendation}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {(['overview','workstreams','redflags','financial','integration'] as const).map(s=><button key={s} onClick={()=>setSubtab(s)} className={`px-3 py-1 rounded text-xs capitalize ${subtab===s?'bg-indigo-600 text-white':'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{s==='redflags'?'Red Flags':s}</button>)}
          </div>
          {subtab==='overview' && (
            <div className="space-y-3">
              {result.dealOverview && <div className="bg-gray-800 rounded p-3">
                <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                  <div><span className="text-gray-400">Deal Type: </span><span className="text-white">{result.dealOverview.dealType}</span></div>
                </div>
                <p className="text-gray-300 text-xs mb-2">{result.dealOverview.rationale}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-green-400 mb-1">Synergies</p><ul>{(result.dealOverview.synergies||[]).map((s:string,i:number)=><li key={i} className="text-gray-300 text-xs">+ {s}</li>)}</ul></div>
                  <div><p className="text-xs text-red-400 mb-1">Risks</p><ul>{(result.dealOverview.risks||[]).map((s:string,i:number)=><li key={i} className="text-gray-300 text-xs">- {s}</li>)}</ul></div>
                </div>
              </div>}
              {result.goNoGoSummary && (
                <div className="bg-gray-800 rounded p-3">
                  {(result.goNoGoSummary.conditions||[]).length>0&&<div className="mb-2"><p className="text-xs text-yellow-400 mb-1">Conditions</p><ul>{result.goNoGoSummary.conditions.map((c:string,i:number)=><li key={i} className="text-yellow-300 text-xs">• {c}</li>)}</ul></div>}
                  {(result.goNoGoSummary.dealBreakers||[]).length>0&&<div><p className="text-xs text-red-400 mb-1">Deal Breakers</p><ul>{result.goNoGoSummary.dealBreakers.map((c:string,i:number)=><li key={i} className="text-red-300 text-xs">⚠ {c}</li>)}</ul></div>}
                </div>
              )}
              {result.timeline&&<div className="space-y-2">{result.timeline.map((ph:any,i:number)=><div key={i} className="bg-gray-800 rounded p-2"><div className="flex justify-between mb-1"><p className="text-white text-xs font-medium">{ph.phase}</p><span className="text-gray-400 text-xs">{ph.duration}</span></div><ul>{(ph.keyActivities||[]).map((a:string,j:number)=><li key={j} className="text-gray-300 text-xs">• {a}</li>)}</ul></div>)}</div>}
            </div>
          )}
          {subtab==='workstreams' && (
            <div className="space-y-2">
              {(result.workstreams||[]).map((ws:any,i:number)=>(
                <div key={i} className="bg-gray-800 rounded overflow-hidden">
                  <button className="w-full flex items-center justify-between p-3" onClick={()=>setExpandedWS(expandedWS===i?null:i)}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${ws.priority==='Critical'?'bg-red-900 text-red-300':ws.priority==='High'?'bg-orange-900 text-orange-300':'bg-yellow-900 text-yellow-300'}`}>{ws.priority}</span>
                      <span className="text-white text-sm">{ws.workstream}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400"><span>{ws.timeline}</span><span>{expandedWS===i?'▲':'▼'}</span></div>
                  </button>
                  {expandedWS===i && <div className="px-3 pb-3 space-y-1">{(ws.items||[]).map((item:any,j:number)=><div key={j} className="flex items-start gap-2 bg-gray-700/50 rounded p-2"><span className={`text-xs mt-0.5 ${DD_STATUS_COLOR[item.status]||'text-gray-400'}`}>●</span><div><p className="text-gray-200 text-xs">{item.item}</p>{item.notes&&<p className="text-gray-400 text-xs">{item.notes}</p>}</div></div>)}</div>}
                </div>
              ))}
            </div>
          )}
          {subtab==='redflags' && (
            <div className="space-y-2">
              {(result.redFlags||[]).length===0?<p className="text-gray-400 text-sm">No red flags identified.</p>:(result.redFlags||[]).map((rf:any,i:number)=>(
                <div key={i} className="bg-gray-800 rounded p-3 border-l-2 border-red-500">
                  <div className="flex items-center justify-between mb-1"><p className="text-white text-sm font-medium">{rf.area}</p><span className={`text-xs ${DD_SEV_COLOR[rf.severity]||'text-gray-400'}`}>{rf.severity}</span></div>
                  <p className="text-gray-300 text-xs mb-1">{rf.finding}</p>
                  <p className="text-blue-300 text-xs">→ {rf.recommendation}</p>
                </div>
              ))}
              {(result.legalRisks||[]).length>0&&<div className="mt-3"><p className="text-xs text-gray-400 mb-2">Legal Risks</p>{result.legalRisks.map((lr:any,i:number)=><div key={i} className="bg-gray-800 rounded p-2 mb-1"><div className="flex justify-between"><p className="text-gray-200 text-xs">{lr.risk}</p><span className="text-xs text-yellow-400">{lr.severity}</span></div><p className="text-gray-400 text-xs">{lr.mitigation}</p></div>)}</div>}
            </div>
          )}
          {subtab==='financial' && result.financialSummary && (
            <div className="space-y-2">
              {Object.entries(result.financialSummary).map(([k,v])=>(
                <div key={k} className="bg-gray-800 rounded p-3">
                  <p className="text-xs text-gray-400 mb-1 capitalize">{k.replace(/([A-Z])/g,' $1').trim()}</p>
                  <p className="text-gray-200 text-sm">{v as string}</p>
                </div>
              ))}
              {result.valuationConsiderations&&<div className="bg-gray-800 rounded p-3"><p className="text-xs text-gray-400 mb-2">Valuation</p><p className="text-gray-200 text-xs mb-2">{result.valuationConsiderations.methodology}</p><p className="text-green-300 text-xs mb-1">Synergies Value: {result.valuationConsiderations.synergiesValue}</p><ul>{(result.valuationConsiderations.purchasePriceAdjustments||[]).map((a:string,i:number)=><li key={i} className="text-gray-300 text-xs">• {a}</li>)}</ul></div>}
            </div>
          )}
          {subtab==='integration' && result.integrationConsiderations && (
            <div className="space-y-3">
              {[['Day 1 Priorities',result.integrationConsiderations.day1Priorities,'text-indigo-300'],['Cultural Factors',result.integrationConsiderations.culturalFactors,'text-purple-300'],['Systems Integration',result.integrationConsiderations.systemsIntegration,'text-blue-300'],['Retention Risks',result.integrationConsiderations.retentionRisks,'text-red-300']].map(([label,items,color])=>(
                <div key={label as string} className="bg-gray-800 rounded p-3"><p className="text-xs text-gray-400 mb-2">{label}</p><ul className="space-y-1">{(items as string[]).map((it,i)=><li key={i} className={`text-xs ${color}`}>• {it}</li>)}</ul></div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v9.03 Digital Transformation Roadmap ---
const EFFORT_COLOR: Record<string,string> = { 'Low':'text-green-400','Medium':'text-yellow-400','High':'text-red-400' };
const TECH_PRIORITY_COLOR: Record<string,string> = { 'Critical':'text-red-400','High':'text-orange-400','Medium':'text-yellow-400' };
function DigitalTransformPanel({ api }: { api: string }) {
  const [form, setForm] = useState({ company:'', industry:'', currentState:'', targetState:'', budget:'', timeframe:'3 years', teamSize:'', painPoints:'', priorities:'', provider:'anthropic' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [subtab, setSubtab] = useState<'overview'|'phases'|'technology'|'change'|'metrics'>('overview');
  const run = async () => {
    setLoading(true); setErr(''); setResult(null);
    try {
      const r = await fetch(`${api}/api/digital-transform`, { method:'POST', headers:{'Content-Type':'application/json',...(localStorage.getItem('forge_token')?{Authorization:`Bearer ${localStorage.getItem('forge_token')}`}:{})}, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || 'Failed');
      setResult(d);
    } catch(e:any) { setErr(e.message); } finally { setLoading(false); }
  };
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-lg font-bold text-white mb-3">🚀 Digital Transformation Roadmap</h2>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[['company','Company Name'],['industry','Industry'],['timeframe','Timeframe'],['budget','Budget'],['teamSize','Team Size']].map(([k,l])=>(
          <div key={k}><label className="text-xs text-gray-400">{l}</label><input className="w-full bg-gray-800 text-white rounded p-2 text-sm mt-1" value={(form as any)[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={l} /></div>
        ))}
        <div><label className="text-xs text-gray-400">Provider</label><select className="w-full bg-gray-800 text-white rounded p-2 text-sm mt-1" value={form.provider} onChange={e=>setForm(f=>({...f,provider:e.target.value}))}><option value="anthropic">Anthropic</option><option value="openai">OpenAI</option><option value="gemini">Gemini</option></select></div>
      </div>
      {[['currentState','Current State Description'],['targetState','Target State / Vision'],['painPoints','Key Pain Points'],['priorities','Transformation Priorities']].map(([k,l])=>(
        <div key={k} className="mb-3"><label className="text-xs text-gray-400">{l}</label><textarea className="w-full bg-gray-800 text-white rounded p-2 text-sm mt-1" rows={2} value={(form as any)[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={l} /></div>
      ))}
      <button onClick={run} disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded text-sm disabled:opacity-50">{loading?'Building…':'Build Roadmap'}</button>
      {err && <p className="text-red-400 text-sm mt-2">{err}</p>}
      {result && (
        <div className="mt-5">
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <p className="text-white font-bold text-base mb-1">{result.roadmapTitle}</p>
            <p className="text-gray-300 text-sm mb-3">{result.executiveSummary}</p>
            {result.maturityAssessment && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="text-center"><p className="text-xs text-gray-400">Current Maturity</p><p className="text-3xl font-bold text-red-400">{result.maturityAssessment.currentScore}<span className="text-gray-500 text-lg">/10</span></p></div>
                <div className="text-center"><p className="text-xs text-gray-400">Target Maturity</p><p className="text-3xl font-bold text-green-400">{result.maturityAssessment.targetScore}<span className="text-gray-500 text-lg">/10</span></p></div>
              </div>
            )}
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {(['overview','phases','technology','change','metrics'] as const).map(s=><button key={s} onClick={()=>setSubtab(s)} className={`px-3 py-1 rounded text-xs capitalize ${subtab===s?'bg-indigo-600 text-white':'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{s}</button>)}
          </div>
          {subtab==='overview' && (
            <div className="space-y-3">
              {(result.strategicPillars||[]).length>0 && <div className="grid grid-cols-1 gap-2">{result.strategicPillars.map((p:any,i:number)=><div key={i} className="bg-gray-800 rounded p-3"><p className="text-indigo-400 font-medium text-sm mb-1">{p.pillar}</p><p className="text-gray-300 text-xs mb-1">{p.description}</p><p className="text-green-300 text-xs">Value: {p.businessValue}</p></div>)}</div>}
              {(result.quickWins||[]).length>0 && <div className="bg-gray-800 rounded p-3"><p className="text-xs text-gray-400 mb-2">⚡ Quick Wins</p><ul className="space-y-1">{result.quickWins.map((w:string,i:number)=><li key={i} className="text-green-300 text-xs">• {w}</li>)}</ul></div>}
              {result.investmentSummary && <div className="bg-gray-800 rounded p-3 grid grid-cols-2 gap-3">{[['Total Budget',result.investmentSummary.totalBudget],['Expected ROI',result.investmentSummary.expectedROI],['Payback Period',result.investmentSummary.paybackPeriod]].map(([l,v])=><div key={l}><p className="text-xs text-gray-400">{l}</p><p className="text-white font-medium text-sm">{v}</p></div>)}</div>}
            </div>
          )}
          {subtab==='phases' && (
            <div className="space-y-4">
              {(result.phases||[]).map((ph:any,i:number)=>(
                <div key={i} className="bg-gray-800 rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div><p className="text-white font-bold">{ph.phase}</p><p className="text-gray-400 text-xs">{ph.timeline} · {ph.theme}</p></div>
                    <span className="text-xs text-indigo-300 bg-indigo-900/40 px-2 py-1 rounded">{ph.budget}</span>
                  </div>
                  <div className="space-y-2 mt-3">
                    {(ph.initiatives||[]).map((init:any,j:number)=>(
                      <div key={j} className="bg-gray-700/50 rounded p-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-white text-xs font-medium">{init.initiative}</p>
                          <div className="flex gap-2"><span className={`text-xs ${EFFORT_COLOR[init.effort]||'text-gray-400'}`}>Effort:{init.effort}</span><span className={`text-xs ${EFFORT_COLOR[init.impact]||'text-gray-400'}`}>Impact:{init.impact}</span></div>
                        </div>
                        {init.kpis&&init.kpis.length>0&&<p className="text-gray-400 text-xs">KPIs: {init.kpis.join(', ')}</p>}
                      </div>
                    ))}
                  </div>
                  {(ph.milestones||[]).length>0 && <div className="mt-2"><p className="text-xs text-gray-400 mb-1">Milestones</p><ul className="space-y-0.5">{ph.milestones.map((m:string,j:number)=><li key={j} className="text-gray-300 text-xs">🏁 {m}</li>)}</ul></div>}
                </div>
              ))}
            </div>
          )}
          {subtab==='technology' && (
            <div className="space-y-2">
              {(result.technologyStack||[]).map((t:any,i:number)=>(
                <div key={i} className="bg-gray-800 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-medium text-sm">{t.category}</p>
                    <span className={`text-xs ${TECH_PRIORITY_COLOR[t.priority]||'text-gray-400'}`}>{t.priority}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 mb-1">
                    <div><span className="text-gray-400">Current: </span>{t.current}</div>
                    <div><span className="text-gray-400">Target: </span>{t.target}</div>
                  </div>
                  <p className="text-gray-400 text-xs">{t.rationale}</p>
                </div>
              ))}
            </div>
          )}
          {subtab==='change' && result.changeManagement && (
            <div className="space-y-3">
              {[['Cultural Shifts',result.changeManagement.culturalShifts,'text-purple-300'],['Training Plan',result.changeManagement.trainingPlan,'text-blue-300'],['Resistance Factors',result.changeManagement.resistanceFactors,'text-red-300']].map(([label,items,color])=>(
                <div key={label as string} className="bg-gray-800 rounded p-3"><p className="text-xs text-gray-400 mb-2">{label}</p><ul className="space-y-1">{(items as string[]).map((it,i)=><li key={i} className={`text-xs ${color}`}>• {it}</li>)}</ul></div>
              ))}
              {result.changeManagement.communicationStrategy && <div className="bg-gray-800 rounded p-3"><p className="text-xs text-gray-400 mb-1">Communication Strategy</p><p className="text-gray-300 text-xs">{result.changeManagement.communicationStrategy}</p></div>}
              {result.governanceModel && <div className="bg-gray-800 rounded p-3"><p className="text-xs text-gray-400 mb-2">Governance</p><p className="text-gray-300 text-xs mb-1">{result.governanceModel.decisionFramework}</p><p className="text-gray-400 text-xs">Review: {result.governanceModel.reviewCadence}</p></div>}
            </div>
          )}
          {subtab==='metrics' && (
            <div className="space-y-2">
              {(result.successMetrics||[]).map((m:any,i:number)=>(
                <div key={i} className="bg-gray-800 rounded p-3">
                  <p className="text-white font-medium text-sm mb-1">{m.metric}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-300">
                    <div><span className="text-gray-400">Baseline: </span>{m.baseline}</div>
                    <div><span className="text-gray-400">Target: </span>{m.target}</div>
                    <div><span className="text-gray-400">Method: </span>{m.measurementMethod}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v9.02 Vendor Evaluation Framework ---
const VENDOR_REC_COLOR: Record<string,string> = { 'Strongly Recommend':'text-green-400','Recommend':'text-blue-400','Neutral':'text-yellow-400','Not Recommend':'text-red-400' };
function VendorEvalPanel({ api }: { api: string }) {
  const [form, setForm] = useState({ projectName:'', vendorNames:'', budget:'', timeline:'', stakeholders:'', evaluationCriteria:'', mustHaves:'', niceToHaves:'', provider:'anthropic' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [subtab, setSubtab] = useState<'overview'|'criteria'|'vendors'|'matrix'|'recommendation'>('overview');
  const run = async () => {
    setLoading(true); setErr(''); setResult(null);
    try {
      const r = await fetch(`${api}/api/vendor-eval`, { method:'POST', headers:{'Content-Type':'application/json',...(localStorage.getItem('forge_token')?{Authorization:`Bearer ${localStorage.getItem('forge_token')}`}:{})}, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || 'Failed');
      setResult(d);
    } catch(e:any) { setErr(e.message); } finally { setLoading(false); }
  };
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-lg font-bold text-white mb-3">🔍 Vendor Evaluation Framework</h2>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[['projectName','Project Name'],['vendorNames','Vendor Names (comma-separated)'],['budget','Budget'],['timeline','Timeline'],['stakeholders','Key Stakeholders']].map(([k,l])=>(
          <div key={k}><label className="text-xs text-gray-400">{l}</label><input className="w-full bg-gray-800 text-white rounded p-2 text-sm mt-1" value={(form as any)[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={l} /></div>
        ))}
        <div><label className="text-xs text-gray-400">Provider</label><select className="w-full bg-gray-800 text-white rounded p-2 text-sm mt-1" value={form.provider} onChange={e=>setForm(f=>({...f,provider:e.target.value}))}><option value="anthropic">Anthropic</option><option value="openai">OpenAI</option><option value="gemini">Gemini</option></select></div>
      </div>
      {[['evaluationCriteria','Evaluation Criteria (e.g. cost, support, scalability)'],['mustHaves','Must-Have Requirements'],['niceToHaves','Nice-to-Have Features']].map(([k,l])=>(
        <div key={k} className="mb-3"><label className="text-xs text-gray-400">{l}</label><textarea className="w-full bg-gray-800 text-white rounded p-2 text-sm mt-1" rows={2} value={(form as any)[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={l} /></div>
      ))}
      <button onClick={run} disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded text-sm disabled:opacity-50">{loading?'Evaluating…':'Run Evaluation'}</button>
      {err && <p className="text-red-400 text-sm mt-2">{err}</p>}
      {result && (
        <div className="mt-5">
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <p className="text-white font-bold text-base mb-1">{result.frameworkTitle}</p>
            <p className="text-gray-300 text-sm">{result.executiveSummary}</p>
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {(['overview','criteria','vendors','matrix','recommendation'] as const).map(s=><button key={s} onClick={()=>setSubtab(s)} className={`px-3 py-1 rounded text-xs capitalize ${subtab===s?'bg-indigo-600 text-white':'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{s}</button>)}
          </div>
          {subtab==='overview' && (
            <div className="space-y-3">
              <div className="bg-gray-800 rounded p-3">
                <p className="text-xs text-gray-400 mb-2">Vendor Rankings</p>
                {(result.rankingSummary||[]).map((r:any)=>(
                  <div key={r.rank} className="flex items-start gap-3 mb-2 pb-2 border-b border-gray-700 last:border-0">
                    <span className="text-2xl font-bold text-gray-500 w-6">#{r.rank}</span>
                    <div><p className="text-white font-medium text-sm">{r.vendor} <span className="text-gray-400 text-xs">({r.score.toFixed(1)})</span></p><p className="text-gray-400 text-xs">{r.rationale}</p></div>
                  </div>
                ))}
              </div>
              {(result.implementationRisks||[]).length>0 && <div className="bg-gray-800 rounded p-3"><p className="text-xs text-gray-400 mb-2">Implementation Risks</p><ul className="space-y-1">{result.implementationRisks.map((r:string,i:number)=><li key={i} className="text-yellow-300 text-xs">⚠ {r}</li>)}</ul></div>}
              {(result.negotiationLeverage||[]).length>0 && <div className="bg-gray-800 rounded p-3"><p className="text-xs text-gray-400 mb-2">Negotiation Leverage</p><ul className="space-y-1">{result.negotiationLeverage.map((r:string,i:number)=><li key={i} className="text-green-300 text-xs">• {r}</li>)}</ul></div>}
            </div>
          )}
          {subtab==='criteria' && (
            <div className="space-y-2">
              {(result.evaluationCriteria||[]).map((c:any,i:number)=>(
                <div key={i} className="bg-gray-800 rounded p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2"><p className="text-white text-sm font-medium">{c.criterion}</p>{c.mustHave&&<span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded">Must Have</span>}</div>
                    <span className="text-xs text-gray-400">Weight: {c.weight}%</span>
                  </div>
                  <p className="text-gray-400 text-xs mb-2">{c.category} · {c.description}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs"><div className="bg-red-900/30 rounded p-1"><p className="text-red-400 font-medium mb-0.5">Score 1</p><p className="text-gray-300">{c.scoringGuide?.['1']}</p></div><div className="bg-yellow-900/30 rounded p-1"><p className="text-yellow-400 font-medium mb-0.5">Score 3</p><p className="text-gray-300">{c.scoringGuide?.['3']}</p></div><div className="bg-green-900/30 rounded p-1"><p className="text-green-400 font-medium mb-0.5">Score 5</p><p className="text-gray-300">{c.scoringGuide?.['5']}</p></div></div>
                </div>
              ))}
            </div>
          )}
          {subtab==='vendors' && (
            <div className="space-y-4">
              {(result.vendors||[]).map((v:any,i:number)=>(
                <div key={i} className="bg-gray-800 rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-bold">{v.vendorName}</p>
                    <span className={`text-xs font-medium ${VENDOR_REC_COLOR[v.recommendation]||'text-gray-400'}`}>{v.recommendation}</span>
                  </div>
                  <p className="text-gray-300 text-xs mb-3">{v.overview}</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div><p className="text-xs text-green-400 mb-1">Strengths</p><ul className="space-y-0.5">{(v.strengths||[]).map((s:string,j:number)=><li key={j} className="text-gray-300 text-xs">+ {s}</li>)}</ul></div>
                    <div><p className="text-xs text-red-400 mb-1">Weaknesses</p><ul className="space-y-0.5">{(v.weaknesses||[]).map((s:string,j:number)=><li key={j} className="text-gray-300 text-xs">- {s}</li>)}</ul></div>
                  </div>
                  {(v.riskFlags||[]).length>0 && <div className="mb-2"><p className="text-xs text-yellow-400 mb-1">Risk Flags</p><ul className="space-y-0.5">{v.riskFlags.map((r:string,j:number)=><li key={j} className="text-yellow-300 text-xs">⚠ {r}</li>)}</ul></div>}
                  {v.pricingNotes && <p className="text-gray-400 text-xs">💰 {v.pricingNotes}</p>}
                </div>
              ))}
            </div>
          )}
          {subtab==='matrix' && result.comparisonMatrix && (
            <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr>{result.comparisonMatrix.headers.map((h:string,i:number)=><th key={i} className="text-left text-gray-400 p-2 border-b border-gray-700">{h}</th>)}</tr></thead><tbody>{result.comparisonMatrix.rows.map((row:any,i:number)=><tr key={i} className="border-b border-gray-800"><td className="text-gray-300 p-2">{row.criterion}</td>{Object.values(row.scores).map((s:any,j:number)=><td key={j} className={`p-2 font-medium ${s>=4?'text-green-400':s>=3?'text-yellow-400':'text-red-400'}`}>{s}/5</td>)}</tr>)}</tbody></table></div>
          )}
          {subtab==='recommendation' && result.finalRecommendation && (
            <div className="space-y-3">
              <div className="bg-gray-800 rounded p-4">
                <p className="text-xs text-gray-400 mb-1">Preferred Vendor</p>
                <p className="text-green-400 font-bold text-lg mb-2">{result.finalRecommendation.preferredVendor}</p>
                <p className="text-gray-300 text-sm mb-3">{result.finalRecommendation.rationale}</p>
                {(result.finalRecommendation.conditions||[]).length>0 && <div className="mb-3"><p className="text-xs text-gray-400 mb-1">Conditions for Approval</p><ul className="space-y-1">{result.finalRecommendation.conditions.map((c:string,i:number)=><li key={i} className="text-yellow-300 text-xs">• {c}</li>)}</ul></div>}
                {result.finalRecommendation.alternativeIfFails && <p className="text-gray-400 text-xs">Alternative: {result.finalRecommendation.alternativeIfFails}</p>}
              </div>
              {(result.dueeDiligenceChecklist||[]).length>0 && <div className="bg-gray-800 rounded p-3"><p className="text-xs text-gray-400 mb-2">Due Diligence Checklist</p><ul className="space-y-1">{result.dueeDiligenceChecklist.map((c:string,i:number)=><li key={i} className="text-gray-300 text-xs flex gap-2"><span className="text-gray-600">☐</span>{c}</li>)}</ul></div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v9.01 Annual Performance Review Generator ---
const RATING_COLOR: Record<string,string> = { 'Exceptional':'text-yellow-400','Exceeds Expectations':'text-green-400','Meets Expectations':'text-blue-400','Needs Improvement':'text-red-400' };
const GOAL_STATUS_COLOR: Record<string,string> = { 'Achieved':'text-green-400','Partially Achieved':'text-yellow-400','Not Achieved':'text-red-400' };
function PerfReviewPanel({ api }: { api: string }) {
  const [form, setForm] = useState({ employeeName:'', role:'', department:'', reviewPeriod:'2026', managerName:'', keyResponsibilities:'', goals:'', achievements:'', challenges:'', provider:'anthropic' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [subtab, setSubtab] = useState<'overview'|'competencies'|'goals'|'strengths'|'development'|'next'>('overview');
  const run = async () => {
    setLoading(true); setErr(''); setResult(null);
    try {
      const r = await fetch(`${api}/api/perf-review`, { method:'POST', headers:{'Content-Type':'application/json',...(localStorage.getItem('forge_token')?{Authorization:`Bearer ${localStorage.getItem('forge_token')}`}:{})}, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || 'Failed');
      setResult(d);
    } catch(e:any) { setErr(e.message); } finally { setLoading(false); }
  };
  const subtabs = ['overview','competencies','goals','strengths','development','next'] as const;
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-lg font-bold text-white mb-3">⭐ Annual Performance Review Generator</h2>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[['employeeName','Employee Name'],['role','Role/Title'],['department','Department'],['reviewPeriod','Review Period'],['managerName','Manager Name']].map(([k,l])=>(
          <div key={k}><label className="text-xs text-gray-400">{l}</label><input className="w-full bg-gray-800 text-white rounded p-2 text-sm mt-1" value={(form as any)[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={l} /></div>
        ))}
        <div><label className="text-xs text-gray-400">Provider</label><select className="w-full bg-gray-800 text-white rounded p-2 text-sm mt-1" value={form.provider} onChange={e=>setForm(f=>({...f,provider:e.target.value}))}><option value="anthropic">Anthropic</option><option value="openai">OpenAI</option><option value="gemini">Gemini</option></select></div>
      </div>
      {[['keyResponsibilities','Key Responsibilities'],['goals','Goals Set for Period'],['achievements','Key Achievements'],['challenges','Challenges Faced']].map(([k,l])=>(
        <div key={k} className="mb-3"><label className="text-xs text-gray-400">{l}</label><textarea className="w-full bg-gray-800 text-white rounded p-2 text-sm mt-1" rows={2} value={(form as any)[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={l} /></div>
      ))}
      <button onClick={run} disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded text-sm disabled:opacity-50">{loading?'Generating…':'Generate Review'}</button>
      {err && <p className="text-red-400 text-sm mt-2">{err}</p>}
      {result && (
        <div className="mt-5">
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-white font-bold text-base">{result.reviewTitle}</p>
                <p className="text-gray-400 text-sm">{form.employeeName} · {form.role} · {form.reviewPeriod}</p>
              </div>
              <span className={`text-sm font-bold px-3 py-1 rounded-full bg-gray-700 ${RATING_COLOR[result.overallRating]||'text-white'}`}>{result.overallRating}</span>
            </div>
            <p className="text-gray-300 text-sm mt-3">{result.overallRatingJustification}</p>
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {subtabs.map(s=><button key={s} onClick={()=>setSubtab(s)} className={`px-3 py-1 rounded text-xs capitalize ${subtab===s?'bg-indigo-600 text-white':'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{s==='next'?'Next Year':s}</button>)}
          </div>
          {subtab==='overview' && (
            <div className="space-y-3">
              <div className="bg-gray-800 rounded p-3"><p className="text-xs text-gray-400 mb-1">Manager Narrative</p><p className="text-gray-200 text-sm whitespace-pre-line">{result.managerNarrative}</p></div>
              {result.compensationNote && <div className="bg-gray-800 rounded p-3"><p className="text-xs text-gray-400 mb-1">Compensation Note</p><p className="text-gray-200 text-sm">{result.compensationNote}</p></div>}
              <div className="bg-gray-800 rounded p-3"><p className="text-xs text-gray-400 mb-2">Self-Assessment Prompts for Employee</p><ul className="space-y-1">{(result.employeeSelfAssessmentPrompts||[]).map((q:string,i:number)=><li key={i} className="text-gray-300 text-xs">• {q}</li>)}</ul></div>
              {result.careerDevelopment && <div className="bg-gray-800 rounded p-3 grid grid-cols-3 gap-3">{[['Short-Term Path',result.careerDevelopment.shortTermPath],['Long-Term Path',result.careerDevelopment.longTermPath],['Stretch Assignment',result.careerDevelopment.stretchAssignment]].map(([l,v])=><div key={l}><p className="text-xs text-gray-400 mb-1">{l}</p><p className="text-gray-200 text-xs">{v}</p></div>)}</div>}
            </div>
          )}
          {subtab==='competencies' && (
            <div className="space-y-2">
              {(result.competencyRatings||[]).map((c:any,i:number)=>(
                <div key={i} className="bg-gray-800 rounded p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white text-sm font-medium">{c.competency}</p>
                    <div className="flex gap-1">{[1,2,3,4,5].map(n=><span key={n} className={`w-4 h-4 rounded-full text-xs flex items-center justify-center ${n<=c.rating?'bg-indigo-500':'bg-gray-600'}`} />)}</div>
                  </div>
                  <p className="text-gray-300 text-xs mb-1"><span className="text-gray-400">Evidence: </span>{c.evidence}</p>
                  {c.developmentNote && <p className="text-blue-300 text-xs">💡 {c.developmentNote}</p>}
                </div>
              ))}
            </div>
          )}
          {subtab==='goals' && (
            <div className="space-y-2">
              {(result.goalAssessment||[]).map((g:any,i:number)=>(
                <div key={i} className="bg-gray-800 rounded p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white text-sm">{g.goal}</p>
                    <span className={`text-xs font-medium ${GOAL_STATUS_COLOR[g.status]||'text-gray-400'}`}>{g.status}</span>
                  </div>
                  <p className="text-gray-300 text-xs mb-1"><span className="text-gray-400">Evidence: </span>{g.evidence}</p>
                  <p className="text-gray-300 text-xs"><span className="text-gray-400">Impact: </span>{g.impact}</p>
                </div>
              ))}
            </div>
          )}
          {subtab==='strengths' && (
            <div className="space-y-2">
              {(result.keyStrengths||[]).map((s:any,i:number)=>(
                <div key={i} className="bg-gray-800 rounded p-3">
                  <p className="text-green-400 font-medium text-sm mb-1">✓ {s.strength}</p>
                  <p className="text-gray-300 text-xs mb-1"><span className="text-gray-400">Example: </span>{s.example}</p>
                  <p className="text-gray-300 text-xs"><span className="text-gray-400">Business Impact: </span>{s.businessImpact}</p>
                </div>
              ))}
            </div>
          )}
          {subtab==='development' && (
            <div className="space-y-2">
              {(result.developmentAreas||[]).map((d:any,i:number)=>(
                <div key={i} className="bg-gray-800 rounded p-3">
                  <p className="text-yellow-400 font-medium text-sm mb-2">⚠ {d.area}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 mb-2">
                    <div><span className="text-gray-400">Current: </span>{d.currentState}</div>
                    <div><span className="text-gray-400">Target: </span>{d.targetState}</div>
                  </div>
                  <p className="text-gray-300 text-xs"><span className="text-gray-400">Action Plan: </span>{d.actionPlan}</p>
                </div>
              ))}
            </div>
          )}
          {subtab==='next' && (
            <div className="space-y-2">
              {(result.nextYearGoals||[]).map((g:any,i:number)=>(
                <div key={i} className="bg-gray-800 rounded p-3">
                  <p className="text-white font-medium text-sm mb-1">{g.goal}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-300">
                    <div><span className="text-gray-400">Metric: </span>{g.metric}</div>
                    <div><span className="text-gray-400">Timeline: </span>{g.timeline}</div>
                    <div><span className="text-gray-400">Support: </span>{g.support}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v9.00 Agency Proposal Generator ---
function AgencyProposalPanel({ api }: { api: string }) {
  const [agencyName, setAgencyName] = useState('');
  const [clientName, setClientName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [projectGoals, setProjectGoals] = useState('');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('3 months');
  const [clientIndustry, setClientIndustry] = useState('');
  const [differentiators, setDifferentiators] = useState('');
  const [provider, setProvider] = useState('anthropic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [section, setSection] = useState<'overview'|'scope'|'team'|'cases'|'budget'|'terms'>('overview');
  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${api}/api/agency-proposal`, { method:'POST', headers:{'Content-Type':'application/json',...(localStorage.getItem('forge_token')?{'Authorization':`Bearer ${localStorage.getItem('forge_token')}`}:{})}, body: JSON.stringify({ agencyName, clientName, projectType, projectGoals, budget, timeline, clientIndustry, differentiators, provider }) });
      const d = await r.json();
      if (!r.ok) setError(d.error || 'Error');
      else setResult(d);
    } catch(e:any) { setError(e.message); }
    setLoading(false);
  };
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-bold text-white mb-3">📄 Agency Proposal Generator</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Agency name" value={agencyName} onChange={e=>setAgencyName(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Client name" value={clientName} onChange={e=>setClientName(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Project type" value={projectType} onChange={e=>setProjectType(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Client industry" value={clientIndustry} onChange={e=>setClientIndustry(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Budget" value={budget} onChange={e=>setBudget(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Timeline" value={timeline} onChange={e=>setTimeline(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <textarea className="bg-gray-700 text-white rounded px-3 py-2 text-sm" rows={2} placeholder="Project goals" value={projectGoals} onChange={e=>setProjectGoals(e.target.value)} />
          <textarea className="bg-gray-700 text-white rounded px-3 py-2 text-sm" rows={2} placeholder="Agency differentiators" value={differentiators} onChange={e=>setDifferentiators(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <select className="bg-gray-700 text-white rounded px-3 py-2 text-sm" value={provider} onChange={e=>setProvider(e.target.value)}>
            {['anthropic','openai','gemini','groq'].map(p=><option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={run} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50">
            {loading ? 'Generating…' : 'Generate Proposal'}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>
      {result && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-white font-bold text-lg">{result.proposalTitle}</h3>
            <p className="text-gray-300 text-sm mt-2">{result.executiveSummary}</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {(['overview','scope','team','cases','budget','terms'] as const).map(s=>(
                <button key={s} onClick={()=>setSection(s)} className={`px-3 py-1 rounded text-xs font-medium ${section===s?'bg-blue-700 text-white':'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{s.charAt(0).toUpperCase()+s.slice(1)}</button>
              ))}
            </div>
          </div>
          {section==='overview' && result.clientUnderstanding && (
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <div><p className="text-blue-400 text-xs font-semibold">Situation</p><p className="text-gray-300 text-sm mt-1">{result.clientUnderstanding.situation}</p></div>
              <div><p className="text-red-400 text-xs font-semibold">Challenges</p><ul className="mt-1 space-y-0.5">{(result.clientUnderstanding.challenges||[]).map((c:string,i:number)=><li key={i} className="text-gray-300 text-xs">• {c}</li>)}</ul></div>
              <div><p className="text-green-400 text-xs font-semibold">Opportunities</p><ul className="mt-1 space-y-0.5">{(result.clientUnderstanding.opportunities||[]).map((o:string,i:number)=><li key={i} className="text-gray-300 text-xs">• {o}</li>)}</ul></div>
              {result.proposedSolution && <div className="bg-gray-700 rounded p-3"><p className="text-yellow-400 text-xs font-semibold mb-1">Our Approach</p><p className="text-gray-300 text-sm">{result.proposedSolution.approach}</p><p className="text-purple-400 text-xs mt-2">✨ {result.proposedSolution.uniqueAngle}</p></div>}
              {result.whyUs && <div><p className="text-teal-400 text-xs font-semibold mb-2">Why Us</p><div className="space-y-1">{result.whyUs.map((w:any,i:number)=><div key={i} className="bg-gray-700 rounded px-3 py-2"><span className="text-white text-xs font-medium">{w.reason}</span><p className="text-gray-400 text-xs mt-0.5">{w.evidence}</p></div>)}</div></div>}
            </div>
          )}
          {section==='scope' && result.scopeOfWork && (
            <div className="space-y-3">{result.scopeOfWork.map((ph:any,i:number)=>(
              <div key={i} className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between mb-2"><span className="text-white font-medium">{ph.phase}</span><span className="text-gray-400 text-xs">{ph.timeline}</span></div>
                <p className="text-blue-400 text-xs">Team: {ph.team?.join(', ')}</p>
                <ul className="mt-2 space-y-0.5">{(ph.deliverables||[]).map((d:string,i:number)=><li key={i} className="text-gray-300 text-xs">✓ {d}</li>)}</ul>
              </div>
            ))}</div>
          )}
          {section==='team' && result.teamBios && (
            <div className="grid grid-cols-2 gap-3">{result.teamBios.map((t:any,i:number)=>(
              <div key={i} className="bg-gray-800 rounded-lg p-4">
                <p className="text-white font-semibold">{t.name}</p>
                <p className="text-blue-400 text-xs">{t.role}</p>
                <p className="text-gray-400 text-xs mt-1">{t.relevantExperience}</p>
                <p className="text-gray-300 text-xs mt-1 italic">{t.contribution}</p>
              </div>
            ))}</div>
          )}
          {section==='cases' && result.caseStudies && (
            <div className="space-y-3">{result.caseStudies.map((c:any,i:number)=>(
              <div key={i} className="bg-gray-800 rounded-lg p-4">
                <p className="text-white font-semibold">{c.client}</p>
                <p className="text-red-400 text-xs mt-1">Challenge: {c.challenge}</p>
                <p className="text-blue-400 text-xs mt-1">Solution: {c.solution}</p>
                <div className="mt-2"><p className="text-green-400 text-xs font-semibold">Results:</p><ul className="space-y-0.5 mt-1">{(c.results||[]).map((r:string,i:number)=><li key={i} className="text-gray-300 text-xs">• {r}</li>)}</ul></div>
              </div>
            ))}</div>
          )}
          {section==='budget' && result.investmentBreakdown && (
            <div className="bg-gray-800 rounded-lg p-4">
              <table className="w-full text-xs"><thead><tr className="text-gray-400 border-b border-gray-600"><th className="text-left py-1">Item</th><th className="text-left py-1">Description</th><th className="text-right py-1">Cost</th></tr></thead>
              <tbody>{result.investmentBreakdown.map((b:any,i:number)=><tr key={i} className="border-b border-gray-700"><td className="text-white py-2">{b.item}</td><td className="text-gray-400 py-2">{b.description}</td><td className="text-green-400 text-right py-2">{b.cost}</td></tr>)}</tbody></table>
              {result.callToAction && <div className="mt-4 bg-blue-900/40 border border-blue-700 rounded p-3"><p className="text-blue-300 text-sm">{result.callToAction}</p></div>}
            </div>
          )}
          {section==='terms' && result.terms && (
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              {Object.entries(result.terms).map(([k,v])=><div key={k}><p className="text-yellow-400 text-xs font-semibold capitalize">{k.replace(/([A-Z])/g,' $1')}</p><p className="text-gray-300 text-sm mt-1">{v as string}</p></div>)}
              {result.nextSteps && <div><p className="text-green-400 text-xs font-semibold">Next Steps</p><ol className="mt-1 space-y-0.5">{result.nextSteps.map((s:string,i:number)=><li key={i} className="text-gray-300 text-xs">{i+1}. {s}</li>)}</ol></div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v8.99 Customer Journey Map Generator ---
const EMOTION_BG: Record<string,string> = { Positive:'bg-green-900/40 border-green-700', Neutral:'bg-gray-700 border-gray-600', Negative:'bg-red-900/40 border-red-700' };
const MOMENT_COLOR: Record<string,string> = { Peak:'text-green-400', Pain:'text-red-400', Critical:'text-yellow-400' };
function JourneyMapPanel({ api }: { api: string }) {
  const [product, setProduct] = useState('');
  const [persona, setPersona] = useState('');
  const [personaGoal, setPersonaGoal] = useState('');
  const [industry, setIndustry] = useState('');
  const [touchpoints, setTouchpoints] = useState('');
  const [painPoints, setPainPoints] = useState('');
  const [provider, setProvider] = useState('anthropic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [activeStage, setActiveStage] = useState(0);
  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${api}/api/journey-map`, { method:'POST', headers:{'Content-Type':'application/json',...(localStorage.getItem('forge_token')?{'Authorization':`Bearer ${localStorage.getItem('forge_token')}`}:{})}, body: JSON.stringify({ product, persona, personaGoal, industry, touchpoints, painPoints, provider }) });
      const d = await r.json();
      if (!r.ok) setError(d.error || 'Error');
      else setResult(d);
    } catch(e:any) { setError(e.message); }
    setLoading(false);
  };
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-bold text-white mb-3">🗺️ Customer Journey Map</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Product / service name" value={product} onChange={e=>setProduct(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Customer persona (e.g. marketing manager)" value={persona} onChange={e=>setPersona(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Persona goal" value={personaGoal} onChange={e=>setPersonaGoal(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Industry" value={industry} onChange={e=>setIndustry(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Known touchpoints" value={touchpoints} onChange={e=>setTouchpoints(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Known pain points" value={painPoints} onChange={e=>setPainPoints(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <select className="bg-gray-700 text-white rounded px-3 py-2 text-sm" value={provider} onChange={e=>setProvider(e.target.value)}>
            {['anthropic','openai','gemini','groq'].map(p=><option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={run} disabled={loading} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50">
            {loading ? 'Mapping…' : 'Generate Map'}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>
      {result && (
        <div className="space-y-4">
          {result.persona && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-white font-bold">{result.mapTitle}</h3>
              <div className="mt-3 bg-gray-700 rounded p-3 flex justify-between items-start">
                <div><p className="text-teal-400 font-semibold">{result.persona.name}</p><p className="text-gray-400 text-xs">{result.persona.role}</p><p className="text-gray-400 text-xs mt-1">Tech: {result.persona.techSavviness}</p></div>
                <div className="text-right"><p className="text-gray-400 text-xs">Goals: {result.persona.goals?.join(', ')}</p><p className="text-red-400 text-xs mt-1">Frustrations: {result.persona.frustrations?.join(', ')}</p></div>
              </div>
            </div>
          )}
          {result.stages && (
            <>
              <div className="flex gap-2 flex-wrap">
                {result.stages.map((s:any,i:number)=>(
                  <button key={i} onClick={()=>setActiveStage(i)} className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 ${activeStage===i?'bg-teal-700 text-white':'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                    {s.emotions?.emoji} {s.stage}
                  </button>
                ))}
              </div>
              {result.stages[activeStage] && (() => {
                const s = result.stages[activeStage];
                return (
                  <div className="space-y-3">
                    <div className={`border rounded-lg p-4 ${EMOTION_BG[s.emotions?.overall]||'bg-gray-800 border-gray-600'}`}>
                      <div className="flex justify-between items-start">
                        <div><p className="text-white font-semibold">{s.stage}</p><p className="text-gray-400 text-xs">{s.stageGoal} · {s.duration}</p></div>
                        <span className="text-2xl">{s.emotions?.emoji}</span>
                      </div>
                      <p className="text-gray-300 text-sm mt-2">{s.emotions?.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-800 rounded p-3"><p className="text-blue-400 text-xs font-semibold mb-1">Actions</p><ul className="space-y-0.5">{(s.actions||[]).map((a:string,i:number)=><li key={i} className="text-gray-300 text-xs">• {a}</li>)}</ul></div>
                      <div className="bg-gray-800 rounded p-3"><p className="text-purple-400 text-xs font-semibold mb-1">Touchpoints</p><ul className="space-y-0.5">{(s.touchpoints||[]).map((t:string,i:number)=><li key={i} className="text-gray-300 text-xs">• {t}</li>)}</ul></div>
                      <div className="bg-gray-800 rounded p-3"><p className="text-red-400 text-xs font-semibold mb-1">Pain Points</p><ul className="space-y-0.5">{(s.painPoints||[]).map((p:string,i:number)=><li key={i} className="text-gray-300 text-xs">• {p}</li>)}</ul></div>
                      <div className="bg-gray-800 rounded p-3"><p className="text-green-400 text-xs font-semibold mb-1">Opportunities</p><ul className="space-y-0.5">{(s.opportunities||[]).map((o:string,i:number)=><li key={i} className="text-gray-300 text-xs">• {o}</li>)}</ul></div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
          {result.moments?.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">⚡ Key Moments</h4>
              <div className="space-y-2">{result.moments.map((m:any,i:number)=>(
                <div key={i} className="bg-gray-700 rounded p-3">
                  <div className="flex justify-between"><span className="text-white text-sm font-medium">{m.moment}</span><span className={`text-xs font-bold ${MOMENT_COLOR[m.type]||'text-gray-400'}`}>{m.type}</span></div>
                  <p className="text-gray-400 text-xs mt-1">{m.description}</p>
                  <p className="text-blue-400 text-xs mt-1">→ {m.recommendation}</p>
                </div>
              ))}</div>
            </div>
          )}
          {result.implementationPriorities?.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">🎯 Implementation Priorities</h4>
              <div className="space-y-2">{result.implementationPriorities.map((p:any,i:number)=>(
                <div key={i} className="flex justify-between bg-gray-700 rounded px-3 py-2">
                  <div><span className="text-white text-sm">{p.priority}</span><span className="text-gray-400 text-xs ml-2">({p.stage})</span></div>
                  <div className="flex gap-2 text-xs"><span className="text-yellow-400">Effort: {p.effort}</span><span className="text-green-400">Impact: {p.impact}</span></div>
                </div>
              ))}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v8.98 Talent Acquisition Strategy Generator ---
const HIRE_PRIORITY_COLOR: Record<string,string> = { Critical:'text-red-400', High:'text-orange-400', Medium:'text-yellow-400' };
function TalentStrategyPanel({ api }: { api: string }) {
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [rolesNeeded, setRolesNeeded] = useState('');
  const [timeline, setTimeline] = useState('6 months');
  const [budget, setBudget] = useState('');
  const [currentTeamSize, setCurrentTeamSize] = useState('');
  const [remotePolicy, setRemotePolicy] = useState('hybrid');
  const [competitorEmployers, setCompetitorEmployers] = useState('');
  const [provider, setProvider] = useState('anthropic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState<'hiring'|'branding'|'sourcing'|'dei'|'budget'>('hiring');
  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${api}/api/talent-strategy`, { method:'POST', headers:{'Content-Type':'application/json',...(localStorage.getItem('forge_token')?{'Authorization':`Bearer ${localStorage.getItem('forge_token')}`}:{})}, body: JSON.stringify({ company, industry, rolesNeeded, timeline, budget, currentTeamSize, remotePolicy, competitorEmployers, provider }) });
      const d = await r.json();
      if (!r.ok) setError(d.error || 'Error');
      else setResult(d);
    } catch(e:any) { setError(e.message); }
    setLoading(false);
  };
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-bold text-white mb-3">🎯 Talent Acquisition Strategy</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Company name" value={company} onChange={e=>setCompany(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Industry" value={industry} onChange={e=>setIndustry(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Roles needed (e.g. engineers, PMs)" value={rolesNeeded} onChange={e=>setRolesNeeded(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Timeline" value={timeline} onChange={e=>setTimeline(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Budget" value={budget} onChange={e=>setBudget(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Current team size" value={currentTeamSize} onChange={e=>setCurrentTeamSize(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Remote policy (remote/hybrid/onsite)" value={remotePolicy} onChange={e=>setRemotePolicy(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Competitor employers" value={competitorEmployers} onChange={e=>setCompetitorEmployers(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <select className="bg-gray-700 text-white rounded px-3 py-2 text-sm" value={provider} onChange={e=>setProvider(e.target.value)}>
            {['anthropic','openai','gemini','groq'].map(p=><option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={run} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50">
            {loading ? 'Generating…' : 'Generate Strategy'}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>
      {result && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-white font-bold text-lg">{result.strategyTitle}</h3>
            <p className="text-gray-300 text-sm mt-2">{result.executiveSummary}</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {(['hiring','branding','sourcing','dei','budget'] as const).map(s=>(
                <button key={s} onClick={()=>setActiveSection(s)} className={`px-3 py-1 rounded text-xs font-medium ${activeSection===s?'bg-purple-700 text-white':'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{s.charAt(0).toUpperCase()+s.slice(1)}</button>
              ))}
            </div>
          </div>
          {activeSection==='hiring' && result.hiringPlan && (
            <div className="space-y-3">
              {result.hiringPlan.map((role:any,i:number)=>(
                <div key={i} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div><span className="text-white font-semibold">{role.role}</span><span className="text-gray-400 text-sm ml-2">({role.level})</span></div>
                    <div className="flex gap-2 items-center"><span className="text-gray-400 text-xs">×{role.quantity}</span><span className={`text-xs font-bold ${HIRE_PRIORITY_COLOR[role.priority]||'text-gray-400'}`}>{role.priority}</span></div>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">Start: {role.targetStartDate} · Salary: {role.salaryRange}</p>
                  <p className="text-gray-400 text-xs mt-1">Skills: {role.keySkills?.join(', ')}</p>
                  <p className="text-blue-400 text-xs mt-1">Channels: {role.sourcingChannels?.join(', ')}</p>
                </div>
              ))}
            </div>
          )}
          {activeSection==='branding' && result.employerBrandingStrategy && (
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <div><p className="text-yellow-400 text-xs font-semibold">Value Proposition</p><p className="text-white text-sm mt-1">{result.employerBrandingStrategy.valueProposition}</p></div>
              <div><p className="text-blue-400 text-xs font-semibold">Differentiators</p><ul className="mt-1 space-y-1">{(result.employerBrandingStrategy.differentiators||[]).map((d:string,i:number)=><li key={i} className="text-gray-300 text-xs">• {d}</li>)}</ul></div>
              <div><p className="text-purple-400 text-xs font-semibold">Content Pillars</p><div className="flex flex-wrap gap-1 mt-1">{(result.employerBrandingStrategy.contentPillars||[]).map((p:string,i:number)=><span key={i} className="bg-purple-900/40 text-purple-300 text-xs px-2 py-0.5 rounded">{p}</span>)}</div></div>
              <div><p className="text-green-400 text-xs font-semibold">Channel Strategy</p><p className="text-gray-300 text-sm mt-1">{result.employerBrandingStrategy.channelStrategy}</p></div>
            </div>
          )}
          {activeSection==='sourcing' && result.sourcingChannels && (
            <div className="space-y-3">{result.sourcingChannels.map((ch:any,i:number)=>(
              <div key={i} className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between"><span className="text-white font-medium">{ch.channel}</span><span className="text-gray-400 text-xs">{ch.timeToHire} · {ch.estimatedCostPerHire}</span></div>
                <p className="text-blue-400 text-xs mt-1">Best for: {ch.bestFor}</p>
                <ul className="mt-1 space-y-0.5">{(ch.tactics||[]).map((t:string,ti:number)=><li key={ti} className="text-gray-400 text-xs">• {t}</li>)}</ul>
              </div>
            ))}</div>
          )}
          {activeSection==='dei' && result.diversityInclusion && (
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <div><p className="text-pink-400 text-xs font-semibold">Goals</p><ul className="mt-1 space-y-1">{(result.diversityInclusion.goals||[]).map((g:string,i:number)=><li key={i} className="text-gray-300 text-xs">• {g}</li>)}</ul></div>
              <div><p className="text-blue-400 text-xs font-semibold">Initiatives</p><ul className="mt-1 space-y-1">{(result.diversityInclusion.initiatives||[]).map((g:string,i:number)=><li key={i} className="text-gray-300 text-xs">• {g}</li>)}</ul></div>
              <div><p className="text-yellow-400 text-xs font-semibold">Bias Reduction</p><ul className="mt-1 space-y-1">{(result.diversityInclusion.biasReductionTactics||[]).map((g:string,i:number)=><li key={i} className="text-gray-300 text-xs">• {g}</li>)}</ul></div>
            </div>
          )}
          {activeSection==='budget' && result.budgetBreakdown && (
            <div className="bg-gray-800 rounded-lg p-4">
              <table className="w-full text-xs"><thead><tr className="text-gray-400 border-b border-gray-600"><th className="text-left py-1">Category</th><th className="text-right py-1">Est. Cost</th><th className="text-left py-1 pl-3">Notes</th></tr></thead>
              <tbody>{result.budgetBreakdown.map((b:any,i:number)=><tr key={i} className="border-b border-gray-700"><td className="text-white py-1.5">{b.category}</td><td className="text-green-400 text-right py-1.5">{b.estimatedCost}</td><td className="text-gray-400 py-1.5 pl-3">{b.notes}</td></tr>)}</tbody></table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v8.97 Product Launch Checklist Generator ---
const PRIORITY_DOT: Record<string,string> = { Critical:'bg-red-500', High:'bg-orange-400', Medium:'bg-yellow-400', Low:'bg-green-400' };
function LaunchChecklistPanel({ api }: { api: string }) {
  const [productName, setProductName] = useState('');
  const [productType, setProductType] = useState('SaaS');
  const [targetMarket, setTargetMarket] = useState('B2B');
  const [launchDate, setLaunchDate] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [channels, setChannels] = useState('');
  const [budget, setBudget] = useState('');
  const [provider, setProvider] = useState('anthropic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [checked, setChecked] = useState<Record<string,boolean>>({});
  const [activePhase, setActivePhase] = useState(0);
  const toggle = (key: string) => setChecked(p=>({...p,[key]:!p[key]}));
  const run = async () => {
    setLoading(true); setError(''); setResult(null); setChecked({});
    try {
      const r = await fetch(`${api}/api/launch-checklist`, { method:'POST', headers:{'Content-Type':'application/json',...(localStorage.getItem('forge_token')?{'Authorization':`Bearer ${localStorage.getItem('forge_token')}`}:{})}, body: JSON.stringify({ productName, productType, targetMarket, launchDate, teamSize, channels, budget, provider }) });
      const d = await r.json();
      if (!r.ok) setError(d.error || 'Error');
      else setResult(d);
    } catch(e:any) { setError(e.message); }
    setLoading(false);
  };
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-bold text-white mb-3">🚀 Product Launch Checklist</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Product name" value={productName} onChange={e=>setProductName(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Product type (SaaS, mobile app…)" value={productType} onChange={e=>setProductType(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Target market (B2B, B2C…)" value={targetMarket} onChange={e=>setTargetMarket(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Launch date" value={launchDate} onChange={e=>setLaunchDate(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Team size" value={teamSize} onChange={e=>setTeamSize(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Launch channels" value={channels} onChange={e=>setChannels(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm col-span-2" placeholder="Budget (optional)" value={budget} onChange={e=>setBudget(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <select className="bg-gray-700 text-white rounded px-3 py-2 text-sm" value={provider} onChange={e=>setProvider(e.target.value)}>
            {['anthropic','openai','gemini','groq'].map(p=><option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={run} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50">
            {loading ? 'Generating…' : 'Generate Checklist'}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>
      {result && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-white font-bold text-lg">{result.launchTitle}</h3>
            <p className="text-gray-400 text-sm">Launch: {result.launchDate}</p>
            {result.phases && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {result.phases.map((ph:any,i:number)=>(
                  <button key={i} onClick={()=>setActivePhase(i)} className={`px-3 py-1 rounded text-xs font-medium ${activePhase===i?'bg-green-700 text-white':'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                    {ph.phase} <span className="text-gray-400">({ph.timeline})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {result.phases?.[activePhase] && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">{result.phases[activePhase].phase}</h4>
              <div className="space-y-2">
                {result.phases[activePhase].items?.map((item:any,i:number)=>{
                  const key = `${activePhase}-${i}`;
                  return (
                    <div key={i} className={`border rounded p-3 ${checked[key]?'border-green-700 bg-green-900/20':'border-gray-600 bg-gray-700'}`}>
                      <div className="flex items-start gap-2">
                        <input type="checkbox" checked={!!checked[key]} onChange={()=>toggle(key)} className="mt-0.5 accent-green-500" />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className={`text-sm font-medium ${checked[key]?'line-through text-gray-500':'text-white'}`}>{item.task}</span>
                            <div className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[item.priority]||'bg-gray-400'}`}></span><span className="text-gray-400 text-xs">{item.priority}</span></div>
                          </div>
                          <p className="text-gray-400 text-xs mt-0.5">Owner: {item.owner} · Due: {item.dueDate}</p>
                          {item.notes && <p className="text-gray-500 text-xs mt-0.5">{item.notes}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {result.goNoGoCriteria?.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">🚦 Go / No-Go Criteria</h4>
              <div className="space-y-2">{result.goNoGoCriteria.map((c:any,i:number)=>(
                <div key={i} className="bg-gray-700 rounded px-3 py-2 flex justify-between">
                  <span className="text-white text-sm">{c.criterion}</span>
                  <span className="text-green-400 text-xs">{c.threshold} · {c.owner}</span>
                </div>
              ))}</div>
            </div>
          )}
          {result.launchDayRunbook?.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">📋 Launch Day Runbook</h4>
              <div className="space-y-1">{result.launchDayRunbook.map((r:any,i:number)=>(
                <div key={i} className="flex gap-3 text-xs border-b border-gray-700 pb-1">
                  <span className="text-blue-400 font-mono w-16 shrink-0">{r.time}</span>
                  <span className="text-white flex-1">{r.action}</span>
                  <span className="text-gray-400 w-24 shrink-0">{r.owner}</span>
                </div>
              ))}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v8.96 Board Meeting Agenda Generator ---
const AGENDA_TYPE_COLOR: Record<string,string> = { Information:'bg-blue-900/40 text-blue-300', Discussion:'bg-purple-900/40 text-purple-300', Decision:'bg-red-900/40 text-red-300', Action:'bg-green-900/40 text-green-300' };
function BoardAgendaPanel({ api }: { api: string }) {
  const [company, setCompany] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [duration, setDuration] = useState('3 hours');
  const [boardSize, setBoardSize] = useState('7');
  const [quarter, setQuarter] = useState('Q3');
  const [keyTopics, setKeyTopics] = useState('');
  const [financialHighlights, setFinancialHighlights] = useState('');
  const [strategicUpdates, setStrategicUpdates] = useState('');
  const [provider, setProvider] = useState('anthropic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${api}/api/board-agenda`, { method:'POST', headers:{'Content-Type':'application/json',...(localStorage.getItem('forge_token')?{'Authorization':`Bearer ${localStorage.getItem('forge_token')}`}:{})}, body: JSON.stringify({ company, meetingDate, duration, boardSize, quarter, keyTopics, financialHighlights, strategicUpdates, provider }) });
      const d = await r.json();
      if (!r.ok) setError(d.error || 'Error');
      else setResult(d);
    } catch(e:any) { setError(e.message); }
    setLoading(false);
  };
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-bold text-white mb-3">🏛️ Board Meeting Agenda Generator</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Company name" value={company} onChange={e=>setCompany(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Meeting date" value={meetingDate} onChange={e=>setMeetingDate(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Duration (e.g. 3 hours)" value={duration} onChange={e=>setDuration(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Board size" value={boardSize} onChange={e=>setBoardSize(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Quarter (e.g. Q3 2026)" value={quarter} onChange={e=>setQuarter(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Key topics" value={keyTopics} onChange={e=>setKeyTopics(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <textarea className="bg-gray-700 text-white rounded px-3 py-2 text-sm" rows={2} placeholder="Financial highlights" value={financialHighlights} onChange={e=>setFinancialHighlights(e.target.value)} />
          <textarea className="bg-gray-700 text-white rounded px-3 py-2 text-sm" rows={2} placeholder="Strategic updates" value={strategicUpdates} onChange={e=>setStrategicUpdates(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <select className="bg-gray-700 text-white rounded px-3 py-2 text-sm" value={provider} onChange={e=>setProvider(e.target.value)}>
            {['anthropic','openai','gemini','groq'].map(p=><option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={run} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50">
            {loading ? 'Generating…' : 'Generate Agenda'}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>
      {result && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-white font-bold text-lg">{result.agendaTitle}</h3>
            {result.meetingDetails && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {Object.entries(result.meetingDetails).map(([k,v])=>(
                  <div key={k} className="bg-gray-700 rounded p-2 text-center">
                    <p className="text-gray-400 text-xs capitalize">{k}</p>
                    <p className="text-white text-xs font-medium mt-0.5">{v as string}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          {result.consentAgenda?.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-gray-400 text-xs font-semibold uppercase mb-2">📋 Consent Agenda</h4>
              <div className="space-y-1">{result.consentAgenda.map((c:any,i:number)=>(
                <div key={i} className="flex gap-2 text-xs"><span className="text-white font-medium">{c.item}</span><span className="text-gray-400">— {c.description}</span></div>
              ))}</div>
            </div>
          )}
          {result.agendaItems && (
            <div className="space-y-3">
              <h4 className="text-white font-semibold">📅 Agenda Items</h4>
              {result.agendaItems.map((item:any,i:number)=>(
                <div key={i} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-sm font-mono">{item.itemNumber}.</span>
                      <span className="text-white font-medium text-sm">{item.title}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${AGENDA_TYPE_COLOR[item.type]||'bg-gray-700 text-gray-300'}`}>{item.type}</span>
                      <span className="text-gray-400 text-xs">{item.duration}</span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs">Presenter: {item.presenter}</p>
                  <p className="text-gray-300 text-xs mt-1">{item.objective}</p>
                  {item.keyQuestions?.length > 0 && (
                    <div className="mt-2"><p className="text-yellow-400 text-xs font-semibold">Key Questions:</p>
                    <ul className="mt-1 space-y-0.5">{item.keyQuestions.map((q:string,qi:number)=><li key={qi} className="text-gray-400 text-xs">• {q}</li>)}</ul></div>
                  )}
                  <p className="text-green-400 text-xs mt-2">✓ {item.expectedOutcome}</p>
                </div>
              ))}
            </div>
          )}
          {result.postMeetingActions?.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">✅ Post-Meeting Actions</h4>
              <div className="space-y-2">{result.postMeetingActions.map((a:any,i:number)=>(
                <div key={i} className="flex justify-between bg-gray-700 rounded px-3 py-2">
                  <span className="text-gray-300 text-xs">{a.action}</span>
                  <span className="text-gray-400 text-xs">{a.owner} · {a.deadline}</span>
                </div>
              ))}</div>
            </div>
          )}
          {result.boardPackageChecklist?.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">📦 Board Package Checklist</h4>
              <div className="grid grid-cols-2 gap-1">{result.boardPackageChecklist.map((c:string,i:number)=>(
                <div key={i} className="text-gray-300 text-xs flex items-center gap-1"><span className="text-green-400">☐</span>{c}</div>
              ))}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v8.95 Crisis Communication Plan Generator ---
const CRISIS_SEV_COLOR: Record<string,string> = { Critical:'text-red-500', High:'text-orange-400', Medium:'text-yellow-400' };
function CrisisCommsPanel({ api }: { api: string }) {
  const [company, setCompany] = useState('');
  const [crisisType, setCrisisType] = useState('');
  const [crisisDescription, setCrisisDescription] = useState('');
  const [affectedParties, setAffectedParties] = useState('');
  const [severity, setSeverity] = useState('high');
  const [spokesperson, setSpokesperson] = useState('');
  const [provider, setProvider] = useState('anthropic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview'|'messages'|'media'|'social'|'recovery'>('overview');
  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${api}/api/crisis-comms`, { method:'POST', headers:{'Content-Type':'application/json',...(localStorage.getItem('forge_token')?{'Authorization':`Bearer ${localStorage.getItem('forge_token')}`}:{})}, body: JSON.stringify({ company, crisisType, crisisDescription, affectedParties, severity, spokesperson, provider }) });
      const d = await r.json();
      if (!r.ok) setError(d.error || 'Error');
      else setResult(d);
    } catch(e:any) { setError(e.message); }
    setLoading(false);
  };
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-bold text-white mb-3">🚨 Crisis Communication Plan</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Company name" value={company} onChange={e=>setCompany(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Crisis type (e.g. data breach, PR scandal)" value={crisisType} onChange={e=>setCrisisType(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Affected parties" value={affectedParties} onChange={e=>setAffectedParties(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Spokesperson" value={spokesperson} onChange={e=>setSpokesperson(e.target.value)} />
        </div>
        <textarea className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm mb-3" rows={2} placeholder="Crisis description" value={crisisDescription} onChange={e=>setCrisisDescription(e.target.value)} />
        <div className="flex gap-2">
          <select className="bg-gray-700 text-white rounded px-3 py-2 text-sm" value={severity} onChange={e=>setSeverity(e.target.value)}>
            {['critical','high','medium','low'].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select className="bg-gray-700 text-white rounded px-3 py-2 text-sm" value={provider} onChange={e=>setProvider(e.target.value)}>
            {['anthropic','openai','gemini','groq'].map(p=><option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={run} disabled={loading} className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50">
            {loading ? 'Generating…' : 'Generate Plan'}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>
      {result && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <h3 className="text-white font-bold text-lg">{result.planTitle}</h3>
              <span className={`text-sm font-bold ${CRISIS_SEV_COLOR[result.crisisSeverity]||'text-gray-400'}`}>⚠️ {result.crisisSeverity}</span>
            </div>
            {result.immediateActions && (
              <div className="mt-3">
                <p className="text-red-400 text-xs font-semibold uppercase mb-2">🔴 Immediate Actions</p>
                <div className="space-y-1">{result.immediateActions.map((a:any,i:number)=>(
                  <div key={i} className="bg-red-900/30 border border-red-800 rounded px-3 py-2 flex justify-between">
                    <span className="text-white text-xs">{a.action}</span>
                    <span className="text-gray-400 text-xs">{a.timeframe} · {a.owner}</span>
                  </div>
                ))}</div>
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['overview','messages','media','social','recovery'] as const).map(t=>(
              <button key={t} onClick={()=>setActiveTab(t)} className={`px-3 py-1 rounded text-xs font-medium ${activeTab===t?'bg-red-700 text-white':'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
            ))}
          </div>
          {activeTab==='messages' && result.keyMessages && (
            <div className="space-y-3">{result.keyMessages.map((m:any,i:number)=>(
              <div key={i} className="bg-gray-800 rounded-lg p-4">
                <p className="text-blue-400 font-semibold text-sm">{m.audience}</p>
                <p className="text-white text-sm mt-1 italic">"{m.coreMessage}"</p>
                <p className="text-gray-400 text-xs mt-2">Tone: {m.toneGuidance}</p>
                <p className="text-red-400 text-xs">Avoid: {m.thingsToAvoid}</p>
              </div>
            ))}</div>
          )}
          {activeTab==='media' && result.mediaStrategy && (
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <p className="text-white text-sm">{result.mediaStrategy.approach}</p>
              {result.mediaStrategy.pressReleaseDraft && (
                <div className="bg-gray-700 rounded p-3"><p className="text-gray-400 text-xs font-semibold mb-1">Press Release Draft</p><p className="text-gray-300 text-xs whitespace-pre-line">{result.mediaStrategy.pressReleaseDraft}</p></div>
              )}
              {result.mediaStrategy.faqs && (
                <div className="space-y-2">{result.mediaStrategy.faqs.map((f:any,i:number)=>(
                  <div key={i} className="bg-gray-700 rounded p-2"><p className="text-yellow-400 text-xs font-semibold">Q: {f.q}</p><p className="text-gray-300 text-xs mt-1">A: {f.a}</p></div>
                ))}</div>
              )}
            </div>
          )}
          {activeTab==='social' && result.socialMediaGuidelines && (
            <div className="bg-gray-800 rounded-lg p-4 grid grid-cols-2 gap-4">
              <div><p className="text-green-400 text-xs font-semibold mb-2">✅ DO Post</p><ul className="space-y-1">{(result.socialMediaGuidelines.doPost||[]).map((s:string,i:number)=><li key={i} className="text-gray-300 text-xs">• {s}</li>)}</ul></div>
              <div><p className="text-red-400 text-xs font-semibold mb-2">❌ Do NOT Post</p><ul className="space-y-1">{(result.socialMediaGuidelines.doNotPost||[]).map((s:string,i:number)=><li key={i} className="text-gray-300 text-xs">• {s}</li>)}</ul></div>
              <div className="col-span-2"><p className="text-gray-400 text-xs font-semibold mb-1">Monitor Keywords</p><div className="flex flex-wrap gap-1">{(result.socialMediaGuidelines.monitoringKeywords||[]).map((k:string,i:number)=><span key={i} className="bg-gray-600 text-gray-200 text-xs px-2 py-0.5 rounded">{k}</span>)}</div></div>
            </div>
          )}
          {activeTab==='recovery' && result.recoveryPlan && (
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <div><p className="text-yellow-400 text-xs font-semibold">Short Term</p><p className="text-gray-300 text-sm mt-1">{result.recoveryPlan.shortTerm}</p></div>
              <div><p className="text-green-400 text-xs font-semibold">Long Term</p><p className="text-gray-300 text-sm mt-1">{result.recoveryPlan.longTerm}</p></div>
              <div><p className="text-blue-400 text-xs font-semibold">Reputation Repair</p><p className="text-gray-300 text-sm mt-1">{result.recoveryPlan.reputationRepair}</p></div>
              {result.lessonsLearned && <div className="bg-gray-700 rounded p-3"><p className="text-gray-400 text-xs font-semibold">Lessons Learned</p><p className="text-gray-300 text-sm mt-1">{result.lessonsLearned}</p></div>}
            </div>
          )}
          {activeTab==='overview' && result.internalComms && (
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <div><p className="text-blue-400 text-xs font-semibold">Employee Message</p><p className="text-gray-300 text-sm mt-1 whitespace-pre-line">{result.internalComms.employeeMessage}</p></div>
              <div><p className="text-purple-400 text-xs font-semibold">Management Briefing</p><p className="text-gray-300 text-sm mt-1">{result.internalComms.managementBriefing}</p></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v8.94 Change Management Plan Generator ---
const IMPACT_COLOR: Record<string,string> = { High:'text-red-400', Medium:'text-yellow-400', Low:'text-green-400' };
const LIKELIHOOD_COLOR: Record<string,string> = { High:'bg-red-900/40 border-red-700', Medium:'bg-yellow-900/40 border-yellow-700', Low:'bg-green-900/40 border-green-700' };
function ChangeMgmtPanel({ api }: { api: string }) {
  const [company, setCompany] = useState('');
  const [changeType, setChangeType] = useState('');
  const [changeDescription, setChangeDescription] = useState('');
  const [affectedGroups, setAffectedGroups] = useState('');
  const [timeline, setTimeline] = useState('');
  const [sponsor, setSponsor] = useState('');
  const [risks, setRisks] = useState('');
  const [provider, setProvider] = useState('anthropic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${api}/api/change-mgmt`, { method:'POST', headers:{'Content-Type':'application/json',...(localStorage.getItem('forge_token')?{'Authorization':`Bearer ${localStorage.getItem('forge_token')}`}:{})}, body: JSON.stringify({ company, changeType, changeDescription, affectedGroups, timeline, sponsor, risks, provider }) });
      const d = await r.json();
      if (!r.ok) setError(d.error || 'Error');
      else setResult(d);
    } catch(e:any) { setError(e.message); }
    setLoading(false);
  };
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-bold text-white mb-3">🔄 Change Management Plan</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Company name" value={company} onChange={e=>setCompany(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Change type (e.g. ERP rollout, restructure)" value={changeType} onChange={e=>setChangeType(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Affected groups" value={affectedGroups} onChange={e=>setAffectedGroups(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Timeline (e.g. 6 months)" value={timeline} onChange={e=>setTimeline(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Executive sponsor" value={sponsor} onChange={e=>setSponsor(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Known risks" value={risks} onChange={e=>setRisks(e.target.value)} />
        </div>
        <textarea className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm mb-3" rows={2} placeholder="Change description" value={changeDescription} onChange={e=>setChangeDescription(e.target.value)} />
        <div className="flex gap-2">
          <select className="bg-gray-700 text-white rounded px-3 py-2 text-sm" value={provider} onChange={e=>setProvider(e.target.value)}>
            {['anthropic','openai','gemini','groq'].map(p=><option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={run} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50">
            {loading ? 'Generating…' : 'Generate Plan'}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>
      {result && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-white font-bold text-lg">{result.planTitle}</h3>
            <p className="text-gray-300 text-sm mt-2">{result.executiveSummary}</p>
            {result.changeOverview && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                {[['Current State',result.changeOverview.currentState,'text-red-400'],['Future State',result.changeOverview.futureState,'text-green-400'],['Why Now',result.changeOverview.whyNow,'text-yellow-400']].map(([l,v,c])=>(
                  <div key={l as string} className="bg-gray-700 rounded p-2"><p className={`text-xs font-semibold ${c}`}>{l as string}</p><p className="text-gray-300 text-xs mt-1">{v as string}</p></div>
                ))}
              </div>
            )}
          </div>
          {result.impactAssessment && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">👥 Impact Assessment</h4>
              <div className="space-y-2">
                {result.impactAssessment.map((g:any,i:number)=>(
                  <div key={i} className="bg-gray-700 rounded p-3">
                    <div className="flex justify-between"><span className="text-white text-sm font-medium">{g.group}</span><span className={`text-xs font-bold ${IMPACT_COLOR[g.impactLevel]||'text-gray-400'}`}>{g.impactLevel}</span></div>
                    <p className="text-gray-400 text-xs mt-1">Concerns: {(g.primaryConcerns||[]).join(', ')}</p>
                    <p className="text-blue-300 text-xs mt-1">↗ {g.mitigationApproach}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.phases && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">📅 Phases</h4>
              <div className="space-y-3">
                {result.phases.map((ph:any,i:number)=>(
                  <div key={i} className="border border-gray-600 rounded p-3">
                    <div className="flex justify-between mb-2"><span className="text-white font-medium text-sm">{ph.phase}</span><span className="text-gray-400 text-xs">{ph.timeline}</span></div>
                    <p className="text-gray-400 text-xs">{ph.objectives?.join(' · ')}</p>
                    <p className="text-green-400 text-xs mt-1">✓ {ph.successCriteria}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.resistanceManagement && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">⚠️ Resistance Management</h4>
              <div className="space-y-2">
                {result.resistanceManagement.map((r:any,i:number)=>(
                  <div key={i} className={`border rounded p-3 ${LIKELIHOOD_COLOR[r.likelihood]||'bg-gray-700'}`}>
                    <div className="flex justify-between"><span className="text-white text-sm">{r.resistanceType}</span><span className="text-xs text-gray-400">{r.likelihood}</span></div>
                    <p className="text-gray-300 text-xs mt-1">{r.response}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.sustainabilityPlan && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">🌱 Sustainability Plan</h4>
              <p className="text-gray-300 text-sm">{result.sustainabilityPlan}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v8.93 KPI Dashboard Builder ---
const KPI_VIZ_ICON: Record<string,string> = { 'line chart':'📈', 'bar chart':'📊', 'gauge':'🎯', 'number':'🔢', 'pie chart':'🥧', 'table':'📋' };
const KPI_CAT_COLOR: Record<string,string> = { financial:'text-green-400', growth:'text-blue-400', operational:'text-yellow-400', customer:'text-pink-400', product:'text-purple-400' };
function KPIDashboardPanel({ api }: { api: string }) {
  const [company, setCompany] = useState('');
  const [department, setDepartment] = useState('');
  const [goals, setGoals] = useState('');
  const [audience, setAudience] = useState('');
  const [currentMetrics, setCurrentMetrics] = useState('');
  const [provider, setProvider] = useState('anthropic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${api}/api/kpi-dashboard`, { method:'POST', headers:{'Content-Type':'application/json',...(localStorage.getItem('forge_token')?{'Authorization':`Bearer ${localStorage.getItem('forge_token')}`}:{})}, body: JSON.stringify({ company, department, goals, audience, currentMetrics, provider }) });
      const d = await r.json();
      if (!r.ok) setError(d.error || 'Error');
      else setResult(d);
    } catch(e:any) { setError(e.message); }
    setLoading(false);
  };
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-bold text-white mb-3">📊 KPI Dashboard Builder</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Company name" value={company} onChange={e=>setCompany(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Department (e.g. Marketing)" value={department} onChange={e=>setDepartment(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Goals (e.g. grow ARR, reduce churn)" value={goals} onChange={e=>setGoals(e.target.value)} />
          <input className="bg-gray-700 text-white rounded px-3 py-2 text-sm" placeholder="Audience (e.g. exec team)" value={audience} onChange={e=>setAudience(e.target.value)} />
        </div>
        <textarea className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm mb-3" rows={2} placeholder="Current metrics tracked (optional)" value={currentMetrics} onChange={e=>setCurrentMetrics(e.target.value)} />
        <div className="flex gap-2">
          <select className="bg-gray-700 text-white rounded px-3 py-2 text-sm" value={provider} onChange={e=>setProvider(e.target.value)}>
            {['anthropic','openai','gemini','groq'].map(p=><option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={run} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50">
            {loading ? 'Building…' : 'Build Dashboard'}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>
      {result && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-white font-bold text-lg">{result.dashboardTitle}</h3>
            <p className="text-gray-400 text-sm mt-1">{result.purpose}</p>
            {result.northStarMetric && (
              <div className="mt-3 bg-yellow-900/30 border border-yellow-700 rounded p-3">
                <p className="text-yellow-400 font-semibold text-sm">⭐ North Star Metric</p>
                <p className="text-white font-bold">{result.northStarMetric.metric}</p>
                <p className="text-gray-300 text-sm">Target: {result.northStarMetric.currentTarget}</p>
                <p className="text-gray-400 text-xs mt-1">{result.northStarMetric.why}</p>
              </div>
            )}
          </div>
          {(result.kpiCategories||[]).map((cat: any, ci: number) => (
            <div key={ci} className="bg-gray-800 rounded-lg p-4">
              <h4 className={`font-bold mb-3 ${KPI_CAT_COLOR[cat.category?.toLowerCase()] || 'text-blue-400'}`}>{cat.category}</h4>
              <div className="space-y-2">
                {(cat.kpis||[]).map((k: any, ki: number) => (
                  <div key={ki} className="bg-gray-700 rounded p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-white font-medium text-sm">{KPI_VIZ_ICON[k.visualType?.toLowerCase()]||'📌'} {k.name}</span>
                        <p className="text-gray-400 text-xs mt-1">Formula: {k.formula}</p>
                        <p className="text-gray-400 text-xs">Owner: {k.owner} · {k.frequency}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-green-400 text-xs font-bold">Target: {k.target}</span>
                        <p className="text-red-400 text-xs">🚩 {k.redFlag}</p>
                      </div>
                    </div>
                    {k.benchmark && <p className="text-gray-500 text-xs mt-1">Benchmark: {k.benchmark}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {result.reviewCadence && (
            <div className="bg-gray-800 rounded-lg p-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase mb-2">Review Cadence</p>
                <p className="text-white text-sm">{result.reviewCadence}</p>
                {result.dataSourcesNeeded && (
                  <div className="mt-3">
                    <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Data Sources Needed</p>
                    <ul className="space-y-1">{(result.dataSourcesNeeded||[]).map((s:string,i:number)=><li key={i} className="text-gray-300 text-xs">• {s}</li>)}</ul>
                  </div>
                )}
              </div>
              <div>
                {result.implementationSteps && (
                  <>
                    <p className="text-gray-400 text-xs font-semibold uppercase mb-2">Implementation Steps</p>
                    <ol className="space-y-1">{(result.implementationSteps||[]).map((s:string,i:number)=><li key={i} className="text-gray-300 text-xs">{i+1}. {s}</li>)}</ol>
                  </>
                )}
                {result.commonPitfalls && (
                  <div className="mt-3">
                    <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Common Pitfalls</p>
                    <ul className="space-y-1">{(result.commonPitfalls||[]).map((s:string,i:number)=><li key={i} className="text-yellow-400 text-xs">⚠️ {s}</li>)}</ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v8.92 Fundraising Strategy Generator ---
function FundraisingStrategyPanel({ api }: { api: string }) {
  const [company, setCompany] = React.useState('');
  const [stage, setStage] = React.useState('Seed');
  const [amount, setAmount] = React.useState('');
  const [useOfFunds, setUseOfFunds] = React.useState('');
  const [traction, setTraction] = React.useState('');
  const [industry, setIndustry] = React.useState('');
  const [timeline, setTimeline] = React.useState('6 months');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('investors');
  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${api}/api/fundraising-strategy`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ company, stage, amount, useOfFunds, traction, industry, timeline }) });
      const d = await r.json();
      if (!d.success) throw new Error(d.error || 'Failed');
      setResult(d);
    } catch(e: any) { setError(e.message); } finally { setLoading(false); }
  };
  const tabs = [['investors','🎯 Investors'],['timeline','📅 Timeline'],['objections','💬 Objections'],['diligence','🔍 Due Diligence']];
  return (
    <div style={{ padding: 24, maxWidth: 960 }}>
      <h2 style={{ marginBottom: 4 }}>💸 Fundraising Strategy Generator</h2>
      <p style={{ color: '#888', marginBottom: 20 }}>Build a complete fundraising playbook with investor targeting, pitch narrative, and objection handling.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[['Company', company, setCompany, 'e.g. Forge AI'], ['Stage', stage, setStage, 'Pre-Seed / Seed / Series A / B'], ['Amount Seeking', amount, setAmount, 'e.g. $2M'], ['Use of Funds', useOfFunds, setUseOfFunds, 'e.g. 50% eng, 30% sales, 20% ops'], ['Current Traction', traction, setTraction, 'e.g. $50k MRR, 200 customers, 3x YoY'], ['Industry', industry, setIndustry, 'e.g. B2B SaaS / AI / Fintech'], ['Timeline', timeline, setTimeline, 'e.g. 6 months']].map(([label, val, set, ph]: any) => (
          <div key={label}>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>{label}</div>
            <input value={val} onChange={e => set(e.target.value)} placeholder={ph} style={{ width: '100%', padding: '8px 10px', background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
          </div>
        ))}
      </div>
      <button onClick={run} disabled={loading || !company} style={{ padding: '10px 24px', background: '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
        {loading ? 'Building...' : 'Generate Fundraising Strategy'}
      </button>
      {error && <div style={{ color: '#f87171', marginTop: 12 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 24 }}>
          <div style={{ background: '#1a1a2e', borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 8px' }}>{result.strategyTitle}</h3>
            <p style={{ color: '#ccc', fontSize: 13, margin: '0 0 12px' }}>{result.roundSummary}</p>
            <div style={{ background: '#111827', borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 600, color: '#facc15', marginBottom: 6, fontSize: 13 }}>Pitch Narrative</div>
              <p style={{ color: '#ccc', fontSize: 13, margin: 0 }}>{result.pitchNarrative}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {tabs.map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{ padding: '6px 14px', background: activeTab === id ? '#7c3aed' : '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 13 }}>{label}</button>
            ))}
          </div>
          {activeTab === 'investors' && (
            <div>
              <div style={{ background: '#111827', borderRadius: 8, padding: 14, marginBottom: 12 }}>
                <div style={{ fontWeight: 600, color: '#34d399', marginBottom: 6 }}>Key Metrics to Highlight</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{result.keyMetricsToHighlight?.map((m: string, i: number) => <span key={i} style={{ background: '#1a1a2e', padding: '4px 10px', borderRadius: 4, color: '#ccc', fontSize: 12 }}>{m}</span>)}</div>
              </div>
              {result.targetInvestorTypes?.map((inv: any, i: number) => (
                <div key={i} style={{ background: '#111827', borderRadius: 8, padding: 14, marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, color: '#60a5fa', marginBottom: 4 }}>{inv.type}</div>
                  <div style={{ color: '#aaa', fontSize: 13, marginBottom: 6 }}>{inv.why}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{inv.examples?.map((e: string, j: number) => <span key={j} style={{ background: '#1a1a2e', padding: '2px 8px', borderRadius: 4, fontSize: 11, color: '#888' }}>{e}</span>)}</div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'timeline' && (
            <div>{result.fundingTimeline?.map((t: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #222' }}>
                <div style={{ minWidth: 60, color: '#7c3aed', fontWeight: 600, fontSize: 12 }}>{t.week}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{t.milestone}</div>
                  <div style={{ color: '#aaa', fontSize: 12 }}>{t.action}</div>
                </div>
              </div>
            ))}</div>
          )}
          {activeTab === 'objections' && (
            <div>{result.commonObjections?.map((o: any, i: number) => (
              <div key={i} style={{ background: '#111827', borderRadius: 8, padding: 14, marginBottom: 10 }}>
                <div style={{ fontWeight: 600, color: '#f87171', marginBottom: 6 }}>❓ {o.objection}</div>
                <div style={{ color: '#ccc', fontSize: 13 }}>✅ {o.response}</div>
              </div>
            ))}</div>
          )}
          {activeTab === 'diligence' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: '#111827', borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, color: '#34d399', marginBottom: 8 }}>📁 DD Prep Checklist</div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>{result.dueDiligencePrep?.map((d: string, i: number) => <li key={i} style={{ color: '#ccc', fontSize: 13, marginBottom: 6 }}>{d}</li>)}</ul>
              </div>
              <div style={{ background: '#111827', borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, color: '#facc15', marginBottom: 8 }}>🔄 Alternative Options</div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>{result.alternativeOptions?.map((a: string, i: number) => <li key={i} style={{ color: '#ccc', fontSize: 13, marginBottom: 6 }}>{a}</li>)}</ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v8.91 Market Entry Strategy Generator ---
const RISK_COLOR2: Record<string,string> = { high: '#ef4444', medium: '#f59e0b', low: '#34d399' };
function MarketEntryPanel({ api }: { api: string }) {
  const [company, setCompany] = React.useState('');
  const [product, setProduct] = React.useState('');
  const [targetMarket, setTargetMarket] = React.useState('');
  const [targetCountry, setTargetCountry] = React.useState('');
  const [budget, setBudget] = React.useState('');
  const [timeline, setTimeline] = React.useState('12 months');
  const [currentPresence, setCurrentPresence] = React.useState('none');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('phases');
  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${api}/api/market-entry`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ company, product, targetMarket, targetCountry, budget, timeline, currentPresence }) });
      const d = await r.json();
      if (!d.success) throw new Error(d.error || 'Failed');
      setResult(d);
    } catch(e: any) { setError(e.message); } finally { setLoading(false); }
  };
  const tabs = [['phases','📅 Phases'],['risks','🚨 Risks'],['local','🗺️ Local Fit'],['checklist','✅ Go/No-Go']];
  return (
    <div style={{ padding: 24, maxWidth: 960 }}>
      <h2 style={{ marginBottom: 4 }}>🌍 Market Entry Strategy Generator</h2>
      <p style={{ color: '#888', marginBottom: 20 }}>Build a phased market entry plan with regulatory, partnership, and risk guidance.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[['Company', company, setCompany, 'e.g. Forge AI'], ['Product / Service', product, setProduct, 'e.g. AI productivity platform'], ['Target Market', targetMarket, setTargetMarket, 'e.g. SMB software buyers'], ['Target Country / Region', targetCountry, setTargetCountry, 'e.g. Germany / DACH'], ['Budget', budget, setBudget, 'e.g. $200k first year'], ['Timeline', timeline, setTimeline, 'e.g. 12 months'], ['Current Presence', currentPresence, setCurrentPresence, 'none / some partnerships / office']].map(([label, val, set, ph]: any) => (
          <div key={label}>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>{label}</div>
            <input value={val} onChange={e => set(e.target.value)} placeholder={ph} style={{ width: '100%', padding: '8px 10px', background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
          </div>
        ))}
      </div>
      <button onClick={run} disabled={loading || !company || !targetCountry} style={{ padding: '10px 24px', background: '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
        {loading ? 'Strategizing...' : 'Generate Market Entry Plan'}
      </button>
      {error && <div style={{ color: '#f87171', marginTop: 12 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 24 }}>
          <div style={{ background: '#1a1a2e', borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 8px' }}>{result.strategyTitle}</h3>
            <p style={{ color: '#ccc', fontSize: 13, margin: '0 0 12px' }}>{result.marketOverview}</p>
            <div style={{ background: '#111827', borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 700, color: '#facc15', marginBottom: 4 }}>Entry Mode: {result.entryMode}</div>
              <div style={{ color: '#aaa', fontSize: 13 }}>{result.entryModeRationale}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {tabs.map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{ padding: '6px 14px', background: activeTab === id ? '#7c3aed' : '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 13 }}>{label}</button>
            ))}
          </div>
          {activeTab === 'phases' && (
            <div>{result.phases?.map((p: any, i: number) => (
              <div key={i} style={{ background: '#111827', borderRadius: 8, padding: 16, marginBottom: 12, borderLeft: '3px solid #7c3aed' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700 }}>{p.phase}</div>
                  <div style={{ color: '#888', fontSize: 12 }}>{p.timeline} · Budget: {p.budget}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div><div style={{ fontSize: 11, color: '#60a5fa', marginBottom: 4 }}>Objectives</div><ul style={{ margin: 0, paddingLeft: 16 }}>{p.objectives?.map((o: string, j: number) => <li key={j} style={{ color: '#ccc', fontSize: 12, marginBottom: 2 }}>{o}</li>)}</ul></div>
                  <div><div style={{ fontSize: 11, color: '#34d399', marginBottom: 4 }}>Key Actions</div><ul style={{ margin: 0, paddingLeft: 16 }}>{p.keyActions?.map((a: string, j: number) => <li key={j} style={{ color: '#ccc', fontSize: 12, marginBottom: 2 }}>{a}</li>)}</ul></div>
                </div>
              </div>
            ))}</div>
          )}
          {activeTab === 'risks' && (
            <div>{result.riskMitigation?.map((r: any, i: number) => (
              <div key={i} style={{ background: '#111827', borderRadius: 8, padding: 14, marginBottom: 10, borderLeft: `3px solid ${RISK_COLOR2[r.likelihood?.toLowerCase()] || '#888'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontWeight: 600 }}>{r.risk}</div>
                  <span style={{ fontSize: 11, color: RISK_COLOR2[r.likelihood?.toLowerCase()] || '#888' }}>{r.likelihood}</span>
                </div>
                <div style={{ color: '#aaa', fontSize: 13 }}>→ {r.mitigation}</div>
              </div>
            ))}</div>
          )}
          {activeTab === 'local' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: '#111827', borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, color: '#34d399', marginBottom: 8 }}>🏠 Local Adaptations</div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>{result.localAdaptations?.map((a: string, i: number) => <li key={i} style={{ color: '#ccc', fontSize: 13, marginBottom: 6 }}>{a}</li>)}</ul>
              </div>
              <div style={{ background: '#111827', borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, color: '#facc15', marginBottom: 8 }}>⚖️ Regulatory</div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>{result.regulatoryConsiderations?.map((r: string, i: number) => <li key={i} style={{ color: '#ccc', fontSize: 13, marginBottom: 6 }}>{r}</li>)}</ul>
              </div>
              <div style={{ background: '#111827', borderRadius: 8, padding: 14, gridColumn: '1 / -1' }}>
                <div style={{ fontWeight: 600, color: '#60a5fa', marginBottom: 8 }}>🤝 Partnership Strategy</div>
                <p style={{ color: '#ccc', fontSize: 13, margin: 0 }}>{result.partnershipStrategy}</p>
              </div>
            </div>
          )}
          {activeTab === 'checklist' && (
            <div style={{ background: '#111827', borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, color: '#34d399', marginBottom: 12 }}>Go / No-Go Checklist</div>
              {result.goNoGoChecklist?.map((item: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid #222' }}>
                  <span style={{ color: '#7c3aed', marginTop: 2 }}>☐</span>
                  <span style={{ color: '#ccc', fontSize: 13 }}>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v8.90 Investor Update Generator ---
function InvestorUpdatePanel({ api }: { api: string }) {
  const [company, setCompany] = React.useState('');
  const [period, setPeriod] = React.useState('');
  const [highlights, setHighlights] = React.useState('');
  const [metrics, setMetrics] = React.useState('');
  const [challenges, setChallenges] = React.useState('');
  const [asks, setAsks] = React.useState('');
  const [nextPeriodGoals, setNextPeriodGoals] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${api}/api/investor-update`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ company, period, highlights, metrics, challenges, asks, nextPeriodGoals }) });
      const d = await r.json();
      if (!d.success) throw new Error(d.error || 'Failed');
      setResult(d);
    } catch(e: any) { setError(e.message); } finally { setLoading(false); }
  };
  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <h2 style={{ marginBottom: 4 }}>📨 Investor Update Generator</h2>
      <p style={{ color: '#888', marginBottom: 20 }}>Generate professional monthly/quarterly investor update emails that build trust and momentum.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[['Company', company, setCompany, 'e.g. Forge AI'], ['Period', period, setPeriod, 'e.g. August 2026'], ['Highlights', highlights, setHighlights, 'e.g. Closed $50k MRR, launched v2'], ['Key Metrics', metrics, setMetrics, 'e.g. MRR $50k (+15%), 1,200 users'], ['Challenges', challenges, setChallenges, 'e.g. Hiring delays, churn spike'], ['Asks', asks, setAsks, 'e.g. Intros to Series A VCs, talent'], ['Next Period Goals', nextPeriodGoals, setNextPeriodGoals, 'e.g. $75k MRR, hire 2 engineers']].map(([label, val, set, ph]: any) => (
          <div key={label}>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>{label}</div>
            <input value={val} onChange={e => set(e.target.value)} placeholder={ph} style={{ width: '100%', padding: '8px 10px', background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
          </div>
        ))}
      </div>
      <button onClick={run} disabled={loading || !company} style={{ padding: '10px 24px', background: '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
        {loading ? 'Writing...' : 'Generate Investor Update'}
      </button>
      {error && <div style={{ color: '#f87171', marginTop: 12 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 24, background: '#111827', borderRadius: 12, padding: 24, fontFamily: 'Georgia, serif' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4, fontFamily: 'monospace' }}>Subject: {result.subject}</div>
          <hr style={{ border: '1px solid #222', margin: '12px 0' }} />
          <p style={{ color: '#ccc' }}>{result.greeting}</p>
          <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 14, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: '#facc15', marginBottom: 6, fontSize: 13 }}>⚡ TL;DR</div>
            <p style={{ color: '#ccc', fontSize: 13, margin: 0 }}>{result.tldr}</p>
          </div>
          {result.highlights?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>🏆 Highlights</div>
              {result.highlights.map((h: any, i: number) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{h.emoji} {h.title}</div>
                  <div style={{ color: '#aaa', fontSize: 13, paddingLeft: 20 }}>{h.detail}</div>
                </div>
              ))}
            </div>
          )}
          {result.metrics?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>📊 Metrics</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 10 }}>
                {result.metrics.map((m: any, i: number) => (
                  <div key={i} style={{ background: '#1a1a2e', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#34d399' }}>{m.value}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: m.trend?.startsWith('+') ? '#34d399' : '#f87171' }}>{m.trend}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.challenges?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>🧱 Challenges & Actions</div>
              {result.challenges.map((c: any, i: number) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, color: '#f87171', fontSize: 13 }}>{c.challenge}</div>
                  <div style={{ color: '#aaa', fontSize: 13, paddingLeft: 12 }}>→ {c.action}</div>
                </div>
              ))}
            </div>
          )}
          {result.asks?.length > 0 && (
            <div style={{ background: '#7c3aed22', borderRadius: 8, padding: 14, marginBottom: 16, border: '1px solid #7c3aed55' }}>
              <div style={{ fontWeight: 700, color: '#7c3aed', marginBottom: 8 }}>🙏 How You Can Help</div>
              {result.asks.map((a: any, i: number) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{a.ask}</div>
                  <div style={{ color: '#aaa', fontSize: 12 }}>{a.context}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>🎯 Next Month Goals</div>
            <ul style={{ margin: 0, paddingLeft: 20 }}>{result.nextPeriodGoals?.map((g: string, i: number) => <li key={i} style={{ color: '#ccc', fontSize: 13, marginBottom: 4 }}>{g}</li>)}</ul>
          </div>
          <p style={{ color: '#ccc' }}>{result.closing}</p>
          {result.ps && <p style={{ color: '#888', fontSize: 13, fontStyle: 'italic' }}>{result.ps}</p>}
        </div>
      )}
    </div>
  );
}

// --- v8.89 Customer Success Playbook Generator ---
const SEVERITY_COLOR: Record<string,string> = { high: '#ef4444', medium: '#f59e0b', low: '#34d399' };
function CSPlaybookPanel({ api }: { api: string }) {
  const [product, setProduct] = React.useState('');
  const [customerSegment, setCustomerSegment] = React.useState('SMB');
  const [churnRisk, setChurnRisk] = React.useState('');
  const [successMetrics, setSuccessMetrics] = React.useState('');
  const [teamSize, setTeamSize] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('journey');
  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${api}/api/cs-playbook`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ product, customerSegment, churnRisk, successMetrics, teamSize }) });
      const d = await r.json();
      if (!d.success) throw new Error(d.error || 'Failed');
      setResult(d);
    } catch(e: any) { setError(e.message); } finally { setLoading(false); }
  };
  const sections = [['journey','🗺️ Journey'],['health','❤️ Health Score'],['churn','🚨 Churn Risk'],['expansion','📈 Expansion'],['qbr','📋 QBR']];
  return (
    <div style={{ padding: 24, maxWidth: 960 }}>
      <h2 style={{ marginBottom: 4 }}>🎯 Customer Success Playbook Generator</h2>
      <p style={{ color: '#888', marginBottom: 20 }}>Build a full CS playbook with journey maps, health scoring, churn prevention, and expansion plays.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[['Product', product, setProduct, 'e.g. Forge AI Platform'], ['Customer Segment', customerSegment, setCustomerSegment, 'SMB / Mid-Market / Enterprise'], ['Churn Risk Signals', churnRisk, setChurnRisk, 'e.g. no login 14 days, low usage'], ['Success Metrics', successMetrics, setSuccessMetrics, 'e.g. NPS > 40, 90% retention'], ['CS Team Size', teamSize, setTeamSize, 'e.g. 3 CSMs, 1 manager']].map(([label, val, set, ph]: any) => (
          <div key={label}>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>{label}</div>
            <input value={val} onChange={e => set(e.target.value)} placeholder={ph} style={{ width: '100%', padding: '8px 10px', background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
          </div>
        ))}
      </div>
      <button onClick={run} disabled={loading || !product} style={{ padding: '10px 24px', background: '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
        {loading ? 'Building...' : 'Generate CS Playbook'}
      </button>
      {error && <div style={{ color: '#f87171', marginTop: 12 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 24 }}>
          <div style={{ background: '#1a1a2e', borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 6px' }}>{result.playbookTitle}</h3>
            <p style={{ color: '#ccc', fontSize: 13, margin: 0 }}>{result.philosophy}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {sections.map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{ padding: '6px 14px', background: activeTab === id ? '#7c3aed' : '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 13 }}>{label}</button>
            ))}
          </div>
          {activeTab === 'journey' && (
            <div>{result.customerJourneyStages?.map((s: any, i: number) => (
              <div key={i} style={{ background: '#111827', borderRadius: 8, padding: 16, marginBottom: 10, borderLeft: '3px solid #7c3aed' }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{s.stage}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div><div style={{ fontSize: 11, color: '#7c3aed', marginBottom: 4 }}>Goals</div><ul style={{ margin: 0, paddingLeft: 16 }}>{s.goals?.map((g: string, j: number) => <li key={j} style={{ color: '#ccc', fontSize: 12, marginBottom: 2 }}>{g}</li>)}</ul></div>
                  <div><div style={{ fontSize: 11, color: '#34d399', marginBottom: 4 }}>CS Actions</div><ul style={{ margin: 0, paddingLeft: 16 }}>{s.csActions?.map((a: string, j: number) => <li key={j} style={{ color: '#ccc', fontSize: 12, marginBottom: 2 }}>{a}</li>)}</ul></div>
                </div>
              </div>
            ))}</div>
          )}
          {activeTab === 'health' && result.healthScoreFramework && (
            <div style={{ background: '#111827', borderRadius: 8, padding: 16 }}>
              <p style={{ color: '#aaa', fontSize: 13, marginTop: 0 }}>{result.healthScoreFramework.scoringNote}</p>
              {result.healthScoreFramework.metrics?.map((m: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #222' }}>
                  <div style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                  <div style={{ color: '#888', fontSize: 12 }}>Weight: {m.weight}</div>
                  <div style={{ color: '#34d399', fontSize: 12 }}>✅ {m.greenThreshold}</div>
                  <div style={{ color: '#ef4444', fontSize: 12 }}>🔴 {m.redThreshold}</div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'churn' && (
            <div>{result.churnRiskPlaybook?.map((p: any, i: number) => (
              <div key={i} style={{ background: '#111827', borderRadius: 8, padding: 14, marginBottom: 10, borderLeft: `3px solid ${SEVERITY_COLOR[p.severity]}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600 }}>{p.trigger}</div>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: SEVERITY_COLOR[p.severity] + '33', color: SEVERITY_COLOR[p.severity] }}>{p.severity}</span>
                </div>
                <div style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Timeline: {p.timeline}</div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>{p.responseActions?.map((a: string, j: number) => <li key={j} style={{ color: '#ccc', fontSize: 12, marginBottom: 2 }}>{a}</li>)}</ul>
              </div>
            ))}</div>
          )}
          {activeTab === 'expansion' && (
            <div>{result.expansionPlaybook?.map((e: any, i: number) => (
              <div key={i} style={{ background: '#111827', borderRadius: 8, padding: 14, marginBottom: 10 }}>
                <div style={{ fontWeight: 600, color: '#34d399', marginBottom: 4 }}>{e.signal}</div>
                <div style={{ color: '#ccc', fontSize: 13, marginBottom: 4 }}>{e.approach}</div>
                <div style={{ color: '#888', fontSize: 12 }}>Timing: {e.timing}</div>
              </div>
            ))}</div>
          )}
          {activeTab === 'qbr' && (
            <div style={{ background: '#111827', borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, color: '#facc15', marginBottom: 12 }}>QBR Agenda Template</div>
              <ul style={{ margin: 0, paddingLeft: 20 }}>{result.qbrTemplate?.map((item: string, i: number) => <li key={i} style={{ color: '#ccc', fontSize: 13, marginBottom: 8 }}>{item}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v8.88 Partnership Proposal Generator ---
function PartnershipProposalPanel({ api }: { api: string }) {
  const [ourCompany, setOurCompany] = React.useState('');
  const [partnerCompany, setPartnerCompany] = React.useState('');
  const [partnershipType, setPartnershipType] = React.useState('strategic alliance');
  const [ourValue, setOurValue] = React.useState('');
  const [theirValue, setTheirValue] = React.useState('');
  const [goals, setGoals] = React.useState('');
  const [terms, setTerms] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${api}/api/partnership-proposal`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ ourCompany, partnerCompany, partnershipType, ourValue, theirValue, goals, terms }) });
      const d = await r.json();
      if (!d.success) throw new Error(d.error || 'Failed');
      setResult(d);
    } catch(e: any) { setError(e.message); } finally { setLoading(false); }
  };
  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h2 style={{ marginBottom: 4 }}>🤝 Partnership Proposal Generator</h2>
      <p style={{ color: '#888', marginBottom: 20 }}>Generate a professional partnership proposal to send to potential partners.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[['Our Company', ourCompany, setOurCompany, 'e.g. Forge AI'], ['Partner Company', partnerCompany, setPartnerCompany, 'e.g. Salesforce'], ['Partnership Type', partnershipType, setPartnershipType, 'strategic alliance / reseller / technology / co-marketing'], ['What We Bring', ourValue, setOurValue, 'e.g. AI platform, 10k users, API'], ['What We Seek', theirValue, setTheirValue, 'e.g. distribution, CRM integration'], ['Goals', goals, setGoals, 'e.g. 2x revenue in 12 months'], ['Proposed Terms', terms, setTerms, 'e.g. rev share 20%, co-branding']].map(([label, val, set, ph]: any) => (
          <div key={label}>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>{label}</div>
            <input value={val} onChange={e => set(e.target.value)} placeholder={ph} style={{ width: '100%', padding: '8px 10px', background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
          </div>
        ))}
      </div>
      <button onClick={run} disabled={loading || !ourCompany || !partnerCompany} style={{ padding: '10px 24px', background: '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
        {loading ? 'Writing...' : 'Generate Proposal'}
      </button>
      {error && <div style={{ color: '#f87171', marginTop: 12 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 24 }}>
          <div style={{ background: '#1a1a2e', borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>Subject</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>{result.subject}</div>
            <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>Executive Summary</div>
            <p style={{ color: '#ccc', fontSize: 13, margin: 0 }}>{result.executiveSummary}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ background: '#111827', borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, color: '#34d399', marginBottom: 8 }}>💡 Partnership Vision</div>
              <p style={{ color: '#ccc', fontSize: 13, margin: 0 }}>{result.partnershipVision}</p>
            </div>
            <div style={{ background: '#111827', borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, color: '#60a5fa', marginBottom: 8 }}>🏗️ Proposed Structure</div>
              <p style={{ color: '#ccc', fontSize: 13, margin: 0 }}>{result.proposedStructure}</p>
            </div>
          </div>
          <div style={{ background: '#111827', borderRadius: 8, padding: 14, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, color: '#facc15', marginBottom: 8 }}>⚖️ Mutual Benefits</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {result.mutualBenefits?.map((b: any, i: number) => (
                <div key={i} style={{ background: '#1a1a2e', borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, marginBottom: 4 }}>{b.party}</div>
                  <div style={{ color: '#ccc', fontSize: 12 }}>{b.benefit}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, color: '#34d399', marginBottom: 8, fontSize: 13 }}>📋 Key Terms</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>{result.keyTerms?.map((t: string, i: number) => <li key={i} style={{ color: '#ccc', fontSize: 12, marginBottom: 4 }}>{t}</li>)}</ul>
            </div>
            <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, color: '#60a5fa', marginBottom: 8, fontSize: 13 }}>📊 Success Metrics</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>{result.successMetrics?.map((m: string, i: number) => <li key={i} style={{ color: '#ccc', fontSize: 12, marginBottom: 4 }}>{m}</li>)}</ul>
            </div>
            <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, color: '#facc15', marginBottom: 8, fontSize: 13 }}>➡️ Next Steps</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>{result.nextSteps?.map((s: string, i: number) => <li key={i} style={{ color: '#ccc', fontSize: 12, marginBottom: 4 }}>{s}</li>)}</ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- v8.87 Pricing Strategy Generator ---
function PricingStrategyPanel({ api }: { api: string }) {
  const [productName, setProductName] = React.useState('');
  const [productType, setProductType] = React.useState('SaaS');
  const [targetMarket, setTargetMarket] = React.useState('');
  const [currentPrice, setCurrentPrice] = React.useState('');
  const [competitors, setCompetitors] = React.useState('');
  const [costs, setCosts] = React.useState('');
  const [goals, setGoals] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${api}/api/pricing-strategy`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ productName, productType, targetMarket, currentPrice, competitors, costs, goals }) });
      const d = await r.json();
      if (!d.success) throw new Error(d.error || 'Failed');
      setResult(d);
    } catch(e: any) { setError(e.message); } finally { setLoading(false); }
  };
  return (
    <div style={{ padding: 24, maxWidth: 960 }}>
      <h2 style={{ marginBottom: 4 }}>💰 Pricing Strategy Generator</h2>
      <p style={{ color: '#888', marginBottom: 20 }}>Build a data-driven pricing strategy with tiers, tactics, and competitive positioning.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[['Product Name', productName, setProductName, 'e.g. Forge AI Platform'], ['Product Type', productType, setProductType, 'SaaS / physical / service'], ['Target Market', targetMarket, setTargetMarket, 'e.g. SMBs, enterprise, consumers'], ['Current Price', currentPrice, setCurrentPrice, 'e.g. $49/mo or not set'], ['Competitors & Pricing', competitors, setCompetitors, 'e.g. Notion $8/mo, Monday $10/mo'], ['Cost Structure', costs, setCosts, 'e.g. $5 COGS, $20 CAC'], ['Business Goals', goals, setGoals, 'e.g. maximize ARR, market share']].map(([label, val, set, ph]: any) => (
          <div key={label}>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>{label}</div>
            <input value={val} onChange={e => set(e.target.value)} placeholder={ph} style={{ width: '100%', padding: '8px 10px', background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
          </div>
        ))}
      </div>
      <button onClick={run} disabled={loading || !productName} style={{ padding: '10px 24px', background: '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
        {loading ? 'Generating...' : 'Generate Pricing Strategy'}
      </button>
      {error && <div style={{ color: '#f87171', marginTop: 12 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 24 }}>
          <div style={{ background: '#1a1a2e', borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: '#facc15', marginBottom: 6 }}>Recommended Strategy: {result.recommendedStrategy}</div>
            <p style={{ color: '#ccc', fontSize: 13, margin: 0 }}>{result.rationale}</p>
          </div>
          <h4 style={{ color: '#7c3aed', marginBottom: 12 }}>Pricing Tiers</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 12, marginBottom: 20 }}>
            {result.tiers?.map((t: any, i: number) => (
              <div key={i} style={{ background: '#111827', borderRadius: 10, padding: 16, border: i === 1 ? '2px solid #7c3aed' : '1px solid #222', position: 'relative' }}>
                {i === 1 && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#7c3aed', fontSize: 10, padding: '2px 8px', borderRadius: 4, color: '#fff', whiteSpace: 'nowrap' }}>RECOMMENDED</div>}
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#34d399' }}>{t.price}<span style={{ fontSize: 12, color: '#888', fontWeight: 400 }}>/{t.billingPeriod}</span></div>
                <div style={{ color: '#888', fontSize: 11, marginBottom: 10 }}>For: {t.targetCustomer}</div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>{t.features?.map((f: string, j: number) => <li key={j} style={{ color: '#ccc', fontSize: 12, marginBottom: 4 }}>{f}</li>)}</ul>
                {t.positioningNote && <div style={{ marginTop: 8, color: '#60a5fa', fontSize: 11 }}>{t.positioningNote}</div>}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, color: '#60a5fa', marginBottom: 8 }}>🧠 Psychological Tactics</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>{result.psychologicalTactics?.map((t: string, i: number) => <li key={i} style={{ color: '#ccc', fontSize: 12, marginBottom: 4 }}>{t}</li>)}</ul>
            </div>
            <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, color: '#34d399', marginBottom: 8 }}>📊 Details</div>
              <div style={{ fontSize: 12, color: '#ccc', marginBottom: 6 }}><strong>Freemium:</strong> {result.freemiumRecommendation}</div>
              <div style={{ fontSize: 12, color: '#ccc', marginBottom: 6 }}><strong>Trial:</strong> {result.trialStrategy}</div>
              <div style={{ fontSize: 12, color: '#ccc', marginBottom: 6 }}><strong>Discounts:</strong> {result.discountPolicy}</div>
              <div style={{ fontSize: 12, color: '#facc15' }}><strong>Revenue:</strong> {result.revenueProjection}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- v8.86 Executive Summary Writer ---
function ExecSummaryPanel({ api }: { api: string }) {
  const [docType, setDocType] = React.useState('report');
  const [title, setTitle] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [keyPoints, setKeyPoints] = React.useState('');
  const [tone, setTone] = React.useState('professional');
  const [length, setLength] = React.useState('one page');
  const [mainContent, setMainContent] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${api}/api/exec-summary`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ docType, title, audience, keyPoints, tone, length, mainContent }) });
      const d = await r.json();
      if (!d.success) throw new Error(d.error || 'Failed');
      setResult(d);
    } catch(e: any) { setError(e.message); } finally { setLoading(false); }
  };
  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <h2 style={{ marginBottom: 4 }}>📄 Executive Summary Writer</h2>
      <p style={{ color: '#888', marginBottom: 20 }}>Generate polished executive summaries for reports, proposals, and business documents.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {[['Document Type', docType, setDocType, 'e.g. report, proposal, business plan'], ['Title', title, setTitle, 'e.g. Q3 Performance Report'], ['Audience', audience, setAudience, 'e.g. Board of Directors'], ['Key Points', keyPoints, setKeyPoints, 'e.g. Revenue growth, cost savings, risks'], ['Tone', tone, setTone, 'professional / formal / concise'], ['Target Length', length, setLength, 'one page / 200 words']].map(([label, val, set, ph]: any) => (
          <div key={label}>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>{label}</div>
            <input value={val} onChange={e => set(e.target.value)} placeholder={ph} style={{ width: '100%', padding: '8px 10px', background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>Main Content / Context (paste or summarize)</div>
        <textarea value={mainContent} onChange={e => setMainContent(e.target.value)} rows={5} placeholder="Paste your document content or describe what it covers..." style={{ width: '100%', padding: '8px 10px', background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13, resize: 'vertical' }} />
      </div>
      <button onClick={run} disabled={loading || !title} style={{ padding: '10px 24px', background: '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
        {loading ? 'Writing...' : 'Generate Executive Summary'}
      </button>
      {error && <div style={{ color: '#f87171', marginTop: 12 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 24 }}>
          <div style={{ background: '#111827', borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 4px', color: '#7c3aed' }}>{result.headline}</h3>
            <p style={{ color: '#ccc', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{result.executiveSummary}</p>
          </div>
          {result.metrics?.length > 0 && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              {result.metrics.map((m: any, i: number) => (
                <div key={i} style={{ background: '#1a1a2e', borderRadius: 8, padding: '10px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#34d399' }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{m.label}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[['🔍 Key Findings', result.keyFindings, '#60a5fa'], ['💡 Recommendations', result.recommendations, '#34d399'], ['➡️ Next Steps', result.nextSteps, '#facc15']].map(([label, items, color]: any) => (
              <div key={label} style={{ background: '#1a1a2e', borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, color, marginBottom: 8, fontSize: 13 }}>{label}</div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>{items?.map((x: string, i: number) => <li key={i} style={{ color: '#ccc', fontSize: 12, marginBottom: 6 }}>{x}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- v8.85 SWOT Analysis Generator ---
const SWOT_COLOR: Record<string,string> = { strengths: '#34d399', weaknesses: '#f87171', opportunities: '#60a5fa', threats: '#facc15' };
const SWOT_ICON: Record<string,string> = { strengths: '💪', weaknesses: '⚠️', opportunities: '🚀', threats: '🛡️' };
const IMPACT_DOT: Record<string,string> = { high: '#ef4444', medium: '#f59e0b', low: '#6b7280' };
function SWOTAnalysisPanel({ api }: { api: string }) {
  const [subject, setSubject] = React.useState('');
  const [industry, setIndustry] = React.useState('');
  const [context, setContext] = React.useState('');
  const [competitors, setCompetitors] = React.useState('');
  const [timeframe, setTimeframe] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${api}/api/swot-analysis`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ subject, industry, context, competitors, timeframe }) });
      const d = await r.json();
      if (!d.success) throw new Error(d.error || 'Failed');
      setResult(d);
    } catch(e: any) { setError(e.message); } finally { setLoading(false); }
  };
  const STRATEGY_COLOR: Record<string,string> = { SO: '#34d399', WO: '#60a5fa', ST: '#facc15', WT: '#f87171' };
  return (
    <div style={{ padding: 24, maxWidth: 960 }}>
      <h2 style={{ marginBottom: 4 }}>🔷 SWOT Analysis Generator</h2>
      <p style={{ color: '#888', marginBottom: 20 }}>Generate a full SWOT analysis with strategic action recommendations.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[['Subject / Company', subject, setSubject, 'e.g. Acme SaaS Platform'], ['Industry', industry, setIndustry, 'e.g. B2B SaaS'], ['Context / Background', context, setContext, 'e.g. Expanding into EU market'], ['Key Competitors', competitors, setCompetitors, 'e.g. Salesforce, HubSpot'], ['Timeframe', timeframe, setTimeframe, 'e.g. Next 12 months']].map(([label, val, set, ph]: any) => (
          <div key={label}>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>{label}</div>
            <input value={val} onChange={e => set(e.target.value)} placeholder={ph} style={{ width: '100%', padding: '8px 10px', background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
          </div>
        ))}
      </div>
      <button onClick={run} disabled={loading || !subject} style={{ padding: '10px 24px', background: '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
        {loading ? 'Analyzing...' : 'Generate SWOT'}
      </button>
      {error && <div style={{ color: '#f87171', marginTop: 12 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 16 }}>{result.title}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {(['strengths','weaknesses','opportunities','threats'] as const).map(cat => (
              <div key={cat} style={{ background: '#111827', borderRadius: 10, padding: 16, borderTop: `3px solid ${SWOT_COLOR[cat]}` }}>
                <div style={{ fontWeight: 700, color: SWOT_COLOR[cat], marginBottom: 12, textTransform: 'capitalize' }}>{SWOT_ICON[cat]} {cat}</div>
                {result[cat]?.map((item: any, i: number) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: IMPACT_DOT[item.impact], flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{item.point}</span>
                    </div>
                    <div style={{ color: '#888', fontSize: 12, marginTop: 2, paddingLeft: 14 }}>{item.detail}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <h4 style={{ color: '#7c3aed', marginBottom: 12 }}>Strategic Actions</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 10, marginBottom: 20 }}>
            {result.strategicActions?.map((a: any, i: number) => (
              <div key={i} style={{ background: '#1a1a2e', borderRadius: 8, padding: 12, borderLeft: `3px solid ${STRATEGY_COLOR[a.type] || '#7c3aed'}` }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: STRATEGY_COLOR[a.type], background: '#0f0f1a', padding: '2px 6px', borderRadius: 4, marginRight: 6 }}>{a.type}</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{a.strategy}</span>
                <div style={{ color: '#888', fontSize: 12, marginTop: 6 }}>{a.description}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Executive Summary</div>
            <p style={{ color: '#ccc', fontSize: 13, margin: 0 }}>{result.executiveSummary}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// --- v8.84 SOP Generator ---
function SOPGenPanel({ api }: { api: string }) {
  const [processName, setProcessName] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [goal, setGoal] = React.useState('');
  const [roles, setRoles] = React.useState('');
  const [frequency, setFrequency] = React.useState('');
  const [tools, setTools] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${api}/api/sop-gen`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ processName, department, goal, roles, frequency, tools }) });
      const d = await r.json();
      if (!d.success) throw new Error(d.error || 'Failed');
      setResult(d);
    } catch(e: any) { setError(e.message); } finally { setLoading(false); }
  };
  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h2 style={{ marginBottom: 4 }}>📋 SOP Generator</h2>
      <p style={{ color: '#888', marginBottom: 20 }}>Generate a detailed Standard Operating Procedure for any business process.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[['Process Name', processName, setProcessName, 'e.g. Customer Onboarding'], ['Department', department, setDepartment, 'e.g. Sales'], ['Goal / Purpose', goal, setGoal, 'e.g. Ensure consistent onboarding experience'], ['Roles Involved', roles, setRoles, 'e.g. Account Manager, IT, Finance'], ['Frequency', frequency, setFrequency, 'e.g. Weekly, As needed'], ['Tools / Systems', tools, setTools, 'e.g. Salesforce, Slack, Jira']].map(([label, val, set, ph]: any) => (
          <div key={label}>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>{label}</div>
            <input value={val} onChange={e => set(e.target.value)} placeholder={ph} style={{ width: '100%', padding: '8px 10px', background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
          </div>
        ))}
      </div>
      <button onClick={run} disabled={loading || !processName} style={{ padding: '10px 24px', background: '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
        {loading ? 'Generating...' : 'Generate SOP'}
      </button>
      {error && <div style={{ color: '#f87171', marginTop: 12 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 24 }}>
          <div style={{ background: '#1a1a2e', borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 8px' }}>{result.title}</h3>
            <div style={{ color: '#888', fontSize: 13 }}>Version: {result.version} | Owner: {result.owner}</div>
            <p style={{ color: '#ccc', marginTop: 8 }}><strong>Purpose:</strong> {result.purpose}</p>
            <p style={{ color: '#ccc' }}><strong>Scope:</strong> {result.scope}</p>
            {result.definitions?.length > 0 && <div style={{ marginTop: 8 }}><strong>Definitions:</strong> {result.definitions.map((d: any) => <span key={d.term} style={{ marginRight: 16, color: '#aaa', fontSize: 13 }}><em>{d.term}:</em> {d.definition}</span>)}</div>}
          </div>
          <h4 style={{ color: '#7c3aed', marginBottom: 12 }}>Steps</h4>
          {result.steps?.map((s: any) => (
            <div key={s.stepNumber} style={{ background: '#111827', borderRadius: 8, padding: 16, marginBottom: 12, borderLeft: '3px solid #7c3aed' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Step {s.stepNumber}: {s.title}</div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Responsible: {s.responsible} | Input: {s.inputs} | Output: {s.outputs}</div>
              <ul style={{ margin: 0, paddingLeft: 20 }}>{s.instructions?.map((ins: string, i: number) => <li key={i} style={{ color: '#ccc', fontSize: 13, marginBottom: 4 }}>{ins}</li>)}</ul>
              {s.checkpoints?.length > 0 && <div style={{ marginTop: 8, color: '#facc15', fontSize: 12 }}>✓ {s.checkpoints.join(' ✓ ')}</div>}
            </div>
          ))}
          {result.kpis?.length > 0 && <div style={{ marginTop: 16 }}><strong>KPIs:</strong> <span style={{ color: '#34d399', fontSize: 13 }}>{result.kpis.join(', ')}</span></div>}
        </div>
      )}
    </div>
  );
}

// --- v8.83 Competitor Battle Card Generator ---
function BattleCardPanel({ api }: { api: string }) {
  const [ourProduct, setOurProduct] = React.useState('');
  const [competitor, setCompetitor] = React.useState('');
  const [ourStrengths, setOurStrengths] = React.useState('');
  const [ourWeaknesses, setOurWeaknesses] = React.useState('');
  const [targetBuyer, setTargetBuyer] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [section, setSection] = React.useState('advantages');
  const run = async () => {
    setLoading(true); setResult(null);
    const r = await fetch(`${api}/api/battle-card`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ ourProduct, competitor, ourStrengths, ourWeaknesses, targetBuyer }) });
    const d = await r.json(); setResult(d); setLoading(false);
  };
  const WINNER_COLOR = { us: '#4ade80', them: '#f87171', tie: '#facc15' };
  const sections = ['advantages','winThemes','objections','discovery','talkingPoints','redFlags','landmines'];
  return (
    <div style={{ padding: 24, maxWidth: 760 }}>
      <h2>⚔️ Competitor Battle Card</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <input placeholder="Our product" value={ourProduct} onChange={e => setOurProduct(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <input placeholder="Competitor name" value={competitor} onChange={e => setCompetitor(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <input placeholder="Our strengths" value={ourStrengths} onChange={e => setOurStrengths(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <input placeholder="Our weaknesses" value={ourWeaknesses} onChange={e => setOurWeaknesses(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      </div>
      <input placeholder="Target buyer persona" value={targetBuyer} onChange={e => setTargetBuyer(e.target.value)} style={{ width: '100%', marginBottom: 12, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <button onClick={run} disabled={loading || !ourProduct || !competitor} style={{ padding: '10px 24px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>{loading ? 'Building...' : 'Generate Battle Card'}</button>
      {result && !result.error && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
            {sections.map(s => <button key={s} onClick={() => setSection(s)} style={{ padding: '4px 10px', borderRadius: 6, background: section===s ? '#7c3aed' : '#1e1e2e', color: '#fff', border: '1px solid #333', cursor: 'pointer', fontSize: 11, textTransform: 'capitalize' }}>{s}</button>)}
          </div>
          {section === 'advantages' && (
            <div>
              {(result.ourAdvantages || []).map((a: any, i: number) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr 60px', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>{a.category}</span>
                  <span style={{ background: '#1e2a1e', borderRadius: 4, padding: '4px 8px', fontSize: 12, color: '#4ade80' }}>{a.us}</span>
                  <span style={{ background: '#2a1e1e', borderRadius: 4, padding: '4px 8px', fontSize: 12, color: '#f87171' }}>{a.them}</span>
                  <span style={{ color: (WINNER_COLOR as any)[a.winner] || '#fff', fontWeight: 700, fontSize: 12 }}>{a.winner === 'us' ? '✅ Us' : a.winner === 'them' ? '❌ Them' : '🤝 Tie'}</span>
                </div>
              ))}
            </div>
          )}
          {section === 'objections' && (result.objectionHandling || []).map((o: any, i: number) => (
            <div key={i} style={{ background: '#1e1e2e', borderRadius: 8, padding: 10, marginBottom: 8 }}>
              <div style={{ color: '#f87171', fontSize: 13, marginBottom: 4 }}>❓ {o.objection}</div>
              <div style={{ color: '#4ade80', fontSize: 13 }}>✅ {o.response}</div>
            </div>
          ))}
          {['winThemes','talkingPoints','redFlags','landmines','discovery'].includes(section) && (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {((result as any)[section === 'discovery' ? 'discoveryQuestions' : section] || []).map((item: string, i: number) => (
                <li key={i} style={{ color: '#e2e8f0', fontSize: 13, marginBottom: 6 }}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {result?.error && <p style={{ color: '#f87171', marginTop: 12 }}>{result.error}</p>}
    </div>
  );
}

// --- v8.82 Onboarding Email Sequence Generator ---
function OnboardingSequencePanel({ api }: { api: string }) {
  const [product, setProduct] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [goal, setGoal] = React.useState('');
  const [emailCount, setEmailCount] = React.useState('5');
  const [tone, setTone] = React.useState('Friendly');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [activeEmail, setActiveEmail] = React.useState(0);
  const run = async () => {
    setLoading(true); setResult(null); setActiveEmail(0);
    const r = await fetch(`${api}/api/onboarding-sequence`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ product, audience, goal, emailCount, tone }) });
    const d = await r.json(); setResult(d); setLoading(false);
  };
  const emails = result?.emails || [];
  const email = emails[activeEmail];
  const copy = () => email && navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}\n\nCTA: ${email.cta}`);
  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h2>📧 Onboarding Email Sequence</h2>
      <input placeholder="Product / service name" value={product} onChange={e => setProduct(e.target.value)} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <input placeholder="Target audience (e.g. new SaaS users)" value={audience} onChange={e => setAudience(e.target.value)} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <input placeholder="Sequence goal (e.g. drive first purchase)" value={goal} onChange={e => setGoal(e.target.value)} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select value={emailCount} onChange={e => setEmailCount(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }}>
          {['3','4','5','6','7'].map(n => <option key={n} value={n}>{n} emails</option>)}
        </select>
        <select value={tone} onChange={e => setTone(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }}>
          {['Friendly','Professional','Conversational','Exciting','Nurturing'].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <button onClick={run} disabled={loading || !product} style={{ padding: '10px 24px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>{loading ? 'Writing...' : 'Generate Sequence'}</button>
      {result?.overallStrategy && <div style={{ marginTop: 10, background: '#1e2a1e', borderRadius: 6, padding: 8, color: '#4ade80', fontSize: 12 }}>Strategy: {result.overallStrategy}</div>}
      {emails.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
            {emails.map((em: any, i: number) => (
              <button key={i} onClick={() => setActiveEmail(i)} style={{ padding: '4px 10px', borderRadius: 6, background: activeEmail===i ? '#7c3aed' : '#1e1e2e', color: '#fff', border: '1px solid #333', cursor: 'pointer', fontSize: 12 }}>Day {em.day}</button>
            ))}
          </div>
          {email && (
            <div style={{ background: '#1e1e2e', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#a78bfa', fontWeight: 700 }}>Day {email.day} — {email.goal}</span>
                <button onClick={copy} style={{ padding: '3px 10px', borderRadius: 5, background: '#374151', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11 }}>Copy</button>
              </div>
              <div style={{ color: '#facc15', fontWeight: 600, marginBottom: 2 }}>Subject: {email.subject}</div>
              <div style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>Preview: {email.preview}</div>
              <pre style={{ color: '#e2e8f0', fontSize: 13, whiteSpace: 'pre-wrap', background: '#16162a', borderRadius: 6, padding: 12, marginBottom: 8 }}>{email.body}</pre>
              <div style={{ background: '#1e2a1e', borderRadius: 6, padding: 8 }}><span style={{ color: '#4ade80', fontWeight: 600 }}>CTA: </span><span style={{ color: '#e2e8f0', fontSize: 13 }}>{email.cta}</span></div>
            </div>
          )}
        </div>
      )}
      {result?.error && <p style={{ color: '#f87171', marginTop: 12 }}>{result.error}</p>}
    </div>
  );
}

// --- v8.81 Pitch Deck Outline Generator ---
function PitchDeckPanel({ api }: { api: string }) {
  const [company, setCompany] = React.useState('');
  const [problem, setProblem] = React.useState('');
  const [solution, setSolution] = React.useState('');
  const [market, setMarket] = React.useState('');
  const [traction, setTraction] = React.useState('');
  const [team, setTeam] = React.useState('');
  const [ask, setAsk] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [activeSlide, setActiveSlide] = React.useState(0);
  const run = async () => {
    setLoading(true); setResult(null); setActiveSlide(0);
    const r = await fetch(`${api}/api/pitch-deck`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ company, problem, solution, market, traction, team, ask }) });
    const d = await r.json(); setResult(d); setLoading(false);
  };
  const slides = result?.slides || [];
  const slide = slides[activeSlide];
  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <h2>📊 Pitch Deck Outline Generator</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <input placeholder="Company name" value={company} onChange={e => setCompany(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <input placeholder="Funding ask (e.g. $2M seed)" value={ask} onChange={e => setAsk(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <input placeholder="Market size" value={market} onChange={e => setMarket(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <input placeholder="Traction / metrics" value={traction} onChange={e => setTraction(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      </div>
      <textarea placeholder="Problem you solve" value={problem} onChange={e => setProblem(e.target.value)} rows={2} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <textarea placeholder="Your solution" value={solution} onChange={e => setSolution(e.target.value)} rows={2} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <input placeholder="Team background" value={team} onChange={e => setTeam(e.target.value)} style={{ width: '100%', marginBottom: 12, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <button onClick={run} disabled={loading || !company} style={{ padding: '10px 24px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>{loading ? 'Building...' : 'Generate Pitch Deck'}</button>
      {result?.storyArc && <div style={{ marginTop: 12, background: '#1e2a1e', borderRadius: 6, padding: 10, color: '#4ade80', fontSize: 13 }}>📖 Story Arc: {result.storyArc}</div>}
      {slides.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            {slides.map((_: any, i: number) => (
              <button key={i} onClick={() => setActiveSlide(i)} style={{ padding: '4px 10px', borderRadius: 6, background: activeSlide===i ? '#7c3aed' : '#1e1e2e', color: '#fff', border: '1px solid #333', cursor: 'pointer', fontSize: 12 }}>{i+1}</button>
            ))}
          </div>
          {slide && (
            <div style={{ background: '#1e1e2e', borderRadius: 10, padding: 18 }}>
              <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Slide {slide.slideNumber}: {slide.title}</div>
              <div style={{ color: '#94a3b8', fontSize: 13, fontStyle: 'italic', marginBottom: 10 }}>{slide.keyMessage}</div>
              <div style={{ marginBottom: 10 }}>{(slide.content || []).map((c: string, i: number) => <div key={i} style={{ color: '#e2e8f0', fontSize: 13, marginBottom: 3 }}>• {c}</div>)}</div>
              <div style={{ background: '#16162a', borderRadius: 6, padding: 8, marginBottom: 8 }}><span style={{ color: '#64748b', fontSize: 11 }}>🎤 Speaker notes: </span><span style={{ color: '#94a3b8', fontSize: 12 }}>{slide.speakerNotes}</span></div>
              <div style={{ color: '#f59e0b', fontSize: 11 }}>🎨 {slide.designTip}</div>
            </div>
          )}
          {result.investorFAQs?.length > 0 && (
            <div style={{ marginTop: 12, background: '#1e1e2e', borderRadius: 8, padding: 12 }}>
              <div style={{ color: '#a78bfa', fontWeight: 600, marginBottom: 8 }}>Investor FAQs</div>
              {result.investorFAQs.map((faq: any, i: number) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>Q: {faq.q}</div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>A: {faq.a}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {result?.error && <p style={{ color: '#f87171', marginTop: 12 }}>{result.error}</p>}
    </div>
  );
}

// --- v8.80 A/B Test Copy Generator ---
function ABCopyPanel({ api }: { api: string }) {
  const [element, setElement] = React.useState('Headline');
  const [context, setContext] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [goal, setGoal] = React.useState('');
  const [variants, setVariants] = React.useState('3');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult(null);
    const r = await fetch(`${api}/api/ab-copy`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ element, context, audience, goal, variants }) });
    const d = await r.json(); setResult(d); setLoading(false);
  };
  const VARIANT_COLORS = ['#7c3aed','#0ea5e9','#10b981','#f59e0b','#ef4444'];
  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h2>🧪 A/B Test Copy Generator</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <select value={element} onChange={e => setElement(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }}>
          {['Headline','Subheadline','CTA Button','Email Subject','Ad Copy','Value Proposition','Pricing Page','Onboarding Message'].map(el => <option key={el}>{el}</option>)}
        </select>
        <select value={variants} onChange={e => setVariants(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }}>
          {['2','3','4','5'].map(n => <option key={n} value={n}>{n} variants</option>)}
        </select>
      </div>
      <input placeholder="Product / page context" value={context} onChange={e => setContext(e.target.value)} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <input placeholder="Target audience" value={audience} onChange={e => setAudience(e.target.value)} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <input placeholder="Conversion goal" value={goal} onChange={e => setGoal(e.target.value)} style={{ width: '100%', marginBottom: 12, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <button onClick={run} disabled={loading || !context} style={{ padding: '10px 24px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>{loading ? 'Generating...' : 'Generate Variants'}</button>
      {result && !result.error && (
        <div style={{ marginTop: 20 }}>
          {result.metric && <div style={{ background: '#1e2a1e', borderRadius: 6, padding: 8, marginBottom: 12, fontSize: 13, color: '#4ade80' }}>📊 Recommended metric: {result.metric}</div>}
          {(result.variants || []).map((v: any, i: number) => (
            <div key={i} style={{ border: `1px solid ${VARIANT_COLORS[i % VARIANT_COLORS.length]}33`, borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: VARIANT_COLORS[i % VARIANT_COLORS.length] }}>{v.label || `Variant ${String.fromCharCode(65+i)}`}</span>
                <span style={{ fontSize: 11, color: '#64748b' }}>{v.angle}</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 6, background: '#16162a', borderRadius: 6, padding: '8px 12px' }}>{v.copy}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>💡 {v.hypothesis}</div>
            </div>
          ))}
          {result.testingTips?.length > 0 && (
            <div style={{ background: '#1e1e2e', borderRadius: 8, padding: 12 }}>
              <div style={{ color: '#a78bfa', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Testing Tips</div>
              {result.testingTips.map((tip: string, i: number) => <div key={i} style={{ color: '#94a3b8', fontSize: 12, marginBottom: 3 }}>• {tip}</div>)}
            </div>
          )}
        </div>
      )}
      {result?.error && <p style={{ color: '#f87171', marginTop: 12 }}>{result.error}</p>}
    </div>
  );
}

// --- v8.79 Customer Persona Builder ---
function PersonaBuilderPanel({ api }: { api: string }) {
  const [product, setProduct] = React.useState('');
  const [industry, setIndustry] = React.useState('');
  const [targetMarket, setTargetMarket] = React.useState('');
  const [painPoints, setPainPoints] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const run = async () => {
    setLoading(true); setResult(null); setActive(0);
    const r = await fetch(`${api}/api/persona-builder`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ product, industry, targetMarket, painPoints }) });
    const d = await r.json(); setResult(d); setLoading(false);
  };
  const personas = result?.personas || [];
  const p = personas[active];
  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h2>👤 Customer Persona Builder</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <input placeholder="Product / service" value={product} onChange={e => setProduct(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <input placeholder="Industry" value={industry} onChange={e => setIndustry(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      </div>
      <input placeholder="Target market description" value={targetMarket} onChange={e => setTargetMarket(e.target.value)} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <textarea placeholder="Known pain points" value={painPoints} onChange={e => setPainPoints(e.target.value)} rows={2} style={{ width: '100%', marginBottom: 12, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <button onClick={run} disabled={loading || !product} style={{ padding: '10px 24px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>{loading ? 'Building...' : 'Build Personas'}</button>
      {personas.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {personas.map((persona: any, i: number) => (
              <button key={i} onClick={() => setActive(i)} style={{ padding: '6px 14px', borderRadius: 8, background: active===i ? '#7c3aed' : '#1e1e2e', color: '#fff', border: active===i ? '1px solid #7c3aed' : '1px solid #333', cursor: 'pointer' }}>{persona.name}</button>
            ))}
          </div>
          {p && (
            <div style={{ background: '#1e1e2e', borderRadius: 10, padding: 18 }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>👤</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#e2e8f0' }}>{p.name}</div>
                  <div style={{ color: '#94a3b8', fontSize: 13 }}>{p.role} · {p.age} · {p.income}</div>
                  <div style={{ color: '#64748b', fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>"{p.quote}"</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[['🎯 Goals', p.goals], ['😤 Frustrations', p.frustrations], ['📱 Behaviors', p.behaviors], ['📣 Channels', p.preferredChannels], ['⚡ Buying Triggers', p.buyingTriggers]].map(([label, items]: any) => (
                  <div key={label} style={{ background: '#16162a', borderRadius: 6, padding: 10 }}>
                    <div style={{ color: '#a78bfa', fontWeight: 600, fontSize: 12, marginBottom: 6 }}>{label}</div>
                    {(items || []).map((it: string, j: number) => <div key={j} style={{ color: '#cbd5e1', fontSize: 12, marginBottom: 2 }}>• {it}</div>)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {result?.error && <p style={{ color: '#f87171', marginTop: 12 }}>{result.error}</p>}
    </div>
  );
}

// --- v8.78 Product Roadmap Generator ---
const PRIORITY_COLOR: Record<string,string> = { P0: '#f87171', P1: '#facc15', P2: '#4ade80' };
const EFFORT_LABEL: Record<string,string> = { S: 'Small', M: 'Medium', L: 'Large' };
function ProductRoadmapPanel({ api }: { api: string }) {
  const [productName, setProductName] = React.useState('');
  const [vision, setVision] = React.useState('');
  const [currentState, setCurrentState] = React.useState('');
  const [goals, setGoals] = React.useState('');
  const [timeframe, setTimeframe] = React.useState('Q1-Q4 2025');
  const [audience, setAudience] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult(null);
    const r = await fetch(`${api}/api/product-roadmap`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ productName, vision, currentState, goals, timeframe, audience }) });
    const d = await r.json(); setResult(d); setLoading(false);
  };
  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <h2>🗺️ Product Roadmap Generator</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <input placeholder="Product name" value={productName} onChange={e => setProductName(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <input placeholder="Target audience" value={audience} onChange={e => setAudience(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <input placeholder="Timeframe (e.g. Q1-Q4 2025)" value={timeframe} onChange={e => setTimeframe(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <input placeholder="Goals" value={goals} onChange={e => setGoals(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      </div>
      <textarea placeholder="Product vision" value={vision} onChange={e => setVision(e.target.value)} rows={2} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <textarea placeholder="Current state / what exists today" value={currentState} onChange={e => setCurrentState(e.target.value)} rows={2} style={{ width: '100%', marginBottom: 12, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <button onClick={run} disabled={loading || !productName} style={{ padding: '10px 24px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>{loading ? 'Generating...' : 'Generate Roadmap'}</button>
      {result && !result.error && (
        <div style={{ marginTop: 20 }}>
          {(result.quarters || []).map((q: any, i: number) => (
            <div key={i} style={{ background: '#1e1e2e', borderRadius: 8, padding: 14, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: '#a78bfa' }}>{q.name}: {q.theme}</span>
                <span style={{ fontSize: 12, color: '#4ade80' }}>🏁 {q.milestone}</span>
              </div>
              {(q.features || []).map((f: any, j: number) => (
                <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6, paddingLeft: 8 }}>
                  <span style={{ background: PRIORITY_COLOR[f.priority] || '#64748b', color: '#000', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{f.priority}</span>
                  <span style={{ color: '#e2e8f0', fontSize: 13 }}><b>{f.name}</b> — {f.description}</span>
                  <span style={{ color: '#94a3b8', fontSize: 11, flexShrink: 0 }}>{EFFORT_LABEL[f.effort] || f.effort} · {f.impact}</span>
                </div>
              ))}
            </div>
          ))}
          {result.successMetrics?.length > 0 && <div style={{ background: '#1e2a1e', borderRadius: 8, padding: 12, marginBottom: 8 }}><b style={{ color: '#4ade80' }}>Success Metrics:</b> {result.successMetrics.join(' · ')}</div>}
          {result.risks?.length > 0 && <div style={{ background: '#2a1e1e', borderRadius: 8, padding: 12 }}><b style={{ color: '#f87171' }}>Risks:</b> {result.risks.join(' · ')}</div>}
        </div>
      )}
      {result?.error && <p style={{ color: '#f87171', marginTop: 12 }}>{result.error}</p>}
    </div>
  );
}

// --- v8.77 Grant Proposal Writer ---
function GrantProposalPanel({ api }: { api: string }) {
  const [orgName, setOrgName] = React.useState('');
  const [projectTitle, setProjectTitle] = React.useState('');
  const [funder, setFunder] = React.useState('');
  const [problem, setProblem] = React.useState('');
  const [solution, setSolution] = React.useState('');
  const [budget, setBudget] = React.useState('');
  const [timeline, setTimeline] = React.useState('12 months');
  const [impact, setImpact] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    const r = await fetch(`${api}/api/grant-proposal`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ orgName, projectTitle, funder, problem, solution, budget, timeline, impact }) });
    const d = await r.json(); setResult(d.proposal || d.error || ''); setLoading(false);
  };
  const copy = () => navigator.clipboard.writeText(result);
  const inp = (ph: string, val: string, set: (v:string)=>void, full=false) => (
    <input placeholder={ph} value={val} onChange={e => set(e.target.value)} style={{ width: full?'100%':'auto', padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff', marginBottom: 8, boxSizing: 'border-box' as any }} />
  );
  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h2>🏛️ Grant Proposal Writer</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 0 }}>
        {inp('Organization name', orgName, setOrgName)}
        {inp('Project title', projectTitle, setProjectTitle)}
        {inp('Funder / grant name', funder, setFunder)}
        {inp('Budget requested', budget, setBudget)}
      </div>
      <input placeholder="Timeline (e.g. 12 months)" value={timeline} onChange={e => setTimeline(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff', marginBottom: 8 }} />
      <textarea placeholder="Problem statement" value={problem} onChange={e => setProblem(e.target.value)} rows={2} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <textarea placeholder="Proposed solution" value={solution} onChange={e => setSolution(e.target.value)} rows={2} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <textarea placeholder="Expected impact / outcomes" value={impact} onChange={e => setImpact(e.target.value)} rows={2} style={{ width: '100%', marginBottom: 12, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <button onClick={run} disabled={loading || !orgName} style={{ padding: '10px 24px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>{loading ? 'Writing...' : 'Generate Proposal'}</button>
      {result && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#a78bfa', fontWeight: 600 }}>Grant Proposal</span>
            <button onClick={copy} style={{ padding: '4px 12px', borderRadius: 6, background: '#374151', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12 }}>Copy</button>
          </div>
          <pre style={{ background: '#1e1e2e', borderRadius: 8, padding: 16, color: '#e2e8f0', whiteSpace: 'pre-wrap', fontSize: 13 }}>{result}</pre>
        </div>
      )}
    </div>
  );
}

// --- v8.76 Sales Proposal Generator ---
function SalesProposalPanel({ api }: { api: string }) {
  const [clientName, setClientName] = React.useState('');
  const [companyName, setCompanyName] = React.useState('');
  const [clientProblem, setClientProblem] = React.useState('');
  const [solution, setSolution] = React.useState('');
  const [pricing, setPricing] = React.useState('');
  const [timeline, setTimeline] = React.useState('30 days');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    const r = await fetch(`${api}/api/sales-proposal`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ clientName, companyName, clientProblem, solution, pricing, timeline }) });
    const d = await r.json(); setResult(d.proposal || d.error || ''); setLoading(false);
  };
  const copy = () => navigator.clipboard.writeText(result);
  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h2>💼 Sales Proposal Generator</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <input placeholder="Client/Company name" value={clientName} onChange={e => setClientName(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <input placeholder="Your company name" value={companyName} onChange={e => setCompanyName(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      </div>
      <textarea placeholder="Client's problem or pain point" value={clientProblem} onChange={e => setClientProblem(e.target.value)} rows={2} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <textarea placeholder="Your proposed solution" value={solution} onChange={e => setSolution(e.target.value)} rows={2} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <input placeholder="Pricing (e.g. $5,000/mo)" value={pricing} onChange={e => setPricing(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <input placeholder="Timeline" value={timeline} onChange={e => setTimeline(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      </div>
      <button onClick={run} disabled={loading || !clientName} style={{ padding: '10px 24px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>{loading ? 'Writing...' : 'Generate Proposal'}</button>
      {result && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#a78bfa', fontWeight: 600 }}>Proposal</span>
            <button onClick={copy} style={{ padding: '4px 12px', borderRadius: 6, background: '#374151', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12 }}>Copy</button>
          </div>
          <pre style={{ background: '#1e1e2e', borderRadius: 8, padding: 16, color: '#e2e8f0', whiteSpace: 'pre-wrap', fontSize: 13 }}>{result}</pre>
        </div>
      )}
    </div>
  );
}

// --- v8.75 Blog Outline Generator ---
function BlogOutlinePanel({ api }: { api: string }) {
  const [topic, setTopic] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [keywords, setKeywords] = React.useState('');
  const [tone, setTone] = React.useState('Informative');
  const [length, setLength] = React.useState('1500 words');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult(null);
    const r = await fetch(`${api}/api/blog-outline`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ topic, audience, keywords, tone, length }) });
    const d = await r.json(); setResult(d); setLoading(false);
  };
  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h2>📝 Blog Outline Generator</h2>
      <input placeholder="Blog topic" value={topic} onChange={e => setTopic(e.target.value)} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <input placeholder="Target audience" value={audience} onChange={e => setAudience(e.target.value)} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <input placeholder="Keywords (comma-separated)" value={keywords} onChange={e => setKeywords(e.target.value)} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select value={tone} onChange={e => setTone(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }}>
          {['Informative','Conversational','Professional','Persuasive','Humorous'].map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={length} onChange={e => setLength(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }}>
          {['800 words','1500 words','2500 words','4000 words'].map(l => <option key={l}>{l}</option>)}
        </select>
      </div>
      <button onClick={run} disabled={loading || !topic} style={{ padding: '10px 24px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>{loading ? 'Generating...' : 'Generate Outline'}</button>
      {result && !result.error && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ color: '#a78bfa' }}>{result.title}</h3>
          <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>{result.metaDescription}</p>
          <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>Est. read time: {result.estimatedReadTime}</p>
          {(result.sections || []).map((s: any, i: number) => (
            <div key={i} style={{ background: '#1e1e2e', borderRadius: 8, padding: 12, marginBottom: 10 }}>
              <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>H2: {s.heading} <span style={{ color: '#64748b', fontSize: 12, fontWeight: 400 }}>~{s.wordCount} words</span></div>
              {(s.subheadings || []).map((sub: string, j: number) => <div key={j} style={{ color: '#94a3b8', fontSize: 13, marginLeft: 12, marginBottom: 2 }}>• H3: {sub}</div>)}
              {(s.keyPoints || []).map((kp: string, j: number) => <div key={j} style={{ color: '#64748b', fontSize: 12, marginLeft: 12 }}>→ {kp}</div>)}
            </div>
          ))}
          <div style={{ background: '#1e2a1e', borderRadius: 8, padding: 12 }}>
            <span style={{ color: '#4ade80', fontWeight: 600 }}>CTA: </span><span style={{ color: '#e2e8f0' }}>{result.callToAction}</span>
          </div>
        </div>
      )}
      {result?.error && <p style={{ color: '#f87171', marginTop: 12 }}>{result.error}</p>}
    </div>
  );
}

// --- v8.74 Social Media Audit ---
function SocialAuditPanel({ api }: { api: string }) {
  const [handle, setHandle] = React.useState('');
  const [platform, setPlatform] = React.useState('Instagram');
  const [bio, setBio] = React.useState('');
  const [recentPosts, setRecentPosts] = React.useState('');
  const [goals, setGoals] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult(null);
    const r = await fetch(`${api}/api/social-audit`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ handle, platform, bio, recentPosts, goals }) });
    const d = await r.json(); setResult(d); setLoading(false);
  };
  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h2>📊 Social Media Audit</h2>
      <input placeholder="Handle (without @)" value={handle} onChange={e => setHandle(e.target.value)} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }}>
        {['Instagram','Twitter/X','LinkedIn','TikTok','YouTube','Facebook'].map(p => <option key={p}>{p}</option>)}
      </select>
      <textarea placeholder="Bio (paste current bio)" value={bio} onChange={e => setBio(e.target.value)} rows={2} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <textarea placeholder="Describe recent posts (themes, types, frequency)" value={recentPosts} onChange={e => setRecentPosts(e.target.value)} rows={3} style={{ width: '100%', marginBottom: 8, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <input placeholder="Goals (e.g. grow audience, drive sales)" value={goals} onChange={e => setGoals(e.target.value)} style={{ width: '100%', marginBottom: 12, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
      <button onClick={run} disabled={loading || !handle} style={{ padding: '10px 24px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>{loading ? 'Auditing...' : 'Run Audit'}</button>
      {result && !result.error && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            {Object.entries(result.scores || {}).map(([k, v]: any) => (
              <div key={k} style={{ flex: 1, background: '#1e1e2e', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: v >= 70 ? '#4ade80' : v >= 40 ? '#facc15' : '#f87171' }}>{v}</div>
                <div style={{ fontSize: 12, color: '#aaa', textTransform: 'capitalize' }}>{k}</div>
              </div>
            ))}
          </div>
          <p style={{ color: '#ccc', marginBottom: 12 }}>{result.summary}</p>
          <h4 style={{ color: '#a78bfa' }}>Recommendations</h4>
          <ul>{(result.recommendations || []).map((r: string, i: number) => <li key={i} style={{ color: '#e2e8f0', marginBottom: 4 }}>{r}</li>)}</ul>
          <h4 style={{ color: '#a78bfa' }}>Content Ideas</h4>
          <ul>{(result.contentIdeas || []).map((r: string, i: number) => <li key={i} style={{ color: '#e2e8f0', marginBottom: 4 }}>{r}</li>)}</ul>
        </div>
      )}
      {result?.error && <p style={{ color: '#f87171', marginTop: 12 }}>{result.error}</p>}
    </div>
  );
}

// --- v8.73 Webinar Script Writer ---
function WebinarScriptPanel({ api }: { api: string }) {
  const [title, setTitle] = React.useState('');
  const [duration, setDuration] = React.useState('60 minutes');
  const [audience, setAudience] = React.useState('professionals');
  const [topic, setTopic] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(`${api}/api/webinar-script`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ title, duration, audience, topic }) });
      const d = await r.json();
      setResult(d.script || d.error || 'Error');
    } catch(e: any) { setResult(e.message); }
    setLoading(false);
  };
  return (
    <div style={{ padding: 24 }}>
      <h2>🎤 Webinar Script Writer</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
        <input placeholder="Webinar title" value={title} onChange={e => setTitle(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <input placeholder="Main topic / key message" value={topic} onChange={e => setTopic(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <select value={duration} onChange={e => setDuration(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }}>
          {['30 minutes','45 minutes','60 minutes','90 minutes'].map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <input placeholder="Target audience" value={audience} onChange={e => setAudience(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <button onClick={run} disabled={loading || !title} style={{ padding: '10px 20px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>{loading ? 'Writing...' : 'Generate Webinar Script'}</button>
      </div>
      {result && <pre style={{ marginTop: 20, padding: 16, background: '#1a1a1a', borderRadius: 8, whiteSpace: 'pre-wrap', color: '#e2e8f0' }}>{result}</pre>}
    </div>
  );
}

// --- v8.72 White Paper Generator ---
function WhitePaperPanel({ api }: { api: string }) {
  const [topic, setTopic] = React.useState('');
  const [audience, setAudience] = React.useState('business executives');
  const [problem, setProblem] = React.useState('');
  const [position, setPosition] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(`${api}/api/whitepaper`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ topic, audience, problem, position }) });
      const d = await r.json();
      setResult(d.whitepaper || d.error || 'Error');
    } catch(e: any) { setResult(e.message); }
    setLoading(false);
  };
  return (
    <div style={{ padding: 24 }}>
      <h2>📄 White Paper Generator</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
        <input placeholder="White paper topic" value={topic} onChange={e => setTopic(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <input placeholder="Target audience" value={audience} onChange={e => setAudience(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <textarea placeholder="Problem being addressed" value={problem} onChange={e => setProblem(e.target.value)} rows={2} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff', resize: 'vertical' }} />
        <textarea placeholder="Your position or solution angle" value={position} onChange={e => setPosition(e.target.value)} rows={2} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff', resize: 'vertical' }} />
        <button onClick={run} disabled={loading || !topic} style={{ padding: '10px 20px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>{loading ? 'Generating...' : 'Generate White Paper'}</button>
      </div>
      {result && <pre style={{ marginTop: 20, padding: 16, background: '#1a1a1a', borderRadius: 8, whiteSpace: 'pre-wrap', color: '#e2e8f0' }}>{result}</pre>}
    </div>
  );
}

// --- v8.71 Case Study Writer ---
function CaseStudyPanel({ api }: { api: string }) {
  const [customer, setCustomer] = React.useState('');
  const [industry, setIndustry] = React.useState('technology');
  const [challenge, setChallenge] = React.useState('');
  const [solution, setSolution] = React.useState('');
  const [results, setResults] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(`${api}/api/case-study`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ customer, industry, challenge, solution, results }) });
      const d = await r.json();
      setResult(d.study || d.error || 'Error');
    } catch(e: any) { setResult(e.message); }
    setLoading(false);
  };
  return (
    <div style={{ padding: 24 }}>
      <h2>📋 Case Study Writer</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
        <input placeholder="Customer/company name" value={customer} onChange={e => setCustomer(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <input placeholder="Industry" value={industry} onChange={e => setIndustry(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <textarea placeholder="The challenge they faced" value={challenge} onChange={e => setChallenge(e.target.value)} rows={2} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff', resize: 'vertical' }} />
        <textarea placeholder="Solution you provided" value={solution} onChange={e => setSolution(e.target.value)} rows={2} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff', resize: 'vertical' }} />
        <textarea placeholder="Results & outcomes (include metrics if possible)" value={results} onChange={e => setResults(e.target.value)} rows={2} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff', resize: 'vertical' }} />
        <button onClick={run} disabled={loading || !customer || !challenge} style={{ padding: '10px 20px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>{loading ? 'Writing...' : 'Generate Case Study'}</button>
      </div>
      {result && <pre style={{ marginTop: 20, padding: 16, background: '#1a1a1a', borderRadius: 8, whiteSpace: 'pre-wrap', color: '#e2e8f0' }}>{result}</pre>}
    </div>
  );
}

// --- v8.70 Testimonial Request Writer ---
function TestimonialReqPanel({ api }: { api: string }) {
  const [customerName, setCustomerName] = React.useState('');
  const [product, setProduct] = React.useState('');
  const [outcome, setOutcome] = React.useState('');
  const [platform, setPlatform] = React.useState('Google Reviews');
  const [emails, setEmails] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setEmails([]);
    try {
      const r = await fetch(`${api}/api/testimonial-req`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ customerName, product, outcome, platform }) });
      const d = await r.json();
      setEmails(d.emails || []);
    } catch(e: any) { setEmails([{ tone: 'error', subject: '', body: e.message }]); }
    setLoading(false);
  };
  return (
    <div style={{ padding: 24 }}>
      <h2>⭐ Testimonial Request Writer</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
        <input placeholder="Customer name" value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <input placeholder="Product or service" value={product} onChange={e => setProduct(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <input placeholder="Known outcome or result they achieved" value={outcome} onChange={e => setOutcome(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }}>
          {['Google Reviews','LinkedIn','G2','Trustpilot','Capterra','Website testimonial'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={run} disabled={loading || !product} style={{ padding: '10px 20px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>{loading ? 'Writing...' : 'Generate Emails'}</button>
      </div>
      {emails.map((e, i) => (
        <div key={i} style={{ marginTop: 16, padding: 16, background: '#1a1a1a', borderRadius: 8 }}>
          <p style={{ color: '#a78bfa', fontWeight: 700, marginBottom: 4 }}>Tone: {e.tone} | Subject: {e.subject}</p>
          <pre style={{ color: '#e2e8f0', whiteSpace: 'pre-wrap', margin: 0 }}>{e.body}</pre>
        </div>
      ))}
    </div>
  );
}

// --- v8.69 FAQ Generator ---
function FAQGenPanel({ api }: { api: string }) {
  const [topic, setTopic] = React.useState('');
  const [audience, setAudience] = React.useState('general public');
  const [count, setCount] = React.useState('10');
  const [faqs, setFaqs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setFaqs([]);
    try {
      const r = await fetch(`${api}/api/faq-gen`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ topic, audience, count }) });
      const d = await r.json();
      setFaqs(d.faqs || []);
    } catch(e: any) { setFaqs([{ q: e.message, a: '' }]); }
    setLoading(false);
  };
  return (
    <div style={{ padding: 24 }}>
      <h2>❓ FAQ Generator</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
        <input placeholder="Topic or product" value={topic} onChange={e => setTopic(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <input placeholder="Target audience" value={audience} onChange={e => setAudience(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <select value={count} onChange={e => setCount(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }}>
          {['5','10','15','20'].map(n => <option key={n} value={n}>{n} FAQs</option>)}
        </select>
        <button onClick={run} disabled={loading || !topic} style={{ padding: '10px 20px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>{loading ? 'Generating...' : 'Generate FAQs'}</button>
      </div>
      {faqs.map((f, i) => (
        <div key={i} style={{ marginTop: 14, padding: 14, background: '#1a1a1a', borderRadius: 8 }}>
          <p style={{ color: '#a78bfa', fontWeight: 700, marginBottom: 6 }}>Q: {f.q}</p>
          <p style={{ color: '#e2e8f0' }}>A: {f.a}</p>
        </div>
      ))}
    </div>
  );
}

// --- v8.68 Press Release Writer ---
function PressReleasePanel({ api }: { api: string }) {
  const [headline, setHeadline] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [announcement, setAnnouncement] = React.useState('');
  const [quote, setQuote] = React.useState('');
  const [contact, setContact] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(`${api}/api/press-release`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ headline, company, announcement, quote, contact }) });
      const d = await r.json();
      setResult(d.release || d.error || 'Error');
    } catch(e: any) { setResult(e.message); }
    setLoading(false);
  };
  return (
    <div style={{ padding: 24 }}>
      <h2>📰 Press Release Writer</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
        <input placeholder="Headline" value={headline} onChange={e => setHeadline(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <input placeholder="Company name" value={company} onChange={e => setCompany(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <textarea placeholder="Announcement details" value={announcement} onChange={e => setAnnouncement(e.target.value)} rows={3} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff', resize: 'vertical' }} />
        <input placeholder="Executive quote (optional)" value={quote} onChange={e => setQuote(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <input placeholder="Press contact email" value={contact} onChange={e => setContact(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <button onClick={run} disabled={loading || !headline || !announcement} style={{ padding: '10px 20px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>{loading ? 'Writing...' : 'Generate Press Release'}</button>
      </div>
      {result && <pre style={{ marginTop: 20, padding: 16, background: '#1a1a1a', borderRadius: 8, whiteSpace: 'pre-wrap', color: '#e2e8f0', fontFamily: 'Georgia, serif' }}>{result}</pre>}
    </div>
  );
}

// --- v8.67 LinkedIn Post Generator ---
function LinkedInPostPanel({ api }: { api: string }) {
  const [topic, setTopic] = React.useState('');
  const [angle, setAngle] = React.useState('thought leadership');
  const [industry, setIndustry] = React.useState('tech/business');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(`${api}/api/linkedin-post`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ topic, angle, industry }) });
      const d = await r.json();
      setResult(d.post || d.error || 'Error');
    } catch(e: any) { setResult(e.message); }
    setLoading(false);
  };
  return (
    <div style={{ padding: 24 }}>
      <h2>💼 LinkedIn Post Generator</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
        <input placeholder="Post topic or story" value={topic} onChange={e => setTopic(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <select value={angle} onChange={e => setAngle(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }}>
          {['thought leadership','personal story','industry insight','controversial take','how-to/tips','milestone/win','failure lesson'].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <input placeholder="Industry" value={industry} onChange={e => setIndustry(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <button onClick={run} disabled={loading || !topic} style={{ padding: '10px 20px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>{loading ? 'Writing...' : 'Generate Post'}</button>
      </div>
      {result && <pre style={{ marginTop: 20, padding: 16, background: '#1a1a1a', borderRadius: 8, whiteSpace: 'pre-wrap', color: '#e2e8f0' }}>{result}</pre>}
    </div>
  );
}

// --- v8.66 Instagram Caption Writer ---
function IGCaptionPanel({ api }: { api: string }) {
  const [description, setDescription] = React.useState('');
  const [niche, setNiche] = React.useState('lifestyle');
  const [tone, setTone] = React.useState('engaging and authentic');
  const [cta, setCta] = React.useState('encourage comments');
  const [captions, setCaptions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setCaptions([]);
    try {
      const r = await fetch(`${api}/api/ig-caption`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ description, niche, tone, cta }) });
      const d = await r.json();
      setCaptions(d.captions || []);
    } catch(e: any) { setCaptions([{ caption: e.message, hashtags: [] }]); }
    setLoading(false);
  };
  return (
    <div style={{ padding: 24 }}>
      <h2>📸 Instagram Caption Writer</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
        <textarea placeholder="Describe your post / what's in the photo" value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff', resize: 'vertical' }} />
        <input placeholder="Niche (e.g. fitness, travel, food)" value={niche} onChange={e => setNiche(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <input placeholder="Tone" value={tone} onChange={e => setTone(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <input placeholder="CTA goal" value={cta} onChange={e => setCta(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <button onClick={run} disabled={loading || !description} style={{ padding: '10px 20px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>{loading ? 'Writing...' : 'Generate Captions'}</button>
      </div>
      {captions.map((c, i) => (
        <div key={i} style={{ marginTop: 16, padding: 16, background: '#1a1a1a', borderRadius: 8 }}>
          <p style={{ color: '#e2e8f0', marginBottom: 8 }}>{c.caption}</p>
          <p style={{ color: '#7c3aed', fontSize: 13 }}>{(c.hashtags || []).join(' ')}</p>
        </div>
      ))}
    </div>
  );
}

// --- v8.65 Twitter/X Thread Optimizer ---
function ThreadOptimizerPanel({ api }: { api: string }) {
  const [content, setContent] = React.useState('');
  const [goal, setGoal] = React.useState('maximize engagement');
  const [tweets, setTweets] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setTweets([]);
    try {
      const r = await fetch(`${api}/api/thread-optimize`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ content, goal }) });
      const d = await r.json();
      setTweets(d.tweets || [d.error || 'Error']);
    } catch(e: any) { setTweets([e.message]); }
    setLoading(false);
  };
  return (
    <div style={{ padding: 24 }}>
      <h2>🐦 Twitter/X Thread Optimizer</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
        <textarea placeholder="Paste your content or draft thread" value={content} onChange={e => setContent(e.target.value)} rows={5} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff', resize: 'vertical' }} />
        <input placeholder="Goal (e.g. maximize engagement, drive traffic)" value={goal} onChange={e => setGoal(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <button onClick={run} disabled={loading || !content} style={{ padding: '10px 20px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>{loading ? 'Optimizing...' : 'Optimize Thread'}</button>
      </div>
      {tweets.length > 0 && <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tweets.map((tw, i) => <div key={i} style={{ padding: 14, background: '#1a1a1a', borderRadius: 8, color: '#e2e8f0', borderLeft: '3px solid #7c3aed' }}><span style={{ color: '#7c3aed', fontWeight: 700 }}>{i+1}/</span> {tw}</div>)}
      </div>}
    </div>
  );
}

// --- v8.64 YouTube Description Writer ---
function YTDescriptionPanel({ api }: { api: string }) {
  const [title, setTitle] = React.useState('');
  const [summary, setSummary] = React.useState('');
  const [keywords, setKeywords] = React.useState('');
  const [channel, setChannel] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(`${api}/api/yt-description`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ title, summary, keywords, channel }) });
      const d = await r.json();
      setResult(d.description || d.error || 'Error');
    } catch(e: any) { setResult(e.message); }
    setLoading(false);
  };
  return (
    <div style={{ padding: 24 }}>
      <h2>📺 YouTube Description Writer</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
        <input placeholder="Video title" value={title} onChange={e => setTitle(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <input placeholder="Channel name" value={channel} onChange={e => setChannel(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <textarea placeholder="Video summary / key points" value={summary} onChange={e => setSummary(e.target.value)} rows={3} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff', resize: 'vertical' }} />
        <input placeholder="Target keywords (comma separated)" value={keywords} onChange={e => setKeywords(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <button onClick={run} disabled={loading || !title} style={{ padding: '10px 20px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>{loading ? 'Writing...' : 'Generate Description'}</button>
      </div>
      {result && <pre style={{ marginTop: 20, padding: 16, background: '#1a1a1a', borderRadius: 8, whiteSpace: 'pre-wrap', color: '#e2e8f0' }}>{result}</pre>}
    </div>
  );
}

// --- v8.63 Video Script Writer ---
function VideoScriptPanel({ api }: { api: string }) {
  const [topic, setTopic] = React.useState('');
  const [duration, setDuration] = React.useState('5-minute');
  const [platform, setPlatform] = React.useState('YouTube');
  const [style, setStyle] = React.useState('educational');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(`${api}/api/video-script`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('forge_token')}` }, body: JSON.stringify({ topic, duration, platform, style }) });
      const d = await r.json();
      setResult(d.script || d.error || 'Error');
    } catch(e: any) { setResult(e.message); }
    setLoading(false);
  };
  return (
    <div style={{ padding: 24 }}>
      <h2>🎬 Video Script Writer</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
        <input placeholder="Video topic" value={topic} onChange={e => setTopic(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }} />
        <select value={duration} onChange={e => setDuration(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }}>
          {['1-minute','3-minute','5-minute','10-minute','15-minute','30-minute'].map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }}>
          {['YouTube','TikTok','Instagram Reels','LinkedIn','Twitter/X','Vimeo'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={style} onChange={e => setStyle(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #333', background: '#1a1a1a', color: '#fff' }}>
          {['educational','entertaining','documentary','tutorial','vlog','promotional'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={run} disabled={loading || !topic} style={{ padding: '10px 20px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer' }}>{loading ? 'Writing...' : 'Write Script'}</button>
      </div>
      {result && <pre style={{ marginTop: 20, padding: 16, background: '#1a1a1a', borderRadius: 8, whiteSpace: 'pre-wrap', color: '#e2e8f0' }}>{result}</pre>}
    </div>
  );
}

// --- v8.62 Podcast Script Writer ---
function PodcastScriptPanel({ api }: { api: Api }) {
  const [form, setForm] = useState({ topic: '', duration: '20', format: 'solo host', audience: '' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<'script'|'shownotes'>('script');
  const [openSeg, setOpenSeg] = useState<number|null>(0);
  const submit = async () => {
    if (!form.topic.trim()) return;
    setLoading(true); setError(''); setResult(null); setOpenSeg(0); setView('script');
    try {
      const r = await fetch(`${api.base}/api/podcast-script`, { method: 'POST', headers: { ...api.headers, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };
  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 12, fontSize: 15 }}>🎙️ Podcast Script Writer</h3>
      <input placeholder="Episode topic *" value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} style={{ width: '100%', padding: 8, marginBottom: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 8, marginBottom: 8 }}>
        <input type="number" placeholder="Mins" min={5} max={60} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} style={{ padding: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
        <input placeholder="Format (solo / interview / panel)" value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))} style={{ padding: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
        <input placeholder="Target audience" value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} style={{ padding: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
      </div>
      <button onClick={submit} disabled={loading} style={{ padding: '8px 16px', background: '#7c3aed', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 13 }}>
        {loading ? 'Writing...' : 'Write Script'}
      </button>
      {error && <p style={{ color: '#f87171', marginTop: 8, fontSize: 12 }}>{error}</p>}
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{result.episode_title}</div>
            <div style={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>{result.tagline}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <button onClick={() => setView('script')} style={{ padding: '4px 12px', background: view === 'script' ? '#7c3aed' : '#1a1a2e', border: `1px solid ${view === 'script' ? '#7c3aed' : '#333'}`, borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 12 }}>Script</button>
            <button onClick={() => setView('shownotes')} style={{ padding: '4px 12px', background: view === 'shownotes' ? '#7c3aed' : '#1a1a2e', border: `1px solid ${view === 'shownotes' ? '#7c3aed' : '#333'}`, borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 12 }}>Show Notes</button>
          </div>
          {view === 'script' && (
            <div>
              <div style={{ background: '#1a1a2e', padding: 10, borderRadius: 6, marginBottom: 8, borderLeft: '3px solid #7c3aed' }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>INTRO</div>
                <div style={{ fontSize: 13, fontStyle: 'italic' }}>{result.intro_script}</div>
              </div>
              {(result.segments || []).map((s: any, i: number) => (
                <div key={i} style={{ background: '#1a1a2e', borderRadius: 6, marginBottom: 6, overflow: 'hidden' }}>
                  <div onClick={() => setOpenSeg(openSeg === i ? null : i)} style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 11, color: '#a78bfa', marginRight: 8 }}>{s.timestamp}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{s.title}</span>
                      <span style={{ fontSize: 11, color: '#888', marginLeft: 8 }}>{s.duration_mins}min</span>
                    </div>
                    <span style={{ fontSize: 12 }}>{openSeg === i ? '▲' : '▼'}</span>
                  </div>
                  {openSeg === i && (
                    <div style={{ padding: '0 12px 10px' }}>
                      <div style={{ marginBottom: 6 }}>{(s.talking_points || []).map((p: string, j: number) => <div key={j} style={{ fontSize: 12, color: '#aaa', padding: '2px 0' }}>• {p}</div>)}</div>
                      <div style={{ fontSize: 13, fontStyle: 'italic', color: '#ddd', borderTop: '1px solid #333', paddingTop: 6 }}>{s.script_excerpt}</div>
                    </div>
                  )}
                </div>
              ))}
              <div style={{ background: '#1a1a2e', padding: 10, borderRadius: 6, borderLeft: '3px solid #4ade80' }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>OUTRO</div>
                <div style={{ fontSize: 13, fontStyle: 'italic' }}>{result.outro_script}</div>
              </div>
            </div>
          )}
          {view === 'shownotes' && result.show_notes && (
            <div>
              <div style={{ background: '#1a1a2e', padding: 12, borderRadius: 6, marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>DESCRIPTION</div>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>{result.show_notes.description}</div>
              </div>
              <div style={{ background: '#1a1a2e', padding: 12, borderRadius: 6, marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>KEY TAKEAWAYS</div>
                {(result.show_notes.key_takeaways || []).map((t: string, i: number) => <div key={i} style={{ fontSize: 12, padding: '2px 0' }}>✓ {t}</div>)}
              </div>
              <div style={{ background: '#1a1a2e', padding: 12, borderRadius: 6, marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>TIMESTAMPS</div>
                {(result.show_notes.timestamps || []).map((t: string, i: number) => <div key={i} style={{ fontSize: 12, padding: '2px 0', color: '#a78bfa' }}>{t}</div>)}
              </div>
              {result.social_post && <div style={{ background: '#1a1a2e', padding: 12, borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>SOCIAL POST</div>
                <div style={{ fontSize: 13 }}>{result.social_post}</div>
              </div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v8.61 Ad Copy Generator ---
function AdCopyPanel({ api }: { api: Api }) {
  const [form, setForm] = useState({ product: '', audience: '', goal: 'conversions', platforms: 'Google, Facebook/Instagram, LinkedIn' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plat, setPlat] = useState('google');
  const submit = async () => {
    if (!form.product.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${api.base}/api/ad-copy`, { method: 'POST', headers: { ...api.headers, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d); setPlat('google');
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };
  const platTabs = [{ id: 'google', label: '🔍 Google' }, { id: 'facebook', label: '📘 Facebook' }, { id: 'instagram', label: '📸 Instagram' }, { id: 'linkedin', label: '💼 LinkedIn' }];
  const ads = result?.ads;
  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 12, fontSize: 15 }}>💰 Ad Copy Generator</h3>
      <input placeholder="Product / service *" value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))} style={{ width: '100%', padding: 8, marginBottom: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <input placeholder="Target audience" value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} style={{ padding: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
        <input placeholder="Campaign goal" value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))} style={{ padding: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
      </div>
      <button onClick={submit} disabled={loading} style={{ padding: '8px 16px', background: '#7c3aed', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 13 }}>
        {loading ? 'Generating...' : 'Generate Ad Copy'}
      </button>
      {error && <p style={{ color: '#f87171', marginTop: 8, fontSize: 12 }}>{error}</p>}
      {result && ads && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {platTabs.map(p => (
              <button key={p.id} onClick={() => setPlat(p.id)} style={{ padding: '4px 10px', background: plat === p.id ? '#7c3aed' : '#1a1a2e', border: `1px solid ${plat === p.id ? '#7c3aed' : '#333'}`, borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 12 }}>
                {p.label}
              </button>
            ))}
          </div>
          {plat === 'google' && ads.google && (
            <div style={{ background: '#1a1a2e', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>GOOGLE ADS</div>
              <div style={{ fontSize: 13, color: '#4ade80', marginBottom: 2 }}>H1: {ads.google.headline_1}</div>
              <div style={{ fontSize: 13, color: '#4ade80', marginBottom: 2 }}>H2: {ads.google.headline_2}</div>
              <div style={{ fontSize: 13, color: '#4ade80', marginBottom: 8 }}>H3: {ads.google.headline_3}</div>
              <div style={{ fontSize: 12, marginBottom: 2 }}>D1: {ads.google.description_1}</div>
              <div style={{ fontSize: 12, marginBottom: 8 }}>D2: {ads.google.description_2}</div>
              <div style={{ fontSize: 11, color: '#888' }}>URL: {ads.google.display_url}</div>
            </div>
          )}
          {plat === 'facebook' && ads.facebook && (
            <div style={{ background: '#1a1a2e', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>FACEBOOK ADS</div>
              <div style={{ fontSize: 13, marginBottom: 8, lineHeight: 1.6 }}>{ads.facebook.primary_text}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{ads.facebook.headline}</div>
              <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>{ads.facebook.description}</div>
              <div style={{ padding: '4px 12px', background: '#1d9bf0', borderRadius: 4, display: 'inline-block', fontSize: 12 }}>{ads.facebook.cta}</div>
            </div>
          )}
          {plat === 'instagram' && ads.instagram && (
            <div style={{ background: '#1a1a2e', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>INSTAGRAM ADS</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>{ads.instagram.caption}</div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: '#fff', background: '#333', padding: '6px 10px', borderRadius: 4 }}>Story: {ads.instagram.story_text}</div>
              <div style={{ fontSize: 12, color: '#e1306c' }}>{(ads.instagram.hashtags || []).map((h: string) => `#${h}`).join(' ')}</div>
            </div>
          )}
          {plat === 'linkedin' && ads.linkedin && (
            <div style={{ background: '#1a1a2e', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>LINKEDIN ADS</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{ads.linkedin.headline}</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>{ads.linkedin.intro_text}</div>
              <div style={{ padding: '4px 12px', background: '#0077b5', borderRadius: 4, display: 'inline-block', fontSize: 12 }}>{ads.linkedin.cta}</div>
            </div>
          )}
          {result.hooks && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>HOOK VARIANTS</div>
              {result.hooks.map((h: string, i: number) => <div key={i} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid #1a1a2e' }}>🪝 {h}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v8.60 Landing Page Copy Generator ---
function LandingCopyPanel({ api }: { api: Api }) {
  const [form, setForm] = useState({ product: '', audience: '', value_prop: '', tone: 'confident and clear' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [section, setSection] = useState('hero');
  const submit = async () => {
    if (!form.product.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${api.base}/api/landing-copy`, { method: 'POST', headers: { ...api.headers, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d); setSection('hero');
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };
  const copyAll = () => {
    if (!result) return;
    const lines = [
      `HERO\nH1: ${result.hero?.headline}\nSub: ${result.hero?.subheadline}\nCTA: ${result.hero?.cta_primary}`,
      `PROBLEM\n${result.problem?.heading}\n${result.problem?.body}`,
      `SOLUTION\n${result.solution?.heading}\n${result.solution?.body}\n${(result.solution?.bullets||[]).map((b:string)=>`• ${b}`).join('\n')}`,
      `FEATURES\n${(result.features||[]).map((f:any)=>`${f.icon} ${f.title}: ${f.description}`).join('\n')}`,
      `FAQ\n${(result.faq||[]).map((f:any)=>`Q: ${f.q}\nA: ${f.a}`).join('\n\n')}`,
    ];
    navigator.clipboard.writeText(lines.join('\n\n'));
  };
  const sections = ['hero', 'problem', 'solution', 'features', 'testimonials', 'faq', 'ctas'];
  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 12, fontSize: 15 }}>🚀 Landing Page Copy Generator</h3>
      <input placeholder="Product name / description *" value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))} style={{ width: '100%', padding: 8, marginBottom: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <input placeholder="Target audience" value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} style={{ padding: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
        <input placeholder="Main value proposition" value={form.value_prop} onChange={e => setForm(f => ({ ...f, value_prop: e.target.value }))} style={{ padding: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={submit} disabled={loading} style={{ padding: '8px 16px', background: '#7c3aed', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 13 }}>
          {loading ? 'Generating...' : 'Generate Copy'}
        </button>
        {result && <button onClick={copyAll} style={{ padding: '8px 12px', background: '#333', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 12 }}>Copy All</button>}
      </div>
      {error && <p style={{ color: '#f87171', marginTop: 8, fontSize: 12 }}>{error}</p>}
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
            {sections.map(s => (
              <button key={s} onClick={() => setSection(s)} style={{ padding: '3px 10px', background: section === s ? '#7c3aed' : '#1a1a2e', border: `1px solid ${section === s ? '#7c3aed' : '#333'}`, borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 11 }}>
                {s}
              </button>
            ))}
          </div>
          {section === 'hero' && result.hero && (
            <div style={{ background: '#1a1a2e', padding: 16, borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{result.hero.headline}</div>
              <div style={{ fontSize: 14, color: '#ccc', marginBottom: 12 }}>{result.hero.subheadline}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ padding: '8px 16px', background: '#7c3aed', borderRadius: 6, fontSize: 13 }}>{result.hero.cta_primary}</div>
                <div style={{ padding: '8px 16px', background: '#333', borderRadius: 6, fontSize: 13 }}>{result.hero.cta_secondary}</div>
              </div>
            </div>
          )}
          {section === 'problem' && result.problem && (
            <div style={{ background: '#1a1a2e', padding: 16, borderRadius: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{result.problem.heading}</div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>{result.problem.body}</div>
            </div>
          )}
          {section === 'solution' && result.solution && (
            <div style={{ background: '#1a1a2e', padding: 16, borderRadius: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{result.solution.heading}</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>{result.solution.body}</div>
              {(result.solution.bullets || []).map((b: string, i: number) => <div key={i} style={{ fontSize: 13, padding: '3px 0' }}>✓ {b}</div>)}
            </div>
          )}
          {section === 'features' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(result.features || []).map((f: any, i: number) => (
                <div key={i} style={{ background: '#1a1a2e', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{f.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: '#aaa' }}>{f.description}</div>
                </div>
              ))}
            </div>
          )}
          {section === 'testimonials' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(result.testimonials || []).map((t: any, i: number) => (
                <div key={i} style={{ background: '#1a1a2e', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontStyle: 'italic', marginBottom: 6 }}>"{t.quote}"</div>
                  <div style={{ fontSize: 12, color: '#888' }}>— {t.author}</div>
                  <div style={{ fontSize: 11, color: '#4ade80', marginTop: 4 }}>Result: {t.result}</div>
                </div>
              ))}
            </div>
          )}
          {section === 'faq' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(result.faq || []).map((f: any, i: number) => (
                <div key={i} style={{ background: '#1a1a2e', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Q: {f.q}</div>
                  <div style={{ fontSize: 13, color: '#aaa' }}>A: {f.a}</div>
                </div>
              ))}
            </div>
          )}
          {section === 'ctas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {result.pricing_cta && <div style={{ background: '#1a1a2e', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{result.pricing_cta.heading}</div>
                <div style={{ fontSize: 12, color: '#aaa', margin: '4px 0' }}>{result.pricing_cta.subtext}</div>
                <div style={{ padding: '6px 14px', background: '#7c3aed', borderRadius: 6, display: 'inline-block', fontSize: 13 }}>{result.pricing_cta.cta}</div>
              </div>}
              {result.footer_cta && <div style={{ background: '#1a1a2e', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{result.footer_cta.heading}</div>
                <div style={{ fontSize: 12, color: '#aaa', margin: '4px 0' }}>{result.footer_cta.subtext}</div>
                <div style={{ padding: '6px 14px', background: '#7c3aed', borderRadius: 6, display: 'inline-block', fontSize: 13 }}>{result.footer_cta.cta}</div>
              </div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v8.59 Cold Email Personalizer ---
function ColdEmailPanel({ api }: { api: Api }) {
  const [form, setForm] = useState({ prospect_name: '', prospect_company: '', prospect_role: '', your_offer: '', pain_point: '', tone: 'professional and direct' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selVariant, setSelVariant] = useState(0);
  const [copied, setCopied] = useState(false);
  const submit = async () => {
    if (!form.prospect_name.trim() || !form.your_offer.trim()) return;
    setLoading(true); setError(''); setResult(null); setSelVariant(0);
    try {
      const r = await fetch(`${api.base}/api/cold-email`, { method: 'POST', headers: { ...api.headers, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };
  const email = result?.emails?.[selVariant];
  const copy = () => {
    if (!email) return;
    navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 12, fontSize: 15 }}>🎯 Cold Email Personalizer</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        <input placeholder="Prospect name *" value={form.prospect_name} onChange={e => setForm(f => ({ ...f, prospect_name: e.target.value }))} style={{ padding: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
        <input placeholder="Company" value={form.prospect_company} onChange={e => setForm(f => ({ ...f, prospect_company: e.target.value }))} style={{ padding: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
        <input placeholder="Role / title" value={form.prospect_role} onChange={e => setForm(f => ({ ...f, prospect_role: e.target.value }))} style={{ padding: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
      </div>
      <input placeholder="Your offer / what you're selling *" value={form.your_offer} onChange={e => setForm(f => ({ ...f, your_offer: e.target.value }))} style={{ width: '100%', padding: 8, marginBottom: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <input placeholder="Main pain point to address" value={form.pain_point} onChange={e => setForm(f => ({ ...f, pain_point: e.target.value }))} style={{ padding: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
        <input placeholder="Tone" value={form.tone} onChange={e => setForm(f => ({ ...f, tone: e.target.value }))} style={{ padding: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
      </div>
      <button onClick={submit} disabled={loading} style={{ padding: '8px 16px', background: '#7c3aed', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 13 }}>
        {loading ? 'Writing...' : 'Generate Emails'}
      </button>
      {error && <p style={{ color: '#f87171', marginTop: 8, fontSize: 12 }}>{error}</p>}
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {(result.emails || []).map((_: any, i: number) => (
              <button key={i} onClick={() => setSelVariant(i)} style={{ padding: '4px 10px', background: selVariant === i ? '#7c3aed' : '#1a1a2e', border: `1px solid ${selVariant === i ? '#7c3aed' : '#333'}`, borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 12 }}>
                {result.emails[i].variant}
              </button>
            ))}
          </div>
          {email && (
            <div style={{ background: '#1a1a2e', padding: 12, borderRadius: 8, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>Subject: {email.subject}</div>
                <button onClick={copy} style={{ padding: '3px 10px', background: copied ? '#4ade80' : '#333', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontSize: 11 }}>{copied ? '✓ Copied' : 'Copy'}</button>
              </div>
              <pre style={{ fontSize: 13, whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6, margin: 0 }}>{email.body}</pre>
              <div style={{ fontSize: 11, color: '#888', marginTop: 8 }}>{email.word_count} words · Best for: {email.best_for}</div>
            </div>
          )}
          {(result.follow_up_sequence || []).length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>FOLLOW-UP SEQUENCE</div>
              {result.follow_up_sequence.map((f: any, i: number) => (
                <div key={i} style={{ background: '#1a1a2e', padding: 8, borderRadius: 6, marginBottom: 6 }}>
                  <div style={{ fontSize: 11, color: '#a78bfa', marginBottom: 2 }}>Day {f.day}: {f.subject}</div>
                  <div style={{ fontSize: 12 }}>{f.body}</div>
                </div>
              ))}
            </div>
          )}
          {(result.tips || []).length > 0 && (
            <div style={{ marginTop: 8 }}>
              {result.tips.map((t: string, i: number) => <div key={i} style={{ fontSize: 12, color: '#888' }}>💡 {t}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v8.58 Newsletter Builder ---
function NewsletterPanel({ api }: { api: Api }) {
  const [form, setForm] = useState({ topic: '', bullets: '', audience: '', tone: 'professional yet conversational' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selSubject, setSelSubject] = useState(0);
  const submit = async () => {
    if (!form.topic.trim()) return;
    setLoading(true); setError(''); setResult(null); setSelSubject(0);
    try {
      const r = await fetch(`${api.base}/api/newsletter-build`, { method: 'POST', headers: { ...api.headers, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };
  const sectionColors: Record<string, string> = { intro: '#7c3aed', main: '#2563eb', insight: '#d97706', actionable: '#16a34a', closing: '#6b7280' };
  const copyFull = () => {
    if (!result) return;
    const txt = `Subject: ${(result.subject_lines || [])[selSubject] || ''}\nPreview: ${result.preview_text || ''}\n\n${(result.sections || []).map((s: any) => `${s.heading ? s.heading + '\n' : ''}${s.content}`).join('\n\n')}\n\n[${result.cta_button}](${result.cta_url_placeholder})\n\n${result.ps_line}`;
    navigator.clipboard.writeText(txt);
  };
  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 12, fontSize: 15 }}>📧 Newsletter Builder</h3>
      <input placeholder="Newsletter topic / this week's theme" value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} style={{ width: '100%', padding: 8, marginBottom: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
      <textarea placeholder="Key points / bullet points to include (optional)" value={form.bullets} onChange={e => setForm(f => ({ ...f, bullets: e.target.value }))} rows={3} style={{ width: '100%', padding: 8, marginBottom: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <input placeholder="Audience (e.g. SaaS founders)" value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} style={{ padding: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
        <input placeholder="Tone" value={form.tone} onChange={e => setForm(f => ({ ...f, tone: e.target.value }))} style={{ padding: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={submit} disabled={loading} style={{ padding: '8px 16px', background: '#7c3aed', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 13 }}>
          {loading ? 'Building...' : 'Build Newsletter'}
        </button>
        {result && <button onClick={copyFull} style={{ padding: '8px 12px', background: '#333', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 12 }}>Copy Full</button>}
      </div>
      {error && <p style={{ color: '#f87171', marginTop: 8, fontSize: 12 }}>{error}</p>}
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>SUBJECT LINE (click to select)</div>
            {(result.subject_lines || []).map((s: string, i: number) => (
              <div key={i} onClick={() => setSelSubject(i)} style={{ padding: '6px 10px', marginBottom: 4, background: selSubject === i ? '#7c3aed22' : '#1a1a2e', border: `1px solid ${selSubject === i ? '#7c3aed' : '#333'}`, borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>{s}</div>
            ))}
          </div>
          <div style={{ background: '#1a1a2e', padding: 8, borderRadius: 6, marginBottom: 10, fontSize: 12, color: '#888' }}>
            Preview: {result.preview_text}
          </div>
          {(result.sections || []).map((s: any, i: number) => (
            <div key={i} style={{ borderLeft: `3px solid ${sectionColors[s.type] || '#333'}`, paddingLeft: 10, marginBottom: 12 }}>
              {s.heading && <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{s.heading}</div>}
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>{s.content}</div>
            </div>
          ))}
          <div style={{ background: '#7c3aed', padding: '8px 16px', borderRadius: 6, display: 'inline-block', marginBottom: 10, fontSize: 13 }}>
            {result.cta_button} →
          </div>
          {result.ps_line && <div style={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>{result.ps_line}</div>}
          <div style={{ fontSize: 11, color: '#555', marginTop: 8 }}>{result.estimated_read_time} read · ~{result.word_count} words</div>
        </div>
      )}
    </div>
  );
}

// --- v8.57 Thread Writer ---
function ThreadWriterPanel({ api }: { api: Api }) {
  const [form, setForm] = useState({ topic: '', angle: '', tweets: '8' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(-1);
  const submit = async () => {
    if (!form.topic.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${api.base}/api/thread-writer`, { method: 'POST', headers: { ...api.headers, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };
  const copyTweet = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopied(idx); setTimeout(() => setCopied(-1), 1500);
  };
  const copyAll = () => {
    if (!result) return;
    const all = (result.thread || []).map((t: any) => `${t.number}/ ${t.tweet}`).join('\n\n');
    navigator.clipboard.writeText(all);
  };
  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 12, fontSize: 15 }}>🧵 Thread Writer</h3>
      <input placeholder="Topic (e.g. How I grew my SaaS to $10k MRR)" value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} style={{ width: '100%', padding: 8, marginBottom: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 8, marginBottom: 8 }}>
        <input placeholder="Angle / hook style (e.g. personal story, listicle, controversial)" value={form.angle} onChange={e => setForm(f => ({ ...f, angle: e.target.value }))} style={{ padding: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
        <input type="number" min={5} max={15} placeholder="# tweets" value={form.tweets} onChange={e => setForm(f => ({ ...f, tweets: e.target.value }))} style={{ padding: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={submit} disabled={loading} style={{ padding: '8px 16px', background: '#7c3aed', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 13 }}>
          {loading ? 'Writing...' : 'Write Thread'}
        </button>
        {result && <button onClick={copyAll} style={{ padding: '8px 12px', background: '#1d9bf0', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 12 }}>Copy All</button>}
      </div>
      {error && <p style={{ color: '#f87171', marginTop: 8, fontSize: 12 }}>{error}</p>}
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, fontSize: 11, color: '#888' }}>
            <span>Type: {result.thread_type}</span>
            <span>·</span>
            <span>Reach: {result.estimated_impressions}</span>
            <span>·</span>
            <span>Best time: {result.best_time_to_post}</span>
          </div>
          {(result.thread || []).map((t: any, i: number) => (
            <div key={i} style={{ background: '#1a1a2e', padding: 10, borderRadius: 6, marginBottom: 6, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ fontSize: 11, color: t.type === 'hook' ? '#a78bfa' : '#888', marginBottom: 4 }}>{t.number}/ · {t.type} · {t.char_count || '?'} chars</div>
                <button onClick={() => copyTweet(t.tweet, i)} style={{ padding: '2px 8px', background: copied === i ? '#4ade80' : '#333', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontSize: 10 }}>{copied === i ? '✓' : 'Copy'}</button>
              </div>
              <div style={{ fontSize: 13 }}>{t.tweet}</div>
            </div>
          ))}
          {result.hashtags && <div style={{ fontSize: 12, color: '#1d9bf0', marginTop: 8 }}>{(result.hashtags || []).map((h: string) => `#${h}`).join(' ')}</div>}
        </div>
      )}
    </div>
  );
}

// --- v8.56 Headline Analyzer ---
function HeadlinePanel({ api }: { api: Api }) {
  const [form, setForm] = useState({ headline: '', context: '' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    if (!form.headline.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${api.base}/api/headline-analyze`, { method: 'POST', headers: { ...api.headers, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };
  const scoreColor = (s: number) => s >= 80 ? '#4ade80' : s >= 60 ? '#facc15' : '#f87171';
  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 12, fontSize: 15 }}>📰 Headline Analyzer</h3>
      <input placeholder="Enter your headline or title to analyze" value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} style={{ width: '100%', padding: 8, marginBottom: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
      <input placeholder="Context (optional — e.g. blog post about SaaS pricing)" value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} style={{ width: '100%', padding: 8, marginBottom: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
      <button onClick={submit} disabled={loading} style={{ padding: '8px 16px', background: '#7c3aed', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 13 }}>
        {loading ? 'Analyzing...' : 'Analyze Headline'}
      </button>
      {error && <p style={{ color: '#f87171', marginTop: 8, fontSize: 12 }}>{error}</p>}
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, background: '#1a1a2e', padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: scoreColor(result.scores?.overall || 0) }}>{result.grade}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{result.verdict}</div>
              <div style={{ fontSize: 11, color: '#888' }}>Overall: {result.scores?.overall}/100</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
            {Object.entries(result.scores || {}).filter(([k]) => k !== 'overall').map(([k, v]: any) => (
              <div key={k} style={{ background: '#1a1a2e', padding: 8, borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: scoreColor(v) }}>{v}</div>
                <div style={{ fontSize: 10, color: '#888' }}>{k.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div style={{ background: '#1a1a2e', padding: 10, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#4ade80', marginBottom: 4 }}>STRENGTHS</div>
              {(result.strengths || []).map((s: string, i: number) => <div key={i} style={{ fontSize: 12 }}>✓ {s}</div>)}
            </div>
            <div style={{ background: '#1a1a2e', padding: 10, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#f87171', marginBottom: 4 }}>WEAKNESSES</div>
              {(result.weaknesses || []).map((w: string, i: number) => <div key={i} style={{ fontSize: 12 }}>✗ {w}</div>)}
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>IMPROVED VERSIONS</div>
          {(result.improvements || []).map((imp: any, i: number) => (
            <div key={i} style={{ background: '#1a1a2e', padding: 10, borderRadius: 6, marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{imp.headline}</div>
                <div style={{ fontSize: 12, color: scoreColor(imp.score), fontWeight: 700 }}>{imp.score}</div>
              </div>
              <div style={{ fontSize: 11, color: '#888' }}>{imp.why}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- v8.55 Content Calendar Generator ---
function ContentCalPanel({ api }: { api: Api }) {
  const [form, setForm] = useState({ topic: '', weeks: '4', channels: 'Blog, Twitter/X, LinkedIn, Email Newsletter', goals: '' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    if (!form.topic.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${api.base}/api/content-calendar`, { method: 'POST', headers: { ...api.headers, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };
  const channelColors: Record<string, string> = { Blog: '#7c3aed', 'Twitter/X': '#1d9bf0', LinkedIn: '#0077b5', 'Email Newsletter': '#16a34a', Instagram: '#e1306c', YouTube: '#ff0000' };
  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 12, fontSize: 15 }}>📅 Content Calendar Generator</h3>
      <input placeholder="Topic / niche (e.g. SaaS growth, AI tools, personal finance)" value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} style={{ width: '100%', padding: 8, marginBottom: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <label style={{ fontSize: 11, color: '#888' }}>Weeks (1–8)</label>
          <input type="number" min={1} max={8} value={form.weeks} onChange={e => setForm(f => ({ ...f, weeks: e.target.value }))} style={{ width: '100%', padding: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#888' }}>Goals</label>
          <input placeholder="e.g. drive signups, build community" value={form.goals} onChange={e => setForm(f => ({ ...f, goals: e.target.value }))} style={{ width: '100%', padding: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
        </div>
      </div>
      <input placeholder="Channels (comma-separated)" value={form.channels} onChange={e => setForm(f => ({ ...f, channels: e.target.value }))} style={{ width: '100%', padding: 8, marginBottom: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
      <button onClick={submit} disabled={loading} style={{ padding: '8px 16px', background: '#7c3aed', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 13 }}>
        {loading ? 'Generating...' : 'Generate Calendar'}
      </button>
      {error && <p style={{ color: '#f87171', marginTop: 8, fontSize: 12 }}>{error}</p>}
      {result && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>{result.summary}</p>
          {(result.weeks_data || []).map((w: any, wi: number) => (
            <div key={wi} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#a78bfa' }}>Week {w.week}: {w.theme}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(w.posts || []).map((p: any, pi: number) => (
                  <div key={pi} style={{ background: '#1a1a2e', padding: 8, borderRadius: 6, display: 'grid', gridTemplateColumns: '70px 90px 1fr', gap: 8, alignItems: 'start' }}>
                    <div style={{ fontSize: 11, color: '#888' }}>{p.day}</div>
                    <div style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: channelColors[p.channel] || '#333', textAlign: 'center' }}>{p.channel}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{p.hook}</div>
                      <div style={{ fontSize: 11, color: '#4ade80' }}>CTA: {p.cta}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- v8.54 Brand Voice Analyzer ---
function BrandVoicePanel({ api }: { api: Api }) {
  const [form, setForm] = useState({ samples: '', brand: '' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    if (!form.samples.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${api.base}/api/brand-voice`, { method: 'POST', headers: { ...api.headers, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };
  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 12, fontSize: 15 }}>🎨 Brand Voice Analyzer</h3>
      <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Paste sample content to extract and codify your brand voice.</p>
      <input placeholder="Brand name (optional)" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} style={{ width: '100%', padding: 8, marginBottom: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
      <textarea placeholder="Paste content samples (emails, blog posts, social copy, etc.) — at least 50 characters" value={form.samples} onChange={e => setForm(f => ({ ...f, samples: e.target.value }))} rows={6} style={{ width: '100%', padding: 8, marginBottom: 8, background: '#1a1a2e', border: '1px solid #333', borderRadius: 6, color: '#fff', fontSize: 13 }} />
      <button onClick={submit} disabled={loading} style={{ padding: '8px 16px', background: '#7c3aed', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 13 }}>
        {loading ? 'Analyzing...' : 'Analyze Brand Voice'}
      </button>
      {error && <p style={{ color: '#f87171', marginTop: 8, fontSize: 12 }}>{error}</p>}
      {result && (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ fontSize: 13, marginBottom: 8 }}>Brand: {result.brand}</h4>
          <p style={{ fontSize: 12, background: '#1a1a2e', padding: 10, borderRadius: 6, marginBottom: 8 }}>{result.voice_summary}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div style={{ background: '#1a1a2e', padding: 10, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>PERSONALITY</div>
              {(result.personality_traits || []).map((t: string, i: number) => <div key={i} style={{ fontSize: 12, padding: '2px 0' }}>• {t}</div>)}
            </div>
            <div style={{ background: '#1a1a2e', padding: 10, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>TONE</div>
              <div style={{ fontSize: 12 }}>Primary: {result.tone?.primary}</div>
              <div style={{ fontSize: 12 }}>Secondary: {result.tone?.secondary}</div>
              <div style={{ fontSize: 12, color: '#f87171' }}>Avoid: {result.tone?.avoid}</div>
            </div>
          </div>
          <div style={{ background: '#1a1a2e', padding: 10, borderRadius: 6, marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>WRITING RULES</div>
            {(result.writing_rules || []).map((r: string, i: number) => <div key={i} style={{ fontSize: 12, padding: '2px 0' }}>• {r}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div style={{ background: '#1a1a2e', padding: 10, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#4ade80', marginBottom: 4 }}>✓ GOOD EXAMPLE</div>
              <div style={{ fontSize: 12, fontStyle: 'italic' }}>{result.examples?.good}</div>
            </div>
            <div style={{ background: '#1a1a2e', padding: 10, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#f87171', marginBottom: 4 }}>✗ BAD EXAMPLE</div>
              <div style={{ fontSize: 12, fontStyle: 'italic' }}>{result.examples?.bad}</div>
            </div>
          </div>
          <div style={{ background: '#1a1a2e', padding: 10, borderRadius: 6 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>CONTENT PILLARS</div>
            <div style={{ fontSize: 12 }}>{(result.content_pillars || []).join(' · ')}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- v8.53 Changelog Generator ---
function ChangelogPanel({ api }: { api: Api }) {
  const [form, setForm] = useState({ commits: '', version: '', product: '' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [showMd, setShowMd] = useState(false);

  const generate = async () => {
    if (!form.commits.trim()) return;
    setLoading(true); setErr(''); setResult(null);
    try {
      const r = await fetch(`${api.base}/api/changelog`, {
        method: 'POST', headers: { ...api.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Error');
      setResult(d);
    } catch(e: any) { setErr(e.message); }
    setLoading(false);
  };

  const copy = (text: string) => navigator.clipboard.writeText(text).catch(() => {});

  return (
    <div>
      <h3 style={{ color: '#e2e8f0', marginBottom: 8 }}>📝 Changelog Generator</h3>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>Generate polished changelogs from commit messages or feature lists.</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={form.product} onChange={e => setForm(f => ({...f, product: e.target.value}))} placeholder="Product name"
          style={{ flex: 1, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '6px 10px', fontSize: 13 }} />
        <input value={form.version} onChange={e => setForm(f => ({...f, version: e.target.value}))} placeholder="Version (e.g. 2.1.0)"
          style={{ flex: 1, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '6px 10px', fontSize: 13 }} />
      </div>
      <textarea value={form.commits} onChange={e => setForm(f => ({...f, commits: e.target.value}))}
        placeholder="Paste commit messages or feature list, e.g.:\nfeat: add dark mode\nfix: login crash on iOS\nchore: upgrade dependencies\nfeat: new dashboard analytics" rows={5}
        style={{ width: '100%', background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: 10, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 8 }} />
      <button onClick={generate} disabled={loading || !form.commits.trim()}
        style={{ background: '#475569', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', cursor: 'pointer', fontWeight: 600 }}>
        {loading ? 'Generating...' : 'Generate Changelog'}
      </button>
      {err && <p style={{ color: '#f87171', marginTop: 8 }}>{err}</p>}
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ background: '#1e293b', borderRadius: 8, padding: 12, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ color: '#e2e8f0' }}>{result.product} v{result.version} <span style={{ color: '#64748b', fontSize: 12 }}>· {result.release_date}</span></h4>
              <p style={{ color: '#94a3b8', fontSize: 13 }}>{result.summary}</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setShowMd(!showMd)} style={{ background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
                {showMd ? 'Preview' : 'Markdown'}
              </button>
              {result.markdown && <button onClick={() => copy(result.markdown)} style={{ background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Copy</button>}
            </div>
          </div>
          {showMd ? (
            <pre style={{ background: '#0f172a', color: '#e2e8f0', borderRadius: 6, padding: 12, fontSize: 12, overflow: 'auto', maxHeight: 400 }}>{result.markdown}</pre>
          ) : (
            <>
              {result.highlights?.length > 0 && (
                <div style={{ background: '#1a2744', border: '1px solid #1d4ed8', borderRadius: 6, padding: 10, marginBottom: 10 }}>
                  <div style={{ color: '#93c5fd', fontSize: 12, marginBottom: 6 }}>⭐ Highlights</div>
                  {result.highlights.map((h: string, i: number) => <p key={i} style={{ color: '#bfdbfe', fontSize: 13, margin: '2px 0' }}>• {h}</p>)}
                </div>
              )}
              {['added', 'improved', 'fixed', 'removed'].map(section => {
                const items = result.sections?.[section];
                if (!items?.length) return null;
                const colors: Record<string,string> = { added: '#22c55e', improved: '#3b82f6', fixed: '#f59e0b', removed: '#ef4444' };
                const icons: Record<string,string> = { added: '✨', improved: '⚡', fixed: '🐛', removed: '🗑️' };
                return (
                  <div key={section} style={{ marginBottom: 10 }}>
                    <div style={{ color: colors[section], fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>{icons[section]} {section}</div>
                    {items.map((item: any, i: number) => (
                      <div key={i} style={{ background: '#1e293b', borderRadius: 4, padding: '6px 10px', marginBottom: 4, borderLeft: `2px solid ${colors[section]}` }}>
                        <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{item.title}</div>
                        <div style={{ color: '#94a3b8', fontSize: 12 }}>{item.description}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
              {result.breaking_changes?.length > 0 && (
                <div style={{ background: '#2d1b1b', border: '1px solid #7f1d1d', borderRadius: 6, padding: 10, marginBottom: 8 }}>
                  <div style={{ color: '#fca5a5', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>⚠️ Breaking Changes</div>
                  {result.breaking_changes.map((b: string, i: number) => <p key={i} style={{ color: '#f87171', fontSize: 12 }}>• {b}</p>)}
                </div>
              )}
              {result.upgrade_notes && <p style={{ color: '#64748b', fontSize: 12 }}>📦 Upgrade notes: {result.upgrade_notes}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// --- v8.52 API Docs Generator ---
function ApiDocsPanel({ api }: { api: Api }) {
  const [form, setForm] = useState({ title: '', baseUrl: '', endpoints: '' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [activeEp, setActiveEp] = useState<number|null>(null);

  const generate = async () => {
    if (!form.endpoints.trim()) return;
    setLoading(true); setErr(''); setResult(null); setActiveEp(null);
    try {
      const r = await fetch(`${api.base}/api/api-docs`, {
        method: 'POST', headers: { ...api.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Error');
      setResult(d);
    } catch(e: any) { setErr(e.message); }
    setLoading(false);
  };

  const methodColor: Record<string, string> = { GET: '#22c55e', POST: '#3b82f6', PUT: '#f59e0b', PATCH: '#f59e0b', DELETE: '#ef4444' };

  return (
    <div>
      <h3 style={{ color: '#e2e8f0', marginBottom: 8 }}>📖 API Docs Generator</h3>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>Generate comprehensive REST API documentation.</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="API Title"
          style={{ flex: 1, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '6px 10px', fontSize: 13 }} />
        <input value={form.baseUrl} onChange={e => setForm(f => ({...f, baseUrl: e.target.value}))} placeholder="https://api.example.com"
          style={{ flex: 1, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '6px 10px', fontSize: 13 }} />
      </div>
      <textarea value={form.endpoints} onChange={e => setForm(f => ({...f, endpoints: e.target.value}))}
        placeholder="Describe your API endpoints, e.g.:\nGET /users — list all users\nPOST /users — create user with name and email\nDELETE /users/:id — delete user by ID" rows={5}
        style={{ width: '100%', background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: 10, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 8 }} />
      <button onClick={generate} disabled={loading || !form.endpoints.trim()}
        style={{ background: '#0f766e', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', cursor: 'pointer', fontWeight: 600 }}>
        {loading ? 'Generating...' : 'Generate Docs'}
      </button>
      {err && <p style={{ color: '#f87171', marginTop: 8 }}>{err}</p>}
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ background: '#0f172a', border: '1px solid #0f766e', borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ color: '#2dd4bf', marginBottom: 4 }}>{result.title} <span style={{ color: '#64748b', fontSize: 11 }}>v{result.version}</span></h4>
                <p style={{ color: '#94a3b8', fontSize: 12 }}>{result.description}</p>
              </div>
            </div>
            <div style={{ background: '#1e293b', borderRadius: 4, padding: '4px 10px', marginTop: 8, fontSize: 12, color: '#38bdf8', fontFamily: 'monospace' }}>{result.base_url}</div>
          </div>
          {result.authentication && (
            <div style={{ background: '#1e293b', borderRadius: 6, padding: 10, marginBottom: 10, borderLeft: '3px solid #f59e0b' }}>
              <span style={{ color: '#f59e0b', fontSize: 12, fontWeight: 600 }}>🔐 Auth: </span>
              <span style={{ color: '#e2e8f0', fontSize: 12 }}>{result.authentication.description}</span>
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            {result.endpoints?.map((ep: any, i: number) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div onClick={() => setActiveEp(activeEp === i ? null : i)}
                  style={{ background: '#1e293b', borderRadius: activeEp === i ? '6px 6px 0 0' : 6, padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ background: methodColor[ep.method]+'22', color: methodColor[ep.method], borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, fontFamily: 'monospace', minWidth: 56, textAlign: 'center' }}>{ep.method}</span>
                  <span style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: 13 }}>{ep.path}</span>
                  <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 'auto' }}>{ep.summary}</span>
                </div>
                {activeEp === i && (
                  <div style={{ background: '#0f172a', borderRadius: '0 0 6px 6px', padding: 12, border: '1px solid #1e293b' }}>
                    <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 10 }}>{ep.description}</p>
                    {ep.parameters?.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ color: '#64748b', fontSize: 11, marginBottom: 6 }}>PARAMETERS</div>
                        {ep.parameters.map((p: any, j: number) => (
                          <div key={j} style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 4 }}>
                            <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{p.name}</span>
                            <span style={{ color: '#64748b' }}>{p.in}</span>
                            <span style={{ color: p.required ? '#ef4444' : '#22c55e' }}>{p.required ? 'required' : 'optional'}</span>
                            <span style={{ color: '#94a3b8' }}>{p.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {ep.responses?.map((resp: any, j: number) => (
                      <div key={j} style={{ background: '#1e293b', borderRadius: 4, padding: 8, marginBottom: 4 }}>
                        <span style={{ color: resp.status < 300 ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: 12 }}>{resp.status}</span>
                        <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 8 }}>{resp.description}</span>
                        {resp.example && <pre style={{ color: '#64748b', fontSize: 10, marginTop: 4, overflow: 'auto' }}>{JSON.stringify(resp.example, null, 2)}</pre>}
                      </div>
                    ))}
                    {ep.example_curl && <pre style={{ background: '#020617', color: '#22c55e', borderRadius: 4, padding: 8, fontSize: 11, overflow: 'auto', marginTop: 8 }}>{ep.example_curl}</pre>}
                  </div>
                )}
              </div>
            ))}
          </div>
          {result.rate_limiting && <p style={{ color: '#64748b', fontSize: 12 }}>⚡ Rate limit: {result.rate_limiting}</p>}
        </div>
      )}
    </div>
  );
}

// --- v8.51 User Stories ---
function UserStoriesPanel({ api }: { api: Api }) {
  const [form, setForm] = useState({ feature: '', persona: 'user', context: 'web app' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [selected, setSelected] = useState<number|null>(null);

  const generate = async () => {
    if (!form.feature.trim()) return;
    setLoading(true); setErr(''); setResult(null); setSelected(null);
    try {
      const r = await fetch(`${api.base}/api/user-stories`, {
        method: 'POST', headers: { ...api.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Error');
      setResult(d);
    } catch(e: any) { setErr(e.message); }
    setLoading(false);
  };

  const prioColor: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
  const ptColor = (p: number) => p <= 2 ? '#22c55e' : p <= 5 ? '#f59e0b' : '#ef4444';

  return (
    <div>
      <h3 style={{ color: '#e2e8f0', marginBottom: 8 }}>📋 User Story Generator</h3>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>Generate agile user stories with acceptance criteria.</p>
      <textarea value={form.feature} onChange={e => setForm(f => ({...f, feature: e.target.value}))}
        placeholder="Describe the feature..." rows={3}
        style={{ width: '100%', background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: 10, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={form.persona} onChange={e => setForm(f => ({...f, persona: e.target.value}))} placeholder="Persona (user, admin...)"
          style={{ flex: 1, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '6px 10px', fontSize: 13 }} />
        <input value={form.context} onChange={e => setForm(f => ({...f, context: e.target.value}))} placeholder="Context (web app, mobile...)"
          style={{ flex: 1, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '6px 10px', fontSize: 13 }} />
      </div>
      <button onClick={generate} disabled={loading || !form.feature.trim()}
        style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', cursor: 'pointer', fontWeight: 600 }}>
        {loading ? 'Generating...' : 'Generate Stories'}
      </button>
      {err && <p style={{ color: '#f87171', marginTop: 8 }}>{err}</p>}
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ background: '#2e1065', border: '1px solid #7c3aed', borderRadius: 8, padding: 10, marginBottom: 12 }}>
            <span style={{ color: '#c4b5fd', fontSize: 12, fontWeight: 700 }}>EPIC: </span>
            <span style={{ color: '#ede9fe', fontSize: 14 }}>{result.epic}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {result.stories?.map((s: any, i: number) => (
              <button key={i} onClick={() => setSelected(selected === i ? null : i)}
                style={{ background: selected === i ? '#7c3aed' : '#1e293b', color: selected === i ? '#fff' : '#94a3b8', border: `1px solid ${selected === i ? '#7c3aed' : '#334155'}`, borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
                {s.id} <span style={{ color: prioColor[s.priority] }}>●</span> {s.story_points}pts
              </button>
            ))}
          </div>
          {selected !== null && result.stories?.[selected] && (() => {
            const s = result.stories[selected];
            return (
              <div style={{ background: '#1e293b', borderRadius: 8, padding: 14, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#a78bfa', fontWeight: 700 }}>{s.id}: {s.title}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ background: prioColor[s.priority]+'22', color: prioColor[s.priority], borderRadius: 4, padding: '2px 8px', fontSize: 11 }}>{s.priority}</span>
                    <span style={{ background: ptColor(s.story_points)+'22', color: ptColor(s.story_points), borderRadius: 4, padding: '2px 8px', fontSize: 11 }}>{s.story_points} pts</span>
                  </div>
                </div>
                <p style={{ color: '#e2e8f0', fontStyle: 'italic', fontSize: 13, marginBottom: 10 }}>"{s.story}"</p>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6 }}>✅ ACCEPTANCE CRITERIA</div>
                  {s.acceptance_criteria?.map((ac: string, j: number) => (
                    <div key={j} style={{ background: '#0f172a', borderRadius: 4, padding: '6px 10px', marginBottom: 4, color: '#e2e8f0', fontSize: 12, borderLeft: '2px solid #7c3aed' }}>{ac}</div>
                  ))}
                </div>
                {s.labels && <div style={{ display: 'flex', gap: 4 }}>{s.labels.map((l: string, j: number) => <span key={j} style={{ background: '#1e1b4b', color: '#a5b4fc', borderRadius: 4, padding: '2px 6px', fontSize: 11 }}>{l}</span>)}</div>}
              </div>
            );
          })()}
          {result.definition_of_done && (
            <div style={{ background: '#1e293b', borderRadius: 6, padding: 10, marginBottom: 8 }}>
              <div style={{ color: '#22c55e', fontSize: 12, marginBottom: 6 }}>✅ Definition of Done</div>
              {result.definition_of_done.map((d: string, i: number) => <p key={i} style={{ color: '#94a3b8', fontSize: 12, margin: '2px 0' }}>• {d}</p>)}
            </div>
          )}
          {result.out_of_scope && (
            <div style={{ background: '#1e293b', borderRadius: 6, padding: 10 }}>
              <div style={{ color: '#f59e0b', fontSize: 12, marginBottom: 4 }}>🚫 Out of Scope</div>
              {result.out_of_scope.map((o: string, i: number) => <p key={i} style={{ color: '#94a3b8', fontSize: 12, margin: '2px 0' }}>• {o}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v8.50 OKR Generator ---
function OKRPanel({ api }: { api: Api }) {
  const [form, setForm] = useState({ goal: '', timeframe: 'Q1 2025', team: '' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [expanded, setExpanded] = useState<number|null>(0);

  const generate = async () => {
    if (!form.goal.trim()) return;
    setLoading(true); setErr(''); setResult(null); setExpanded(0);
    try {
      const r = await fetch(`${api.base}/api/okr-generate`, {
        method: 'POST', headers: { ...api.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Error');
      setResult(d);
    } catch(e: any) { setErr(e.message); }
    setLoading(false);
  };

  const confColor = (c: number) => c >= 70 ? '#22c55e' : c >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div>
      <h3 style={{ color: '#e2e8f0', marginBottom: 8 }}>🎯 OKR Generator</h3>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>Generate Objectives and Key Results for any goal.</p>
      <textarea value={form.goal} onChange={e => setForm(f => ({...f, goal: e.target.value}))}
        placeholder="Describe your high-level goal..." rows={3}
        style={{ width: '100%', background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: 10, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={form.timeframe} onChange={e => setForm(f => ({...f, timeframe: e.target.value}))} placeholder="Timeframe (Q1 2025)"
          style={{ flex: 1, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '6px 10px', fontSize: 13 }} />
        <input value={form.team} onChange={e => setForm(f => ({...f, team: e.target.value}))} placeholder="Team (optional)"
          style={{ flex: 1, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '6px 10px', fontSize: 13 }} />
      </div>
      <button onClick={generate} disabled={loading || !form.goal.trim()}
        style={{ background: '#0891b2', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', cursor: 'pointer', fontWeight: 600 }}>
        {loading ? 'Generating...' : 'Generate OKRs'}
      </button>
      {err && <p style={{ color: '#f87171', marginTop: 8 }}>{err}</p>}
      {result && (
        <div style={{ marginTop: 16 }}>
          {result.north_star && (
            <div style={{ background: '#0c4a6e', border: '1px solid #0369a1', borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <div style={{ color: '#7dd3fc', fontSize: 11 }}>⭐ NORTH STAR METRIC</div>
              <p style={{ color: '#e0f2fe', fontWeight: 600, fontSize: 14, marginTop: 4 }}>{result.north_star}</p>
            </div>
          )}
          {result.objectives?.map((obj: any, i: number) => (
            <div key={i} style={{ background: '#1e293b', borderRadius: 8, marginBottom: 10, overflow: 'hidden' }}>
              <div onClick={() => setExpanded(expanded === i ? null : i)}
                style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: '#0891b2', fontSize: 11, fontWeight: 700 }}>O{obj.id} · {obj.owner}</span>
                  <p style={{ color: '#e2e8f0', fontWeight: 600, margin: '2px 0 0' }}>{obj.objective}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: confColor(obj.confidence), fontSize: 12, fontWeight: 700 }}>{obj.confidence}%</div>
                  <div style={{ color: '#64748b', fontSize: 10 }}>confidence</div>
                </div>
              </div>
              {expanded === i && (
                <div style={{ padding: '0 14px 14px', borderTop: '1px solid #334155' }}>
                  {obj.key_results?.map((kr: any) => (
                    <div key={kr.id} style={{ marginTop: 10, background: '#0f172a', borderRadius: 6, padding: 10, borderLeft: '3px solid #0891b2' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: '#38bdf8', fontSize: 11, fontWeight: 600 }}>KR {kr.id}</span>
                        <span style={{ color: '#64748b', fontSize: 11 }}>{kr.metric}</span>
                      </div>
                      <p style={{ color: '#e2e8f0', fontSize: 13 }}>{kr.kr}</p>
                      <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 11 }}>
                        <span style={{ color: '#94a3b8' }}>From: <strong style={{ color: '#f87171' }}>{kr.baseline}</strong></span>
                        <span style={{ color: '#94a3b8' }}>→ To: <strong style={{ color: '#22c55e' }}>{kr.target}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {result.initiatives && (
            <div style={{ background: '#1e293b', borderRadius: 6, padding: 10, marginBottom: 8 }}>
              <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>⚡ Key Initiatives</div>
              {result.initiatives.map((ini: string, i: number) => <p key={i} style={{ color: '#e2e8f0', fontSize: 12, margin: '2px 0' }}>• {ini}</p>)}
            </div>
          )}
          {result.anti_goals && (
            <div style={{ background: '#1e293b', borderRadius: 6, padding: 10 }}>
              <div style={{ color: '#f59e0b', fontSize: 12, marginBottom: 6 }}>🚫 Anti-Goals (what we won't do)</div>
              {result.anti_goals.map((ag: string, i: number) => <p key={i} style={{ color: '#94a3b8', fontSize: 12, margin: '2px 0' }}>• {ag}</p>)}
              {result.check_in_cadence && <p style={{ color: '#64748b', fontSize: 11, marginTop: 8 }}>📅 Check-in: {result.check_in_cadence}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v8.49 Pitch Deck Builder ---
function PitchDeckPanel({ api }: { api: Api }) {
  const [form, setForm] = useState({ startup: '', problem: '', solution: '', market: '', traction: '', ask: '' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);

  const build = async () => {
    if (!form.startup || !form.problem || !form.solution) return;
    setLoading(true); setErr(''); setResult(null); setActiveSlide(0);
    try {
      const r = await fetch(`${api.base}/api/pitch-deck`, {
        method: 'POST', headers: { ...api.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Error');
      setResult(d);
    } catch(e: any) { setErr(e.message); }
    setLoading(false);
  };

  const inp = (k: string) => ({ value: (form as any)[k], onChange: (e: any) => setForm(f => ({...f, [k]: e.target.value})),
    style: { width: '100%', background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '6px 10px', fontSize: 13, boxSizing: 'border-box' as any } });

  return (
    <div>
      <h3 style={{ color: '#e2e8f0', marginBottom: 8 }}>🚀 Pitch Deck Builder</h3>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>Generate a structured investor pitch deck outline.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div><label style={{ color: '#94a3b8', fontSize: 12 }}>Startup Name *</label><input {...inp('startup')} placeholder="Acme AI" /></div>
        <div><label style={{ color: '#94a3b8', fontSize: 12 }}>Market / TAM</label><input {...inp('market')} placeholder="$10B SaaS market" /></div>
        <div><label style={{ color: '#94a3b8', fontSize: 12 }}>Problem *</label><input {...inp('problem')} placeholder="The problem you solve" /></div>
        <div><label style={{ color: '#94a3b8', fontSize: 12 }}>Traction</label><input {...inp('traction')} placeholder="100 users, $5K MRR" /></div>
        <div><label style={{ color: '#94a3b8', fontSize: 12 }}>Solution *</label><input {...inp('solution')} placeholder="Your unique solution" /></div>
        <div><label style={{ color: '#94a3b8', fontSize: 12 }}>The Ask</label><input {...inp('ask')} placeholder="$500K pre-seed" /></div>
      </div>
      <button onClick={build} disabled={loading || !form.startup || !form.problem || !form.solution}
        style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', cursor: 'pointer', fontWeight: 600 }}>
        {loading ? 'Building...' : 'Build Pitch Deck'}
      </button>
      {err && <p style={{ color: '#f87171', marginTop: 8 }}>{err}</p>}
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ background: '#1e1b4b', border: '1px solid #4338ca', borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <div style={{ color: '#a5b4fc', fontSize: 11, marginBottom: 4 }}>INVESTOR HOOK</div>
            <p style={{ color: '#e0e7ff', fontStyle: 'italic', fontSize: 14 }}>"{result.investor_hook}"</p>
            <div style={{ color: '#818cf8', fontSize: 12, marginTop: 6 }}>✨ {result.tagline}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {result.slides?.map((s: any, i: number) => (
              <button key={i} onClick={() => setActiveSlide(i)}
                style={{ background: activeSlide === i ? '#6366f1' : '#1e293b', color: activeSlide === i ? '#fff' : '#94a3b8', border: '1px solid #334155', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
                {s.slide}. {s.title}
              </button>
            ))}
          </div>
          {result.slides?.[activeSlide] && (
            <div style={{ background: '#1e293b', borderRadius: 8, padding: 14, marginBottom: 12 }}>
              <h4 style={{ color: '#6366f1', marginBottom: 8 }}>Slide {result.slides[activeSlide].slide}: {result.slides[activeSlide].title}</h4>
              <p style={{ color: '#e2e8f0', fontSize: 13, marginBottom: 8 }}>{result.slides[activeSlide].content}</p>
              <div style={{ background: '#0f172a', borderRadius: 4, padding: 8, borderLeft: '2px solid #6366f1' }}>
                <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>SPEAKER NOTES</div>
                <p style={{ color: '#94a3b8', fontSize: 12 }}>{result.slides[activeSlide].speaker_notes}</p>
              </div>
            </div>
          )}
          {result.key_metrics && (
            <div style={{ background: '#1e293b', borderRadius: 6, padding: 10, marginBottom: 8 }}>
              <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>📊 Key Metrics to Highlight</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {result.key_metrics.map((m: string, i: number) => <span key={i} style={{ background: '#0f172a', color: '#38bdf8', borderRadius: 4, padding: '2px 8px', fontSize: 12 }}>{m}</span>)}
              </div>
            </div>
          )}
          {result.red_flags_to_avoid && (
            <div style={{ background: '#2d1b1b', border: '1px solid #7f1d1d', borderRadius: 6, padding: 10 }}>
              <div style={{ color: '#fca5a5', fontSize: 12, marginBottom: 6 }}>🚫 Red Flags to Avoid</div>
              {result.red_flags_to_avoid.map((f: string, i: number) => <p key={i} style={{ color: '#f87171', fontSize: 12, margin: '2px 0' }}>• {f}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v8.48 Risk Analyzer ---
function RiskAnalyzerPanel({ api }: { api: Api }) {
  const [plan, setPlan] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const analyze = async () => {
    if (!plan.trim()) return;
    setLoading(true); setErr(''); setResult(null);
    try {
      const r = await fetch(`${api.base}/api/risk-analyze`, {
        method: 'POST', headers: { ...api.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Error');
      setResult(d);
    } catch(e: any) { setErr(e.message); }
    setLoading(false);
  };

  const levelColor: Record<string, string> = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444', critical: '#7c3aed' };
  const impactColor: Record<string, string> = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };

  return (
    <div>
      <h3 style={{ color: '#e2e8f0', marginBottom: 8 }}>⚠️ Risk Analyzer</h3>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>Identify and score risks for any plan, project, or initiative.</p>
      <textarea value={plan} onChange={e => setPlan(e.target.value)}
        placeholder="Describe your plan or project..." rows={4}
        style={{ width: '100%', background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: 10, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
      <button onClick={analyze} disabled={loading || !plan.trim()}
        style={{ marginTop: 8, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', cursor: 'pointer', fontWeight: 600 }}>
        {loading ? 'Analyzing...' : 'Analyze Risks'}
      </button>
      {err && <p style={{ color: '#f87171', marginTop: 8 }}>{err}</p>}
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ background: '#1e293b', borderRadius: 8, padding: '10px 16px', border: `2px solid ${levelColor[result.risk_level] || '#94a3b8'}` }}>
              <div style={{ color: '#94a3b8', fontSize: 11 }}>RISK LEVEL</div>
              <div style={{ color: levelColor[result.risk_level] || '#e2e8f0', fontWeight: 700, fontSize: 18, textTransform: 'uppercase' }}>{result.risk_level}</div>
            </div>
            <div style={{ background: '#1e293b', borderRadius: 8, padding: '10px 16px' }}>
              <div style={{ color: '#94a3b8', fontSize: 11 }}>RISK SCORE</div>
              <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 18 }}>{result.risk_score}/100</div>
            </div>
          </div>
          <p style={{ color: '#cbd5e1', fontSize: 13, marginBottom: 12, background: '#1e293b', padding: 10, borderRadius: 6 }}>{result.summary}</p>
          {result.top_risk && <div style={{ background: '#2d1b1b', border: '1px solid #7f1d1d', borderRadius: 6, padding: 10, marginBottom: 12, color: '#fca5a5', fontSize: 13 }}>🔴 <strong>Top Risk:</strong> {result.top_risk}</div>}
          {result.risks && result.risks.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <h4 style={{ color: '#e2e8f0', marginBottom: 8 }}>Risk Register</h4>
              {result.risks.map((r: any) => (
                <div key={r.id} style={{ background: '#1e293b', borderRadius: 6, padding: 10, marginBottom: 8, borderLeft: `3px solid ${impactColor[r.impact] || '#94a3b8'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{r.title}</span>
                    <span style={{ color: '#94a3b8', fontSize: 11 }}>{r.category} · Score: {r.severity_score}/10</span>
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: 12, margin: '2px 0' }}>{r.description}</p>
                  <div style={{ display: 'flex', gap: 8, fontSize: 11, marginTop: 4 }}>
                    <span style={{ color: impactColor[r.probability] }}>Prob: {r.probability}</span>
                    <span style={{ color: impactColor[r.impact] }}>Impact: {r.impact}</span>
                  </div>
                  <p style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>🛡️ {r.mitigation}</p>
                </div>
              ))}
            </div>
          )}
          {result.quick_wins && result.quick_wins.length > 0 && (
            <div style={{ background: '#1e2d1e', border: '1px solid #166534', borderRadius: 6, padding: 10, marginBottom: 12 }}>
              <h4 style={{ color: '#86efac', marginBottom: 6, fontSize: 13 }}>⚡ Quick Wins</h4>
              {result.quick_wins.map((w: string, i: number) => <p key={i} style={{ color: '#a7f3d0', fontSize: 12, margin: '2px 0' }}>• {w}</p>)}
            </div>
          )}
          {result.contingency && (
            <div style={{ background: '#1e293b', borderRadius: 6, padding: 10, borderLeft: '3px solid #6366f1' }}>
              <h4 style={{ color: '#a5b4fc', marginBottom: 4, fontSize: 13 }}>🆘 Contingency Plan</h4>
              <p style={{ color: '#94a3b8', fontSize: 12 }}>{result.contingency}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v8.47 Decision Matrix ---
function DecisionMatrixPanel({ api }: { api: Api }) {
  const [decision, setDecision] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [criteria, setCriteria] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState('');

  const addOption = () => setOptions([...options, '']);
  const updateOption = (i: number, v: string) => { const o = [...options]; o[i] = v; setOptions(o); };
  const removeOption = (i: number) => { if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i)); };

  const run = async () => {
    const validOpts = options.filter(o => o.trim());
    if (!decision.trim() || validOpts.length < 2) return;
    setRunning(true); setErr(''); setResult(null);
    try {
      const criteriaList = criteria.split(',').map(c => c.trim()).filter(Boolean);
      const d = await api('/api/decision-matrix', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision: decision.trim(), options: validOpts, criteria: criteriaList.length ? criteriaList : undefined }) });
      if (d.success) setResult(d); else setErr(d.error || 'Failed');
    } catch(e: any) { setErr(e.message); }
    setRunning(false);
  };

  const scoreColor = (s: number) => s >= 8 ? '#4ade80' : s >= 6 ? '#fbbf24' : '#f87171';
  const confColor: Record<string, string> = { high: '#4ade80', medium: '#fbbf24', low: '#f87171' };

  return (
    <div>
      <h3 style={{ ...S.h, fontSize: 15, marginBottom: 8 }}>⚖️ Decision Matrix</h3>
      <p style={{ ...S.sub, marginBottom: 12 }}>Describe your decision, list options, and get a scored matrix with a clear recommendation.</p>
      <input value={decision} onChange={e => setDecision(e.target.value)} placeholder="What decision are you making? e.g. 'Which cloud provider should we use?'" style={{ ...S.input, width: '100%', marginBottom: 10 }} />
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-text3,#888)', marginBottom: 6 }}>Options (min 2):</div>
        {options.map((opt, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
            <input value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Option ${i+1}`} style={{ ...S.input, flex: 1 }} />
            {options.length > 2 && <button onClick={() => removeOption(i)} style={{ ...S.btn, fontSize: 11, padding: '4px 8px', background: 'transparent', border: '1px solid var(--fg-border,#2a2a3e)', color: '#f87171' }}>✕</button>}
          </div>
        ))}
        <button onClick={addOption} style={{ ...S.btn, fontSize: 11, background: 'transparent', border: '1px solid var(--fg-border,#2a2a3e)', color: 'var(--fg-text3,#888)' }}>+ Add Option</button>
      </div>
      <input value={criteria} onChange={e => setCriteria(e.target.value)} placeholder="Criteria (optional, comma-separated): e.g. Cost, Speed, Risk, Scalability" style={{ ...S.input, width: '100%', marginBottom: 10 }} />
      <button onClick={run} disabled={running || !decision.trim() || options.filter(o=>o.trim()).length < 2} style={{ ...S.btn, ...S.primaryBtn, marginBottom: 16 }}>
        {running ? '⏳ Analyzing…' : '⚖️ Analyze Decision'}
      </button>
      {err && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 10 }}>{err}</div>}
      {result && (
        <div>
          <div style={{ borderRadius: 10, border: '1px solid rgba(108,99,255,0.3)', background: 'rgba(108,99,255,0.06)', padding: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--fg-text3,#888)', marginBottom: 2 }}>RECOMMENDED</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--fg-accent,#6c63ff)' }}>{result.winner}</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: confColor[result.confidence] || '#888', border: `1px solid ${confColor[result.confidence] || '#888'}40`, borderRadius: 6, padding: '2px 8px' }}>{result.confidence} confidence</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-text2,#ccc)', lineHeight: 1.6, marginBottom: result.key_tradeoff ? 8 : 0 }}>{result.recommendation}</div>
            {result.key_tradeoff && <div style={{ fontSize: 11, color: 'var(--fg-text3,#888)', fontStyle: 'italic' }}>⚖️ Key tradeoff: {result.key_tradeoff}</div>}
          </div>
          <div style={{ overflowX: 'auto', marginBottom: 14 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--fg-text3,#888)', borderBottom: '1px solid var(--fg-border,#2a2a3e)' }}>Criterion</th>
                  {result.matrix?.map((m: any) => (
                    <th key={m.option} style={{ padding: '6px 10px', color: m.option === result.winner ? 'var(--fg-accent,#6c63ff)' : 'var(--fg-text2,#ccc)', borderBottom: '1px solid var(--fg-border,#2a2a3e)', textAlign: 'center' }}>{m.option}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.criteria?.map((crit: string) => (
                  <tr key={crit}>
                    <td style={{ padding: '5px 10px', color: 'var(--fg-text3,#888)', borderBottom: '1px solid var(--fg-border,#2a2a3e)20' }}>{crit}</td>
                    {result.matrix?.map((m: any) => {
                      const score = m.scores?.[crit] ?? '—';
                      return <td key={m.option} style={{ padding: '5px 10px', textAlign: 'center', borderBottom: '1px solid var(--fg-border,#2a2a3e)20', fontWeight: 700, color: typeof score === 'number' ? scoreColor(score) : '#888' }}>{score}</td>;
                    })}
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: '6px 10px', fontWeight: 700, color: 'var(--fg-text,#f0f1f5)' }}>Total</td>
                  {result.matrix?.map((m: any) => (
                    <td key={m.option} style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 800, fontSize: 13, color: m.option === result.winner ? 'var(--fg-accent,#6c63ff)' : scoreColor(m.total/result.criteria?.length||1) }}>{m.total}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          {result.when_to_pick_alternative && (
            <div style={{ borderRadius: 8, border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.04)', padding: 10, fontSize: 11, color: 'var(--fg-text2,#ccc)' }}>
              <span style={{ fontWeight: 700, color: '#fbbf24' }}>💡 Choose differently if: </span>{result.when_to_pick_alternative}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v8.46 Writing Coach ---
function WritingCoachPanel({ api }: { api: Api }) {
  const [text, setText] = useState('');
  const [goal, setGoal] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState('');

  const run = async () => {
    if (!text.trim() || text.trim().length < 30) return;
    setRunning(true); setErr(''); setResult(null);
    try {
      const d = await api('/api/writing-coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text.trim(), goal: goal.trim() }) });
      if (d.success) setResult(d); else setErr(d.error || 'Failed');
    } catch(e: any) { setErr(e.message); }
    setRunning(false);
  };

  const scoreColor = (s: number) => s >= 8 ? '#4ade80' : s >= 6 ? '#fbbf24' : '#f87171';
  const sevColor: Record<string, string> = { high: '#f87171', medium: '#fbbf24', low: '#888' };

  return (
    <div>
      <h3 style={{ ...S.h, fontSize: 15, marginBottom: 8 }}>✍️ Writing Coach</h3>
      <p style={{ ...S.sub, marginBottom: 12 }}>Paste your writing for expert feedback on clarity, structure, voice, and conciseness.</p>
      <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="Writing goal (optional): e.g. 'persuasive blog post', 'formal email'" style={{ ...S.input, width: '100%', marginBottom: 8 }} />
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Paste your writing here…" rows={5}
        style={{ ...S.input, width: '100%', fontFamily: 'inherit', resize: 'vertical', marginBottom: 10 }} />
      <button onClick={run} disabled={running || text.trim().length < 30} style={{ ...S.btn, ...S.primaryBtn, marginBottom: 16 }}>
        {running ? '⏳ Analyzing…' : '✍️ Coach My Writing'}
      </button>
      {err && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 10 }}>{err}</div>}
      {result && (
        <div>
          <div style={{ borderRadius: 10, border: '1px solid var(--fg-border,#2a2a3e)', background: 'var(--fg-bg2,#1a1a2e)', padding: 14, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: scoreColor(result.overall_score) }}>{result.grade}</div>
              <div style={{ fontSize: 10, color: 'var(--fg-text3,#888)' }}>{result.wordCount} words analyzed</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {result.scores && Object.entries(result.scores).map(([k, v]: any) => (
                <div key={k} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: scoreColor(v) }}>{v}</div>
                  <div style={{ fontSize: 9, color: 'var(--fg-text3,#888)', textTransform: 'capitalize' }}>{k}</div>
                </div>
              ))}
            </div>
          </div>
          {result.praise?.length > 0 && (
            <div style={{ borderRadius: 8, border: '1px solid rgba(74,222,128,0.3)', background: 'rgba(74,222,128,0.04)', padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', marginBottom: 6 }}>👏 What's Working</div>
              {result.praise.map((p: string, i: number) => <div key={i} style={{ fontSize: 11, color: 'var(--fg-text2,#ccc)', marginBottom: 3 }}>• {p}</div>)}
            </div>
          )}
          {result.issues?.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-text2,#ccc)', marginBottom: 8 }}>🔧 Issues to Fix</div>
              {result.issues.map((iss: any, i: number) => (
                <div key={i} style={{ borderRadius: 8, border: `1px solid ${sevColor[iss.severity]}40`, background: `${sevColor[iss.severity]}08`, padding: 10, marginBottom: 6 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: sevColor[iss.severity], textTransform: 'uppercase', border: `1px solid ${sevColor[iss.severity]}60`, borderRadius: 4, padding: '1px 5px' }}>{iss.severity}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-text,#f0f1f5)' }}>{iss.issue}</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-text3,#888)' }}>→ {iss.fix}</div>
                </div>
              ))}
            </div>
          )}
          {result.rewritten_opening && (
            <div style={{ borderRadius: 8, border: '1px solid rgba(108,99,255,0.3)', background: 'rgba(108,99,255,0.05)', padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-accent,#6c63ff)', marginBottom: 6 }}>✨ Rewritten Opening</div>
              <div style={{ fontSize: 12, color: 'var(--fg-text2,#ccc)', lineHeight: 1.6, fontStyle: 'italic' }}>{result.rewritten_opening}</div>
            </div>
          )}
          {result.next_level && (
            <div style={{ borderRadius: 8, border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.04)', padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>🎯 Next Level Tip</div>
              <div style={{ fontSize: 12, color: 'var(--fg-text2,#ccc)' }}>{result.next_level}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v8.45 Idea Validator ---
function IdeaValidatorPanel({ api }: { api: Api }) {
  const [idea, setIdea] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState('');

  const run = async () => {
    if (!idea.trim()) return;
    setRunning(true); setErr(''); setResult(null);
    try {
      const d = await api('/api/idea-validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idea: idea.trim() }) });
      if (d.success) setResult(d); else setErr(d.error || 'Failed');
    } catch(e: any) { setErr(e.message); }
    setRunning(false);
  };

  const verdictColor: Record<string, string> = { 'Go for it': '#4ade80', 'Needs work': '#fbbf24', 'Pivot': '#fb923c', 'Red flag': '#f87171' };
  const scoreColor = (s: number) => s >= 8 ? '#4ade80' : s >= 6 ? '#fbbf24' : '#f87171';

  return (
    <div>
      <h3 style={{ ...S.h, fontSize: 15, marginBottom: 8 }}>🚀 Idea Validator</h3>
      <p style={{ ...S.sub, marginBottom: 12 }}>Describe your startup or project idea — get scored across 6 dimensions with strengths, risks, and first steps.</p>
      <textarea value={idea} onChange={e => setIdea(e.target.value)} placeholder="e.g. An app that connects dog owners with local dog sitters using AI matching" rows={3}
        style={{ ...S.input, width: '100%', fontFamily: 'inherit', resize: 'vertical', marginBottom: 10 }} />
      <button onClick={run} disabled={running || !idea.trim()} style={{ ...S.btn, ...S.primaryBtn, marginBottom: 16 }}>
        {running ? '⏳ Validating…' : '🚀 Validate Idea'}
      </button>
      {err && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 10 }}>{err}</div>}
      {result && (
        <div>
          <div style={{ borderRadius: 10, border: `2px solid ${verdictColor[result.verdict] || '#6c63ff'}40`, background: `${verdictColor[result.verdict] || '#6c63ff'}08`, padding: 16, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: verdictColor[result.verdict] || '#6c63ff' }}>{result.verdict}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: scoreColor(result.overall_score) }}>{result.overall_score}/10</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-text2,#ccc)', lineHeight: 1.6 }}>{result.summary}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 8, marginBottom: 14 }}>
            {(result.dimensions || []).map((d: any) => (
              <div key={d.name} style={{ borderRadius: 8, border: '1px solid var(--fg-border,#2a2a3e)', background: 'var(--fg-bg2,#1a1a2e)', padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--fg-text2,#ccc)' }}>{d.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: scoreColor(d.score) }}>{d.score}</div>
                </div>
                <div style={{ height: 3, borderRadius: 2, background: 'var(--fg-border,#2a2a3e)', marginBottom: 6 }}>
                  <div style={{ height: '100%', borderRadius: 2, width: `${d.score*10}%`, background: scoreColor(d.score) }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--fg-text3,#888)', lineHeight: 1.4 }}>{d.rationale}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div style={{ borderRadius: 8, border: '1px solid rgba(74,222,128,0.3)', background: 'rgba(74,222,128,0.04)', padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>💪 Strengths</div>
              {(result.strengths || []).map((s: string, i: number) => <div key={i} style={{ fontSize: 11, color: 'var(--fg-text2,#ccc)', marginBottom: 4 }}>• {s}</div>)}
            </div>
            <div style={{ borderRadius: 8, border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.04)', padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', marginBottom: 8 }}>⚠️ Risks</div>
              {(result.risks || []).map((r: string, i: number) => <div key={i} style={{ fontSize: 11, color: 'var(--fg-text2,#ccc)', marginBottom: 4 }}>• {r}</div>)}
            </div>
            <div style={{ borderRadius: 8, border: '1px solid rgba(108,99,255,0.3)', background: 'rgba(108,99,255,0.05)', padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-accent,#6c63ff)', marginBottom: 8 }}>🎯 First Steps</div>
              {(result.first_steps || []).map((s: string, i: number) => <div key={i} style={{ fontSize: 11, color: 'var(--fg-text2,#ccc)', marginBottom: 4 }}>{i+1}. {s}</div>)}
            </div>
          </div>
          {result.pivots?.length > 0 && (
            <div style={{ borderRadius: 8, border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.04)', padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', marginBottom: 8 }}>🔄 Pivot Options</div>
              {result.pivots.map((p: string, i: number) => <div key={i} style={{ fontSize: 11, color: 'var(--fg-text2,#ccc)', marginBottom: 4 }}>• {p}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v8.44 Persona Chat ---
const PRESET_PERSONAS = [
  'Socrates, the ancient Greek philosopher',
  'Elon Musk, the tech entrepreneur',
  'Marie Curie, the pioneering scientist',
  'Gordon Ramsay, the fiery celebrity chef',
  'A Zen Buddhist monk',
  'A brutally honest career coach',
  'Warren Buffett, the legendary investor',
  'Shakespeare, the Elizabethan playwright',
];

function PersonaChatPanel({ api }: { api: Api }) {
  const [persona, setPersona] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user'|'assistant'; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const chatRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages]);

  const send = async () => {
    if (!input.trim() || !persona.trim() || loading) return;
    const newMessages = [...messages, { role: 'user' as const, content: input.trim() }];
    setMessages(newMessages); setInput(''); setLoading(true); setErr('');
    try {
      const d = await api('/api/persona-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ persona, messages: newMessages }) });
      if (d.success) setMessages([...newMessages, { role: 'assistant', content: d.reply }]);
      else setErr(d.error || 'Failed');
    } catch(e: any) { setErr(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ ...S.h, fontSize: 15, marginBottom: 8 }}>🎭 Persona Chat</h3>
      <div style={{ marginBottom: 10 }}>
        <input value={persona} onChange={e => { setPersona(e.target.value); setMessages([]); }} placeholder="Enter a persona (e.g. 'Steve Jobs')" style={{ ...S.input, width: '100%', marginBottom: 6 }} />
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {PRESET_PERSONAS.map(p => (
            <button key={p} onClick={() => { setPersona(p); setMessages([]); }} style={{ ...S.btn, fontSize: 10, padding: '3px 8px', background: persona === p ? 'var(--fg-accent,#6c63ff)' : 'var(--fg-bg2,#1a1a2e)', color: persona === p ? '#fff' : 'var(--fg-text3,#888)', border: '1px solid var(--fg-border,#2a2a3e)' }}>
              {p.split(',')[0]}
            </button>
          ))}
        </div>
      </div>
      <div ref={chatRef} style={{ flex: 1, minHeight: 200, maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10, padding: 4 }}>
        {messages.length === 0 && <div style={{ fontSize: 12, color: 'var(--fg-text3,#888)', textAlign: 'center', marginTop: 40 }}>Select a persona and start chatting…</div>}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '80%', borderRadius: 10, padding: '8px 12px', fontSize: 12, lineHeight: 1.6,
              background: m.role === 'user' ? 'var(--fg-accent,#6c63ff)' : 'var(--fg-bg2,#1a1a2e)',
              color: m.role === 'user' ? '#fff' : 'var(--fg-text2,#ccc)',
              border: m.role === 'assistant' ? '1px solid var(--fg-border,#2a2a3e)' : 'none' }}>
              {m.role === 'assistant' && <div style={{ fontSize: 10, color: 'var(--fg-accent,#6c63ff)', marginBottom: 4, fontWeight: 700 }}>🎭 {persona.split(',')[0]}</div>}
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div style={{ fontSize: 12, color: 'var(--fg-text3,#888)', fontStyle: 'italic' }}>🎭 {persona.split(',')[0]} is thinking…</div>}
      </div>
      {err && <div style={{ color: '#f87171', fontSize: 11, marginBottom: 6 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder={persona ? `Ask ${persona.split(',')[0]}…` : 'Select a persona first'} disabled={!persona.trim()} style={{ ...S.input, flex: 1 }} />
        <button onClick={send} disabled={!input.trim() || !persona.trim() || loading} style={{ ...S.btn, ...S.primaryBtn }}>Send</button>
        {messages.length > 0 && <button onClick={() => setMessages([])} style={{ ...S.btn, fontSize: 11, background: 'transparent', border: '1px solid var(--fg-border,#2a2a3e)', color: 'var(--fg-text3,#888)' }}>Clear</button>}
      </div>
    </div>
  );
}

// --- v8.43 Debate Simulator ---
function DebateSimulatorPanel({ api }: { api: Api }) {
  const [topic, setTopic] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState('');

  const run = async () => {
    if (!topic.trim()) return;
    setRunning(true); setErr(''); setResult(null);
    try {
      const d = await api('/api/debate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: topic.trim() }) });
      if (d.success) setResult(d); else setErr(d.error || 'Failed');
    } catch(e: any) { setErr(e.message); }
    setRunning(false);
  };

  const winnerColor = result?.verdict?.winner === 'pro' ? '#4ade80' : result?.verdict?.winner === 'con' ? '#f87171' : '#fbbf24';
  const winnerLabel = result?.verdict?.winner === 'pro' ? '✅ PRO wins' : result?.verdict?.winner === 'con' ? '❌ CON wins' : '🤝 Tie';

  return (
    <div>
      <h3 style={{ ...S.h, fontSize: 15, marginBottom: 8 }}>⚔️ Debate Simulator</h3>
      <p style={{ ...S.sub, marginBottom: 12 }}>Enter any topic — AI argues both sides simultaneously, then an impartial judge picks the winner.</p>
      <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()} placeholder="e.g. Remote work is better than office work" style={{ ...S.input, width: '100%', marginBottom: 10 }} />
      <button onClick={run} disabled={running || !topic.trim()} style={{ ...S.btn, ...S.primaryBtn, marginBottom: 16 }}>
        {running ? '⏳ Debating…' : '⚔️ Start Debate'}
      </button>
      {err && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 10 }}>{err}</div>}
      {result && (
        <div>
          {result.verdict && (
            <div style={{ borderRadius: 8, border: `1.5px solid ${winnerColor}40`, background: `${winnerColor}08`, padding: 14, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: winnerColor }}>{winnerLabel}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-text3,#888)' }}>{result.verdict.margin} victory · Pro {result.verdict.pro_score}/10 vs Con {result.verdict.con_score}/10</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--fg-text2,#ccc)', marginBottom: 6 }}>{result.verdict.verdict}</div>
              {result.verdict.key_insight && <div style={{ fontSize: 11, color: 'var(--fg-text3,#888)', fontStyle: 'italic' }}>💡 {result.verdict.key_insight}</div>}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ borderRadius: 8, border: '1.5px solid rgba(74,222,128,0.3)', background: 'rgba(74,222,128,0.04)', padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4ade80', marginBottom: 10 }}>✅ PRO — Arguments For</div>
              <div style={{ fontSize: 12, color: 'var(--fg-text2,#ccc)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{result.pro}</div>
            </div>
            <div style={{ borderRadius: 8, border: '1.5px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.04)', padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f87171', marginBottom: 10 }}>❌ CON — Arguments Against</div>
              <div style={{ fontSize: 12, color: 'var(--fg-text2,#ccc)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{result.con}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- v8.42 Knowledge Distiller ---
function KnowledgeDistillerPanel({ api }: { api: Api }) {
  const [text, setText] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState('');
  const [view, setView] = useState<'summary'|'insights'|'faq'|'flashcards'>('summary');

  const run = async () => {
    if (!text.trim() || text.trim().length < 50) return;
    setRunning(true); setErr(''); setResult(null);
    try {
      const d = await api('/api/knowledge-distill', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text.trim() }) });
      if (d.success) { setResult(d); setView('summary'); } else setErr(d.error || 'Failed');
    } catch(e: any) { setErr(e.message); }
    setRunning(false);
  };

  const views: { id: typeof view; label: string }[] = [
    { id: 'summary', label: '📋 Summary' },
    { id: 'insights', label: '💡 Insights' },
    { id: 'faq', label: '❓ FAQ' },
    { id: 'flashcards', label: '🃏 Flashcards' },
  ];

  return (
    <div>
      <h3 style={{ ...S.h, fontSize: 15, marginBottom: 8 }}>🧪 Knowledge Distiller</h3>
      <p style={{ ...S.sub, marginBottom: 12 }}>Paste any text — get a summary, key insights, FAQ, and study flashcards.</p>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Paste an article, document, notes, or any text to distill…" rows={5}
        style={{ ...S.input, width: '100%', fontFamily: 'inherit', resize: 'vertical', marginBottom: 10 }} />
      <button onClick={run} disabled={running || text.trim().length < 50} style={{ ...S.btn, ...S.primaryBtn, marginBottom: 16 }}>
        {running ? '⏳ Distilling…' : '🧪 Distill Knowledge'}
      </button>
      {err && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 10 }}>{err}</div>}
      {result && (
        <div>
          <div style={{ fontSize: 10, color: 'var(--fg-text3,#888)', marginBottom: 10 }}>{result.wordCount} words processed</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {views.map(v => (
              <button key={v.id} onClick={() => setView(v.id)} style={{ ...S.btn, background: view === v.id ? 'var(--fg-accent,#6c63ff)' : 'var(--fg-bg2,#1a1a2e)', color: view === v.id ? '#fff' : 'var(--fg-text2,#ccc)', border: `1px solid ${view === v.id ? 'transparent' : 'var(--fg-border,#2a2a3e)'}`, fontSize: 11 }}>
                {v.label}
              </button>
            ))}
          </div>
          {view === 'summary' && (
            <div style={{ borderRadius: 8, border: '1px solid var(--fg-border,#2a2a3e)', background: 'var(--fg-bg2,#1a1a2e)', padding: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--fg-text,#f0f1f5)', lineHeight: 1.7 }}>{result.summary}</div>
            </div>
          )}
          {view === 'insights' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(result.insights || []).map((ins: string, i: number) => (
                <div key={i} style={{ borderRadius: 8, border: '1px solid var(--fg-border,#2a2a3e)', background: 'var(--fg-bg2,#1a1a2e)', padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-accent,#6c63ff)', minWidth: 20 }}>{i+1}.</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-text2,#ccc)', lineHeight: 1.6 }}>{ins}</div>
                </div>
              ))}
            </div>
          )}
          {view === 'faq' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(result.faq || []).map((item: any, i: number) => (
                <div key={i} style={{ borderRadius: 8, border: '1px solid var(--fg-border,#2a2a3e)', background: 'var(--fg-bg2,#1a1a2e)', padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)', marginBottom: 6 }}>Q: {item.q}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-text2,#ccc)', lineHeight: 1.6 }}>A: {item.a}</div>
                </div>
              ))}
            </div>
          )}
          {view === 'flashcards' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
              {(result.flashcards || []).map((card: any, i: number) => (
                <div key={i} style={{ borderRadius: 8, border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.05)', padding: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', marginBottom: 8, borderBottom: '1px solid rgba(99,102,241,0.2)', paddingBottom: 6 }}>{card.front}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-text2,#ccc)', lineHeight: 1.6 }}>{card.back}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- v8.41 Prompt Optimizer ---
function PromptOptimizerPanel({ api }: { api: Api }) {
  const [prompt, setPrompt] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState('');

  const run = async () => {
    if (!prompt.trim()) return;
    setRunning(true); setErr(''); setResult(null);
    try {
      const d = await api('/api/prompt-optimizer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt.trim() }) });
      if (d.success) setResult(d); else setErr(d.error || 'Failed');
    } catch(e: any) { setErr(e.message); }
    setRunning(false);
  };

  return (
    <div>
      <h3 style={{ ...S.h, fontSize: 15, marginBottom: 8 }}>✨ Prompt Optimizer</h3>
      <p style={{ ...S.sub, marginBottom: 12 }}>Paste any prompt — AI will rewrite it to be clearer and more effective, then compare outputs side by side.</p>
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Enter your prompt to optimize…" rows={4}
        style={{ ...S.input, width: '100%', fontFamily: 'inherit', resize: 'vertical', marginBottom: 10 }} />
      <button onClick={run} disabled={running || !prompt.trim()} style={{ ...S.btn, ...S.primaryBtn, marginBottom: 16 }}>
        {running ? '⏳ Optimizing…' : '✨ Optimize Prompt'}
      </button>
      {err && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 10 }}>{err}</div>}
      {result && (
        <div>
          {result.optimized?.reasoning && (
            <div style={{ borderRadius: 8, border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.06)', padding: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', marginBottom: 4 }}>🧠 Optimization Reasoning</div>
              <div style={{ fontSize: 11, color: 'var(--fg-text2,#ccc)' }}>{result.optimized.reasoning}</div>
              {result.optimized.improvements?.length > 0 && (
                <ul style={{ margin: '8px 0 0', paddingLeft: 16 }}>
                  {result.optimized.improvements.map((imp: string, i: number) => (
                    <li key={i} style={{ fontSize: 11, color: 'var(--fg-text2,#ccc)', marginBottom: 2 }}>{imp}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ borderRadius: 8, border: '1px solid var(--fg-border,#2a2a3e)', background: 'var(--fg-bg2,#1a1a2e)', padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-text3,#888)', marginBottom: 6 }}>📝 Original Prompt</div>
              <div style={{ fontSize: 11, color: 'var(--fg-text3,#888)', fontStyle: 'italic', marginBottom: 8, padding: '6px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 4 }}>{result.original.prompt}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-text2,#ccc)', marginBottom: 4 }}>Output:</div>
              <div style={{ fontSize: 11, color: 'var(--fg-text2,#ccc)', lineHeight: 1.6, maxHeight: 200, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{result.original.output}</div>
              <div style={{ fontSize: 9, color: 'var(--fg-text3,#888)', marginTop: 6 }}>{result.original.latencyMs}ms</div>
            </div>
            <div style={{ borderRadius: 8, border: '1.5px solid rgba(139,92,246,0.4)', background: 'rgba(139,92,246,0.04)', padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', marginBottom: 6 }}>✨ Optimized Prompt</div>
              <div style={{ fontSize: 11, color: '#c4b5fd', fontStyle: 'italic', marginBottom: 8, padding: '6px 8px', background: 'rgba(139,92,246,0.1)', borderRadius: 4 }}>{result.optimized.prompt}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-text2,#ccc)', marginBottom: 4 }}>Output:</div>
              <div style={{ fontSize: 11, color: 'var(--fg-text2,#ccc)', lineHeight: 1.6, maxHeight: 200, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{result.optimized.output}</div>
              <div style={{ fontSize: 9, color: 'var(--fg-text3,#888)', marginTop: 6 }}>{result.optimized.latencyMs}ms</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- v8.40 Agent Benchmark ---
function AgentBenchmarkPanel({ api }: { api: Api }) {
  const [goal, setGoal] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState('');

  const run = async () => {
    if (!goal.trim()) return;
    setRunning(true); setErr(''); setResult(null);
    try {
      const d = await api('/api/agent-benchmark', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal: goal.trim() }) });
      if (d.success) setResult(d); else setErr(d.error || 'Failed');
    } catch(e: any) { setErr(e.message); }
    setRunning(false);
  };

  const winnerIdx = result?.winner?.winner_index ? result.winner.winner_index - 1 : -1;

  return (
    <div>
      <h3 style={{ ...S.h, fontSize: 15, marginBottom: 8 }}>🏆 Agent Benchmark</h3>
      <p style={{ ...S.sub, marginBottom: 12 }}>Run a goal through 4 different instruction strategies and see which wins.</p>
      <textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder="Enter your goal or prompt to benchmark…" rows={3}
        style={{ ...S.input, width: '100%', fontFamily: 'inherit', resize: 'vertical', marginBottom: 10 }} />
      <button onClick={run} disabled={running || !goal.trim()} style={{ ...S.btn, ...S.primaryBtn, marginBottom: 16 }}>
        {running ? '⏳ Running benchmark…' : '▶ Run Benchmark'}
      </button>
      {err && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 10 }}>{err}</div>}
      {result && (
        <div>
          {result.winner && (
            <div style={{ borderRadius: 8, border: '1px solid rgba(255,193,7,0.4)', background: 'rgba(255,193,7,0.06)', padding: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>🥇 Winner: Strategy {result.winner.winner_index}</div>
              <div style={{ fontSize: 11, color: 'var(--fg-text3,#888)' }}>{result.winner.winner_reason}</div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 10 }}>
            {result.results.map((r: any, i: number) => {
              const isWinner = i === winnerIdx;
              const rank = result.winner?.rankings?.find((x: any) => x.index === i+1);
              return (
                <div key={i} style={{ borderRadius: 8, border: `1.5px solid ${isWinner ? 'rgba(255,193,7,0.5)' : 'var(--fg-border,#2a2a3e)'}`, background: isWinner ? 'rgba(255,193,7,0.04)' : 'var(--fg-bg2,#1a1a2e)', padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: isWinner ? '#fbbf24' : 'var(--fg-text,#f0f1f5)' }}>
                      {isWinner ? '🥇 ' : `#${rank?.rank || i+1} `}Strategy {i+1}
                    </div>
                    {rank && <div style={{ fontSize: 10, color: '#4ade80', fontWeight: 600 }}>{rank.score}/10</div>}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--fg-orange,#ff1f35)', marginBottom: 6, fontStyle: 'italic' }}>"{r.strategy}"</div>
                  {r.error ? (
                    <div style={{ fontSize: 11, color: '#f87171' }}>Error: {r.error}</div>
                  ) : (
                    <div style={{ fontSize: 11, color: 'var(--fg-text2,#ccc)', lineHeight: 1.6, maxHeight: 160, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{r.output}</div>
                  )}
                  <div style={{ fontSize: 9, color: 'var(--fg-text3,#888)', marginTop: 6 }}>{r.latencyMs}ms · {r.tokens} tok</div>
                  {rank?.reasoning && <div style={{ fontSize: 10, color: 'var(--fg-text3,#888)', marginTop: 4, borderTop: '1px solid var(--fg-border,#2a2a3e)', paddingTop: 4 }}>{rank.reasoning}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// --- v8.39 Goal Milestone Tracker ---
function GoalMilestoneTracker({ api }: { api: Api }) {
  const [goals, setGoals] = useState<any[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newValue, setNewValue] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => { loadGoals(); }, []);

  async function loadGoals() {
    try { const d = await api('/api/agent-goals'); if (d.success) setGoals(d.data || []); } catch {}
  }

  async function selectGoal(g: any) {
    setSelectedGoal(g);
    try { const d = await api(`/api/agent-goals/${g.id}/milestones`); if (d.success) setMilestones(d.data); } catch {}
  }

  async function addMilestone() {
    if (!newTitle.trim() || !selectedGoal) return;
    setAdding(true);
    try {
      await api(`/api/agent-goals/${selectedGoal.id}/milestones`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTitle.trim(), target_value: newValue ? parseFloat(newValue) : undefined }) });
      setNewTitle(''); setNewValue('');
      selectGoal(selectedGoal);
    } catch {}
    setAdding(false);
  }

  async function complete(mid: number) {
    try { await api(`/api/agent-goals/milestones/${mid}/complete`, { method: 'PATCH' }); selectGoal(selectedGoal); } catch {}
  }

  async function remove(mid: number) {
    try { await api(`/api/agent-goals/milestones/${mid}`, { method: 'DELETE' }); selectGoal(selectedGoal); } catch {}
  }

  const done = milestones.filter(m => m.completed).length;
  const pct = milestones.length > 0 ? Math.round((done / milestones.length) * 100) : 0;

  return (
    <div>
      <h3 style={{ ...S.h, fontSize: 15, marginBottom: 12 }}>≡ƒÄ» Goal Milestones</h3>
      {!selectedGoal ? (
        <div>
          <p style={{ ...S.sub, marginBottom: 10 }}>Select a goal to manage its milestones:</p>
          {goals.length === 0 && <p style={S.sub}>No goals yet.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {goals.filter((g: any) => g.status === 'active').map(g => (
              <button key={g.id} onClick={() => selectGoal(g)} style={{ ...S.btn, ...S.ghostBtn, textAlign: 'left', padding: '10px 14px' }}>
                <strong>{g.title}</strong> <span style={{ ...S.sub, fontSize: 11 }}>┬╖ {g.metric}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <button onClick={() => setSelectedGoal(null)} style={{ ...S.btn, ...S.ghostBtn, padding: '4px 10px', fontSize: 12 }}>ΓåÉ Back</button>
            <span style={{ fontWeight: 700 }}>{selectedGoal.title}</span>
          </div>
          {milestones.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={S.sub}>{done}/{milestones.length} complete</span>
                <span style={{ color: '#4ade80' }}>{pct}%</span>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 4, height: 8 }}>
                <div style={{ background: '#4ade80', width: `${pct}%`, height: '100%', borderRadius: 4, transition: 'width 0.3s' }} />
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {milestones.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: m.completed ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${m.completed ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, padding: '8px 12px' }}>
                <button onClick={() => !m.completed && complete(m.id)} style={{ background: 'none', border: `2px solid ${m.completed ? '#4ade80' : 'rgba(255,255,255,0.3)'}`, borderRadius: '50%', width: 20, height: 20, cursor: m.completed ? 'default' : 'pointer', color: '#4ade80', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{m.completed ? 'Γ£ô' : ''}</button>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, textDecoration: m.completed ? 'line-through' : 'none', color: m.completed ? '#94a3b8' : '#e2e8f0' }}>{m.title}</span>
                  {m.target_value != null && <span style={{ ...S.sub, fontSize: 11, marginLeft: 8 }}>@ {m.target_value}</span>}
                  {m.completed_at && <span style={{ ...S.sub, fontSize: 10, marginLeft: 8 }}>Γ£ô {m.completed_at.slice(0, 10)}</span>}
                </div>
                <button onClick={() => remove(m.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14, padding: 0 }}>Γ£ò</button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Milestone title" style={{ ...S.input, flex: 2, padding: '6px 10px', fontSize: 12 }} onKeyDown={e => e.key === 'Enter' && addMilestone()} />
            <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Value (opt)" type="number" style={{ ...S.input, flex: 1, padding: '6px 10px', fontSize: 12 }} />
            <button onClick={addMilestone} disabled={adding || !newTitle.trim()} style={{ ...S.btn, opacity: adding ? 0.5 : 1 }}>+ Add</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ΓöÇΓöÇΓöÇ v8.38 Agent Digest Panel ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function AgentDigestPanel({ api }: { api: Api }) {
  const [days, setDays] = useState(1);
  const [format, setFormat] = useState<'email'|'slack'>('email');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true); setResult(null);
    try {
      const d = await api('/api/agent-digest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ days, format }) });
      if (d.success) setResult(d);
    } catch {}
    setLoading(false);
  }

  function copy() {
    if (result?.narrative) { navigator.clipboard.writeText(result.narrative); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  }

  return (
    <div>
      <h3 style={{ ...S.h, fontSize: 15, marginBottom: 12 }}>≡ƒô¿ Agent Digest</h3>
      <p style={{ ...S.sub, marginBottom: 14 }}>Generate a copy-ready summary of your agent activity.</p>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
        <label style={{ ...S.sub, fontSize: 12 }}>Period:</label>
        {[1, 7, 30].map(d => (
          <button key={d} onClick={() => setDays(d)} style={{ ...S.btn, ...(days === d ? {} : S.ghostBtn), padding: '4px 12px', fontSize: 12 }}>{d === 1 ? 'Today' : `${d}d`}</button>
        ))}
        <label style={{ ...S.sub, fontSize: 12, marginLeft: 8 }}>Format:</label>
        {(['email','slack'] as const).map(f => (
          <button key={f} onClick={() => setFormat(f)} style={{ ...S.btn, ...(format === f ? {} : S.ghostBtn), padding: '4px 12px', fontSize: 12 }}>{f === 'email' ? '≡ƒôº Email' : '≡ƒÆ¼ Slack'}</button>
        ))}
        <button onClick={generate} disabled={loading} style={{ ...S.btn, marginLeft: 'auto', opacity: loading ? 0.5 : 1 }}>
          {loading ? 'ΓÅ│ Generating...' : 'Γ£¿ Generate'}
        </button>
      </div>

      {result && (
        <div>
          {result.raw && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              {[
                { label: 'Runs', val: result.raw.runs },
                { label: 'Completed', val: result.raw.completed, color: '#4ade80' },
                { label: 'Failed', val: result.raw.failed, color: '#f87171' },
                { label: 'Avg Score', val: result.raw.avgScore ?? 'ΓÇö' },
                { label: 'Goals', val: result.raw.goals },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: s.color || '#e2e8f0' }}>{s.val}</div>
                  <div style={{ ...S.sub, fontSize: 10 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <pre style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 16, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 13, lineHeight: 1.6, color: '#e2e8f0', maxHeight: 300, overflowY: 'auto' }}>{result.narrative}</pre>
            <button onClick={copy} style={{ position: 'absolute', top: 10, right: 10, ...S.btn, ...S.ghostBtn, padding: '4px 10px', fontSize: 11 }}>{copied ? 'Γ£ô Copied' : '≡ƒôï Copy'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ΓöÇΓöÇΓöÇ v8.37 Agent Tag Panel ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const TAG_COLORS = ['#a78bfa','#4ade80','#60a5fa','#fb923c','#f472b6','#facc15','#34d399','#f87171'];
function tagColor(t: string) { return TAG_COLORS[Math.abs(t.split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % TAG_COLORS.length]; }

function AgentTagPanel({ api }: { api: Api }) {
  const [tags, setTags] = useState<string[]>([]);
  const [selected, setSelected] = useState<string|null>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [editRun, setEditRun] = useState<any>(null);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadTags(); }, []);

  async function loadTags() {
    try { const d = await api('/api/agent-tags'); if (d.success) setTags(d.tags); } catch {}
  }

  async function selectTag(tag: string) {
    setSelected(tag); setLoading(true);
    try { const d = await api(`/api/agent-runs/by-tag/${encodeURIComponent(tag)}`); if (d.success) setRuns(d.data); } catch {}
    setLoading(false);
  }

  async function saveTagsForRun(run: any, newTags: string[]) {
    setSaving(true);
    try {
      await api(`/api/agent-runs/${run.id}/tags`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tags: newTags }) });
      setEditRun(null);
      loadTags();
      if (selected) selectTag(selected);
    } catch {}
    setSaving(false);
  }

  return (
    <div>
      <h3 style={{ ...S.h, fontSize: 15, marginBottom: 12 }}>≡ƒÅ╖∩╕Å Agent Tags</h3>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {tags.length === 0 && <p style={S.sub}>No tags yet ΓÇö add tags to runs to see them here.</p>}
        {tags.map(t => (
          <button key={t} onClick={() => selectTag(t)} style={{ background: selected === t ? tagColor(t) : 'rgba(255,255,255,0.06)', border: `1px solid ${tagColor(t)}`, color: selected === t ? '#000' : tagColor(t), borderRadius: 20, padding: '4px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>{t}</button>
        ))}
      </div>

      {selected && (
        <div>
          <p style={{ ...S.sub, fontSize: 12, marginBottom: 8 }}>Runs tagged <strong style={{ color: tagColor(selected) }}>#{selected}</strong> ({runs.length})</p>
          {loading && <p style={S.sub}>Loading...</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {runs.map(run => {
              const runTags: string[] = (() => { try { return JSON.parse(run.tags || '[]'); } catch { return []; } })();
              return (
                <div key={run.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 10 }}>
                  {editRun?.id === run.id ? (
                    <div>
                      <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600 }}>{run.name}</p>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                        {editRun.tags.map((t: string) => (
                          <span key={t} style={{ background: tagColor(t), color: '#000', borderRadius: 12, padding: '2px 8px', fontSize: 11, cursor: 'pointer' }} onClick={() => setEditRun((e: any) => ({ ...e, tags: e.tags.filter((x: string) => x !== t) }))}>Γ£ò {t}</span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newTag.trim()) { setEditRun((er: any) => ({ ...er, tags: [...er.tags, newTag.trim()] })); setNewTag(''); }}} placeholder="Add tag + Enter" style={{ ...S.input, flex: 1, padding: '4px 8px', fontSize: 12 }} />
                        <button onClick={() => saveTagsForRun(run, editRun.tags)} disabled={saving} style={{ ...S.btn, padding: '4px 12px' }}>Save</button>
                        <button onClick={() => setEditRun(null)} style={{ ...S.btn, ...S.ghostBtn, padding: '4px 12px' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>{run.name}</p>
                        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                          {runTags.map(t => <span key={t} style={{ background: tagColor(t), color: '#000', borderRadius: 12, padding: '1px 7px', fontSize: 10 }}>{t}</span>)}
                        </div>
                      </div>
                      <button onClick={() => setEditRun({ id: run.id, tags: [...runTags] })} style={{ ...S.btn, ...S.ghostBtn, padding: '3px 10px', fontSize: 11 }}>Γ£Å∩╕Å Edit</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ΓöÇΓöÇΓöÇ v8.36 Smart Retry Panel ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function SmartRetryPanel({ api }: { api: Api }) {
  const [runs, setRuns] = useState<any[]>([]);
  const [retrying, setRetrying] = useState<number|null>(null);
  const [results, setResults] = useState<Record<number,string>>({});
  const [delay, setDelay] = useState(0);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try { const d = await api('/api/agent-runs/failed?limit=50'); if (d.success) setRuns(d.data); } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function retry(run: any) {
    setRetrying(run.id);
    try {
      const d = await api(`/api/agent-runs/${run.id}/retry`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ delay_ms: delay }) });
      if (d.success) {
        setResults(r => ({ ...r, [run.id]: d.result || 'Done' }));
        setRuns(prev => prev.filter(r => r.id !== run.id));
      } else {
        setResults(r => ({ ...r, [run.id]: `Error: ${d.error}` }));
      }
    } catch { setResults(r => ({ ...r, [run.id]: 'Request failed' })); }
    setRetrying(null);
  }

  async function retryAll() {
    for (const run of runs.slice(0, 10)) {
      await retry(run);
      if (delay > 0) await new Promise(r => setTimeout(r, delay));
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ ...S.h, fontSize: 15 }}>≡ƒöä Smart Retry</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ ...S.sub, fontSize: 11 }}>Delay:</label>
          {[0, 1000, 3000, 5000].map(d => (
            <button key={d} onClick={() => setDelay(d)} style={{ ...S.btn, ...(delay === d ? {} : S.ghostBtn), padding: '3px 8px', fontSize: 11 }}>{d === 0 ? 'None' : `${d/1000}s`}</button>
          ))}
          <button onClick={retryAll} disabled={runs.length === 0} style={{ ...S.btn, background: '#dc2626' }}>ΓÜí Retry All</button>
          <button onClick={load} style={{ ...S.btn, ...S.ghostBtn }}>Γå║</button>
        </div>
      </div>
      {loading && <p style={S.sub}>Loading failed runs...</p>}
      {!loading && runs.length === 0 && Object.keys(results).length === 0 && <p style={{ ...S.sub, textAlign: 'center', padding: 24 }}>Γ£à No failed runs</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {runs.map(run => (
          <div key={run.id} style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 10, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{run.name || 'Unnamed'}</p>
                <p style={{ ...S.sub, margin: '2px 0 0', fontSize: 11 }}>{run.created_at?.slice(0, 19)} ┬╖ {run.error || 'Unknown error'}</p>
              </div>
              <button onClick={() => retry(run)} disabled={retrying === run.id} style={{ ...S.btn, background: '#16a34a', marginLeft: 10, opacity: retrying === run.id ? 0.5 : 1, flexShrink: 0 }}>
                {retrying === run.id ? 'ΓÅ│' : '≡ƒöä Retry'}
              </button>
            </div>
          </div>
        ))}
        {Object.entries(results).map(([id, res]) => (
          <div key={id} style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 10, padding: 12 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#4ade80' }}>Γ£ô Run {id} retried</p>
            <pre style={{ margin: '6px 0 0', fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 80, overflowY: 'auto', color: '#94a3b8' }}>{res}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}

// ΓöÇΓöÇΓöÇ v8.35 Agent Cost Tracker ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function AgentCostTracker({ api }: { api: Api }) {
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

  async function load(d = days) {
    setLoading(true);
    try { const r = await api(`/api/agent-costs?days=${d}`); if (r.success) setData(r); } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const maxCost = data?.agentRanking?.[0]?.cost || 1;
  const maxDay = Math.max(...(data?.dailySpend?.map((d: any) => d.cost) || [1]));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ ...S.h, fontSize: 15 }}>≡ƒÆ░ Agent Cost Tracker</h3>
        <div style={{ display: 'flex', gap: 6 }}>
          {[7, 14, 30, 90].map(d => (
            <button key={d} onClick={() => { setDays(d); load(d); }} style={{ ...S.btn, ...(days === d ? {} : S.ghostBtn), padding: '4px 10px', fontSize: 11 }}>{d}d</button>
          ))}
        </div>
      </div>
      {loading && <p style={S.sub}>Loading...</p>}
      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Total Spend', value: `$${data.totalCost.toFixed(5)}`, color: '#facc15' },
              { label: 'Total Runs', value: data.runCount, color: '#4ade80' },
              { label: 'Avg / Run', value: data.runCount > 0 ? `$${(data.totalCost / data.runCount).toFixed(6)}` : '$0', color: '#a78bfa' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ ...S.sub, fontSize: 11 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {data.dailySpend?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ ...S.sub, fontSize: 12, marginBottom: 8 }}>Daily Spend</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
                {data.dailySpend.map((d: any) => (
                  <div key={d.date} title={`${d.date}: $${d.cost}`} style={{ flex: 1, background: '#a78bfa', borderRadius: '3px 3px 0 0', height: `${Math.max(4, Math.round((d.cost / maxDay) * 56))}px` }} />
                ))}
              </div>
            </div>
          )}

          {data.agentRanking?.length > 0 && (
            <div>
              <p style={{ ...S.sub, fontSize: 12, marginBottom: 8 }}>Top Agents by Cost</p>
              {data.agentRanking.map((a: any, i: number) => (
                <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8', width: 16, textAlign: 'right' }}>{i + 1}</span>
                  <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                  <div style={{ width: 100, background: 'rgba(0,0,0,0.3)', borderRadius: 4, height: 6 }}>
                    <div style={{ background: '#facc15', width: `${Math.round((a.cost / maxCost) * 100)}%`, height: '100%', borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 11, color: '#facc15', width: 70, textAlign: 'right' }}>${a.cost.toFixed(5)}</span>
                  <span style={{ ...S.sub, fontSize: 10, width: 40, textAlign: 'right' }}>{a.runs}r</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ΓöÇΓöÇΓöÇ v8.34 Token Estimator ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function TokenEstimatorPanel({ api }: { api: Api }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function estimate() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const d = await api('/api/tokens/estimate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      if (d.success) setResult(d);
    } catch {}
    setLoading(false);
  }

  // live estimate while typing (no API needed for char/word count)
  const liveTokens = Math.round(text.length / 4);
  const liveWords = text.trim() ? text.trim().split(/\s+/).length : 0;

  const providerColor: Record<string,string> = { anthropic: '#a78bfa', openai: '#4ade80', google: '#60a5fa', groq: '#fb923c', mistral: '#f472b6' };

  return (
    <div>
      <h3 style={{ ...S.h, fontSize: 15, marginBottom: 8 }}>≡ƒöó Context Window Estimator</h3>
      <p style={{ ...S.sub, marginBottom: 12 }}>Paste any text to see token count and which models can fit it.</p>
      <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
        <span style={{ ...S.sub, fontSize: 12 }}>Chars: <strong style={{ color: '#e2e8f0' }}>{text.length.toLocaleString()}</strong></span>
        <span style={{ ...S.sub, fontSize: 12 }}>Words: <strong style={{ color: '#e2e8f0' }}>{liveWords.toLocaleString()}</strong></span>
        <span style={{ ...S.sub, fontSize: 12 }}>~Tokens: <strong style={{ color: '#a78bfa' }}>{liveTokens.toLocaleString()}</strong></span>
      </div>
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setResult(null); }}
        placeholder="Paste your prompt, document, or context here..."
        style={{ width: '100%', minHeight: 120, background: (S.input as any).background, border: (S.input as any).border, color: (S.input as any).color, borderRadius: 8, padding: 10, fontSize: 12, resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }}
      />
      <button onClick={estimate} disabled={loading || !text.trim()} style={{ ...S.btn, opacity: loading ? 0.5 : 1 }}>
        {loading ? 'ΓÅ│...' : '≡ƒöó Check Model Fit'}
      </button>
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {result.models.map((m: any) => (
              <div key={m.name} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${m.fits ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`, borderRadius: 8, padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: providerColor[m.provider] || '#e2e8f0' }}>{m.name}</span>
                  <span style={{ fontSize: 11, color: m.fits ? '#4ade80' : '#f87171' }}>{m.fits ? 'Γ£ô fits' : 'Γ£ù too big'}</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 4, height: 6, marginBottom: 4 }}>
                  <div style={{ background: m.fits ? '#4ade80' : '#f87171', width: `${m.pct}%`, height: '100%', borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>{m.pct}% of {(m.context/1000).toFixed(0)}k ctx</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ΓöÇΓöÇΓöÇ v8.33 Prompt A/B Diff Tester ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function PromptDiffPanel({ api }: { api: Api }) {
  const [promptA, setPromptA] = useState('');
  const [promptB, setPromptB] = useState('');
  const [testInput, setTestInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    if (!promptA.trim() || !promptB.trim() || !testInput.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const d = await api('/api/prompts/diff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ promptA: promptA.trim(), promptB: promptB.trim(), testInput: testInput.trim() }) });
      if (d.success) setResult(d);
      else setError(d.error || 'Failed');
    } catch { setError('Request failed'); }
    setLoading(false);
  }

  const colStyle = { flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 14 };
  const scoreColor = (n: number) => n >= 8 ? '#4ade80' : n >= 5 ? '#facc15' : '#f87171';

  return (
    <div>
      <h3 style={{ ...S.h, fontSize: 15, marginBottom: 8 }}>ΓÜû∩╕Å Prompt A/B Tester</h3>
      <p style={{ ...S.sub, marginBottom: 14 }}>Run two prompts against the same input and get a scored comparison.</p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={{ ...S.sub, fontSize: 11, display: 'block', marginBottom: 4 }}>Prompt A</label>
          <textarea value={promptA} onChange={e => setPromptA(e.target.value)} placeholder="System or instruction prompt A..." style={{ width: '100%', minHeight: 80, background: (S.input as any).background, border: (S.input as any).border, color: (S.input as any).color, borderRadius: 8, padding: 8, fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ ...S.sub, fontSize: 11, display: 'block', marginBottom: 4 }}>Prompt B</label>
          <textarea value={promptB} onChange={e => setPromptB(e.target.value)} placeholder="System or instruction prompt B..." style={{ width: '100%', minHeight: 80, background: (S.input as any).background, border: (S.input as any).border, color: (S.input as any).color, borderRadius: 8, padding: 8, fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }} />
        </div>
      </div>
      <label style={{ ...S.sub, fontSize: 11, display: 'block', marginBottom: 4 }}>Test Input (same for both)</label>
      <textarea value={testInput} onChange={e => setTestInput(e.target.value)} placeholder="The user message / test case to run both prompts against..." style={{ width: '100%', minHeight: 60, background: (S.input as any).background, border: (S.input as any).border, color: (S.input as any).color, borderRadius: 8, padding: 8, fontSize: 12, resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }} />
      <button onClick={run} disabled={loading || !promptA.trim() || !promptB.trim() || !testInput.trim()} style={{ ...S.btn, opacity: loading ? 0.5 : 1 }}>
        {loading ? 'ΓÅ│ Running...' : 'ΓÜû∩╕Å Compare'}
      </button>
      {error && <p style={{ color: '#f87171', fontSize: 13, marginTop: 10 }}>{error}</p>}
      {result && (
        <div style={{ marginTop: 16 }}>
          {result.scores?.winner && (
            <div style={{ textAlign: 'center', marginBottom: 14, padding: '10px 0', background: 'rgba(139,92,246,0.15)', borderRadius: 10, border: '1px solid rgba(139,92,246,0.3)' }}>
              <span style={{ fontSize: 18 }}>{result.scores.winner === 'A' ? '≡ƒÅå Prompt A wins' : result.scores.winner === 'B' ? '≡ƒÅå Prompt B wins' : '≡ƒñ¥ Tie'}</span>
              {result.scores.reason && <p style={{ ...S.sub, margin: '4px 0 0', fontSize: 12 }}>{result.scores.reason}</p>}
            </div>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            {(['A','B'] as const).map(k => {
              const sc = result.scores?.[k.toLowerCase()];
              const out = k === 'A' ? result.outputA : result.outputB;
              return (
                <div key={k} style={{ ...colStyle, border: `1px solid ${result.scores?.winner === k ? '#a78bfa' : 'rgba(255,255,255,0.1)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Prompt {k}</span>
                    {sc && <span style={{ color: scoreColor(sc.overall), fontWeight: 700 }}>Γ¡É {sc.overall}/10</span>}
                  </div>
                  {sc && (
                    <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                      {(['clarity','relevance','usefulness'] as const).map(m => (
                        <span key={m} style={{ fontSize: 11, color: scoreColor(sc[m]) }}>{m}: {sc[m]}/10</span>
                      ))}
                    </div>
                  )}
                  {sc?.verdict && <p style={{ ...S.sub, fontSize: 11, marginBottom: 8, fontStyle: 'italic' }}>"{sc.verdict}"</p>}
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, color: '#e2e8f0', lineHeight: 1.5, maxHeight: 200, overflowY: 'auto' }}>{out}</pre>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ΓöÇΓöÇΓöÇ v8.32 Prompt Mutation Engine ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function PromptMutationPanel({ api }: { api: Api }) {
  const [prompt, setPrompt] = useState('');
  const [count, setCount] = useState(4);
  const [variants, setVariants] = useState<{ strategy: string; variant: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<number|null>(null);

  async function mutate() {
    if (!prompt.trim()) return;
    setLoading(true); setError(''); setVariants([]);
    try {
      const d = await api('/api/prompts/mutate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt.trim(), count }) });
      if (d.success) setVariants(d.variants);
      else setError(d.error || 'Failed');
    } catch { setError('Request failed'); }
    setLoading(false);
  }

  function copy(text: string, i: number) {
    navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div>
      <h3 style={{ ...S.h, fontSize: 15, marginBottom: 12 }}>≡ƒº¼ Prompt Mutation Engine</h3>
      <p style={{ ...S.sub, marginBottom: 12 }}>Generate smarter variants of any prompt using different engineering strategies.</p>
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Enter your prompt to mutate..."
        style={{ width: '100%', minHeight: 90, background: S.input.background, border: S.input.border, color: S.input.color, borderRadius: 8, padding: 10, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
      />
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8, marginBottom: 16 }}>
        <label style={{ ...S.sub, fontSize: 12 }}>Variants:</label>
        {[2,4,6,8].map(n => (
          <button key={n} onClick={() => setCount(n)} style={{ ...S.btn, ...(count === n ? {} : S.ghostBtn), padding: '4px 12px', fontSize: 12 }}>{n}</button>
        ))}
        <button onClick={mutate} disabled={loading || !prompt.trim()} style={{ ...S.btn, marginLeft: 'auto', opacity: loading || !prompt.trim() ? 0.5 : 1 }}>
          {loading ? 'ΓÅ│ Mutating...' : '≡ƒº¼ Mutate'}
        </button>
      </div>
      {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      {variants.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {variants.map((v, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600 }}>Strategy {i+1}: {v.strategy.slice(0, 60)}</span>
                <button onClick={() => copy(v.variant, i)} style={{ ...S.btn, ...S.ghostBtn, padding: '3px 10px', fontSize: 11 }}>
                  {copied === i ? 'Γ£ô Copied' : '≡ƒôï Copy'}
                </button>
              </div>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, color: '#e2e8f0', lineHeight: 1.5 }}>{v.variant}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Morning dashboard + approval inbox ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function AgentSchedulePanel({ api }: { api: Api }) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [running, setRunning] = useState<string|null>(null);
  const [toggling, setToggling] = useState<string|null>(null);

  const load = async () => {
    const d = await api('/api/schedules');
    if (d?.success) setSchedules(d.data || []);
  };

  useEffect(() => { load(); }, []);

  const runNow = async (id: string) => {
    setRunning(id);
    await api(`/api/schedules/${id}/run`, { method: 'POST', body: '{}' });
    setTimeout(() => setRunning(null), 2000);
  };

  const toggle = async (id: string, enabled: number) => {
    setToggling(id);
    await api(`/api/schedules/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ enabled: enabled ? 0 : 1 }) });
    await load();
    setToggling(null);
  };

  const del = async (id: string) => {
    await api(`/api/schedules/${id}`, { method: 'DELETE' });
    setSchedules(s => s.filter(x => x.id !== id));
  };

  return (
    <div style={{ padding: '16px', color: '#e2e8f0' }}>
      <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>ΓÅ░ My Schedules</h3>
      <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#94a3b8' }}>All autonomous schedules ΓÇö enable/disable, run on demand, or delete.</p>
      {schedules.length === 0 && <div style={{ fontSize: '13px', color: '#64748b' }}>No schedules yet. Create one in the Templates tab.</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {schedules.map((s: any) => (
          <div key={s.id} style={{ background: '#1e293b', border: `1px solid ${s.enabled ? '#1d4ed8' : '#334155'}`, borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: s.enabled ? '#60a5fa' : '#64748b', flex: 1 }}>{s.name}</span>
              <span style={{ fontSize: '10px', background: s.enabled ? '#1e3a5f' : '#1e293b', color: s.enabled ? '#93c5fd' : '#64748b', padding: '2px 7px', borderRadius: '4px' }}>{s.enabled ? 'ΓùÅ active' : 'Γùï paused'}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginBottom: 4 }}>cron: {s.cron_expression}</div>
            {s.persona && <div style={{ fontSize: '11px', color: '#7c3aed', marginBottom: 4 }}>≡ƒÄ¡ {s.persona}</div>}
            {s.trigger_schedule_id && <div style={{ fontSize: '11px', color: '#f97316', marginBottom: 4 }}>Γ¢ô cascade trigger</div>}
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: 8 }}>{String(s.prompt).slice(0, 100)}{s.prompt?.length > 100 ? 'ΓÇª' : ''}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => runNow(s.id)} disabled={running === s.id} style={{ background: '#6366f1', border: 'none', borderRadius: '5px', color: '#fff', padding: '5px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>{running === s.id ? 'Γû╢ RunningΓÇª' : 'Γû╢ Run Now'}</button>
              <button onClick={() => toggle(s.id, s.enabled)} disabled={toggling === s.id} style={{ background: s.enabled ? '#78350f' : '#14532d', border: 'none', borderRadius: '5px', color: s.enabled ? '#fcd34d' : '#86efac', padding: '5px 10px', cursor: 'pointer', fontSize: '11px' }}>{s.enabled ? 'Pause' : 'Enable'}</button>
              <button onClick={() => del(s.id)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '5px', color: '#f87171', padding: '5px 10px', cursor: 'pointer', fontSize: '11px' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentMemorySearch({ api }: { api: Api }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleted, setDeleted] = useState<Set<string>>(new Set());

  const search = async () => {
    if (!q.trim()) return;
    setLoading(true);
    const d = await api(`/api/agent-memory/search?q=${encodeURIComponent(q)}&limit=30`);
    setResults(d?.results || []);
    setLoading(false);
  };

  const del = async (key: string) => {
    await api(`/api/agent-memory/${encodeURIComponent(key)}`, { method: 'DELETE' });
    setDeleted(s => new Set([...s, key]));
  };

  return (
    <div style={{ padding: '16px', color: '#e2e8f0' }}>
      <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>≡ƒºá Memory Search</h3>
      <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#94a3b8' }}>Search all memories the agent has stored. Delete ones that are outdated or incorrect.</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} placeholder="Search memories by key or valueΓÇª" style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', padding: '8px 10px', fontSize: '13px' }} />
        <button onClick={search} disabled={loading} style={{ background: '#6366f1', border: 'none', borderRadius: '6px', color: '#fff', padding: '8px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>{loading ? 'ΓÇª' : '≡ƒöì'}</button>
      </div>
      {results.length === 0 && !loading && q && <div style={{ fontSize: '13px', color: '#64748b' }}>No memories found for "{q}"</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {results.filter(r => !deleted.has(r.key)).map((r: any) => (
          <div key={r.key} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', marginBottom: 3 }}>{r.key}</div>
              {r.category && <div style={{ fontSize: '10px', color: '#475569', marginBottom: 4 }}>category: {r.category}</div>}
              <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{String(r.value).slice(0, 300)}{r.value?.length > 300 ? 'ΓÇª' : ''}</div>
              <div style={{ fontSize: '10px', color: '#475569', marginTop: 4 }}>{new Date(r.updated_at).toLocaleString()}</div>
            </div>
            <button onClick={() => del(r.key)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '5px', color: '#f87171', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', flexShrink: 0 }}>≡ƒùæ</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentPlaybookPanel({ api }: { api: Api }) {
  const [plays, setPlays] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', goal_pattern: '', strategy: '', tags: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { const r = await api('/api/agent-playbook'); if (r.ok) { const d = await r.json(); setPlays(d.playbook||[]); } } catch {}
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title || !form.strategy) return;
    setSaving(true);
    try {
      await api('/api/agent-playbook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, tags: form.tags.split(',').map((t:string)=>t.trim()).filter(Boolean) }) });
      setForm({ title: '', goal_pattern: '', strategy: '', tags: '' });
      setShowForm(false);
      await load();
    } finally { setSaving(false); }
  };

  const del = async (id: string) => {
    await api(`/api/agent-playbook/${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ color: '#e2e8f0', margin: 0 }}>≡ƒôû Agent Playbook</h3>
        <button onClick={() => setShowForm(s => !s)} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer' }}>+ Add Strategy</button>
      </div>
      {showForm && (
        <div style={{ background: '#1e293b', border: '1px solid #6366f1', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
          <input placeholder="Strategy title" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', padding: '8px', marginBottom: '8px', boxSizing: 'border-box' }} />
          <input placeholder="Goal pattern (optional, e.g. 'research topic')" value={form.goal_pattern} onChange={e => setForm(f=>({...f,goal_pattern:e.target.value}))} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', padding: '8px', marginBottom: '8px', boxSizing: 'border-box' }} />
          <textarea placeholder="Strategy description (what works well, which tools, approach)" value={form.strategy} onChange={e => setForm(f=>({...f,strategy:e.target.value}))} rows={4} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', padding: '8px', marginBottom: '8px', boxSizing: 'border-box', resize: 'vertical' }} />
          <input placeholder="Tags (comma-separated)" value={form.tags} onChange={e => setForm(f=>({...f,tags:e.target.value}))} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }} />
          <button onClick={save} disabled={saving || !form.title || !form.strategy} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 20px', cursor: 'pointer' }}>{saving ? 'SavingΓÇª' : 'Save'}</button>
        </div>
      )}
      {plays.length === 0 ? (
        <div style={{ color: '#475569', textAlign: 'center', padding: '40px' }}>No strategies yet. Agents auto-save winning plays, or add one manually above.</div>
      ) : plays.map((p: any) => (
        <div key={p.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '14px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
            <div>
              <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '14px' }}>{p.title}</span>
              {p.avg_score > 0 && <span style={{ marginLeft: '8px', background: '#22c55e22', color: '#22c55e', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>Γ¡É {p.avg_score}/100</span>}
              {p.use_count > 0 && <span style={{ marginLeft: '6px', color: '#64748b', fontSize: '11px' }}>used {p.use_count}x</span>}
            </div>
            <button onClick={() => del(p.id)} style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '16px' }}>Γ£ò</button>
          </div>
          {p.goal_pattern && <div style={{ fontSize: '11px', color: '#6366f1', marginBottom: '6px' }}>≡ƒÄ» {p.goal_pattern}</div>}
          <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>{p.strategy.slice(0, 400)}{p.strategy.length > 400 ? 'ΓÇª' : ''}</div>
          {p.tags?.length > 0 && <div style={{ marginTop: '8px' }}>{p.tags.map((t:string) => <span key={t} style={{ background: '#334155', color: '#94a3b8', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', marginRight: '4px' }}>{t}</span>)}</div>}
        </div>
      ))}
    </div>
  );
}

function AgentDigestPanel({ api }: { api: Api }) {
  const [digests, setDigests] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [latest, setLatest] = useState<string|null>(null);

  const load = async () => {
    try { const r = await api('/api/agent-digest'); if (r.ok) { const d = await r.json(); setDigests(d.digests||[]); } } catch {}
  };
  useEffect(() => { load(); }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      const r = await api('/api/agent-digest', { method: 'POST' });
      if (r.ok) { const d = await r.json(); setLatest(d.summary); await load(); }
    } catch {} finally { setGenerating(false); }
  };

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ color: '#e2e8f0', margin: 0 }}>≡ƒôï Agent Digest</h3>
        <button onClick={generate} disabled={generating} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1 }}>
          {generating ? 'GeneratingΓÇª' : 'Γ£¿ Generate Now'}
        </button>
      </div>
      {latest && (
        <div style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid #6366f1', borderRadius: '8px', padding: '14px', marginBottom: '16px', color: '#c7d2fe', lineHeight: 1.6 }}>
          <div style={{ fontSize: '11px', color: '#6366f1', marginBottom: '6px', fontWeight: 700 }}>JUST GENERATED</div>
          {latest}
        </div>
      )}
      {digests.length === 0 && !latest ? (
        <div style={{ color: '#475569', textAlign: 'center', padding: '40px' }}>No digests yet. Click Generate Now to create your first one.</div>
      ) : digests.map((d: any) => (
        <div key={d.key} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '14px', marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>{d.key?.replace('digest_','').toUpperCase()} ┬╖ {new Date(d.created_at).toLocaleString()}</div>
          <div style={{ color: '#cbd5e1', lineHeight: 1.6, fontSize: '14px' }}>{d.value}</div>
        </div>
      ))}
    </div>
  );
}

function AutonomyStatsBar({ api }: { api: Api }) {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    const load = async () => { try { const r = await api('/api/autonomy-stats'); if (r.ok) setStats(await r.json()); } catch {} };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);
  if (!stats) return null;
  const items = [
    { label: 'Runs Today', value: stats.runsToday ?? 0, icon: '≡ƒñû' },
    { label: 'This Week', value: stats.runsWeek ?? 0, icon: '≡ƒôê' },
    { label: 'Avg Score', value: stats.avgScore != null ? `${stats.avgScore}/100` : 'ΓÇö', icon: 'Γ¡É' },
    { label: 'Schedules', value: stats.activeSchedules ?? 0, icon: 'ΓÅ░' },
    { label: 'Goals', value: stats.activeGoals ?? 0, icon: '≡ƒÄ»' },
    { label: 'Events', value: stats.eventsToday ?? 0, icon: '≡ƒôí' },
    { label: 'Memories', value: stats.totalMemories ?? 0, icon: '≡ƒºá' },
    { label: 'Approvals', value: stats.pendingApprovals ?? 0, icon: 'Γ£à', alert: stats.pendingApprovals > 0 },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '12px' }}>
      {items.map(item => (
        <div key={item.label} style={{ background: item.alert ? 'rgba(239,68,68,0.12)' : '#1e293b', border: `1px solid ${item.alert ? '#ef4444' : '#334155'}`, borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', marginBottom: '2px' }}>{item.icon}</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: item.alert ? '#f87171' : '#e2e8f0' }}>{item.value}</div>
          <div style={{ fontSize: '10px', color: '#475569', marginTop: '1px' }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

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
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg-text,#f0f1f5)' }}>≡ƒîà {greet}{username ? `, ${username}` : ''}. Here's your day.</div>
        <div style={{ fontSize: 12, color: 'var(--fg-text2,#ccc)', marginTop: 4 }}>
          {approvals.length > 0 ? `${approvals.length} thing${approvals.length === 1 ? '' : 's'} need your approval.` : 'Nothing needs your approval. All clear. Γ£¿'}
        </div>
      </div>
      {data?.lastRun && (
        <div style={S.card}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)', marginBottom: 8 }}>
            Last Night's Run {data.lastRun.status === 'complete' ? 'Γ£à' : 'ΓÜá∩╕Å'} <span style={{ fontWeight: 400, color: 'var(--fg-text3,#888)' }}>[{new Date(data.lastRun.started_at + 'Z').toLocaleString()}]</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-text2,#ccc)', lineHeight: 1.9 }}>
            ≡ƒôä {s.seo_pages || 0} new SEO pages drafted<br />
            ≡ƒô▒ {s.social_posts || 0} posts scheduled for this week<br />
            Γ¡É {s.review_requests || 0} review requests in flight<br />
            ≡ƒîÉ {data.publishedPages || 0} pages live total
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button disabled={running} style={{ ...S.btn, ...S.ghostBtn }} onClick={runNow}>{running ? <span className="fg-tool-running" style={{ display: 'inline-block' }}>ΓÜÖ∩╕Å</span> : '≡ƒîÖ'} {running ? 'Agents workingΓÇª' : 'Run nightly pipeline now'}</button>
        {approvals.length > 1 && (
          <button style={{ ...S.btn, ...S.primary }} onClick={async () => { await api('/approvals/approve-all', { method: 'POST', body: '{}' }); load(); }}>Γ£à Approve All {approvals.length}</button>
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

// ΓöÇΓöÇΓöÇ Agent roster browser ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export function AgentRoster({ api }: { api: Api }) {
  const [roster, setRoster] = useState<any[]>([]);
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  useEffect(() => { (async () => { try { const d = await api('/agents/roster'); if (d?.success) setRoster(d.data); } catch {} })(); }, [api]);
  const groups: Record<string, string> = { operations: '≡ƒÆ╝ Business Operations', execution: 'ΓÜí Execution', intelligence: '≡ƒö¼ Intelligence', moonshot: '≡ƒîî Moonshots' };
  return (
    <div>
      {Object.entries(groups).map(([g, label]) => (
        <div key={g}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--fg-text2,#ccc)', margin: '14px 0 8px' }}>{label}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 8 }}>
            {roster.filter(r => r.group === g).map(r => (
              <div key={r.id} style={{ ...S.card, marginBottom: 0, borderLeft: `3px solid ${r.color}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)' }}>{r.name}</div>
                <div style={{ fontSize: 10, color: 'var(--fg-text3,#888)', margin: '4px 0 8px', lineHeight: 1.5 }}>{r.prompt.slice(0, 90)}ΓÇª</div>
                <button style={{ ...S.btn, fontSize: 10, padding: '4px 10px', background: installed.has(r.id) ? 'var(--fg-bg4,#1a1a1e)' : 'var(--fg-odim2,rgba(255,31,53,0.22))', color: installed.has(r.id) ? 'var(--fg-text3,#888)' : 'var(--fg-orange2,#ff4d5e)' }}
                  onClick={async () => { try { await api(`/agents/roster/${r.id}/install`, { method: 'POST', body: '{}' }); setInstalled(x => new Set([...Array.from(x), r.id])); } catch {} }}>
                  {installed.has(r.id) ? 'Γ£ô Installed' : '+ Install'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Magic Reply ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export function MagicReply({ api }: { api: Api }) {
  const [msg, setMsg] = useState('');
  const [sender, setSender] = useState('');
  const [channel, setChannel] = useState('email');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true); setReply('');
    try { const d = await api('/magic-reply', { method: 'POST', body: JSON.stringify({ message: msg, sender, channel }) }); if (d?.success) setReply(d.data.reply); else setReply('ΓÜá∩╕Å ' + (d?.error || 'failed')); }
    catch (e: any) { setReply('ΓÜá∩╕Å ' + e.message); } finally { setBusy(false); }
  };
  return (
    <div>
      <p style={S.sub}>Paste any email / Slack / DM. Forge drafts the perfect reply in your voice ΓÇö one tap to copy.</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input style={{ ...S.input, flex: 1 }} placeholder="From (name/email)" value={sender} onChange={e => setSender(e.target.value)} />
        <select style={{ ...S.input, width: 120 }} value={channel} onChange={e => setChannel(e.target.value)}>
          <option value="email">Email</option><option value="slack">Slack</option><option value="dm">DM</option><option value="sms">SMS</option>
        </select>
      </div>
      <textarea style={{ ...S.input, minHeight: 110 }} placeholder="Paste the message you receivedΓÇª" value={msg} onChange={e => setMsg(e.target.value)} />
      <button disabled={busy || !msg.trim()} style={{ ...S.btn, ...S.primary, marginTop: 8 }} onClick={go}>{busy ? <span className="fg-tool-running" style={{ display: 'inline-block' }}>Γ£¿</span> : 'Γ£¿'} Magic Reply</button>
      {reply && (
        <div style={{ ...S.card, marginTop: 12 }} className={busy ? 'fg-ghost-text' : ''}>
          <div style={{ fontSize: 12, whiteSpace: 'pre-wrap', color: 'var(--fg-text,#f0f1f5)', lineHeight: 1.6 }}>{reply}</div>
          <button style={{ ...S.btn, ...S.ghostBtn, fontSize: 11, marginTop: 8 }} onClick={() => { navigator.clipboard?.writeText(reply); }}>≡ƒôï Copy</button>
        </div>
      )}
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Agent Cinema ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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
      <p style={S.sub}>Watch your agents work ΓÇö every overnight run, through glass.</p>
      {runs.length === 0 && <div style={{ ...S.card, textAlign: 'center', color: 'var(--fg-text3,#888)', fontSize: 12 }}>No runs yet.</div>}
      {runs.map(r => (
        <div key={r.id} style={S.card} className={r.status === 'running' ? 'fg-living-active' : ''}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)' }}>
            <span>{r.status === 'running' ? <span className="fg-tool-running" style={{ display: 'inline-block' }}>ΓÜÖ∩╕Å</span> : r.status === 'complete' ? 'Γ£à' : 'ΓÜá∩╕Å'} Nightly run</span>
            <span style={{ fontWeight: 400, color: 'var(--fg-text3,#888)' }}>{new Date(r.started_at + 'Z').toLocaleString()}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-text2,#ccc)', marginTop: 6 }}>
            ≡ƒôä {r.summary?.seo_pages || 0} SEO pages ┬╖ ≡ƒô▒ {r.summary?.social_posts || 0} posts ┬╖ Γ¡É {r.summary?.review_requests || 0} reviews
            {(r.summary?.errors || []).length > 0 && <div style={{ color: '#f87171', marginTop: 4 }}>ΓÜá {(r.summary.errors as string[]).slice(0, 3).join(' ┬╖ ')}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Voice-First Forge ("Hey Forge") ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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
    } catch (e: any) { setSpeech('ΓÜá∩╕Å ' + e.message); }
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
          ? <button style={{ ...S.btn, ...S.primary }} onClick={start}>≡ƒÄÖ∩╕Å Start listening</button>
          : <button style={{ ...S.btn, background: 'rgba(248,113,113,0.2)', color: '#f87171' }} onClick={stop}>ΓÅ╣ Stop</button>}
        {listening && <span className="fg-ghost-text" style={{ fontSize: 11, color: 'var(--fg-orange2,#ff4d5e)' }}>{active ? 'ΓùÅ Forge is listening to you' : 'Γùï waiting for "Hey Forge"ΓÇª'}</span>}
      </div>
      {transcript && <div style={{ ...S.card, marginTop: 12 }}><div style={{ fontSize: 10, color: 'var(--fg-text3,#888)' }}>You said</div><div style={{ fontSize: 12, color: 'var(--fg-text,#f0f1f5)' }}>{transcript}</div></div>}
      {speech && <div style={{ ...S.card, borderLeft: '3px solid var(--fg-orange,#ff1f35)' }}><div style={{ fontSize: 10, color: 'var(--fg-text3,#888)' }}>Forge</div><div style={{ fontSize: 12, color: 'var(--fg-text,#f0f1f5)', lineHeight: 1.6 }}>{speech}</div></div>}
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Marketplace ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const MARKET_APPS = [
  { id: 'reputation', name: 'ReputationGuard', icon: 'Γ¡É', desc: 'Auto-respond to reviews, flag negatives', category: 'Marketing' },
  { id: 'seo', name: 'SEO Engine', icon: '≡ƒöì', desc: 'Nightly content stubs, keyword tracking', category: 'Marketing' },
  { id: 'debt', name: 'DebtChaser', icon: '≡ƒÆ░', desc: 'Automated invoice follow-up sequences', category: 'Finance' },
  { id: 'social', name: 'SocialPilot', icon: '≡ƒô▒', desc: 'Schedule & post across all channels', category: 'Marketing' },
  { id: 'leads', name: 'LeadNurturer', icon: '≡ƒÄ»', desc: 'Drip sequences for cold + warm leads', category: 'Sales' },
  { id: 'competitor', name: 'CompetitorWatch', icon: '≡ƒö¡', desc: 'Monitor rival pricing, reviews, news', category: 'Intel' },
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

  if (loading) return <div style={{ textAlign: 'center', padding: 24, color: 'var(--fg-text3,#888)' }}>Loading marketplaceΓÇª</div>;

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
                {busy === app.id ? 'ΓÇª' : on ? 'Uninstall' : 'Install'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Universal Agents ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const AGENTS = [
  { id: 'debt_chaser', icon: '≡ƒÆ░', name: 'DebtChaser', desc: 'Chase overdue invoices via email/SMS' },
  { id: 'reputation_guard', icon: 'Γ¡É', name: 'ReputationGuard', desc: 'Respond to new reviews automatically' },
  { id: 'competitor_watch', icon: '≡ƒö¡', name: 'CompetitorWatch', desc: 'Scan competitor sites & alert changes' },
  { id: 'content_engine', icon: 'Γ£ì∩╕Å', name: 'ContentEngine', desc: 'Generate week of social + blog content' },
  { id: 'lead_nurturer', icon: '≡ƒÄ»', name: 'LeadNurturer', desc: 'Send nurture sequence to cold leads' },
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
                    {res.error ? `Error: ${res.error}` : res.message || `Γ£ô ${JSON.stringify(res).slice(0,60)}`}
                  </div>
                )}
              </div>
              <button
                disabled={running === a.id}
                onClick={() => run(a.id)}
                style={{ ...S.btn, ...S.primary, flexShrink: 0 }}>
                {running === a.id ? <span className="fg-tool-running">ΓÜÖ∩╕Å</span> : 'Run'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Forge Modes ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const MODES = [
  { id: 'default', icon: '≡ƒîÉ', name: 'Standard', desc: 'Full Forge interface' },
  { id: 'focus', icon: '≡ƒÄ»', name: 'Focus', desc: 'Hide distractions, just the chat' },
  { id: 'warroom', icon: 'ΓÜí', name: 'War Room', desc: 'Parallel agent runs visible' },
  { id: 'overnight', icon: '≡ƒîÖ', name: 'Overnight', desc: 'Queue tasks, run while you sleep' },
  { id: 'copilot', icon: '≡ƒñû', name: 'Co-Pilot', desc: 'AI suggests replies & next actions' },
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
              {on && <div style={{ fontSize: 10, color: 'var(--fg-orange2,#ff4d5e)', marginTop: 6, fontWeight: 700 }}>ΓùÅ ACTIVE</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Autonomy Hub ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export function ForgeAutonomyHub({ api, username, onClose, onOpenOnboarding, onModeChange }: {
  api: Api; username?: string; onClose: () => void;
  onOpenOnboarding?: () => void; onModeChange?: (mode: string) => void;
}) {
  const [tab, setTab] = useState<'dashboard'|'approvals'|'agents'|'market'|'modes'|'voice'|'moonshots'|'hub'|'cascade'|'goals'|'monitors'|'webhooks'|'rss'|'apikeys'|'chains'|'conditions'|'playground'|'history'|'templates'|'leaderboard'|'events'|'digest'|'playbook'|'memory'|'myschedules'|'runs'|'autopilot'|'health'|'relay'|'scoreboard'|'mutate'|'diff'|'tokens'|'costs'|'retry'|'tags'|'agentdigest'|'milestones'|'benchmark'|'optimizer'|'distill'|'debate'|'persona'|'validate'|'writecoach'|'decision'|'risk'|'pitch'|'okr'|'userstories'|'apidocs'|'changelog'|'brandvoice'|'contentcal'|'headline'|'threadwriter'|'newsletter'|'coldemail'|'landingcopy'|'adcopy'|'podscript'|'vidscript'|'ytdesc'|'threadopt'|'igcaption'|'linkedinpost'|'pressrelease'|'faqgen'|'testimonialreq'|'casestudy'|'whitepaper'|'webinarscript'|'socialaudit'|'blogoutline'|'salesproposal'|'grantproposal'|'productroadmap'|'personabuilder'|'abcopy'|'pitchdeck'|'onboardingseq'|'battlecard'|'sopgen'|'swotanalysis'|'execsummary'|'pricingstrategy'|'partnershipproposal'|'csplaybook'|'investorupdate'|'marketentry'|'fundraisingstrategy'|'kpidashboard'|'changemgmt'|'crisiscomms'|'boardagenda'|'launchchecklist'|'talentstrategy'|'journeymap'|'agencyproposal'|'perfreview'|'vendoreval'|'digitaltransform'|'duediligence'|'engagementsurvey'>('dashboard');
  const tabs: { id: typeof tab; label: string }[] = [
    { id: 'dashboard', label: '≡ƒîà Morning' },
    { id: 'approvals', label: 'Γ£à Approvals' },
    { id: 'agents', label: '≡ƒñû Agents' },
    { id: 'goals', label: '≡ƒÄ» Goals' },
    { id: 'monitors', label: '≡ƒæü∩╕Å Monitor' },
    { id: 'webhooks', label: '≡ƒöù Webhooks' },
    { id: 'rss', label: '≡ƒô░ RSS' },
    { id: 'apikeys', label: '≡ƒöæ API' },
    { id: 'chains', label: 'Γ¢ô∩╕Å Chains' },
    { id: 'conditions', label: 'ΓÜí Triggers' },
    { id: 'playground', label: '≡ƒº¬ Playground' },
    { id: 'history', label: '≡ƒô£ History' },
    { id: 'templates', label: '≡ƒôª Templates' },
    { id: 'leaderboard', label: '≡ƒÅå Leaders' },
    { id: 'events', label: '≡ƒôí Events' },
    { id: 'digest', label: '≡ƒôï Digest' },
    { id: 'playbook', label: '≡ƒôû Playbook' },
    { id: 'memory', label: '≡ƒºá Memory' },
    { id: 'myschedules', label: 'ΓÅ░ Schedules' },
    { id: 'runs', label: '≡ƒöì Run Inspector' },
    { id: 'autopilot', label: '≡ƒÄ» Autopilot' },
    { id: 'health', label: '≡ƒÆÜ Health' },
    { id: 'relay', label: 'Γ¢ô∩╕Å Relay' },
    { id: 'scoreboard', label: '≡ƒÅà Scoreboard' },
    { id: 'mutate', label: '≡ƒº¼ Mutate' },
    { id: 'diff', label: 'ΓÜû∩╕Å A/B Test' },
    { id: 'tokens', label: '≡ƒöó Token Est.' },
    { id: 'costs', label: '≡ƒÆ░ Cost Tracker' },
    { id: 'retry', label: '≡ƒöä Smart Retry' },
    { id: 'tags', label: '≡ƒÅ╖∩╕Å Tags' },
    { id: 'agentdigest', label: '≡ƒô¿ Digest' },
    { id: 'milestones', label: '≡ƒÄ» Milestones' },
    { id: 'benchmark', label: '≡ƒÅÆ Benchmark' },
    { id: 'optimizer', label: '✨ Optimizer' },
    { id: 'distill', label: '🧪 Distill' },
    { id: 'debate', label: '⚔️ Debate' },
    { id: 'persona', label: '🎭 Persona' },
    { id: 'validate', label: '🚀 Validate' },
    { id: 'writecoach', label: '✍️ Coach' },
    { id: 'decision', label: '⚖️ Decide' },
    { id: 'risk', label: '⚠️ Risks' },
    { id: 'pitch', label: '🚀 Pitch Deck' },
    { id: 'okr', label: '🎯 OKRs' },
    { id: 'userstories', label: '📋 Stories' },
    { id: 'apidocs', label: '📖 API Docs' },
    { id: 'changelog', label: '📝 Changelog' },
    { id: 'brandvoice', label: '🎨 Brand Voice' },
    { id: 'contentcal', label: '📅 Content Cal' },
    { id: 'headline', label: '📰 Headlines' },
    { id: 'threadwriter', label: '🧵 Threads' },
    { id: 'newsletter', label: '📧 Newsletter' },
    { id: 'coldemail', label: '🎯 Cold Email' },
    { id: 'landingcopy', label: '🚀 Landing Copy' },
    { id: 'adcopy', label: '💰 Ad Copy' },
    { id: 'podscript', label: '🎙️ Podcast' },
    { id: 'vidscript', label: '🎬 Video Script' },
    { id: 'ytdesc', label: '📺 YT Description' },
    { id: 'threadopt', label: '🐦 Thread Optimizer' },
    { id: 'igcaption', label: '📸 IG Caption' },
    { id: 'linkedinpost', label: '💼 LinkedIn Post' },
    { id: 'pressrelease', label: '📰 Press Release' },
    { id: 'faqgen', label: '❓ FAQ Generator' },
    { id: 'testimonialreq', label: '⭐ Testimonial Request' },
    { id: 'casestudy', label: '📋 Case Study' },
    { id: 'whitepaper', label: '📄 White Paper' },
    { id: 'webinarscript', label: '🎤 Webinar Script' },
    { id: 'socialaudit', label: '📊 Social Audit' },
    { id: 'blogoutline', label: '📝 Blog Outline' },
    { id: 'salesproposal', label: '💼 Sales Proposal' },
    { id: 'grantproposal', label: '🏛️ Grant Proposal' },
    { id: 'productroadmap', label: '🗺️ Product Roadmap' },
    { id: 'personabuilder', label: '👤 Persona Builder' },
    { id: 'abcopy', label: '🧪 A/B Copy Gen' },
    { id: 'pitchdeck', label: '📊 Pitch Deck' },
    { id: 'onboardingseq', label: '📧 Onboarding Emails' },
    { id: 'fundraisingstrategy', label: '💸 Fundraising' },
    { id: 'kpidashboard', label: '📊 KPI Dashboard' },
    { id: 'changemgmt', label: '🔄 Change Mgmt' },
    { id: 'crisiscomms', label: '🚨 Crisis Comms' },
    { id: 'boardagenda', label: '🏛️ Board Agenda' },
    { id: 'launchchecklist', label: '🚀 Launch Checklist' },
    { id: 'talentstrategy', label: '🎯 Talent Strategy' },
    { id: 'journeymap', label: '🗺️ Journey Map' },
    { id: 'agencyproposal', label: '📄 Agency Proposal' },
    { id: 'perfreview', label: '⭐ Perf Review' },
    { id: 'vendoreval', label: '🔍 Vendor Eval' },
    { id: 'digitaltransform', label: '🚀 Digital Transform' },
    { id: 'duediligence', label: '🔬 Due Diligence' },
    { id: 'engagementsurvey', label: '📋 Engagement Survey' },
    { id: 'marketentry', label: '🌍 Market Entry' },
    { id: 'investorupdate', label: '📨 Investor Update' },
    { id: 'csplaybook', label: '🎯 CS Playbook' },
    { id: 'partnershipproposal', label: '🤝 Partnership Proposal' },
    { id: 'pricingstrategy', label: '💰 Pricing Strategy' },
    { id: 'execsummary', label: '📄 Exec Summary' },
    { id: 'swotanalysis', label: '🔷 SWOT Analysis' },
    { id: 'sopgen', label: '📋 SOP Generator' },
    { id: 'battlecard', label: '⚔️ Battle Card' },
    { id: 'market', label: '≡ƒ¢Æ Market' },
    { id: 'modes', label: 'ΓÜí Modes' },
    { id: 'voice', label: '≡ƒÄÖ∩╕Å Voice' },
    { id: 'moonshots', label: '≡ƒÜÇ Moonshots' },
    { id: 'hub', label: '≡ƒñû All Agents' },
    { id: 'cascade', label: 'ΓÜí Cascade' },
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
                ΓÜÖ∩╕Å Setup
              </button>
            )}
            <button onClick={onClose} style={{ ...S.btn, ...S.ghostBtn }}>Γ£ò</button>
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

        {tab === 'dashboard' && <><AutonomyStatsBar api={api} /><MorningDashboard api={api} /></>}
        {tab === 'approvals' && <MorningDashboard api={api} />}
        {tab === 'agents' && <UniversalAgents api={api} />}
        {tab === 'market' && <ForgeMarketplace api={api} />}
        {tab === 'modes' && <ForgeModes onModeChange={onModeChange} />}
        {tab === 'voice' && <VoiceForge api={api} />}
        {tab === 'moonshots' && <MoonshotAgents api={api} />}
        {tab === 'hub' && <AgentHub api={api} />}
        {tab === 'cascade' && <DroidPipeline api={api} />}
        {tab === 'goals' && <GoalTracker api={api} />}
        {tab === 'monitors' && <UrlMonitorPanel api={api} />}
        {tab === 'webhooks' && <WebhookPanel api={api} />}
        {tab === 'rss' && <RssFeedPanel api={api} />}
        {tab === 'apikeys' && <ApiKeysPanel api={api} />}
        {tab === 'chains' && <ChainBuilderPanel api={api} />}
        {tab === 'conditions' && <ConditionTriggersPanel api={api} />}
        {tab === 'playground' && <ToolPlayground api={api} />}
        {tab === 'history' && <AgentHistoryPanel api={api} />}
        {tab === 'templates' && <AgentTemplatesPanel api={api} />}
        {tab === 'leaderboard' && <AgentLeaderboard api={api} />}
        {tab === 'events' && <AgentEventFeed api={api} />}
        {tab === 'digest' && <AgentDigestPanel api={api} />}
        {tab === 'playbook' && <AgentPlaybookPanel api={api} />}
        {tab === 'memory' && <AgentMemorySearch api={api} />}
        {tab === 'myschedules' && <AgentSchedulePanel api={api} />}
        {tab === 'runs' && <AgentRunInspector api={api} />}
        {tab === 'autopilot' && <GoalAutopilotPanel api={api} />}
        {tab === 'health' && <AgentHealthMonitor api={api} />}
        {tab === 'relay' && <RelayRunner api={api} />}
        {tab === 'scoreboard' && <AgentScoreboard api={api} />}
        {tab === 'mutate' && <PromptMutationPanel api={api} />}
        {tab === 'diff' && <PromptDiffPanel api={api} />}
        {tab === 'tokens' && <TokenEstimatorPanel api={api} />}
        {tab === 'costs' && <AgentCostTracker api={api} />}
        {tab === 'retry' && <SmartRetryPanel api={api} />}
        {tab === 'tags' && <AgentTagPanel api={api} />}
        {tab === 'agentdigest' && <AgentDigestPanel api={api} />}
        {tab === 'milestones' && <GoalMilestoneTracker api={api} />}
        {tab === 'benchmark' && <AgentBenchmarkPanel api={api} />}
        {tab === 'optimizer' && <PromptOptimizerPanel api={api} />}
        {tab === 'distill' && <KnowledgeDistillerPanel api={api} />}
        {tab === 'debate' && <DebateSimulatorPanel api={api} />}
        {tab === 'persona' && <PersonaChatPanel api={api} />}
        {tab === 'validate' && <IdeaValidatorPanel api={api} />}
        {tab === 'writecoach' && <WritingCoachPanel api={api} />}
        {tab === 'decision' && <DecisionMatrixPanel api={api} />}
        {tab === 'risk' && <RiskAnalyzerPanel api={api} />}
        {tab === 'pitch' && <PitchDeckPanel api={api} />}
        {tab === 'okr' && <OKRPanel api={api} />}
        {tab === 'userstories' && <UserStoriesPanel api={api} />}
        {tab === 'apidocs' && <ApiDocsPanel api={api} />}
        {tab === 'changelog' && <ChangelogPanel api={api} />}
        {tab === 'brandvoice' && <BrandVoicePanel api={api} />}
        {tab === 'contentcal' && <ContentCalPanel api={api} />}
        {tab === 'headline' && <HeadlinePanel api={api} />}
        {tab === 'threadwriter' && <ThreadWriterPanel api={api} />}
        {tab === 'newsletter' && <NewsletterPanel api={api} />}
        {tab === 'coldemail' && <ColdEmailPanel api={api} />}
        {tab === 'landingcopy' && <LandingCopyPanel api={api} />}
        {tab === 'adcopy' && <AdCopyPanel api={api} />}
        {tab === 'podscript' && <PodcastScriptPanel api={api} />}
        {tab === 'vidscript' && <VideoScriptPanel api={api} />}
        {tab === 'ytdesc' && <YTDescriptionPanel api={api} />}
        {tab === 'threadopt' && <ThreadOptimizerPanel api={api} />}
        {tab === 'igcaption' && <IGCaptionPanel api={api} />}
        {tab === 'linkedinpost' && <LinkedInPostPanel api={api} />}
        {tab === 'pressrelease' && <PressReleasePanel api={api} />}
        {tab === 'faqgen' && <FAQGenPanel api={api} />}
        {tab === 'testimonialreq' && <TestimonialReqPanel api={api} />}
        {tab === 'casestudy' && <CaseStudyPanel api={api} />}
        {tab === 'whitepaper' && <WhitePaperPanel api={api} />}
        {tab === 'webinarscript' && <WebinarScriptPanel api={api} />}
        {tab === 'socialaudit' && <SocialAuditPanel api={api} />}
        {tab === 'blogoutline' && <BlogOutlinePanel api={api} />}
        {tab === 'salesproposal' && <SalesProposalPanel api={api} />}
        {tab === 'grantproposal' && <GrantProposalPanel api={api} />}
        {tab === 'productroadmap' && <ProductRoadmapPanel api={api} />}
        {tab === 'personabuilder' && <PersonaBuilderPanel api={api} />}
        {tab === 'abcopy' && <ABCopyPanel api={api} />}
        {tab === 'pitchdeck' && <PitchDeckPanel api={api} />}
        {tab === 'onboardingseq' && <OnboardingSequencePanel api={api} />}
        {tab === 'fundraisingstrategy' && <FundraisingStrategyPanel api={api} />}
        {tab === 'kpidashboard' && <KPIDashboardPanel api={api} />}
        {tab === 'changemgmt' && <ChangeMgmtPanel api={api} />}
        {tab === 'crisiscomms' && <CrisisCommsPanel api={api} />}
        {tab === 'boardagenda' && <BoardAgendaPanel api={api} />}
        {tab === 'launchchecklist' && <LaunchChecklistPanel api={api} />}
        {tab === 'talentstrategy' && <TalentStrategyPanel api={api} />}
        {tab === 'journeymap' && <JourneyMapPanel api={api} />}
        {tab === 'agencyproposal' && <AgencyProposalPanel api={api} />}
        {tab === 'perfreview' && <PerfReviewPanel api={api} />}
        {tab === 'vendoreval' && <VendorEvalPanel api={api} />}
        {tab === 'digitaltransform' && <DigitalTransformPanel api={api} />}
        {tab === 'duediligence' && <DueDiligencePanel api={api} />}
        {tab === 'engagementsurvey' && <EngagementSurveyPanel api={api} />}
        {tab === 'marketentry' && <MarketEntryPanel api={api} />}
        {tab === 'investorupdate' && <InvestorUpdatePanel api={api} />}
        {tab === 'csplaybook' && <CSPlaybookPanel api={api} />}
        {tab === 'partnershipproposal' && <PartnershipProposalPanel api={api} />}
        {tab === 'pricingstrategy' && <PricingStrategyPanel api={api} />}
        {tab === 'execsummary' && <ExecSummaryPanel api={api} />}
        {tab === 'swotanalysis' && <SWOTAnalysisPanel api={api} />}
        {tab === 'sopgen' && <SOPGenPanel api={api} />}
        {tab === 'battlecard' && <BattleCardPanel api={api} />}
      </div>
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Moonshot Agents ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const MOONSHOTS = [
  { id: 'ghost', icon: '≡ƒæ╗', name: 'Ghost Agent', desc: 'Silent email/Slack presence ΓÇö acts only at 95%+ confidence', endpoint: '/agents/ghost/activate', method: 'POST' },
  { id: 'mentor', icon: '≡ƒÄô', name: 'Mentor Agent', desc: 'Analyzes your patterns, coaches you to improve', endpoint: '/agents/mentor/analyze', method: 'POST' },
  { id: 'clone', icon: '≡ƒº¼', name: 'Clone Agent', desc: 'Learns your exact writing voice, indistinguishable from you', endpoint: '/agents/clone/train', method: 'POST' },
  { id: 'watchdog', icon: '≡ƒÉò', name: 'Watchdog Agent', desc: '24/7 monitor ΓÇö wakes only when something needs attention', endpoint: '/agents/watchdog/configure', method: 'POST' },
  { id: 'negotiator', icon: '≡ƒñ¥', name: 'Negotiator Agent', desc: 'Handles vendor/client negotiations via email autonomously', endpoint: '/agents/negotiator/draft', method: 'POST' },
  { id: 'connector', icon: '≡ƒöù', name: 'Connector Agent', desc: 'Finds partnership opportunities, drafts intros, tracks follow-ups', endpoint: '/agents/connector/find', method: 'POST' },
];

// ΓöÇΓöÇΓöÇ Goal Tracker ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function GoalTracker({ api }: { api: Api }) {
  const [goals, setGoals] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', metric: '', target_value: '', unit: '', deadline: '', agent_goal: '' });
  const [updating, setUpdating] = useState<{ id: string; val: string; note: string } | null>(null);

  const load = async () => { try { const d = await api('/goals'); if (d?.success) setGoals(d.data); } catch {} };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.title) return;
    await api('/goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, target_value: parseFloat(form.target_value) || 0 }) });
    setAdding(false); setForm({ title: '', description: '', metric: '', target_value: '', unit: '', deadline: '', agent_goal: '' }); load();
  };
  const updateProgress = async () => {
    if (!updating) return;
    await api(`/goals/${updating.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current_value: parseFloat(updating.val) || 0, note: updating.note }) });
    setUpdating(null); load();
  };
  const del = async (id: string) => { await api(`/goals/${id}`, { method: 'DELETE' }); load(); };
  const complete = async (id: string) => { await api(`/goals/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'completed' }) }); load(); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <p style={S.h}>≡ƒÄ» Goal Tracker</p>
          <p style={S.sub}>Set goals. Agents track & work toward them automatically.</p>
        </div>
        <button style={{ ...S.btn, ...S.primary }} onClick={() => setAdding(!adding)}>+ Goal</button>
      </div>

      {adding && (
        <div style={{ ...S.card, marginBottom: 16 }}>
          <p style={{ ...S.h, marginBottom: 10 }}>New Goal</p>
          {[['title', 'Title *'], ['description', 'Description'], ['metric', 'Metric (e.g. Twitter followers)'], ['target_value', 'Target (number)'], ['unit', 'Unit (e.g. followers, $, %)'], ['deadline', 'Deadline (YYYY-MM-DD)']].map(([k, ph]) => (
            <input key={k} placeholder={ph} value={(form as any)[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} style={{ ...S.input, marginBottom: 8 }} />
          ))}
          <textarea placeholder="Agent goal ΓÇö what should the agent DO each day toward this goal? (e.g. Search Twitter for engagement opportunities and respond to 3 relevant posts)" value={form.agent_goal} onChange={e => setForm(p => ({ ...p, agent_goal: e.target.value }))} style={{ ...S.input, height: 70, resize: 'vertical', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ ...S.btn, ...S.primary }} onClick={add}>Create</button>
            <button style={{ ...S.btn, ...S.ghostBtn }} onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {goals.length === 0 && !adding && <p style={{ ...S.sub, textAlign: 'center', marginTop: 32 }}>No goals yet. Create one to start autonomous tracking.</p>}

      {goals.map(g => {
        const pct = g.target_value > 0 ? Math.min(100, Math.round((g.current_value / g.target_value) * 100)) : 0;
        return (
          <div key={g.id} style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <p style={{ ...S.h, margin: '0 0 2px' }}>{g.title}</p>
                {g.metric && <span style={S.tag}>{g.metric}</span>}
                {g.deadline && <span style={{ ...S.tag, background: 'rgba(255,200,0,0.1)', color: '#ffd000' }}>≡ƒôà {g.deadline}</span>}
                {g.agent_goal && <span style={{ ...S.tag, background: 'rgba(0,200,100,0.1)', color: '#00c864' }}>≡ƒñû Agent active</span>}
                <div style={{ margin: '8px 0 4px', background: 'rgba(255,255,255,0.07)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: pct >= 100 ? '#00c864' : 'var(--fg-orange,#ff1f35)', transition: 'width 0.4s' }} />
                </div>
                <p style={{ ...S.sub, margin: 0 }}>{g.current_value} / {g.target_value} {g.unit} ({pct}%)</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 12 }}>
                <button style={{ ...S.btn, ...S.ghostBtn, fontSize: 11 }} onClick={() => setUpdating({ id: g.id, val: String(g.current_value), note: '' })}>Update</button>
                <button style={{ ...S.btn, ...S.ghostBtn, fontSize: 11 }} onClick={() => complete(g.id)}>Γ£ô Done</button>
                <button style={{ ...S.btn, ...S.ghostBtn, fontSize: 11, color: '#ff4d5e' }} onClick={() => del(g.id)}>Delete</button>
              </div>
            </div>
            {updating?.id === g.id && (
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <input type="number" placeholder="New value" value={updating.val} onChange={e => setUpdating(p => p && ({ ...p, val: e.target.value }))} style={{ ...S.input, flex: 1 }} />
                <input placeholder="Note" value={updating.note} onChange={e => setUpdating(p => p && ({ ...p, note: e.target.value }))} style={{ ...S.input, flex: 2 }} />
                <button style={{ ...S.btn, ...S.primary }} onClick={updateProgress}>Save</button>
                <button style={{ ...S.btn, ...S.ghostBtn }} onClick={() => setUpdating(null)}>Γ£ò</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ΓöÇΓöÇΓöÇ URL Monitor Panel ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function UrlMonitorPanel({ api }: { api: Api }) {
  const [monitors, setMonitors] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ url: '', label: '', check_interval: '0 */6 * * *', notify_on_change: true, on_change_goal: '' });

  const load = async () => { try { const d = await api('/url-monitors'); if (d?.success) setMonitors(d.data); } catch {} };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.url) return;
    await api('/url-monitors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setAdding(false); setForm({ url: '', label: '', check_interval: '0 */6 * * *', notify_on_change: true, on_change_goal: '' }); load();
  };
  const toggle = async (id: string, enabled: boolean) => { await api(`/url-monitors/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !enabled }) }); load(); };
  const del = async (id: string) => { await api(`/url-monitors/${id}`, { method: 'DELETE' }); load(); };

  const INTERVALS = [['0 */1 * * *', 'Every hour'], ['0 */6 * * *', 'Every 6 hours'], ['0 */12 * * *', 'Every 12 hours'], ['0 9 * * *', 'Daily at 9am']];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <p style={S.h}>≡ƒæü∩╕Å Web Monitor</p>
          <p style={S.sub}>Watch any URL for changes. Trigger agents automatically when pages update.</p>
        </div>
        <button style={{ ...S.btn, ...S.primary }} onClick={() => setAdding(!adding)}>+ Monitor</button>
      </div>

      {adding && (
        <div style={{ ...S.card, marginBottom: 16 }}>
          <input placeholder="URL to watch *" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} style={{ ...S.input, marginBottom: 8 }} />
          <input placeholder="Label (optional)" value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} style={{ ...S.input, marginBottom: 8 }} />
          <select value={form.check_interval} onChange={e => setForm(p => ({ ...p, check_interval: e.target.value }))} style={{ ...S.input, marginBottom: 8 }}>
            {INTERVALS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <textarea placeholder="On change, run agent goal: (e.g. Summarize what changed and notify me)" value={form.on_change_goal} onChange={e => setForm(p => ({ ...p, on_change_goal: e.target.value }))} style={{ ...S.input, height: 60, resize: 'vertical', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ ...S.btn, ...S.primary }} onClick={add}>Add</button>
            <button style={{ ...S.btn, ...S.ghostBtn }} onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {monitors.length === 0 && !adding && <p style={{ ...S.sub, textAlign: 'center', marginTop: 32 }}>No monitors yet. Watch a URL for autonomous change detection.</p>}

      {monitors.map(m => (
        <div key={m.id} style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <p style={{ ...S.h, margin: '0 0 2px' }}>{m.label || m.url}</p>
              <p style={{ ...S.sub, margin: '0 0 4px', wordBreak: 'break-all' }}>{m.url}</p>
              <span style={{ ...S.tag, background: m.enabled ? 'rgba(0,200,100,0.1)' : 'rgba(255,255,255,0.05)', color: m.enabled ? '#00c864' : '#888' }}>{m.enabled ? 'ΓùÅ Active' : 'Γùï Paused'}</span>
              {m.on_change_goal && <span style={{ ...S.tag, background: 'rgba(255,31,53,0.1)', color: '#ff4d5e' }}>≡ƒñû Agent trigger</span>}
              {m.last_checked && <span style={S.tag}>Checked: {new Date(m.last_checked).toLocaleString()}</span>}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button style={{ ...S.btn, ...S.ghostBtn, fontSize: 11 }} onClick={() => toggle(m.id, m.enabled)}>{m.enabled ? 'Pause' : 'Resume'}</button>
              <button style={{ ...S.btn, ...S.ghostBtn, fontSize: 11, color: '#ff4d5e' }} onClick={() => del(m.id)}>Delete</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Webhook Panel ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function WebhookPanel({ api }: { api: Api }) {
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ label: '', agent_goal: '' });
  const [newToken, setNewToken] = useState<{ id: string; token: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const baseUrl = 'https://forge-production-2692.up.railway.app';
  const load = async () => { try { const d = await api('/webhook-endpoints'); if (d?.success) setEndpoints(d.data); } catch {} };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.agent_goal) return;
    const d = await api('/webhook-endpoints', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (d?.success) { setNewToken({ id: d.id, token: d.token, url: `${baseUrl}${d.url}` }); setAdding(false); setForm({ label: '', agent_goal: '' }); load(); }
  };
  const del = async (id: string) => { await api(`/webhook-endpoints/${id}`, { method: 'DELETE' }); load(); };
  const copy = (text: string) => { try { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <p style={S.h}>≡ƒöù Webhook Receiver</p>
          <p style={S.sub}>External services (GitHub, Stripe, Zapier) POST to your URL and trigger agents.</p>
        </div>
        <button style={{ ...S.btn, ...S.primary }} onClick={() => setAdding(!adding)}>+ Endpoint</button>
      </div>

      {newToken && (
        <div style={{ ...S.card, border: '1px solid rgba(0,200,100,0.3)', marginBottom: 16 }}>
          <p style={{ ...S.h, color: '#00c864', margin: '0 0 6px' }}>Γ£ô Webhook created</p>
          <p style={{ ...S.sub, margin: '0 0 6px' }}>POST to this URL from any external service:</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <code style={{ flex: 1, background: 'rgba(0,0,0,0.4)', padding: '8px 12px', borderRadius: 8, fontSize: 11, wordBreak: 'break-all', color: '#a8f0c8' }}>{newToken.url}</code>
            <button style={{ ...S.btn, ...S.primary, whiteSpace: 'nowrap' }} onClick={() => copy(newToken.url)}>{copied ? 'Γ£ô Copied' : 'Copy URL'}</button>
          </div>
          <button style={{ ...S.btn, ...S.ghostBtn, marginTop: 10, fontSize: 11 }} onClick={() => setNewToken(null)}>Dismiss</button>
        </div>
      )}

      {adding && (
        <div style={{ ...S.card, marginBottom: 16 }}>
          <input placeholder="Label (e.g. GitHub push, Stripe payment)" value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} style={{ ...S.input, marginBottom: 8 }} />
          <textarea placeholder="Agent goal ΓÇö what should the agent do when triggered? (e.g. A payment was received. Check Stripe dashboard and send a thank-you summary to the notifications)" value={form.agent_goal} onChange={e => setForm(p => ({ ...p, agent_goal: e.target.value }))} style={{ ...S.input, height: 80, resize: 'vertical', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ ...S.btn, ...S.primary }} onClick={add}>Create</button>
            <button style={{ ...S.btn, ...S.ghostBtn }} onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {endpoints.length === 0 && !adding && <p style={{ ...S.sub, textAlign: 'center', marginTop: 32 }}>No webhook endpoints. Create one to receive external triggers.</p>}

      {endpoints.map(ep => (
        <div key={ep.id} style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <p style={{ ...S.h, margin: '0 0 2px' }}>{ep.label || 'Unnamed endpoint'}</p>
              <code style={{ fontSize: 10, color: '#888', wordBreak: 'break-all', display: 'block', marginBottom: 4 }}>{baseUrl}/api/webhooks/in/{ep.token}</code>
              <span style={S.tag}>≡ƒöÑ {ep.trigger_count || 0} triggers</span>
              {ep.last_triggered && <span style={S.tag}>Last: {new Date(ep.last_triggered).toLocaleString()}</span>}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button style={{ ...S.btn, ...S.ghostBtn, fontSize: 11 }} onClick={() => copy(`${baseUrl}/api/webhooks/in/${ep.token}`)}>Copy</button>
              <button style={{ ...S.btn, ...S.ghostBtn, fontSize: 11, color: '#ff4d5e' }} onClick={() => del(ep.id)}>Delete</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ΓöÇΓöÇΓöÇ RSS Feed Panel ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function RssFeedPanel({ api }: { api: Api }) {
  const [feeds, setFeeds] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ url: '', label: '', keywords: '', check_interval: '*/30 * * * *', agent_goal: '' });

  const load = async () => { try { const d = await api('/rss-feeds'); if (d?.success) setFeeds(d.data); } catch {} };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.url) return;
    await api('/rss-feeds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setAdding(false); setForm({ url: '', label: '', keywords: '', check_interval: '*/30 * * * *', agent_goal: '' }); load();
  };
  const toggle = async (id: string, enabled: boolean) => { await api(`/rss-feeds/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !enabled }) }); load(); };
  const del = async (id: string) => { await api(`/rss-feeds/${id}`, { method: 'DELETE' }); load(); };

  const INTERVALS = [['*/30 * * * *', 'Every 30 min'], ['0 * * * *', 'Every hour'], ['0 */6 * * *', 'Every 6 hours'], ['0 9 * * *', 'Daily at 9am']];
  const EXAMPLES = ['https://feeds.feedburner.com/TechCrunch', 'https://hnrss.org/frontpage', 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <p style={S.h}>≡ƒô░ RSS Feed Monitor</p>
          <p style={S.sub}>Subscribe to RSS feeds. Agents react when matching news arrives.</p>
        </div>
        <button style={{ ...S.btn, ...S.primary }} onClick={() => setAdding(!adding)}>+ Feed</button>
      </div>

      {adding && (
        <div style={{ ...S.card, marginBottom: 16 }}>
          <input placeholder="RSS feed URL *" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} style={{ ...S.input, marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
            {EXAMPLES.map(ex => <button key={ex} style={{ ...S.btn, ...S.ghostBtn, fontSize: 10 }} onClick={() => setForm(p => ({ ...p, url: ex }))}>{ex.split('/')[2]}</button>)}
          </div>
          <input placeholder="Label (e.g. TechCrunch)" value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} style={{ ...S.input, marginBottom: 8 }} />
          <input placeholder="Keywords to match (comma-separated, e.g. AI, OpenAI, Anthropic)" value={form.keywords} onChange={e => setForm(p => ({ ...p, keywords: e.target.value }))} style={{ ...S.input, marginBottom: 8 }} />
          <select value={form.check_interval} onChange={e => setForm(p => ({ ...p, check_interval: e.target.value }))} style={{ ...S.input, marginBottom: 8 }}>
            {INTERVALS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <textarea placeholder="Agent goal on match (e.g. Summarize this article and suggest 3 actionable insights for my startup)" value={form.agent_goal} onChange={e => setForm(p => ({ ...p, agent_goal: e.target.value }))} style={{ ...S.input, height: 60, resize: 'vertical', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ ...S.btn, ...S.primary }} onClick={add}>Subscribe</button>
            <button style={{ ...S.btn, ...S.ghostBtn }} onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {feeds.length === 0 && !adding && <p style={{ ...S.sub, textAlign: 'center', marginTop: 32 }}>No feeds. Subscribe to RSS feeds to monitor news automatically.</p>}

      {feeds.map(f => (
        <div key={f.id} style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <p style={{ ...S.h, margin: '0 0 2px' }}>{f.label || f.url}</p>
              <p style={{ ...S.sub, margin: '0 0 4px', fontSize: 10, wordBreak: 'break-all' }}>{f.url}</p>
              <span style={{ ...S.tag, background: f.enabled ? 'rgba(0,200,100,0.1)' : 'rgba(255,255,255,0.05)', color: f.enabled ? '#00c864' : '#888' }}>{f.enabled ? 'ΓùÅ Active' : 'Γùï Paused'}</span>
              {f.keywords && <span style={S.tag}>≡ƒöì {f.keywords}</span>}
              {f.agent_goal && <span style={{ ...S.tag, background: 'rgba(255,31,53,0.1)', color: '#ff4d5e' }}>≡ƒñû Agent</span>}
              {f.last_checked && <span style={S.tag}>Checked: {new Date(f.last_checked).toLocaleString()}</span>}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button style={{ ...S.btn, ...S.ghostBtn, fontSize: 11 }} onClick={() => toggle(f.id, f.enabled)}>{f.enabled ? 'Pause' : 'Resume'}</button>
              <button style={{ ...S.btn, ...S.ghostBtn, fontSize: 11, color: '#ff4d5e' }} onClick={() => del(f.id)}>Delete</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ApiKeysPanel({ api }: { api: Api }) {
  const [keys, setKeys] = useState<any[]>([]);
  const [label, setLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string|null>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    const r = await api('/api/forge-api-keys');
    if (r.ok) setKeys((await r.json()).keys || []);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!label.trim()) return;
    setCreating(true);
    const r = await api('/api/forge-api-keys', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ label }) });
    if (r.ok) {
      const d = await r.json();
      setNewKey(d.key);
      setLabel('');
      load();
    }
    setCreating(false);
  };

  const del = async (id: string) => {
    await api(`/api/forge-api-keys/${id}`, { method: 'DELETE' });
    load();
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: '16px', color: '#e2e8f0' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>≡ƒöæ External API Keys</h3>
      <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#94a3b8' }}>
        Use these keys to call <code style={{background:'#1e293b',padding:'2px 6px',borderRadius:'4px'}}>/api/v1/run</code> from external systems.
      </p>

      {newKey && (
        <div style={{ background: '#0f2a1a', border: '1px solid #22c55e', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: '#22c55e', marginBottom: '6px' }}>Γ£à Key created ΓÇö copy it now, it won't show again:</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <code style={{ flex: 1, background: '#1e293b', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', wordBreak: 'break-all' }}>{newKey}</code>
            <button onClick={() => copy(newKey)} style={{ background: copied ? '#22c55e' : '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}>
              {copied ? 'Γ£ô Copied' : 'Copy'}
            </button>
          </div>
          <button onClick={() => setNewKey(null)} style={{ marginTop: '8px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '12px' }}>Dismiss</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Key label (e.g. my-app)"
          style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', padding: '8px 12px', fontSize: '13px' }}
          onKeyDown={e => e.key === 'Enter' && create()}
        />
        <button onClick={create} disabled={creating || !label.trim()} style={{ background: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', padding: '8px 16px', cursor: 'pointer', fontSize: '13px' }}>
          {creating ? '...' : 'Create Key'}
        </button>
      </div>

      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', background: '#0f172a', borderRadius: '6px', padding: '10px' }}>
        <strong>Usage:</strong> <code>POST /api/v1/run</code> with header <code>Authorization: Bearer &lt;key&gt;</code> and body <code>{`{"goal":"do something","userId":"..."}`}</code>
      </div>

      {keys.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#475569', padding: '32px', fontSize: '14px' }}>No API keys yet. Create one above.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {keys.map(k => (
            <div key={k.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{k.label}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: '4px' }}>{k.key_preview}...</code>
                  {' ┬╖ '}{k.call_count || 0} calls
                  {k.last_used && ` ┬╖ last used ${new Date(k.last_used).toLocaleDateString()}`}
                </div>
              </div>
              <button onClick={() => del(k.id)} style={{ background: '#7f1d1d', border: 'none', borderRadius: '6px', color: '#fca5a5', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChainBuilderPanel({ api }: { api: Api }) {
  const [chains, setChains] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [steps, setSteps] = useState([{ name: 'Step 1', goal: '' }, { name: 'Step 2', goal: '' }]);
  const [creating, setCreating] = useState(false);
  const [runningId, setRunningId] = useState<string|null>(null);
  const [runs, setRuns] = useState<Record<string, any[]>>({});

  const load = async () => {
    const r = await api('/api/agent-chains');
    if (r.ok) setChains((await r.json()).chains || []);
  };
  useEffect(() => { load(); }, []);

  const addStep = () => setSteps(s => [...s, { name: `Step ${s.length+1}`, goal: '' }]);
  const removeStep = (i: number) => setSteps(s => s.filter((_, idx) => idx !== i));
  const updateStep = (i: number, field: string, val: string) => setSteps(s => s.map((st, idx) => idx === i ? { ...st, [field]: val } : st));

  const create = async () => {
    if (!name.trim() || steps.some(s => !s.goal.trim())) return;
    setCreating(true);
    await api('/api/agent-chains', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, steps }) });
    setName(''); setSteps([{ name: 'Step 1', goal: '' }, { name: 'Step 2', goal: '' }]);
    load(); setCreating(false);
  };

  const runChain = async (chain: any) => {
    setRunningId(chain.id);
    await api(`/api/agent-chains/${chain.id}/run`, { method: 'POST' });
    setTimeout(async () => {
      const r = await api(`/api/agent-chains/${chain.id}/runs`);
      if (r.ok) { const d = await r.json(); setRuns(prev => ({ ...prev, [chain.id]: d.runs })); }
      setRunningId(null); load();
    }, 3000);
  };

  const del = async (id: string) => { await api(`/api/agent-chains/${id}`, { method: 'DELETE' }); load(); };

  return (
    <div style={{ padding: '16px', color: '#e2e8f0' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>Γ¢ô∩╕Å Agent Chain Builder</h3>
      <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#94a3b8' }}>Chain agents together ΓÇö each step's output feeds the next.</p>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Chain name" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', padding: '8px 10px', fontSize: '13px', marginBottom: '12px', boxSizing: 'border-box' }} />
        {steps.map((step, i) => (
          <div key={i} style={{ marginBottom: '10px', background: '#0f172a', borderRadius: '6px', padding: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
              <input value={step.name} onChange={e => updateStep(i, 'name', e.target.value)} style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#e2e8f0', padding: '4px 8px', fontSize: '12px' }} />
              {steps.length > 1 && <button onClick={() => removeStep(i)} style={{ background: '#7f1d1d', border: 'none', borderRadius: '4px', color: '#fca5a5', padding: '4px 8px', cursor: 'pointer', fontSize: '11px' }}>Γ£ò</button>}
            </div>
            <textarea value={step.goal} onChange={e => updateStep(i, 'goal', e.target.value)} placeholder={`Goal for ${step.name}...`} rows={2} style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#e2e8f0', padding: '6px 8px', fontSize: '12px', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={addStep} style={{ background: '#334155', border: 'none', borderRadius: '6px', color: '#e2e8f0', padding: '8px 14px', cursor: 'pointer', fontSize: '12px' }}>+ Step</button>
          <button onClick={create} disabled={creating} style={{ flex: 1, background: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', padding: '8px', cursor: 'pointer', fontSize: '13px' }}>{creating ? 'Creating...' : 'Create Chain'}</button>
        </div>
      </div>

      {chains.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#475569', padding: '24px', fontSize: '14px' }}>No chains yet.</div>
      ) : chains.map(chain => (
        <div key={chain.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>{chain.name}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>{chain.steps?.length || 0} steps ┬╖ {chain.run_count||0} runs{chain.last_run ? ` ┬╖ last run ${new Date(chain.last_run).toLocaleDateString()}` : ''}</div>
            </div>
            <button onClick={() => runChain(chain)} disabled={runningId === chain.id} style={{ background: runningId === chain.id ? '#334155' : '#059669', border: 'none', borderRadius: '6px', color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}>
              {runningId === chain.id ? 'ΓÅ│ Running...' : 'Γû╢ Run'}
            </button>
            <button onClick={() => del(chain.id)} style={{ background: '#7f1d1d', border: 'none', borderRadius: '6px', color: '#fca5a5', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {chain.steps?.map((s: any, i: number) => (
              <span key={i} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', color: '#94a3b8' }}>{i+1}. {s.name}</span>
            ))}
          </div>
          {runs[chain.id]?.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748b', background: '#0f172a', borderRadius: '4px', padding: '6px' }}>
              Last run: {runs[chain.id][0].status} ΓÇö {runs[chain.id][0].step_results?.join(' | ')?.slice(0,200)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ConditionTriggersPanel({ api }: { api: Api }) {
  const [triggers, setTriggers] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', check_url: '', json_path: '', operator: 'contains', threshold: '', agent_goal: '', cooldown_hours: 24 });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const r = await api('/api/condition-triggers');
    if (r.ok) setTriggers((await r.json()).triggers || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name || !form.check_url || !form.threshold || !form.agent_goal) return;
    setSaving(true);
    await api('/api/condition-triggers', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(form) });
    setForm({ name: '', check_url: '', json_path: '', operator: 'contains', threshold: '', agent_goal: '', cooldown_hours: 24 });
    load(); setSaving(false);
  };

  const toggle = async (t: any) => {
    await api(`/api/condition-triggers/${t.id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ enabled: t.enabled ? 0 : 1 }) });
    load();
  };
  const del = async (id: string) => { await api(`/api/condition-triggers/${id}`, { method: 'DELETE' }); load(); };

  const inp = (style?: any) => ({ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', padding: '7px 10px', fontSize: '13px', width: '100%', boxSizing: 'border-box' as const, ...style });

  const OPERATORS = ['contains','not_contains','gt','lt','eq','gte','lte'];

  return (
    <div style={{ padding: '16px', color: '#e2e8f0' }}>
      <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>ΓÜí Condition Triggers</h3>
      <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#94a3b8' }}>Fire an agent when a URL response meets a condition. Checked every 15 min.</p>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '14px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input style={inp()} placeholder="Trigger name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
        <input style={inp()} placeholder="URL to poll (e.g. https://api.coinbase.com/v2/prices/BTC-USD/spot)" value={form.check_url} onChange={e => setForm(f => ({...f, check_url: e.target.value}))} />
        <input style={inp()} placeholder="JSON path (optional, e.g. data.amount)" value={form.json_path} onChange={e => setForm(f => ({...f, json_path: e.target.value}))} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <select style={{...inp(), flex: '0 0 140px'}} value={form.operator} onChange={e => setForm(f => ({...f, operator: e.target.value}))}>
            {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
          </select>
          <input style={inp()} placeholder="Threshold value" value={form.threshold} onChange={e => setForm(f => ({...f, threshold: e.target.value}))} />
        </div>
        <textarea style={{...inp(), resize: 'vertical'}} rows={2} placeholder="Agent goal when condition is met..." value={form.agent_goal} onChange={e => setForm(f => ({...f, agent_goal: e.target.value}))} />
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '12px', color: '#94a3b8' }}>Cooldown (h):</label>
          <input style={{...inp(), width: '80px'}} type="number" value={form.cooldown_hours} onChange={e => setForm(f => ({...f, cooldown_hours: parseInt(e.target.value)||24}))} />
          <button onClick={save} disabled={saving} style={{ flex: 1, background: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', padding: '8px', cursor: 'pointer', fontSize: '13px' }}>{saving ? 'Saving...' : 'Create Trigger'}</button>
        </div>
      </div>

      {triggers.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#475569', padding: '24px', fontSize: '14px' }}>No triggers yet.</div>
      ) : triggers.map(t => (
        <div key={t.id} style={{ background: '#1e293b', border: `1px solid ${t.enabled ? '#334155' : '#1e293b'}`, borderRadius: '8px', padding: '12px', marginBottom: '8px', opacity: t.enabled ? 1 : 0.6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>{t.name}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                {t.operator} "{t.threshold}" ┬╖ fired {t.fire_count||0}├ù
                {t.last_fired ? ` ┬╖ last ${new Date(t.last_fired).toLocaleDateString()}` : ''}
                {t.last_checked ? ` ┬╖ checked ${new Date(t.last_checked).toLocaleTimeString()}` : ''}
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px', wordBreak: 'break-all' }}>{t.check_url}{t.json_path ? ` ΓåÆ ${t.json_path}` : ''}</div>
            </div>
            <button onClick={() => toggle(t)} style={{ background: t.enabled ? '#059669' : '#334155', border: 'none', borderRadius: '6px', color: '#fff', padding: '5px 10px', cursor: 'pointer', fontSize: '11px' }}>{t.enabled ? 'ON' : 'OFF'}</button>
            <button onClick={() => del(t.id)} style={{ background: '#7f1d1d', border: 'none', borderRadius: '6px', color: '#fca5a5', padding: '5px 8px', cursor: 'pointer', fontSize: '11px' }}>Γ£ò</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ToolPlayground({ api }: { api: Api }) {
  const [tools, setTools] = useState<any[]>([]);
  const [selected, setSelected] = useState('');
  const [argsJson, setArgsJson] = useState('{}');
  const [result, setResult] = useState<string|null>(null);
  const [running, setRunning] = useState(false);
  const [argsError, setArgsError] = useState('');

  useEffect(() => {
    api('/api/forge-tools').then(r => r.ok && r.json().then(d => {
      setTools(d.tools || []);
      if (d.tools?.length > 0) setSelected(d.tools[0].name);
    }));
  }, []);

  const run = async () => {
    let args: any;
    try { args = JSON.parse(argsJson); setArgsError(''); } catch(e) { setArgsError('Invalid JSON'); return; }
    setRunning(true); setResult(null);
    const r = await api('/api/forge-tool-test', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ tool: selected, args }) });
    const d = await r.json();
    setResult(d.success ? d.result : `ERROR: ${d.error}`);
    setRunning(false);
  };

  const selectedTool = tools.find(t => t.name === selected);

  return (
    <div style={{ padding: '16px', color: '#e2e8f0' }}>
      <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>≡ƒº¬ Tool Playground</h3>
      <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#94a3b8' }}>Test any FORGE_TOOL directly. Pick a tool, provide args as JSON, run it.</p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        <select value={selected} onChange={e => { setSelected(e.target.value); setResult(null); setArgsJson('{}'); }} style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', padding: '8px 10px', fontSize: '13px' }}>
          {tools.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
        </select>
      </div>

      {selectedTool && (
        <div style={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: '6px', padding: '10px', marginBottom: '10px', fontSize: '12px', color: '#93c5fd' }}>
          ≡ƒôû {selectedTool.desc}
        </div>
      )}

      <div style={{ marginBottom: '10px' }}>
        <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Args (JSON):</label>
        <textarea
          value={argsJson}
          onChange={e => setArgsJson(e.target.value)}
          rows={5}
          style={{ width: '100%', background: '#1e293b', border: `1px solid ${argsError ? '#ef4444' : '#334155'}`, borderRadius: '6px', color: '#e2e8f0', padding: '8px 10px', fontSize: '12px', fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box' }}
        />
        {argsError && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '2px' }}>{argsError}</div>}
      </div>

      <button onClick={run} disabled={running || !selected} style={{ width: '100%', background: running ? '#334155' : '#7c3aed', border: 'none', borderRadius: '6px', color: '#fff', padding: '10px', cursor: 'pointer', fontSize: '14px', marginBottom: '12px' }}>
        {running ? 'ΓÅ│ Running...' : 'Γû╢ Run Tool'}
      </button>

      {result !== null && (
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>Result:</div>
          <pre style={{ margin: 0, fontSize: '12px', color: result.startsWith('ERROR') ? '#f87171' : '#86efac', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{result}</pre>
        </div>
      )}
    </div>
  );
}

function AgentHistoryPanel({ api }: { api: Api }) {
  const [runs, setRuns] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<string|null>(null);
  const PAGE = 20;

  const load = async (p = 0, f = filter) => {
    const params = new URLSearchParams({ limit: String(PAGE), offset: String(p * PAGE) });
    if (f) params.set('name', f);
    const r = await api(`/api/agent-runs?${params}`);
    if (r.ok) { const d = await r.json(); setRuns(d.runs || []); setTotal(d.total || 0); }
  };
  useEffect(() => { load(0, filter); }, []);

  const search = () => { setPage(0); load(0, filter); };

  return (
    <div style={{ padding: '16px', color: '#e2e8f0' }}>
      <h3 style={{ margin: '0 0 10px', fontSize: '16px' }}>≡ƒô£ Agent Run History</h3>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input value={filter} onChange={e => setFilter(e.target.value)} onKeyDown={e => e.key==='Enter' && search()} placeholder="Filter by agent name..." style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', padding: '7px 10px', fontSize: '13px' }} />
        <button onClick={search} style={{ background: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', padding: '7px 14px', cursor: 'pointer', fontSize: '13px' }}>Search</button>
      </div>
      <div style={{ fontSize: '12px', color: '#475569', marginBottom: '8px' }}>{total} total runs</div>
      {runs.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#475569', padding: '32px', fontSize: '14px' }}>No runs found.</div>
      ) : runs.map(r => (
        <div key={r.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px', marginBottom: '6px', cursor: 'pointer' }} onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', background: r.status==='done'||r.status==='completed'?'#065f46':'#1e3a5f', color: r.status==='done'||r.status==='completed'?'#6ee7b7':'#93c5fd', padding: '2px 6px', borderRadius: '4px' }}>{r.status||'done'}</span>
            <div style={{ flex: 1, fontSize: '13px', fontWeight: 500 }}>{r.name || r.goal?.slice(0,50) || 'unnamed'}</div>
            {r.score != null && <span style={{ fontSize: '11px', background: r.score>=70?'#14532d':r.score>=40?'#78350f':'#7f1d1d', color: r.score>=70?'#86efac':r.score>=40?'#fcd34d':'#fca5a5', padding: '2px 7px', borderRadius: '4px', fontWeight: 700 }}>{r.score}/100</span>}
            <div style={{ fontSize: '11px', color: '#475569' }}>{new Date(r.created_at).toLocaleString()}</div>
          </div>
          {expanded === r.id && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Goal: {r.goal?.slice(0,300)}</div>
              {r.score_reason && <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontStyle: 'italic' }}>≡ƒñû Score reason: {r.score_reason}</div>}
              <pre style={{ margin: 0, fontSize: '11px', color: '#94a3b8', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#0f172a', padding: '8px', borderRadius: '4px' }}>{String(r.result||'').slice(0,600)}</pre>
            </div>
          )}
        </div>
      ))}
      {total > PAGE && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
          <button disabled={page===0} onClick={() => { setPage(page-1); load(page-1); }} style={{ background: '#334155', border: 'none', borderRadius: '6px', color: '#e2e8f0', padding: '6px 12px', cursor: 'pointer' }}>ΓåÉ Prev</button>
          <span style={{ fontSize: '12px', color: '#64748b', padding: '6px' }}>{page+1} / {Math.ceil(total/PAGE)}</span>
          <button disabled={(page+1)*PAGE >= total} onClick={() => { setPage(page+1); load(page+1); }} style={{ background: '#334155', border: 'none', borderRadius: '6px', color: '#e2e8f0', padding: '6px 12px', cursor: 'pointer' }}>Next ΓåÆ</button>
        </div>
      )}
    </div>
  );
}

const AGENT_TEMPLATES = [
  { id: 'daily-news', emoji: '≡ƒô░', name: 'Daily News Briefing', desc: 'Fetches top tech news and summarizes it every morning.', cron: '0 8 * * *', prompt: 'Browse https://news.ycombinator.com and summarize the top 5 stories. Be concise.' },
  { id: 'competitor-monitor', emoji: '≡ƒò╡∩╕Å', name: 'Competitor Monitor', desc: 'Checks a competitor homepage weekly for changes.', cron: '0 9 * * 1', prompt: 'Browse [URL] and summarize any new features, pricing changes, or announcements. Compare with prior results.' },
  { id: 'github-stars', emoji: 'Γ¡É', name: 'GitHub Stars Tracker', desc: 'Tracks star count for a GitHub repo daily.', cron: '0 10 * * *', prompt: 'Fetch https://api.github.com/repos/[owner/repo] and report the current stargazers_count. Note if it increased from yesterday.' },
  { id: 'reddit-mention', emoji: '≡ƒæ╛', name: 'Reddit Mention Alert', desc: 'Searches Reddit for brand mentions daily.', cron: '0 9 * * *', prompt: 'Browse https://www.reddit.com/search/?q=[brand] and list any new posts mentioning [brand] from the last 24 hours.' },
  { id: 'price-check', emoji: '≡ƒÆ░', name: 'Price Monitor', desc: 'Checks a product URL daily for price changes.', cron: '0 8 * * *', prompt: 'Browse [product URL] and extract the current price. Alert if it changed from prior run.' },
  { id: 'uptime-check', emoji: '≡ƒƒó', name: 'Site Uptime Monitor', desc: 'Checks if your site is up every hour.', cron: '0 * * * *', prompt: 'Use http_request to GET [your URL] and report the HTTP status code. Alert if not 200.' },
  { id: 'weekly-summary', emoji: '≡ƒôè', name: 'Weekly Agent Summary', desc: 'Summarizes all agent activity from the past week.', cron: '0 9 * * 1', prompt: 'Use list_goals and list_memories to summarize progress made this week. What goals advanced? What needs attention?' },
  { id: 'content-idea', emoji: '≡ƒÆí', name: 'Daily Content Ideas', desc: 'Generates 3 content ideas based on trending topics.', cron: '0 8 * * *', prompt: 'Browse https://trends.google.com/trends/trendingsearches/daily?geo=US and generate 3 content ideas based on top trends. Store as memories.' },
];

function AgentTemplatesPanel({ api }: { api: Api }) {
  const [installing, setInstalling] = useState<string|null>(null);
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [customForm, setCustomForm] = useState({ name: '', cron: '0 8 * * *', prompt: '', persona: '', trigger_schedule_id: '' });
  const [scheduleList, setScheduleList] = useState<any[]>([]);
  const [customSaving, setCustomSaving] = useState(false);
  const [customSaved, setCustomSaved] = useState(false);

  const install = async (tpl: typeof AGENT_TEMPLATES[0]) => {
    setInstalling(tpl.id);
    await api('/api/agent-schedules', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name: tpl.name, prompt: tpl.prompt, cron_expression: tpl.cron, enabled: true }) });
    setInstalled(s => new Set([...s, tpl.id]));
    setInstalling(null);
  };

  const saveCustom = async () => {
    if (!customForm.name || !customForm.prompt) return;
    setCustomSaving(true);
    await api('/api/schedules', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name: customForm.name, cron_expression: customForm.cron, prompt: customForm.prompt, persona: customForm.persona || null, trigger_schedule_id: customForm.trigger_schedule_id || null }) });
    setCustomSaved(true);
    setCustomForm({ name: '', cron: '0 8 * * *', prompt: '', persona: '', trigger_schedule_id: '' });
    setTimeout(() => setCustomSaved(false), 3000);
    setCustomSaving(false);
  };

  useEffect(() => {
    api('/api/schedules').then((d: any) => { if (d?.success) setScheduleList(d.data || []); });
  }, []);

  return (
    <div style={{ padding: '16px', color: '#e2e8f0' }}>
      <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>≡ƒôª Agent Templates</h3>
      <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#94a3b8' }}>One-click installs. Adds a scheduled agent to your roster. Edit the prompt after to customize.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {AGENT_TEMPLATES.map(tpl => (
          <div key={tpl.id} style={{ background: '#1e293b', border: `1px solid ${installed.has(tpl.id) ? '#059669' : '#334155'}`, borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '22px' }}>{tpl.emoji}</div>
            <div style={{ fontWeight: 700, fontSize: '14px' }}>{tpl.name}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', flex: 1 }}>{tpl.desc}</div>
            <div style={{ fontSize: '11px', color: '#475569' }}>cron: {tpl.cron}</div>
            <button onClick={() => install(tpl)} disabled={!!installing || installed.has(tpl.id)} style={{ background: installed.has(tpl.id) ? '#065f46' : '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', padding: '7px', cursor: 'pointer', fontSize: '12px', marginTop: '4px' }}>
              {installed.has(tpl.id) ? 'Γ£ô Installed' : installing === tpl.id ? 'Installing...' : 'Install'}
            </button>
          </div>
        ))}
      </div>

      {/* Custom schedule with persona */}
      <div style={{ marginTop: 20, background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '16px' }}>
        <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: 4 }}>≡ƒÄ¡ Custom Schedule with Persona</div>
        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: 12 }}>Create a schedule and assign an expert persona ΓÇö the agent will think and reason from that role's perspective.</div>
        <input value={customForm.name} onChange={e => setCustomForm(f => ({...f, name: e.target.value}))} placeholder="Schedule name (e.g. Daily SEO Audit)" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', padding: '8px 10px', fontSize: '13px', marginBottom: 8, boxSizing: 'border-box' }} />
        <input value={customForm.cron} onChange={e => setCustomForm(f => ({...f, cron: e.target.value}))} placeholder="Cron expression (e.g. 0 8 * * *)" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', padding: '8px 10px', fontSize: '13px', marginBottom: 8, boxSizing: 'border-box' }} />
        <textarea value={customForm.prompt} onChange={e => setCustomForm(f => ({...f, prompt: e.target.value}))} placeholder="Agent goal / prompt (what should this agent do?)" rows={3} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', padding: '8px 10px', fontSize: '13px', marginBottom: 8, boxSizing: 'border-box', resize: 'vertical' }} />
        <input value={customForm.persona} onChange={e => setCustomForm(f => ({...f, persona: e.target.value}))} placeholder="Persona (optional) ΓÇö e.g. Data Analyst, Security Auditor, Marketing Strategist" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0', padding: '8px 10px', fontSize: '13px', marginBottom: 8, boxSizing: 'border-box' }} />
        <select value={customForm.trigger_schedule_id} onChange={e => setCustomForm(f => ({...f, trigger_schedule_id: e.target.value}))} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: customForm.trigger_schedule_id ? '#e2e8f0' : '#64748b', padding: '8px 10px', fontSize: '13px', marginBottom: 10 }}>
          <option value="">Γ¢ô Run after schedule (cascade trigger ΓÇö optional)</option>
          {scheduleList.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button onClick={saveCustom} disabled={customSaving || !customForm.name || !customForm.prompt} style={{ background: customSaved ? '#065f46' : '#6366f1', border: 'none', borderRadius: '6px', color: '#fff', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
          {customSaved ? 'Γ£ô Saved!' : customSaving ? 'Saving...' : '+ Create Schedule'}
        </button>
      </div>
    </div>
  );
}

function AgentLeaderboard({ api }: { api: Api }) {
  const [board, setBoard] = useState<any[]>([]);
  const [prefs, setPrefs] = useState<any>({ digest_enabled:1, url_monitor_enabled:1, rss_enabled:1, webhook_enabled:1, goal_enabled:1 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api('/api/agent-leaderboard').then(r => r.ok && r.json().then(d => setBoard(d.leaderboard || [])));
    api('/api/notification-prefs').then(r => r.ok && r.json().then(setPrefs));
  }, []);

  const savePrefs = async () => {
    setSaving(true);
    await api('/api/notification-prefs', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(prefs) });
    setSaving(false);
  };

  const medals = ['≡ƒÑç','≡ƒÑê','≡ƒÑë'];

  return (
    <div style={{ padding: '16px', color: '#e2e8f0' }}>
      <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>≡ƒÅå Agent Leaderboard</h3>
      <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#94a3b8' }}>Your top agents ranked by activity.</p>

      {board.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#475569', padding: '32px', fontSize: '14px' }}>No agent runs yet. Start a scheduled agent to see rankings.</div>
      ) : (
        <div style={{ marginBottom: '20px' }}>
          {board.map((a, i) => (
            <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: i < 3 ? '#1a2540' : '#1e293b', border: `1px solid ${i===0?'#fbbf24':i===1?'#94a3b8':i===2?'#cd7c2f':'#334155'}`, borderRadius: '8px', padding: '10px 14px', marginBottom: '6px' }}>
              <div style={{ fontSize: '20px', width: '28px', textAlign: 'center' }}>{medals[i] || `${i+1}`}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{a.name}</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Last run: {a.last_run ? new Date(a.last_run).toLocaleDateString() : 'never'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>{a.total_runs}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>runs</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, color: a.success_rate >= 80 ? '#22c55e' : a.success_rate >= 50 ? '#f59e0b' : '#ef4444' }}>{a.success_rate}%</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>success</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '14px' }}>
        <h4 style={{ margin: '0 0 10px', fontSize: '14px' }}>≡ƒöö Notification Preferences</h4>
        {[['digest_enabled','Daily Digest'],['url_monitor_enabled','URL Monitor Alerts'],['rss_enabled','RSS Match Alerts'],['webhook_enabled','Webhook Triggers'],['goal_enabled','Goal Progress']].map(([key,label]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!prefs[key]} onChange={e => setPrefs((p: any) => ({...p, [key]: e.target.checked ? 1 : 0}))} style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }} />
            <span style={{ fontSize: '13px' }}>{label}</span>
          </label>
        ))}
        <button onClick={savePrefs} disabled={saving} style={{ width: '100%', background: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', padding: '8px', cursor: 'pointer', fontSize: '13px', marginTop: '4px' }}>{saving ? 'Saving...' : 'Save Preferences'}</button>
      </div>
    </div>
  );
}

function AgentEventFeed({ api }: { api: Api }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api('/api/agent-events?limit=100');
      if (r.ok) { const d = await r.json(); setEvents(d.events || []); }
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  const typeColor: Record<string, string> = {
    goal_reached: '#22c55e', alert: '#f59e0b', data_found: '#3b82f6',
    error: '#ef4444', agent_run: '#8b5cf6', watchdog_alert: '#ef4444', cascade_trigger: '#f97316', generic: '#64748b',
  };

  return (
    <div style={{ padding: '16px', color: '#e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>≡ƒôí Agent Event Bus</h3>
        <button onClick={load} disabled={loading} style={{ background: '#334155', border: 'none', borderRadius: '6px', color: '#e2e8f0', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}>{loading ? '...' : 'Γå╗ Refresh'}</button>
      </div>
      <div style={{ fontSize: '12px', color: '#475569', marginBottom: '8px' }}>{events.length} events ΓÇö auto-refreshes every 15s</div>
      {events.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#475569', padding: '32px', fontSize: '14px' }}>No events yet. Agents emit events when they fire alerts, reach goals, or find data.</div>
      ) : events.map(e => (
        <div key={e.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', marginBottom: '6px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ background: typeColor[e.event_type] || '#64748b', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', whiteSpace: 'nowrap', marginTop: '1px' }}>{e.event_type}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px' }}>{Object.keys(e.payload||{}).length > 0 ? JSON.stringify(e.payload).slice(0,200) : '(no payload)'}</div>
            <div style={{ fontSize: '11px', color: '#475569' }}>{new Date(e.created_at).toLocaleString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

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
                        placeholder="Paste a sample of your writing (email, message)ΓÇª"
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
                        res.draft ? <span style={{ color: 'var(--fg-text,#f0f1f5)', fontSize: 11, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{res.draft.slice(0, 300)}{res.draft.length > 300 ? 'ΓÇª' : ''}</span> :
                        res.insight ? `≡ƒÆí ${res.insight}` :
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
                  {running === m.id ? <span className="fg-tool-running">ΓÜÖ∩╕Å</span> : 'Activate'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Content Engine UI ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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
    { id: 'create', label: 'Γ£ì∩╕Å Create' },
    { id: 'schedule', label: '≡ƒôà Schedule' },
    { id: 'publish', label: '≡ƒôñ Publish' },
    { id: 'intel', label: '≡ƒôè Intelligence' },
  ];

  return (
    <div>
      <h3 style={S.h}>Content Engine</h3>
      <p style={S.sub}>Create ΓåÆ Schedule ΓåÆ Publish ΓåÆ Optimize</p>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} style={{ ...S.btn, background: tab === t.id ? 'var(--fg-orange,#ff1f35)' : 'var(--fg-bg3,#1a1a1e)', color: tab === t.id ? '#fff' : 'var(--fg-text3,#888)', border: 'none' }}>{t.label}</button>
        ))}
      </div>

      {tab === 'create' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Brand scraper */}
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)', marginBottom: 8 }}>≡ƒîÉ Brand Extractor</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://yourbusiness.com" style={{ ...S.input, flex: 1 }} />
              <button onClick={scrapeWebsite} disabled={busy==='scrape'} style={{ ...S.btn, ...S.primary }}>{busy==='scrape' ? 'ΓÇª' : 'Extract'}</button>
            </div>
            {brandData && <div style={{ marginTop: 8, fontSize: 11, color: '#4ade80' }}>Γ£ô {brandData.brandName} ┬╖ Colors: {brandData.colors?.slice(0,3).join(', ')}</div>}
          </div>

          {/* Caption gen */}
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)', marginBottom: 8 }}>Γ£ì∩╕Å Caption Generator</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="What's this post about?" style={{ ...S.input, flex: 1 }} />
              <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ ...S.input, width: 'auto', flexShrink: 0 }}>
                {['instagram','facebook','linkedin','twitter'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <button onClick={genCaption} disabled={busy==='caption'} style={{ ...S.btn, ...S.primary, marginBottom: 8 }}>{busy==='caption' ? 'ΓÇª' : 'Γ£¿ Generate Caption'}</button>
            {caption && <textarea value={caption} onChange={e => setCaption(e.target.value)} style={{ ...S.input, height: 80, resize: 'vertical' } as any} />}
          </div>

          {/* Image gen */}
          <div style={S.card}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)', marginBottom: 8 }}>≡ƒû╝∩╕Å AI Image (DALL-E 3)</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} placeholder="Describe the image (or leave blank to use topic)" style={{ ...S.input, flex: 1 }} />
              <button onClick={genImage} disabled={busy==='image'} style={{ ...S.btn, ...S.primary }}>{busy==='image' ? 'ΓÇª' : 'Generate'}</button>
            </div>
            {imageUrl && <img src={imageUrl} alt="Generated" style={{ width: '100%', borderRadius: 8, maxHeight: 200, objectFit: 'cover' }} />}
          </div>

          <button onClick={schedulePost} disabled={!caption || busy==='schedule'} style={{ ...S.btn, ...S.primary, fontSize: 13 }}>
            {busy==='schedule' ? 'ΓÇª' : '≡ƒôà Schedule Post'}
          </button>
        </div>
      )}

      {tab === 'schedule' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--fg-text,#f0f1f5)' }}>{scheduled.length} posts queued</div>
            <button onClick={loadScheduled} style={{ ...S.btn, ...S.ghostBtn, fontSize: 11 }}>Γå╗ Refresh</button>
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
                <div style={{ fontSize: 12, color: 'var(--fg-text2,#ccc)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.caption?.slice(0,80)}ΓÇª</div>
                <div style={{ fontSize: 10, color: 'var(--fg-text3,#888)', marginTop: 4 }}>≡ƒôà {new Date(p.scheduled_for).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'publish' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ ...S.card, borderLeft: '3px solid var(--fg-orange,#ff1f35)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)', marginBottom: 6 }}>≡ƒôÿ Facebook + Instagram (Meta)</div>
            <div style={{ fontSize: 11, color: 'var(--fg-text3,#888)', marginBottom: 8 }}>Connect via Settings ΓåÆ Integrations ΓåÆ Meta. Then use the API directly with your Page Access Token.</div>
            <div style={{ fontSize: 11, color: '#4ade80' }}>Endpoints: POST /api/content/publish/meta</div>
          </div>
          <div style={{ ...S.card, borderLeft: '3px solid #0077b5' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)', marginBottom: 6 }}>≡ƒÆ╝ LinkedIn</div>
            <div style={{ fontSize: 11, color: 'var(--fg-text3,#888)', marginBottom: 8 }}>Requires LinkedIn OAuth token + authorUrn.</div>
            <div style={{ fontSize: 11, color: '#4ade80' }}>Endpoints: POST /api/content/publish/linkedin</div>
          </div>
          <div style={{ ...S.card, borderLeft: '3px solid #e31118' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)', marginBottom: 6 }}>≡ƒô▒ Twilio SMS</div>
            <div style={{ fontSize: 11, color: 'var(--fg-text3,#888)', marginBottom: 8 }}>Set TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM in Railway env vars.</div>
            <div style={{ fontSize: 11, color: '#4ade80' }}>Endpoints: POST /api/content/sms/send ┬╖ /api/content/sms/sequence</div>
          </div>
        </div>
      )}

      {tab === 'intel' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={loadTop} style={{ ...S.btn, ...S.ghostBtn }}>Γå╗ Top Performers</button>
            <button onClick={autoBoost} disabled={busy==='boost'} style={{ ...S.btn, ...S.primary }}>{busy==='boost' ? 'ΓÇª' : 'ΓÜí Auto-Boost Best'}</button>
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
                <div style={{ fontSize: 11, color: 'var(--fg-text2,#ccc)' }}>{p.caption?.slice(0,80)}ΓÇª</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 10, color: 'var(--fg-text3,#888)' }}>
                  <span>Γ¥ñ∩╕Å {perf.likes || 0}</span><span>≡ƒæü∩╕Å {perf.reach || 0}</span><span>≡ƒû▒∩╕Å {perf.clicks || 0}</span><span>≡ƒöü {perf.shares || 0}</span>
                </div>
              </div>
            );
          })}

          {/* A/B Test */}
          <div style={{ ...S.card, marginTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)', marginBottom: 8 }}>≡ƒº¬ A/B Caption Test</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic for A/B test" style={{ ...S.input, flex: 1 }} />
              <button onClick={runAbTest} disabled={busy==='ab'} style={{ ...S.btn, ...S.primary }}>{busy==='ab' ? 'ΓÇª' : 'Generate'}</button>
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

// ΓöÇΓöÇΓöÇ Agent Roster Full ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const AGENT_CATEGORIES = [
  { id: 'business', label: '≡ƒÆ╝ Business Ops', color: '#6366f1' },
  { id: 'industry', label: '≡ƒÅ¡ Industry', color: '#f59e0b' },
  { id: 'execution', label: 'ΓÜí Execution', color: '#22c55e' },
  { id: 'intelligence', label: '≡ƒö¼ Intelligence', color: '#06b6d4' },
];

const AGENT_LIST = [
  { id:'cfo', name:'CFO', icon:'≡ƒÆ░', cat:'business' }, { id:'coo', name:'COO', icon:'ΓÜÖ∩╕Å', cat:'business' },
  { id:'hr', name:'HR', icon:'≡ƒæÑ', cat:'business' }, { id:'legal', name:'Legal', icon:'ΓÜû∩╕Å', cat:'business' },
  { id:'sales', name:'Sales', icon:'≡ƒÄ»', cat:'business' }, { id:'marketing', name:'Marketing', icon:'≡ƒôú', cat:'business' },
  { id:'customer_success', name:'CS', icon:'≡ƒÆ¼', cat:'business' }, { id:'procurement', name:'Procurement', icon:'≡ƒôª', cat:'business' },
  { id:'law_firm', name:'Law Firm', icon:'≡ƒÅ¢∩╕Å', cat:'industry' }, { id:'medical', name:'Medical', icon:'≡ƒÅÑ', cat:'industry' },
  { id:'real_estate', name:'Real Estate', icon:'≡ƒÅá', cat:'industry' }, { id:'restaurant', name:'Restaurant', icon:'≡ƒì╜∩╕Å', cat:'industry' },
  { id:'construction', name:'Construction', icon:'≡ƒÅù∩╕Å', cat:'industry' }, { id:'accounting', name:'Accounting', icon:'≡ƒôè', cat:'industry' },
  { id:'agency', name:'Agency', icon:'≡ƒÄ¿', cat:'industry' }, { id:'ecom', name:'Ecom', icon:'≡ƒ¢Æ', cat:'industry' },
  { id:'email_agent', name:'Email', icon:'≡ƒôº', cat:'execution' }, { id:'calendar_agent', name:'Calendar', icon:'≡ƒôà', cat:'execution' },
  { id:'document_agent', name:'Document', icon:'≡ƒôä', cat:'execution' }, { id:'data_agent', name:'Data', icon:'≡ƒôê', cat:'execution' },
  { id:'scraper_agent', name:'Scraper', icon:'≡ƒò╖∩╕Å', cat:'execution' }, { id:'monitor_agent', name:'Monitor', icon:'≡ƒæü∩╕Å', cat:'execution' },
  { id:'publisher_agent', name:'Publisher', icon:'≡ƒôñ', cat:'execution' }, { id:'outreach_agent', name:'Outreach', icon:'≡ƒô¼', cat:'execution' },
  { id:'strategist', name:'Strategist', icon:'ΓÖƒ∩╕Å', cat:'intelligence' }, { id:'forecaster', name:'Forecaster', icon:'≡ƒö«', cat:'intelligence' },
  { id:'risk', name:'Risk', icon:'ΓÜá∩╕Å', cat:'intelligence' }, { id:'auditor', name:'Auditor', icon:'≡ƒöì', cat:'intelligence' },
  { id:'memory_agent', name:'Memory', icon:'≡ƒºá', cat:'intelligence' }, { id:'critic', name:'Critic', icon:'≡ƒÄ¡', cat:'intelligence' },
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
        <button onClick={() => setView('swarm')} style={{ ...S.btn, background: view==='swarm' ? 'var(--fg-orange,#ff1f35)' : 'var(--fg-bg3)', color: view==='swarm' ? '#fff' : 'var(--fg-text3)', border:'none' }}>≡ƒÉ¥ Swarm (parallel)</button>
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
          <textarea value={task} onChange={e => setTask(e.target.value)} placeholder={`Task for ${AGENT_LIST.find(a=>a.id===selectedAgent)?.name}ΓÇª`} style={{ ...S.input, height: 72, resize: 'vertical', marginBottom: 8 } as any} />
          <textarea value={context} onChange={e => setContext(e.target.value)} placeholder="Optional context (data, background, constraints)ΓÇª" style={{ ...S.input, height: 48, resize: 'vertical', marginBottom: 8 } as any} />
          <button onClick={runAgent} disabled={!task || running} style={{ ...S.btn, ...S.primary, width: '100%', marginBottom: 12 }}>
            {running ? <span className="fg-tool-running">ΓÜÖ∩╕Å</span> : `Γû╢ Run ${AGENT_LIST.find(a=>a.id===selectedAgent)?.name} [${mode}]`}
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
        <textarea value={swarmTask} onChange={e => setSwarmTask(e.target.value)} placeholder="Task to run across all selected agentsΓÇª" style={{ ...S.input, height: 72, resize: 'vertical', marginBottom: 8 } as any} />
        <button onClick={runSwarm} disabled={!swarmTask || swarmAgents.length === 0 || swarmRunning} style={{ ...S.btn, ...S.primary, width: '100%', marginBottom: 12 }}>
          {swarmRunning ? <span className="fg-tool-running">ΓÜÖ∩╕Å</span> : `≡ƒÉ¥ Run Swarm (${swarmAgents.length} agents)`}
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

// ΓöÇΓöÇΓöÇ CASCADE ΓÇö multi-agent chain orchestration ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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
        <div style={{ fontSize: 22 }}>ΓÜí</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)' }}>Cascade</div>
          <div style={{ fontSize: 11, color: 'var(--fg-text3,#888)' }}>Multi-agent chain ΓÇö each agent builds on the last, autonomously</div>
        </div>
      </div>

      <textarea
        value={task}
        onChange={e => setTask(e.target.value)}
        placeholder="Describe the task for the droid to execute autonomouslyΓÇª"
        style={{ width: '100%', background: 'var(--fg-bg2,#1a1a2e)', border: '1px solid var(--fg-border,#2a2a3e)', borderRadius: 8, padding: 10, color: 'var(--fg-text,#f0f1f5)', fontSize: 12, resize: 'vertical', height: 72, outline: 'none', boxSizing: 'border-box' } as any}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 4 }}>
        <textarea
          value={context}
          onChange={e => setContext(e.target.value)}
          placeholder="Optional contextΓÇª"
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
          {planning ? 'ΓÅ│ PlanningΓÇª' : '≡ƒù║∩╕Å Preview Plan'}
        </button>
        <button onClick={runPipeline} disabled={!task.trim() || running}
          style={{ flex: 2, padding: '8px 0', borderRadius: 8, border: 'none', background: running ? '#3a1a2e' : 'linear-gradient(135deg,#ff1f35,#ff6b35)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          {running ? 'ΓÜí Cascade RunningΓÇª' : 'ΓÜí Run Cascade'}
        </button>
      </div>

      {stepsToShow.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-text3,#888)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            {hasResult ? `Γ£à Pipeline Complete ΓÇö ${result.stepsExecuted} steps` : `≡ƒôï Plan ΓÇö ${stepsToShow.length} steps`}
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
                    {isActive ? 'ΓÜÖ' : isDone && stepResult?.status === 'done' ? 'Γ£ô' : step.stepNum}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-text,#f0f1f5)' }}>{step.title}</div>
                    <div style={{ fontSize: 10, color: accentColor }}>{stepResult?.agentName || step.agentId}</div>
                  </div>
                  {isDone && <div style={{ fontSize: 10, color: 'var(--fg-text3,#888)' }}>{stepResult?.durationMs ? `${(stepResult.durationMs/1000).toFixed(1)}s` : ''} {expandedStep === i ? 'Γû▓' : 'Γû╝'}</div>}
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
          <div style={{ fontSize: 11, fontWeight: 700, color: '#ff1f35', marginBottom: 8 }}>≡ƒÅü Final Output</div>
          <div style={{ fontSize: 12, color: 'var(--fg-text,#f0f1f5)', lineHeight: 1.8, whiteSpace: 'pre-wrap', maxHeight: 400, overflowY: 'auto' }}>
            {result.finalOutput}
          </div>
          {result.totalDurationMs && (
            <div style={{ fontSize: 10, color: 'var(--fg-text3,#888)', marginTop: 8 }}>
              ΓÅ▒ {(result.totalDurationMs / 1000).toFixed(1)}s total ┬╖ {result.stepsExecuted} agents chained
            </div>
          )}
        </div>
      )}

      {result?.error && <div style={{ color: "#f87171", fontSize: 12, padding: 10 }}>Error: {result.error}</div>}
    </div>
  );
}
