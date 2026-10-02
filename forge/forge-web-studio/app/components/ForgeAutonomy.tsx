'use client';
// ─── FORGE AUTONOMY UI ───────────────────────────────────────────────────────
// Onboarding wizard, approval inbox, morning dashboard, credit badge,
// voice-first Forge ("Hey Forge"), magic reply, agent cinema, agent roster,
// living-workspace pulse styles. Self-contained — mounted from ForgeApp.tsx.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { utcStamp } from '../../lib/platform-time';
import { useUiLanguage } from '../../lib/ui-language';
import { previewDocument } from '../../lib/html-preview';

type Api = (path: string, opts?: RequestInit) => Promise<any>;

/** Chinese labels for the autonomy panels. Anything not listed falls back to English. */
const AUTONOMY_ZH: Record<string, string> = {
  'Forge Autonomy OS': 'Forge 自主运营中心',
  'Welcome back, ': '欢迎回来，',
  '⚙️ Setup': '⚙️ 设置向导',
  '🌅 Morning': '🌅 晨报',
  '✅ Approvals': '✅ 待审批',
  '🤖 Agents': '🤖 Agent',
  '⚡ Modes': '⚡ 工作模式',
  '🎙️ Voice': '🎙️ 语音',
  '🚀 Moonshots': '🚀 前沿 Agent',
  '🤖 All Agents': '🤖 全部 Agent',
  '⚡ Cascade': '⚡ 级联编排',
  'Good morning': '早上好',
  'Good afternoon': '下午好',
  'Good evening': '晚上好',
  "Here's your day.": '这是你今天的进展。',
  'Nothing needs your approval. All clear. ✨': '没有待审批事项，一切就绪。✨',
  "Last Night's Run": '昨夜运行',
  'new SEO pages drafted': '篇 SEO 页面已起草',
  'posts scheduled for this week': '条内容已排期到本周',
  'review requests in flight': '条评价邀请进行中',
  'pages live total': '个页面已上线',
  'Agents working…': 'Agent 正在执行…',
  'Run nightly pipeline now': '立即运行夜间流水线',
  'Approve All': '全部批准',
  'No runs yet. Hit "Run nightly pipeline now" to watch Forge work, or finish onboarding so it runs at 2am automatically.': '还没有运行记录。点击“立即运行夜间流水线”即可现场查看，或完成设置向导，让它每天凌晨 2 点自动运行。',
  'Hide': '收起',
  'Preview': '预览',
  '✏️ Edit': '✏️ 编辑',
  '💾 Save': '💾 保存',
  '❌ Skip': '❌ 跳过',
  'Approve': '批准',
  'Publish': '发布',
  'Schedule': '排期',
  'Send': '发送',
  'New SEO Page Ready': 'SEO 页面已就绪',
  'Social Post': '社交内容',
  'Email Campaign': '邮件营销',
  'SMS': '短信',
  'Review Request': '评价邀请',
  '💼 Business Operations': '💼 业务运营',
  '⚡ Execution': '⚡ 执行',
  '🔬 Intelligence': '🔬 情报分析',
  '🌌 Moonshots': '🌌 前沿探索',
  '✓ Installed': '✓ 已安装',
  '+ Install': '+ 安装',
  'Paste any email / Slack / DM. Forge drafts the perfect reply in your voice — one tap to copy.': '粘贴任意邮件、Slack 或私信，Forge 会用你的语气拟好回复，一键复制。',
  'From (name/email)': '来自（姓名／邮箱）',
  'Email': '邮件',
  'DM': '私信',
  'Paste the message you received…': '粘贴你收到的消息…',
  'Magic Reply': '智能回复',
  '📋 Copy': '📋 复制',
  'Watch your agents work — every overnight run, through glass.': '透明查看 Agent 的每一次夜间运行。',
  'No runs yet.': '还没有运行记录。',
  'Nightly run': '夜间运行',
  'SEO pages': '篇 SEO 页面',
  'posts': '条内容',
  'reviews': '条评价',
  'Voice not supported in this browser.': '当前浏览器不支持语音识别。',
  'Say': '说',
  'then talk. Ask for your morning brief, say "approve all", or anything else. Forge answers out loud.': '然后开口即可。让它播报晨报、说“全部批准”，或其它任何指令，Forge 会语音回答。',
  '🎙️ Start listening': '🎙️ 开始聆听',
  '⏹ Stop': '⏹ 停止',
  '● Forge is listening to you': '● Forge 正在聆听',
  '○ waiting for "Hey Forge"…': '○ 等待唤醒词 “Hey Forge”…',
  'You said': '你说',
  'Universal Agents': '通用 Agent',
  'One-click AI agents that run end-to-end tasks': '一键运行、端到端完成任务的 AI Agent',
  'Run': '运行',
  'Forge Modes': 'Forge 工作模式',
  'Switch how Forge behaves for your current session': '切换当前会话中 Forge 的工作方式',
  '● ACTIVE': '● 已启用',
  'Standard': '标准',
  'Full Forge interface': '完整 Forge 界面',
  'Focus': '专注',
  'Hide distractions, just the chat': '隐藏干扰，只留对话',
  'War Room': '作战室',
  'Parallel agent runs visible': '并行 Agent 运行全程可见',
  'Overnight': '夜间',
  'Queue tasks, run while you sleep': '排队任务，在你休息时运行',
  'Co-Pilot': '副驾',
  'AI suggests replies & next actions': 'AI 建议回复与下一步动作',
  'Moonshot Agents': '前沿 Agent',
  "AI agents that operate autonomously at a level users can't distinguish from humans": '可自主运转、接近真人水准的 AI Agent',
  'Paste a sample of your writing (email, message)…': '粘贴一段你的写作样本（邮件、消息）…',
  'Negotiation goal (e.g. reduce vendor price by 15%)': '谈判目标（例如：把供应商报价降低 15%）',
  'Activate': '启用',
  'Ghost Agent': '隐形 Agent',
  'Silent email/Slack presence — acts only at 95%+ confidence': '静默驻守邮件／Slack，置信度 95% 以上才行动',
  'Mentor Agent': '教练 Agent',
  'Analyzes your patterns, coaches you to improve': '分析你的工作习惯并给出改进建议',
  'Clone Agent': '分身 Agent',
  'Learns your exact writing voice, indistinguishable from you': '学习你的写作语气，几可乱真',
  'Watchdog Agent': '哨兵 Agent',
  '24/7 monitor — wakes only when something needs attention': '全天候监控，只在需要关注时提醒',
  'Negotiator Agent': '谈判 Agent',
  'Handles vendor/client negotiations via email autonomously': '自主通过邮件处理供应商／客户谈判',
  'Connector Agent': '人脉 Agent',
  'Finds partnership opportunities, drafts intros, tracks follow-ups': '发现合作机会、撰写引荐并跟进进度',
  'Learning your business...': '正在了解你的业务…',
  'Building your agents...': '正在搭建你的 Agent…',
  'Setting up your automations...': '正在配置自动化…',
  'Preparing your morning dashboard...': '正在准备你的晨报面板…',
  'Forge is building your workspace': 'Forge 正在搭建你的工作区',
  'Your AI business OS is live': '你的 AI 业务系统已上线',
  'Open my morning dashboard →': '打开我的晨报面板 →',
  'What kind of business do you run?': '你经营的是什么类型的业务？',
  'Business name (becomes your subdomain)': '业务名称（将作为你的子域名）',
  'What city or cities do you serve?': '你服务哪些城市？',
  'And what services do you offer? (comma-separated — powers your SEO engine)': '你提供哪些服务？（用逗号分隔，将驱动 SEO 引擎）',
  "What's your biggest daily headache?": '日常最让你头疼的是什么？',
  'Your brand': '你的品牌',
  'Logo URL (optional)': 'Logo 链接（选填）',
  'Primary': '主色',
  'Secondary': '辅色',
  'Connect your tools': '连接你的工具',
  'Pick what you use — Forge wires automations around them.': '选择你在用的工具，Forge 会围绕它们搭建自动化。',
  '← Back': '← 上一步',
  'Next →': '下一步 →',
  '⚡ Build my workspace': '⚡ 搭建我的工作区',
  '🍽️ Restaurant': '🍽️ 餐饮',
  '⚖️ Law Firm': '⚖️ 律所',
  '🎨 Agency': '🎨 代理与创意',
  '🔧 Plumber / Trades': '🔧 维修与工程',
  '🛒 Ecommerce': '🛒 电商',
  '✨ Other': '✨ 其它',
  'Following up with clients': '跟进客户',
  'Getting reviews': '获取好评',
  'Marketing': '市场推广',
  'Admin & paperwork': '行政与文书',
  'Finding new customers': '开发新客户',
};

