'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import styles from './WorkspaceChrome.module.css';

export function WorkspaceNavigation({ active, expanded, zh, onNavigate, children }: {
  active: string; expanded: boolean; zh: boolean;
  onNavigate: (destination: string) => void; children: ReactNode;
}) {
  const links = [
    ['workspace', '01', 'Tasks', '任务'],
    ['dreamtools', '02', 'AI Tools', 'AI 工具'],
    ['files', '03', 'Agent studio & library', 'Agent 工作台与资料库'],
    ['runs', '04', 'Run history', '运行记录'],
    ['piworkflows', '05', 'Workflows', '工作流'],
    ['proceduralskills', '06', 'Skill library', 'Skill 库'],
    ['connections', '07', 'Connections', '连接管理'],
    ['billing', '$', 'Usage & plan', '用量与套餐'],
    ['settings', '↗', 'Settings', '设置'],
  ];
  return <nav aria-label={zh ? '工作区导航' : 'Workspace navigation'} className={styles.navigation}>
    {expanded && <p className={styles.eyebrow}>{zh ? '你的工作区' : 'YOUR WORKSPACE'}</p>}
    {links.map(([id, mark, en, cn]) => <button key={id} title={zh ? cn : en}
      aria-current={active === id || (id === 'workspace' && active === 'home') ? 'page' : undefined}
      onClick={() => onNavigate(id)} className={styles.navLink}>
      <span className={styles.navMark} aria-hidden="true">{mark}</span>{expanded && <span>{zh ? cn : en}</span>}
    </button>)}
    <details className={styles.moreTools}>
      <summary title={zh ? '更多工具' : 'More tools'}>{expanded ? (zh ? '更多工具' : 'More tools') : '···'}</summary>
      {children}
    </details>
  </nav>;
}

export function WorkspaceHeader({ title, zh, controls, children, onLibrary, onPanel, panelOpen, mobile, taskKey, taskTools }: {
  title: string; zh: boolean; controls: ReactNode; children: ReactNode;
  onLibrary: () => void; onPanel: () => void; panelOpen: boolean;
  mobile: boolean; taskKey: string; taskTools: ReactNode;
}) {
  const [advanced, setAdvanced] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const labelId = useId(), optionsId = useId();
  useEffect(() => { setSettingsOpen(false); setAdvanced(false); }, [mobile, taskKey]);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (settingsOpen && mobile && !element.open) element.showModal();
    else if (!settingsOpen && element.open) element.close();
  }, [settingsOpen, mobile]);
  const options = <div id={optionsId} hidden={!advanced} className={styles.advanced}>
    <p className={styles.eyebrow}>{zh ? '高级工具与响应设置' : 'ADVANCED TOOLS & RESPONSE SETTINGS'}</p>
    {children}
  </div>;
  return <><header className={styles.header} data-testid="workspace-header">
    <div className={styles.titleRow}>
      <div className={styles.titleBlock}><span className={styles.eyebrow}>{zh ? 'FORGE / 任务' : 'FORGE / TASKS'}</span><h1 title={title}>{title}</h1></div>
      <div className={styles.actions}>
        {mobile ? <button ref={trigger} type="button" onClick={() => setSettingsOpen(true)} aria-haspopup="dialog" aria-expanded={settingsOpen}>{zh ? '任务设置' : 'Task settings'} <span aria-hidden="true">☷</span></button> : <>
        <button onClick={onLibrary}>{zh ? 'Agent 工作台' : 'Agent studio'} <span aria-hidden="true">↗</span></button>
        <button onClick={onPanel} aria-pressed={panelOpen} className={styles.panelToggle}>{zh ? '任务面板' : 'Task panel'}</button>
        <button onClick={() => setAdvanced(value => !value)} aria-expanded={advanced} aria-controls={optionsId}>{zh ? '选项' : 'Options'} <span aria-hidden="true">{advanced ? '−' : '+'}</span></button>
        </>}
      </div>
    </div>
    {!mobile && <><div className={styles.controls}>{controls}</div>{options}</>}
  </header>
  {mobile ? <dialog ref={dialog} className={styles.sheet} aria-labelledby={labelId}
    onCancel={() => setSettingsOpen(false)} onClose={() => { setSettingsOpen(false); trigger.current?.focus(); }}
    onClick={event => { if (event.target !== event.currentTarget) return; const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setSettingsOpen(false); }}>
    <div className={styles.sheetHeading}><div><span className={styles.eyebrow}>FORGE / {zh ? '当前任务' : 'CURRENT TASK'}</span><h2 id={labelId}>{zh ? '任务设置' : 'Task settings'}</h2><p title={title}>{title}</p></div><button type="button" autoFocus aria-label={zh ? '关闭任务设置' : 'Close task settings'} onClick={() => setSettingsOpen(false)}>×</button></div>
    <div className={styles.sheetBody}>
      <div className={styles.controls}>{controls}</div>
      <div className={styles.taskTools}>{taskTools}</div>
      <div className={styles.sheetActions}><button type="button" onClick={() => { setSettingsOpen(false); onLibrary(); }}>{zh ? 'Agent 工作台' : 'Agent studio'} ↗</button><button type="button" aria-expanded={advanced} aria-controls={optionsId} onClick={() => setAdvanced(value => !value)}>{zh ? '高级选项' : 'Advanced options'} {advanced ? '−' : '+'}</button></div>
      {options}
    </div>
  </dialog> : taskTools}
  </>;
}

type ManagedModel = { id: string; name: string; tier: string; available: boolean; isDefault?: boolean; pricing: { input: number; output: number } };
type PersonalModel = { id: string; name: string; provider: string };
export function WorkspaceModelPicker({ api, value, onChange, locked, zh, onBilling, onSettings, personalOptions }: {
  api: (path: string) => Promise<any>; value: string; onChange: (id: string) => void;
  locked: boolean; zh: boolean; onBilling: () => void; onSettings: () => void; personalOptions: PersonalModel[];
}) {
  const apiRef = useRef(api); apiRef.current = api;
  const [models, setModels] = useState<ManagedModel[]>([]), [personal, setPersonal] = useState<PersonalModel[]>([]), [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let current = true; setStatus('loading');
    Promise.all([apiRef.current('/desktop/models').catch(() => null), apiRef.current('/keys').catch(() => null)]).then(([catalogue, keys]) => {
      const managed = catalogue?.success !== false && Array.isArray(catalogue?.data) ? catalogue.data : null;
      const saved = keys?.success !== false && keys?.data && typeof keys.data === 'object' ? keys.data : null;
      if (!managed && !saved) throw new Error('CATALOG_UNAVAILABLE');
      if (current) {
        setModels(managed || []);
        setPersonal(personalOptions.filter(model => saved?.[`has_${model.provider}`] && !['platform', 'env'].includes(saved[`${model.provider}_key`])));
        setStatus('ready');
      }
    }).catch(() => { if (current) setStatus('error'); });
    return () => { current = false; };
  }, [revision, personalOptions]);
  const valueRef = useRef(value); valueRef.current = value;
  const onChangeRef = useRef(onChange); onChangeRef.current = onChange;
  useEffect(() => {
    // First task on a fresh account: choose a model the account can run.
    if (locked || status !== 'ready' || valueRef.current) return;
    const fallback = models.find(model => model.isDefault && model.available) || models.find(model => model.available) || personal.find(model => model.id === 'gpt-4o-mini') || personal[0];
    if (fallback) onChangeRef.current(fallback.id);
  }, [status, models, personal, locked]);
  const selected = models.find(model => model.id === value);
  const personalSelected = personal.find(model => model.id === value);
  return <div className={styles.modelPicker}>
    <label><span>{zh ? '模型' : 'Model'}</span><select aria-label={zh ? '任务模型' : 'Task model'} value={value} disabled={locked || status !== 'ready'} onChange={event => onChange(event.target.value)}>
      {!selected && !personalSelected && <option value={value}>{value || (zh ? '选择模型' : 'Choose a model')}</option>}
      {[['flagship', 'Flagship', '旗舰'], ['balanced', 'Balanced', '均衡'], ['lightweight', 'Lightweight', '轻量']].map(([tier, en, cn]) => <optgroup key={tier} label={zh ? cn : en}>
        {models.filter(model => model.tier === tier).map(model => <option key={model.id} value={model.id} disabled={!model.available}>{model.name}{model.pricing.input === 0 && model.pricing.output === 0 ? (zh ? ' · 当前免费' : ' · free now') : !model.available ? (zh ? ' · 需付费额度' : ' · paid credit required') : ''}</option>)}
      </optgroup>)}
      {personal.length > 0 && <optgroup label={zh ? '自备密钥' : 'Your API key'}>{personal.map(model => <option key={`${model.provider}:${model.id}`} value={model.id}>{model.name}</option>)}</optgroup>}
    </select></label>
    {status === 'loading' && <span className={styles.rate}>{zh ? '读取模型…' : 'Loading models…'}</span>}
    {status === 'error' && <button onClick={() => setRevision(value => value + 1)}>{zh ? '模型读取失败 · 重试' : 'Models unavailable · retry'}</button>}
    {status === 'ready' && !models.length && !personal.length && <button className={styles.billingLink} onClick={onSettings}>{zh ? '连接模型服务' : 'Connect a model provider'} ↗</button>}
    {selected && <span className={styles.rate}>{locked ? (zh ? '版本已固定 · ' : 'Version locked · ') : ''}{selected.pricing.input === 0 && selected.pricing.output === 0 ? (zh ? '当前免费 · 受 OpenRouter 限额约束' : 'Free now · OpenRouter limits apply') : <>{zh ? '输入' : 'In'} ${selected.pricing.input} / {zh ? '输出' : 'out'} ${selected.pricing.output} <span title={zh ? '每百万 tokens 的基础展示价，按实际用量核对结算。' : 'Base price per million tokens. Charges settle against actual usage.'}>/ 1M</span></>}</span>}
    {personalSelected && <span className={styles.rate}>{zh ? '由模型服务商计费' : 'Billed by your provider'}</span>}
    <button className={styles.billingLink} onClick={onBilling}>{zh ? '用量与套餐' : 'Usage & plan'} ↗</button>
  </div>;
}