/** Interface language for the autonomy panels, shared with the rest of the workspace. */
function useAutonomyText() {
  const [language] = useUiLanguage();
  const zh = language === 'zh';
  const translate = useCallback((text: string) => (zh ? AUTONOMY_ZH[text] ?? text : text), [zh]);
  return [translate, zh] as const;
}

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
  const [restricted, setRestricted] = useState(false);
  const [zh, setZh] = useState(false);
  useEffect(() => {
    let live = true;
    setBal(null);
    try { const saved = localStorage.getItem('forge_billing_language'); setZh(saved === 'zh' || (!saved && navigator.language.startsWith('zh'))); } catch {}
    const load = async () => {
      try {
        const d = await api('/billing/credits');
        if (!live || !d?.success) return;
        const amount = d.data?.billing?.availableUsd ?? d.data?.balance;
        setBal(typeof amount === 'number' && Number.isFinite(amount) && amount >= 0 ? amount : null);
        setRestricted(d.data?.billing?.spendingRestricted === true);
      } catch {}
    };
    load();
    const t = setInterval(load, 60000);
    return () => { live = false; clearInterval(t); };
  }, [api]);
  if (bal === null) return null;
  const low = !restricted && bal < 10;
  const title = restricted
    ? (zh ? '付款核对中 — 查看账单' : 'Payment review — open billing')
    : (zh ? '当前可用 AI 额度 — 查看账单' : 'Available AI credits — open billing');
  const balanceLabel = bal > 0 && bal < 0.01 ? '<$0.01' : `$${bal.toFixed(2)}`;
  return (
    <div onClick={onTopup} title={title}
      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, cursor: 'pointer', flexShrink: 0,
        background: low ? 'rgba(248,113,113,0.12)' : 'var(--fg-bg4, #1a1a1e)', border: `1px solid ${low ? 'rgba(248,113,113,0.5)' : 'var(--fg-border2, rgba(255,255,255,0.11))'}` }}>
      <span style={{ fontSize: 10 }}>🪙</span>
      <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: low ? '#f87171' : 'var(--fg-text2, #ccc)' }}>{restricted ? (zh ? '核对中 · ' : 'Review · ') : ''}{balanceLabel}</span>
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
  const [T, zh] = useAutonomyText();
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
  const steps = [T('Learning your business...'), T('Building your agents...'), T('Setting up your automations...'), T('Preparing your morning dashboard...')];

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
          <h2 style={S.h}>{T('Forge is building your workspace')}</h2>
          <p style={{ ...S.sub, fontSize: 14, color: 'var(--fg-orange2, #ff4d5e)' }}>{steps[buildStep]}</p>
          <div style={{ height: 6, background: 'var(--fg-bg4,#1a1a1e)', borderRadius: 99, overflow: 'hidden', marginTop: 18 }}>
            <div style={{ height: '100%', width: `${((buildStep + 1) / steps.length) * 100}%`, background: 'linear-gradient(90deg,var(--fg-orange,#ff1f35),#f97316)', transition: 'width 1.5s ease' }} />
          </div>
        </>) : (<>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🚀</div>
          <h2 style={S.h}>{T('Your AI business OS is live')}</h2>
          <p style={S.sub}>{result.agentsCreated} agents created · {result.keywordsQueued} SEO keywords queued{result.subdomain ? ` · ${result.subdomain}.forge.app` : ''}</p>
          <p style={{ ...S.sub, fontStyle: 'italic' }}>Persona: {result.persona}</p>
          <button style={{ ...S.btn, ...S.primary, marginTop: 10 }} onClick={() => { onDone(); }}>{T('Open my morning dashboard →')}</button>
        </>)}
      </div>
    </div>
  );

  const Q = [
    { title: T('What kind of business do you run?'), body: (<>
        <input style={{ ...S.input, marginBottom: 12 }} placeholder={T('Business name (becomes your subdomain)')} value={bizName} onChange={e => setBizName(e.target.value)} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {BIZ_TYPES.map(b => (
            <button key={b.id} onClick={() => setBizType(b.id)} style={{ ...S.btn, padding: '14px 8px', background: bizType === b.id ? 'var(--fg-orange,#ff1f35)' : 'var(--fg-bg4,#1a1a1e)', color: bizType === b.id ? '#fff' : 'var(--fg-text2,#ccc)', border: '1px solid var(--fg-border2,rgba(255,255,255,0.11))' }}>{T(b.label)}</button>
          ))}
        </div></>) },
    { title: T('What city or cities do you serve?'), body: (<>
        <input style={S.input} placeholder="Austin, Round Rock, Cedar Park" value={cities} onChange={e => setCities(e.target.value)} />
        <p style={{ ...S.sub, marginTop: 10 }}>{T('And what services do you offer? (comma-separated — powers your SEO engine)')}</p>
        <input style={S.input} placeholder="Drain cleaning, Water heater repair, Leak detection" value={services} onChange={e => setServices(e.target.value)} /></>) },
    { title: T("What's your biggest daily headache?"), body: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PAINS.map(p => (
            <button key={p} onClick={() => setPain(p)} style={{ ...S.btn, textAlign: 'left', padding: '12px 14px', background: pain === p ? 'var(--fg-odim2,rgba(255,31,53,0.22))' : 'var(--fg-bg4,#1a1a1e)', color: 'var(--fg-text,#f0f1f5)', border: `1px solid ${pain === p ? 'var(--fg-orange,#ff1f35)' : 'var(--fg-border2,rgba(255,255,255,0.11))'}` }}>{T(p)}</button>
          ))}
        </div>) },
    { title: T('Your brand'), body: (<>
        <input style={{ ...S.input, marginBottom: 12 }} placeholder={T('Logo URL (optional)')} value={logoUrl} onChange={e => setLogoUrl(e.target.value)} />
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: 'var(--fg-text3,#888)' }}>{T('Primary')} <input type="color" value={primary} onChange={e => setPrimary(e.target.value)} style={{ marginLeft: 6, verticalAlign: 'middle' }} /></label>
          <label style={{ fontSize: 12, color: 'var(--fg-text3,#888)' }}>{T('Secondary')} <input type="color" value={secondary} onChange={e => setSecondary(e.target.value)} style={{ marginLeft: 6, verticalAlign: 'middle' }} /></label>
        </div></>) },
    { title: T('Connect your tools'), body: (<>
        <p style={S.sub}>{T('Pick what you use — Forge wires automations around them.')}</p>
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
          <span style={S.tag}>{zh ? `第 ${step + 1} / ${Q.length} 步` : `Step ${step + 1} / ${Q.length}`}</span>
          <button onClick={onClose} style={{ ...S.btn, ...S.ghostBtn, padding: '3px 9px' }}>✕</button>
        </div>
        <h2 style={S.h}>{Q[step].title}</h2>
        <div style={{ margin: '16px 0 20px' }}>{Q[step].body}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button disabled={step === 0} onClick={() => setStep(s => s - 1)} style={{ ...S.btn, ...S.ghostBtn, opacity: step === 0 ? 0.3 : 1 }}>{T('← Back')}</button>
          {step < Q.length - 1
            ? <button onClick={() => setStep(s => s + 1)} style={{ ...S.btn, ...S.primary }}>{T('Next →')}</button>
            : <button onClick={submit} style={{ ...S.btn, ...S.primary }}>{T('⚡ Build my workspace')}</button>}
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
  const [T] = useAutonomyText();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(a.content || '');
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const meta = TYPE_META[a.type] || { icon: '🤖', label: a.type, verb: T('Approve') };
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
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)' }}>{meta.icon} {T(meta.label)}</div>
          <div style={{ fontSize: 12, color: 'var(--fg-text2,#ccc)', marginTop: 3 }}>{a.title}</div>
          <div style={{ fontSize: 10, color: 'var(--fg-text3,#888)', marginTop: 3 }}>
            {a.platform && <span style={S.tag}>{a.platform}</span>}
            {pv.word_count ? `${pv.word_count} words · ` : ''}
            {a.scheduled_for ? `scheduled ${new Date(utcStamp(a.scheduled_for)).toLocaleDateString()}` : new Date(a.created_at + 'Z').toLocaleString()}
          </div>
        </div>
      </div>
      {preview && !editing && (
        a.type === 'seo_page'
          ? <iframe title={`${T('Preview')}: ${a.title || T(meta.label)}`} sandbox="" referrerPolicy="no-referrer" srcDoc={previewDocument({ content })}
              style={{ display: 'block', width: '100%', height: 240, marginTop: 10, border: '1px solid var(--fg-border,rgba(255,255,255,0.06))', borderRadius: 8, background: '#fff' }} />
          : <div style={{ marginTop: 10, padding: 10, background: 'var(--fg-bg4,#1a1a1e)', borderRadius: 8, fontSize: 12, color: 'var(--fg-text2,#ccc)', maxHeight: 240, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{content}</div>
      )}
      {editing && (
        <textarea style={{ ...S.input, marginTop: 10, minHeight: 140, fontFamily: 'inherit' }} value={content} onChange={e => setContent(e.target.value)} />
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button style={{ ...S.btn, ...S.ghostBtn, fontSize: 11 }} onClick={() => setPreview(p => !p)}>{preview ? T('Hide') : T('Preview')}</button>
        {!editing
          ? <button style={{ ...S.btn, ...S.ghostBtn, fontSize: 11 }} onClick={() => { setEditing(true); setPreview(false); }}>{T('✏️ Edit')}</button>
          : <button style={{ ...S.btn, ...S.ghostBtn, fontSize: 11 }} onClick={async () => { await act('edit', { content }); setEditing(false); }}>{T('💾 Save')}</button>}
        <div style={{ flex: 1 }} />
        <button disabled={busy} style={{ ...S.btn, fontSize: 11, background: 'rgba(248,113,113,0.15)', color: '#f87171' }} onClick={() => act('reject')}>{T('❌ Skip')}</button>
        <button disabled={busy} style={{ ...S.btn, ...S.primary, fontSize: 11 }} onClick={() => act('approve', editing ? { content } : {})}>✅ {T(meta.verb)}</button>
      </div>
    </div>
  );
}

// ─── Morning dashboard + approval inbox ──────────────────────────────────────
export function MorningDashboard({ api, username }: { api: Api; username?: string }) {
  const [T, zh] = useAutonomyText();
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
  const greet = hour < 12 ? T('Good morning') : hour < 18 ? T('Good afternoon') : T('Good evening');
  return (
    <div>
      <div style={{ ...S.card, background: 'linear-gradient(135deg, rgba(255,31,53,0.10), rgba(14,165,233,0.06))' }} className="fg-living">
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--fg-text,#f0f1f5)' }}>🌅 {greet}{username ? `, ${username}` : ''}. {T("Here's your day.")}</div>
        <div style={{ fontSize: 12, color: 'var(--fg-text2,#ccc)', marginTop: 4 }}>
          {approvals.length > 0 ? (zh ? `${approvals.length} 项待你审批。` : `${approvals.length} thing${approvals.length === 1 ? '' : 's'} need your approval.`) : T('Nothing needs your approval. All clear. ✨')}
        </div>
      </div>
      {data?.lastRun && (
        <div style={S.card}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)', marginBottom: 8 }}>
            {T("Last Night's Run")} {data.lastRun.status === 'complete' ? '✅' : '⚠️'} <span style={{ fontWeight: 400, color: 'var(--fg-text3,#888)' }}>[{new Date(data.lastRun.started_at + 'Z').toLocaleString()}]</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-text2,#ccc)', lineHeight: 1.9 }}>
            📄 {s.seo_pages || 0} {T('new SEO pages drafted')}<br />
            📱 {s.social_posts || 0} {T('posts scheduled for this week')}<br />
            ⭐ {s.review_requests || 0} {T('review requests in flight')}<br />
            🌐 {data.publishedPages || 0} {T('pages live total')}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button disabled={running} style={{ ...S.btn, ...S.ghostBtn }} onClick={runNow}>{running ? <span className="fg-tool-running" style={{ display: 'inline-block' }}>⚙️</span> : '🌙'} {running ? T('Agents working…') : T('Run nightly pipeline now')}</button>
        {approvals.length > 1 && (
          <button style={{ ...S.btn, ...S.primary }} onClick={async () => { await api('/approvals/approve-all', { method: 'POST', body: '{}' }); load(); }}>✅ {T('Approve All')} {approvals.length}</button>
        )}
      </div>
      {approvals.map((a: any) => <ApprovalCard key={a.id} a={a} api={api} onResolved={load} />)}
      {approvals.length === 0 && !data?.lastRun && (
        <div style={{ ...S.card, textAlign: 'center', color: 'var(--fg-text3,#888)', fontSize: 12 }}>
          {T('No runs yet. Hit "Run nightly pipeline now" to watch Forge work, or finish onboarding so it runs at 2am automatically.')}
        </div>
      )}
    </div>
  );
}

// ─── Agent roster browser ────────────────────────────────────────────────────
export function AgentRoster({ api }: { api: Api }) {
  const [T] = useAutonomyText();
  const [roster, setRoster] = useState<any[]>([]);
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  useEffect(() => { (async () => { try { const d = await api('/agents/roster'); if (d?.success) setRoster(d.data); } catch {} })(); }, [api]);
  const groups: Record<string, string> = { operations: '💼 Business Operations', execution: '⚡ Execution', intelligence: '🔬 Intelligence', moonshot: '🌌 Moonshots' };
  return (
    <div>
      {Object.entries(groups).map(([g, label]) => (
        <div key={g}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--fg-text2,#ccc)', margin: '14px 0 8px' }}>{T(label)}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 8 }}>
            {roster.filter(r => r.group === g).map(r => (
              <div key={r.id} style={{ ...S.card, marginBottom: 0, borderLeft: `3px solid ${r.color}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)' }}>{r.name}</div>
                <div style={{ fontSize: 10, color: 'var(--fg-text3,#888)', margin: '4px 0 8px', lineHeight: 1.5 }}>{r.prompt.slice(0, 90)}…</div>
                <button style={{ ...S.btn, fontSize: 10, padding: '4px 10px', background: installed.has(r.id) ? 'var(--fg-bg4,#1a1a1e)' : 'var(--fg-odim2,rgba(255,31,53,0.22))', color: installed.has(r.id) ? 'var(--fg-text3,#888)' : 'var(--fg-orange2,#ff4d5e)' }}
                  onClick={async () => { try { await api(`/agents/roster/${r.id}/install`, { method: 'POST', body: '{}' }); setInstalled(x => new Set([...Array.from(x), r.id])); } catch {} }}>
                  {installed.has(r.id) ? T('✓ Installed') : T('+ Install')}
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
  const [T] = useAutonomyText();
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
      <p style={S.sub}>{T('Paste any email / Slack / DM. Forge drafts the perfect reply in your voice — one tap to copy.')}</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input style={{ ...S.input, flex: 1 }} placeholder={T('From (name/email)')} value={sender} onChange={e => setSender(e.target.value)} />
        <select style={{ ...S.input, width: 120 }} value={channel} onChange={e => setChannel(e.target.value)}>
          <option value="email">{T('Email')}</option><option value="slack">Slack</option><option value="dm">{T('DM')}</option><option value="sms">{T('SMS')}</option>
        </select>
      </div>
      <textarea style={{ ...S.input, minHeight: 110 }} placeholder={T('Paste the message you received…')} value={msg} onChange={e => setMsg(e.target.value)} />
      <button disabled={busy || !msg.trim()} style={{ ...S.btn, ...S.primary, marginTop: 8 }} onClick={go}>{busy ? <span className="fg-tool-running" style={{ display: 'inline-block' }}>✨</span> : '✨'} {T('Magic Reply')}</button>
      {reply && (
        <div style={{ ...S.card, marginTop: 12 }} className={busy ? 'fg-ghost-text' : ''}>
          <div style={{ fontSize: 12, whiteSpace: 'pre-wrap', color: 'var(--fg-text,#f0f1f5)', lineHeight: 1.6 }}>{reply}</div>
          <button style={{ ...S.btn, ...S.ghostBtn, fontSize: 11, marginTop: 8 }} onClick={() => { navigator.clipboard?.writeText(reply); }}>{T('📋 Copy')}</button>
        </div>
      )}
    </div>
  );
}

// ─── Agent Cinema ────────────────────────────────────────────────────────────
export function AgentCinema({ api }: { api: Api }) {
  const [T] = useAutonomyText();
  const [runs, setRuns] = useState<any[]>([]);
  useEffect(() => {
    let live = true;
    const load = async () => { try { const d = await api('/nightly/runs'); if (live && d?.success) setRuns(d.data); } catch {} };
    load(); const t = setInterval(load, 15000);
    return () => { live = false; clearInterval(t); };
  }, [api]);
  return (
    <div>
      <p style={S.sub}>{T('Watch your agents work — every overnight run, through glass.')}</p>
      {runs.length === 0 && <div style={{ ...S.card, textAlign: 'center', color: 'var(--fg-text3,#888)', fontSize: 12 }}>{T('No runs yet.')}</div>}
      {runs.map(r => (
        <div key={r.id} style={S.card} className={r.status === 'running' ? 'fg-living-active' : ''}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--fg-text,#f0f1f5)' }}>
            <span>{r.status === 'running' ? <span className="fg-tool-running" style={{ display: 'inline-block' }}>⚙️</span> : r.status === 'complete' ? '✅' : '⚠️'} {T('Nightly run')}</span>
            <span style={{ fontWeight: 400, color: 'var(--fg-text3,#888)' }}>{new Date(r.started_at + 'Z').toLocaleString()}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-text2,#ccc)', marginTop: 6 }}>
            📄 {r.summary?.seo_pages || 0} {T('SEO pages')} · 📱 {r.summary?.social_posts || 0} {T('posts')} · ⭐ {r.summary?.review_requests || 0} {T('reviews')}
            {(r.summary?.errors || []).length > 0 && <div style={{ color: '#f87171', marginTop: 4 }}>⚠ {(r.summary.errors as string[]).slice(0, 3).join(' · ')}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Voice-First Forge ("Hey Forge") ────────────────────────────────────────
export function VoiceForge({ api }: { api: Api }) {
  const [T, zh] = useAutonomyText();
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
    if (!SR) { setSpeech(T('Voice not supported in this browser.')); return; }
    const rec = new SR(); recRef.current = rec;
    rec.continuous = true; rec.interimResults = false; rec.lang = zh ? 'zh-CN' : 'en-US';
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
      <p style={S.sub}>{T('Say')} <b style={{ color: 'var(--fg-orange2,#ff4d5e)' }}>"Hey Forge"</b> {T('then talk. Ask for your morning brief, say "approve all", or anything else. Forge answers out loud.')}</p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {!listening
          ? <button style={{ ...S.btn, ...S.primary }} onClick={start}>{T('🎙️ Start listening')}</button>
          : <button style={{ ...S.btn, background: 'rgba(248,113,113,0.2)', color: '#f87171' }} onClick={stop}>{T('⏹ Stop')}</button>}
        {listening && <span className="fg-ghost-text" style={{ fontSize: 11, color: 'var(--fg-orange2,#ff4d5e)' }}>{active ? T('● Forge is listening to you') : T('○ waiting for "Hey Forge"…')}</span>}
      </div>
      {transcript && <div style={{ ...S.card, marginTop: 12 }}><div style={{ fontSize: 10, color: 'var(--fg-text3,#888)' }}>{T('You said')}</div><div style={{ fontSize: 12, color: 'var(--fg-text,#f0f1f5)' }}>{transcript}</div></div>}
      {speech && <div style={{ ...S.card, borderLeft: '3px solid var(--fg-orange,#ff1f35)' }}><div style={{ fontSize: 10, color: 'var(--fg-text3,#888)' }}>Forge</div><div style={{ fontSize: 12, color: 'var(--fg-text,#f0f1f5)', lineHeight: 1.6 }}>{speech}</div></div>}
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
  const [T] = useAutonomyText();
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
      <h3 style={S.h}>{T('Forge Modes')}</h3>
      <p style={S.sub}>{T('Switch how Forge behaves for your current session')}</p>
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
              <div style={{ fontSize: 13, fontWeight: 700, color: on ? 'var(--fg-orange2,#ff4d5e)' : 'var(--fg-text,#f0f1f5)' }}>{T(m.name)}</div>
              <div style={{ fontSize: 11, color: 'var(--fg-text3,#888)', marginTop: 2 }}>{T(m.desc)}</div>
              {on && <div style={{ fontSize: 10, color: 'var(--fg-orange2,#ff4d5e)', marginTop: 6, fontWeight: 700 }}>{T('● ACTIVE')}</div>}
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
  const [T] = useAutonomyText();
  const [tab, setTab] = useState<'dashboard'|'approvals'|'modes'|'voice'>('dashboard');
  const tabs: { id: typeof tab; label: string }[] = [
    { id: 'dashboard', label: T('🌅 Morning') },
    { id: 'approvals', label: T('✅ Approvals') },
    { id: 'modes', label: T('⚡ Modes') },
    { id: 'voice', label: T('🎙️ Voice') },
  ];

  return (
    <div style={S.panel} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={S.modal}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ ...S.h, fontSize: 18 }}>{T('Forge Autonomy OS')}</h2>
            {username && <p style={S.sub}>{T('Welcome back, ')}{username}</p>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {onOpenOnboarding && (
              <button onClick={onOpenOnboarding} style={{ ...S.btn, ...S.ghostBtn, fontSize: 11 }}>
                {T('⚙️ Setup')}
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
        {tab === 'modes' && <ForgeModes onModeChange={onModeChange} />}
        {tab === 'voice' && <VoiceForge api={api} />}
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
                <div style={{ fontSize: 10, color: 'var(--fg-text3,#888)', marginTop: 4 }}>📅 {new Date(utcStamp(p.scheduled_for)).toLocaleString()}</div>
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
            <div style={{ fontSize: 11, color: 'var(--fg-text3,#888)', marginBottom: 8 }}>Set TWILIO_SID, TWILIO_TOKEN, and TWILIO_FROM in the control-plane environment.</div>
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