export function WorkspaceWelcome({ zh, name, published, onStudio, onPrompt }: {
  zh: boolean; name?: string; published: boolean; onStudio: () => void; onPrompt: (prompt: string) => void;
}) {
  const examples = zh ? [
    ['01', '把资料变成决策', '请先确认可用资料，提炼关键发现、证据和待确认事项，整理成一份决策简报。'],
    ['02', '分析数据与趋势', '请先确认数据文件和字段，再分析主要趋势，生成图表并解释计算口径。'],
    ['03', '完成一个多步任务', '请帮我把任务拆成可执行步骤，先确认输入与交付标准，再逐步执行并检查结果。'],
  ] : [
    ['01', 'Turn sources into decisions', 'First check the available sources. Build a decision brief with key findings, supporting evidence and open questions.'],
    ['02', 'Find the story in your data', 'First confirm the data file and fields. Analyze the main trends, create a chart and explain the calculations.'],
    ['03', 'Work through a larger task', 'Help me break a task into executable steps. Confirm the inputs and acceptance criteria, then execute and check the results.'],
  ];
  return <section className={styles.welcome} data-testid="workspace-welcome">
    <div className={styles.welcomeMark} aria-hidden="true">F<span>↗</span></div>
    <p className={styles.eyebrow}>{published ? (zh ? '你的 AGENT 已就绪' : 'YOUR AGENT IS READY') : (zh ? '从意图到交付' : 'FROM INTENT TO DELIVERY')}</p>
    <h2>{published ? (zh ? `交给 ${name}。` : `Put ${name} to work.`) : (zh ? '让想法，成为完成的工作。' : 'Make room for work that gets done.')}</h2>
    <p className={styles.intro}>{published ? (zh ? '此任务使用你发布的指令、模型和资料版本。描述目标与期望产物，从这里开始。' : 'This task uses your published instructions, model and source version. Start with the outcome you need.') : (zh ? '描述目标开始任务，或把你的方法和资料做成可测评、可复用的 Agent。' : 'Start with an outcome. Or turn your expertise and sources into an Agent you can evaluate and use again.')}</p>
    {!published && <button className={styles.studioButton} onClick={onStudio}>{zh ? '创建我的 Agent' : 'Create my Agent'} <span aria-hidden="true">↗</span></button>}
    <div className={styles.examples}>{examples.map(([number, title, prompt]) => <button key={number} onClick={() => onPrompt(prompt)}><span className={styles.exampleNumber}>{number}</span><strong>{title}</strong><span className={styles.exampleArrow} aria-hidden="true">↗</span></button>)}</div>
    <p className={styles.footnote}>{zh ? '示例会填入输入框，由你确认后发送。模型运行消耗 Forge 额度。' : 'Examples fill the composer for you to review. Model runs use Forge credit.'}</p>
  </section>;
}
