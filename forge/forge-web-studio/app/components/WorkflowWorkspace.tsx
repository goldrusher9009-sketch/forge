'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { assertAccountToken, refreshAccountToken, sessionRevision } from '../../lib/session-state';
import styles from './WorkflowWorkspace.module.css';
import { WorkflowEventTriggers, newReceiverKey, eventError, type ReceiverSecret } from './WorkflowEventTriggers';

type Step = { id: string; name: string; instruction: string; dependsOn: string[]; output: string; reviewRequired: boolean; minBytes?: number; mustContain?: string[] };
type Artifact = { id: string | number; path: string; sha256: string; byteSize: number; preview?: string };
type Attempt = { stage: string; runId?: string; status: string; cost: number; artifacts: Artifact[] };
type Definition = { name: string; prompt: string; model?: string; maxCostUsd: number; maxAttempts: number; maxConcurrent: number; steps: Step[] };
type Workflow = { eventSource?: { eventId: string; type: string; objective: string; data: unknown }; id: string; name: string; status: string; version: number; spent_usd: number; created_at: number; definition: Definition; checkpoint: { attempts: Attempt[]; reviews?: { stepId: string; decision: string }[]; error?: string } };
type Job = { id: string; name: string; status: string; next_run_at: number; run_count: number; max_runs: number; total_budget_usd: number; last_workflow_id?: string };
type Model = { id: string; name: string; available: boolean; isDefault?: boolean };
type Api = (path: string, options?: RequestInit) => Promise<any>;
const terminal = new Set(['completed', 'failed', 'rejected', 'cancelled', 'budget_exceeded', 'evidence_changed']);
const post = (body: unknown = {}): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });
const latest = (flow: Workflow, id: string) => flow.checkpoint.attempts.filter(attempt => attempt.stage === id).at(-1);
const money = (value: number) => '$' + value.toFixed(value > 0 && value < .01 ? 5 : 2);
const statusLabels: Record<string, [string, string]> = {
  queued: ['Queued', '排队中'], launching: ['Starting', '启动中'], running: ['Running', '执行中'],
  awaiting_review: ['Your review', '待你审核'], awaiting_run_approval: ['Action approval', '待操作授权'],
  awaiting_accounting: ['Settling usage', '用量核对中'], cancelling: ['Stopping', '停止中'],
  completed: ['Completed', '已完成'], done: ['File verified', '文件已验证'], failed: ['Failed', '未通过'],
  rejected: ['Rejected', '已拒绝'], cancelled: ['Cancelled', '已取消'], blocked: ['Needs attention', '需要处理'],
  budget_exceeded: ['Budget reached', '已达预算'], evidence_changed: ['File changed', '文件已变更'],
  waiting: ['Waiting', '等待依赖'], active: ['Scheduled', '已安排'], dispatched: ['Dispatched', '已触发'], approved: ['Approved', '审核通过'],
};
function template(zh: boolean, parallel = false): Step[] {
  const research: Step = { id: 'research', name: zh ? '资料研究' : 'Research', instruction: zh ? '研究目标，记录来源、关键事实、假设和待确认事项。' : 'Research the objective. Record sources, key facts, assumptions and open questions.', dependsOn: [], output: 'research.md', reviewRequired: true, minBytes: 100, mustContain: [] };
  const risks: Step = { id: 'risks', name: zh ? '风险分析' : 'Risk analysis', instruction: zh ? '独立分析目标的风险、限制和反对观点，并记录证据。' : 'Independently examine risks, constraints and counterarguments. Record supporting evidence.', dependsOn: [], output: 'risks.md', reviewRequired: true, minBytes: 100, mustContain: [] };
  return [research, ...(parallel ? [risks] : []), { id: 'delivery', name: zh ? '汇总交付' : 'Deliver', instruction: zh ? '结合已审核的上游资料生成最终简报，明确结论、证据和未解决问题。' : 'Create the final brief from the reviewed upstream references. Distinguish conclusions, evidence and unresolved questions.', dependsOn: parallel ? ['research', 'risks'] : ['research'], output: 'deliverable.md', reviewRequired: false, minBytes: 100, mustContain: [] }];
}

export function WorkflowWorkspace({ api, apiBase, token, zh, onBilling }: { api: Api; apiBase: string; token: string; zh: boolean; onBilling: () => void }) {
  const t = (en: string, cn: string) => zh ? cn : en;
  const label = (status: string) => statusLabels[status]?.[zh ? 1 : 0] || status;
  const apiRef = useRef(api); apiRef.current = api;
  const mounted = useRef(false), loadingRef = useRef(false), acting = useRef(false), generation = useRef(0);
  const [flows, setFlows] = useState<Workflow[]>([]), [jobs, setJobs] = useState<Job[]>([]), [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [busy, setBusy] = useState(''), [notice, setNotice] = useState('');
  const [selected, setSelected] = useState(''), [editing, setEditing] = useState(false), [confirmStop, setConfirmStop] = useState('');
  const [draft, setDraft] = useState<Definition>({ name: '', prompt: '', maxCostUsd: 3, maxAttempts: 2, maxConcurrent: 2, model: '', steps: template(zh) });
  const [runAt, setRunAt] = useState(''), [repeat, setRepeat] = useState(0), [maxRuns, setMaxRuns] = useState(2);
  const [eventMode, setEventMode] = useState(false), [eventType, setEventType] = useState('form.submitted'), [eventMaxRuns, setEventMaxRuns] = useState(10), [eventExpiry, setEventExpiry] = useState(''), [eventConsent, setEventConsent] = useState(false);
  const [receiverSecret, setReceiverSecret] = useState<ReceiverSecret | null>(null);
  useEffect(() => setEventConsent(false), [draft.maxCostUsd, eventMaxRuns, eventExpiry]);
  const [runDetails, setRunDetails] = useState<any>(null);
  const submission = useRef<{ body: string; key: string; receiverKey?: string } | null>(null);
  const request = useCallback(async (path: string, options?: RequestInit) => {
    const response = await apiRef.current(path, options);
    if (response?.success === false || response?.error) throw new Error(response.error || 'REQUEST_FAILED');
    return response;
  }, []);
  const refresh = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    const sequence = generation.current;
    try {
      const [runs, scheduled] = await Promise.all([request('/pi-workflows'), request('/pi-jobs')]);
      if (!mounted.current || sequence !== generation.current) return;
      setFlows(runs.data); setJobs(scheduled.data);
    } catch (caught: any) { if (mounted.current && sequence === generation.current) setError(caught.message); }
    finally { loadingRef.current = false; if (mounted.current) setLoading(false); }
  }, [request]);
  const loadModels = useCallback(async () => {
    try {
      const result = await request('/desktop/models');
      if (!mounted.current) return;
      setModels(result.data);
      const model = result.data.find((item: Model) => item.isDefault && item.available) || result.data.find((item: Model) => item.available);
      setDraft(current => ({ ...current, model: current.model || model?.id || '' }));
    } catch (caught: any) { if (mounted.current) setError(caught.message); }
  }, [request]);
  useEffect(() => {
    mounted.current = true;
    void refresh();
    void loadModels();
    const timer = setInterval(() => { if (!acting.current && document.visibilityState === 'visible') void refresh(); }, 4000);
    return () => { mounted.current = false; generation.current++; clearInterval(timer); };
  }, [loadModels, refresh]);
  const act = async (name: string, operation: () => Promise<void>) => {
    if (acting.current) return;
    acting.current = true; generation.current++; setBusy(name); setError(''); setNotice('');
    try { await operation(); } catch (caught: any) { if (mounted.current) setError(caught.message || 'REQUEST_FAILED'); }
    finally { acting.current = false; if (mounted.current) { setBusy(''); void refresh(); } }
  };
  const flow = flows.find(item => item.id === selected);
  const updateStep = (id: string, change: Partial<Step>) => setDraft(current => ({ ...current, steps: current.steps.map(step => step.id === id ? { ...step, ...change } : step) }));
  const minimumBudget = Math.max(.1, draft.steps.length * draft.maxAttempts * .05);
  const perAttempt = Math.floor((draft.maxCostUsd + 1e-9) * 100 / (draft.steps.length * draft.maxAttempts)) / 100;
  const errorText = (code: string) => {
    const known: Record<string, [string, string]> = {
      WORKFLOW_VERSION_CONFLICT: ['The workflow changed. Review its latest state before trying again.', '工作流状态已更新，请查看最新结果后重试。'],
      WORKFLOW_BUDGET_TOO_SMALL: ['Increase the budget to cover every step and allowed attempt.', '请提高预算，以覆盖每一步及允许的尝试次数。'],
      WORKFLOW_ADMISSION_UNCONFIRMED: ['A step could not start. Check your model credit, then resume; existing work is preserved.', '步骤暂未启动。请检查模型额度后恢复执行，已有结果会保留。'],
      WORKFLOW_ARTIFACT_CHECK_FAILED: ['A required file did not pass its checks. Inspect the step and create a revised workflow if needed.', '要求的文件未通过检查。请查看步骤详情，必要时复制并调整工作流。'],
      WORKFLOW_REVIEWED_EVIDENCE_CHANGED: ['A verified file changed. Execution stopped; inspect the source before starting a new workflow.', '已验证文件发生变化，执行已停止。请核对来源后重新创建工作流。'],
      WORKFLOW_RUN_STATE_UNAVAILABLE: ['Run details are temporarily unavailable. Refresh and resume when service returns.', '运行详情暂不可用。服务恢复后可刷新并继续。'],
      WORKFLOW_RUNTIME_UNAVAILABLE: ['Execution service is temporarily unavailable. Resume when service returns.', '执行服务暂不可用，恢复后可继续。'],
      WORKFLOW_INVALID_RUN_AT: ['Choose a future start time.', '请选择未来的开始时间。'],
      WORKFLOW_DUPLICATE_OUTPUT: ['Use a different output filename for every step.', '请为每个步骤使用不同的交付文件名。'],
      WORKFLOW_INVALID_CHECKS: ['Use up to eight required phrases, each at most 500 characters.', '最多设置 8 项必含文字，每项不超过 500 个字符。'],
      WORKFLOW_IDEMPOTENCY_CONFLICT: ['This submission was already received with different details. Refresh to locate the saved workflow.', '此次提交已保存，但内容与当前不同。请刷新找到已保存的工作流。'],
      ACCOUNT_SESSION_CHANGED: ['Your account changed. Reopen the workspace.', '登录账号已变化，请重新打开工作区。'],
    };
    if (code.startsWith('EVENT_')) return eventError(code, zh);
    return known[code]?.[zh ? 1 : 0] || t('The operation could not finish. Refresh to check its state, then try again. Reference: ', '操作未完成，请先刷新确认状态后重试。参考：') + code;
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void act('create', async () => {
      const definition = { ...draft, steps: draft.steps.map(step => ({ ...step, mustContain: (step.mustContain || []).map(value => value.trim()).filter(Boolean) })) };
      if (eventMode && !eventConsent) throw new Error('EVENT_BUDGET_CONFIRMATION_REQUIRED');
      const body = JSON.stringify(eventMode ? { definition, eventType, maxRuns: eventMaxRuns, expiresAt: new Date(eventExpiry).getTime(), totalBudgetUsd: draft.maxCostUsd * eventMaxRuns } : { ...definition, ...(runAt ? { runAt: new Date(runAt).toISOString(), ...(repeat ? { intervalMinutes: repeat, maxRuns } : {}) } : {}) });
      if (submission.current?.body !== body) submission.current = { body, key: crypto.randomUUID(), ...(eventMode ? { receiverKey: newReceiverKey() } : {}) };
      const pending = submission.current;
      const result = await request(eventMode ? '/pi-event-triggers' : runAt ? '/pi-jobs' : '/pi-workflows', { method: 'POST', body: eventMode ? JSON.stringify({ ...JSON.parse(body), receiverKey: pending.receiverKey }) : body, headers: { 'Idempotency-Key': pending.key } });
      if (!mounted.current) return;
      if (eventMode) setReceiverSecret({ id: result.data.id, key: pending.receiverKey! });
      else if (!runAt) { setFlows(current => [result.data, ...current.filter(item => item.id !== result.data.id)]); setSelected(result.data.id); }
      setEditing(false); submission.current = null;
      setNotice(eventMode ? t('Event entry saved. Save its receiver key below to connect your sending system.', '事件入口已保存。请在下方保存接收密钥并配置发送系统。') : runAt ? t('Schedule saved. It runs even when this page is closed.', '计划已保存，关闭页面后仍会按时运行。') : t('Workflow started. You can return here at any time.', '工作流已启动，可随时回来查看。'));
    });
  };
  const decide = (step: Step, decision: string) => {
    if (!flow) return;
    void act('review', async () => {
      await request(`/pi-workflows/${encodeURIComponent(flow.id)}/review`, post({ expectedVersion: flow.version, stepId: step.id, decision }));
      if (mounted.current) setConfirmStop('');
    });
  };
  const download = (runId: string, artifact: Artifact) => act('download', async () => {
    const revision = sessionRevision(); assertAccountToken(token);
    const path = `${apiBase}/agent-runs/${encodeURIComponent(runId)}/artifacts/${encodeURIComponent(String(artifact.id))}/download`;
    const fetchFile = (accessToken: string) => fetch(path, { headers: { Authorization: `Bearer ${accessToken}` }, credentials: 'include', cache: 'no-store', signal: AbortSignal.timeout(60000) });
    let response = await fetchFile(token);
    if (response.status === 401) {
      const fresh = await refreshAccountToken(apiBase);
      if (revision !== sessionRevision()) throw new Error('ACCOUNT_SESSION_CHANGED');
      if (fresh) response = await fetchFile(fresh);
    }
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'DOWNLOAD_FAILED');
    const bytes = await response.arrayBuffer();
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
    if (digest !== artifact.sha256 || bytes.byteLength !== artifact.byteSize) throw new Error('WORKFLOW_REVIEWED_EVIDENCE_CHANGED');
    if (!mounted.current || revision !== sessionRevision()) return;
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }));
    const link = document.createElement('a'); link.href = url; link.download = artifact.path.split(/[\\/]/).at(-1) || 'artifact'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  return <section className={styles.workspace} aria-label={t('Workflows', '工作流')}>
    <div className={styles.content}>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>FORGE / {t('WORKFLOWS', '工作流')}</p><h1>{t('A plan that carries through.', '让计划，一步步落地。')}</h1><p>{t('Connect steps. Review the evidence. Keep every run within budget.', '连接步骤，审核证据，让每次执行都有明确的交付与预算。')}</p></div>
        <button className={styles.primary} disabled={!!busy} onClick={() => { setEditing(true); setRunDetails(null); }}>{t('New workflow', '新建工作流')} <span aria-hidden="true">＋</span></button>
      </header>
      {error && <div role="alert" className={styles.error}>{errorText(error)} <button disabled={!!busy} onClick={() => { setError(''); void refresh(); if (!models.length) void loadModels(); }}>{t('Refresh', '刷新')}</button></div>}
      {notice && <p role="status" className={styles.notice}>{notice}</p>}
      {editing ? <form className={styles.editor} onSubmit={submit}>
        <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>{t('01 / OBJECTIVE', '01 / 目标')}</p><h2>{t('Define the outcome', '定义你要的结果')}</h2></div><button type="button" disabled={!!busy} onClick={() => setEditing(false)}>{t('Back to workflows', '返回工作流')}</button></div>
        <fieldset disabled={!!busy} className={styles.fields}>
          <label>{t('Workflow name', '工作流名称')}<input required maxLength={120} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} placeholder={t('e.g. Market decision brief', '例如：市场决策简报')} /></label>
          <label>{t('Goal & context', '目标与背景')}<textarea aria-label={t('Goal & context', '目标与背景')} required maxLength={eventMode ? 6000 : 12000} rows={4} value={draft.prompt} onChange={event => setDraft({ ...draft, prompt: event.target.value })} placeholder={t('What should be delivered? Include sources, constraints and the intended audience.', '需要交付什么？请提供来源、限制条件和目标读者。')} /></label>
          <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>{t('02 / STEPS', '02 / 步骤')}</p><h2>{t('Build the sequence', '安排执行步骤')}</h2></div><div className={styles.actions}><button type="button" onClick={() => setDraft({ ...draft, steps: template(zh) })}>{t('Research → deliver', '研究 → 交付')}</button><button type="button" onClick={() => setDraft({ ...draft, steps: template(zh, true), maxConcurrent: 2 })}>{t('Parallel research', '并行研究')}</button></div></div>
          <p className={styles.help}>{t('A step starts after all its dependencies pass checks and any required review. Independent steps can run together.', '前置步骤通过检查及必要的人工审核后，后续步骤才会启动。无依赖的步骤可以同时执行。')}</p>
          <ol className={styles.steps}>{draft.steps.map((step, index) => <li key={step.id} className={styles.step}>
            <div className={styles.stepHeader}><span className={styles.number}>{String(index + 1).padStart(2, '0')}</span><h3>{step.name || t('Untitled step', '未命名步骤')}</h3><button type="button" disabled={draft.steps.length === 1} aria-label={t('Remove step ', '删除步骤 ') + (index + 1)} onClick={() => setDraft({ ...draft, steps: draft.steps.filter(item => item.id !== step.id).map(item => ({ ...item, dependsOn: item.dependsOn.filter(id => id !== step.id) })) })}>{t('Remove', '删除')}</button></div>
            <div className={styles.grid}><label>{t('Step name', '步骤名称')}<input required maxLength={100} value={step.name} onChange={event => updateStep(step.id, { name: event.target.value })} /></label><label>{t('Output filename', '交付文件名')}<input required pattern="[a-zA-Z0-9][a-zA-Z0-9_.\-]{0,95}\.(md|txt|csv|json|svg)" title={t('Use a filename ending in .md, .txt, .csv, .json or .svg; no directories.', '使用 .md、.txt、.csv、.json 或 .svg 文件名，不含目录。')} value={step.output} onChange={event => updateStep(step.id, { output: event.target.value })} /></label></div>
            <label>{t('Instructions', '执行要求')}<textarea aria-label={t('Instructions', '执行要求')} required maxLength={4000} rows={3} value={step.instruction} onChange={event => updateStep(step.id, { instruction: event.target.value })} /></label>
            {index > 0 && <fieldset className={styles.dependencies}><legend>{t('Wait for', '等待这些步骤')}</legend>{draft.steps.slice(0, index).map(dependency => <label key={dependency.id} className={styles.checkbox}><input type="checkbox" checked={step.dependsOn.includes(dependency.id)} onChange={event => updateStep(step.id, { dependsOn: event.target.checked ? [...step.dependsOn, dependency.id] : step.dependsOn.filter(id => id !== dependency.id) })} />{dependency.name}</label>)}</fieldset>}
            <label className={styles.checkbox}><input type="checkbox" checked={step.reviewRequired} onChange={event => updateStep(step.id, { reviewRequired: event.target.checked })} />{t('Pause for my review before continuing', '继续前暂停，等待我审核')}</label>
            <details className={styles.checks}><summary>{t('File acceptance checks', '文件验收条件')}</summary><div className={styles.grid}><label>{t('Minimum file size (bytes)', '最小文件大小（字节）')}<input type="number" required min={1} max={10485760} value={step.minBytes ?? 1} onChange={event => updateStep(step.id, { minBytes: Number(event.target.value) })} /></label><label>{t('Required text (one per line, up to 8)', '必须包含的文字（每行一项，最多 8 项）')}<textarea aria-label={t('Required text (one per line, up to 8)', '必须包含的文字（每行一项，最多 8 项）')} rows={3} maxLength={4007} value={(step.mustContain || []).join('\n')} onChange={event => updateStep(step.id, { mustContain: event.target.value.split('\n') })} /></label></div><p className={styles.help}>{t('Exact text matching is case-sensitive and supports files up to 256 KB. Checks verify file structure; review the accuracy yourself.', '文字按大小写精确匹配，支持 256 KB 以内文件。自动检查验证文件结构，内容准确性仍需审核。')}</p></details>
          </li>)}</ol>
          <button type="button" className={styles.add} disabled={draft.steps.length >= 8} onClick={() => { const id = 'step_' + crypto.randomUUID().slice(0, 8); setDraft({ ...draft, steps: [...draft.steps, { id, name: t('New step', '新步骤'), instruction: '', output: id + '.md', dependsOn: [draft.steps.at(-1)!.id], reviewRequired: true, minBytes: 1, mustContain: [] }] }); }}>＋ {t('Add step', '添加步骤')} <span>{draft.steps.length}/8</span></button>
          <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>{t('03 / EXECUTION', '03 / 执行')}</p><h2>{t('Set the boundaries', '设定执行边界')}</h2></div><button type="button" onClick={onBilling}>{t('Usage & plan ↗', '用量与套餐 ↗')}</button></div>
          <div className={styles.grid}><label>{t('Model', '模型')}<select aria-label={t('Model', '模型')} required value={draft.model || ''} onChange={event => setDraft({ ...draft, model: event.target.value })}><option value="" disabled>{t('Choose a model', '选择模型')}</option>{models.map(model => <option key={model.id} value={model.id} disabled={!model.available}>{model.name}{!model.available ? t(' · credit required', ' · 需付费额度') : ''}</option>)}</select></label><label>{t('Budget per workflow (USD)', '每次工作流预算（美元）')}<input required type="number" min={minimumBudget.toFixed(2)} max={100} step="0.01" value={draft.maxCostUsd} onChange={event => setDraft({ ...draft, maxCostUsd: Number(event.target.value) })} /></label><label>{t('Maximum attempts per step', '每步最多尝试次数')}<select aria-label={t('Maximum attempts per step', '每步最多尝试次数')} value={draft.maxAttempts} onChange={event => setDraft({ ...draft, maxAttempts: Number(event.target.value) })}>{[1, 2, 3].map(value => <option key={value}>{value}</option>)}</select></label><label>{t('Steps running at once', '同时执行的步骤数')}<select aria-label={t('Steps running at once', '同时执行的步骤数')} value={draft.maxConcurrent} onChange={event => setDraft({ ...draft, maxConcurrent: Number(event.target.value) })}>{[1, 2, 3].map(value => <option key={value}>{value}</option>)}</select></label></div>
          <p className={styles.help}>{t(`Each attempt is capped at ${money(perAttempt)}. Failed file checks can retry within that allocation. You pay for actual usage.`, `每次尝试上限 ${money(perAttempt)}。文件检查未通过时可在分配预算内重试，按实际用量计费。`)}</p>
          <label className={styles.checkbox}><input type="checkbox" checked={eventMode} onChange={event => { setEventMode(event.target.checked); setEventConsent(false); }} />{t('Start from an external event', '外部事件触发')}</label>
          {eventMode ? <div className={styles.eventSetup}><div className={styles.grid}><label>{t('Event type', '事件名称')}<input required maxLength={80} pattern="[a-zA-Z][a-zA-Z0-9_.\-]{0,79}" value={eventType} onChange={event => setEventType(event.target.value)} placeholder="form.submitted" /></label><label>{t('Maximum events', '最多接收事件数')}<input type="number" required min={1} max={100} step={1} value={eventMaxRuns} onChange={event => setEventMaxRuns(Number(event.target.value))} /></label><label>{t('Expires at (local time)', '截止时间（本地时区）')}<input type="datetime-local" required value={eventExpiry} onChange={event => setEventExpiry(event.target.value)} /></label></div><p className={styles.help}>{t('Choose an expiry within 90 days. Each new event starts this fixed workflow. Retried events reuse the original task; different events can run concurrently. Budget and review settings stay fixed.', '请选择未来 90 天内的截止时间。新事件启动此固定工作流；重复事件复用原任务，不同事件可以同时运行。预算和审核设置保持固定。')}</p><label className={styles.checkbox}><input type="checkbox" required checked={eventConsent} onChange={event => setEventConsent(event.target.checked)} />{t(`I authorize up to ${eventMaxRuns} runs, with a total budget cap of ${money(draft.maxCostUsd * eventMaxRuns)}.`, `我确认授权最多 ${eventMaxRuns} 次执行，总预算不超过 ${money(draft.maxCostUsd * eventMaxRuns)}。`)}</label></div> : <details className={styles.checks}><summary>{t('Schedule for later', '安排稍后执行')}</summary><label>{t('Start time (your local timezone; leave empty to start now)', '开始时间（本地时区；留空即立即执行）')}<input type="datetime-local" value={runAt} onChange={event => setRunAt(event.target.value)} /></label>{runAt && <div className={styles.grid}><label>{t('Repeat', '重复执行')}<select aria-label={t('Repeat', '重复执行')} value={repeat} onChange={event => setRepeat(Number(event.target.value))}><option value={0}>{t('Once', '仅一次')}</option><option value={60}>{t('Every hour', '每小时')}</option><option value={1440}>{t('Every 24 hours', '每 24 小时')}</option><option value={10080}>{t('Every 7 days', '每 7 天')}</option></select></label>{repeat > 0 && <label>{t('Total runs', '总执行次数')}<input type="number" min={1} max={100} required value={maxRuns} onChange={event => setMaxRuns(Number(event.target.value))} /></label>}</div>}<p className={styles.help}>{t('Scheduled runs continue when you are offline. A pending run or review delays the next occurrence; runs never overlap.', '离线时仍会执行。若上一轮尚未结束或等待审核，下一轮将顺延，不会重叠。')}</p></details>}
          <div className={styles.submit}><div><strong>{money(draft.maxCostUsd * (eventMode ? eventMaxRuns : runAt && repeat ? maxRuns : 1))}</strong><span>{t(' maximum total budget', ' 总预算上限')}</span></div><button className={styles.primary} disabled={!draft.model || !!busy} type="submit">{busy === 'create' ? t('Saving…', '保存中…') : eventMode ? t('Create event entry', '创建事件入口') : runAt ? t('Save schedule', '保存执行计划') : t('Start workflow', '启动工作流')} <span aria-hidden="true">↗</span></button></div>
        </fieldset>
      </form> : <div className={styles.layout}>
        <aside className={styles.sidebar}><div className={styles.sectionTitle}><h2>{t('Your workflows', '你的工作流')}</h2><button disabled={!!busy} onClick={() => { setError(''); void refresh(); }}>{t('Refresh', '刷新')}</button></div>{loading ? <p role="status">{t('Loading workflows…', '正在读取工作流…')}</p> : flows.length === 0 ? <p className={styles.help}>{t('Your first workflow starts with an outcome.', '从一个明确的交付目标开始。')}</p> : <ul className={styles.list}>{flows.map(item => <li key={item.id}><button disabled={!!busy} aria-current={selected === item.id ? 'true' : undefined} onClick={() => { setSelected(item.id); setConfirmStop(''); setRunDetails(null); }}><strong>{item.name}</strong><span>{label(item.status)} <span aria-hidden="true">·</span> {money(item.spent_usd)}</span></button></li>)}</ul>}
          {jobs.length > 0 && <div className={styles.schedules}><h2>{t('Schedules', '执行计划')}</h2>{jobs.map(job => <article key={job.id}><strong>{job.name}</strong><p>{label(job.status)} · {job.run_count}/{job.max_runs}</p>{job.status === 'active' && <p>{new Date(job.next_run_at).toLocaleString(zh ? 'zh-CN' : 'en-US')}</p>}<p>{t('Total cap', '总上限')} {money(job.total_budget_usd)}</p>{job.last_workflow_id && <button onClick={() => { setSelected(job.last_workflow_id!); setRunDetails(null); }}>{t('View latest run', '查看最近一次')}</button>}{job.status === 'active' && <button disabled={!!busy} onClick={() => void act('schedule', async () => { await request(`/pi-jobs/${encodeURIComponent(job.id)}/cancel`, post()); })}>{t('Cancel future runs', '取消后续执行')}</button>}</article>)}</div>}
        </aside>
        <div className={styles.detail} id="workflow-results">
          {!flow ? <div className={styles.empty}><span className={styles.diagram} aria-hidden="true">01 <i>→</i> 02 <i>→</i> 03</span><p className={styles.eyebrow}>{t('FROM PLAN TO PROOF', '从计划到有据可查的交付')}</p><h2>{t('Good work has a clear path.', '把复杂任务，变成清晰步骤。')}</h2><p>{t('Research in parallel, approve the findings, and produce a checked deliverable. Your progress is saved at every step.', '并行研究、审核发现，再生成经过检查的交付文件。每一步的进展都会保存。')}</p><button className={styles.primary} onClick={() => setEditing(true)}>{t('Build your first workflow', '创建第一个工作流')} ↗</button></div> : <>
            <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>{label(flow.status)}</p><h2>{flow.name}</h2></div><button disabled={!!busy} onClick={() => { setDraft({ ...flow.definition, prompt: flow.eventSource?.objective || flow.definition.prompt, steps: flow.definition.steps.map(step => ({ ...step, mustContain: step.mustContain || [] })) }); setRunAt(''); setRepeat(0); setEventMode(false); setEditing(true); }}>{t('Use as template', '复制为新工作流')}</button></div>
            <p className={styles.objective}>{flow.eventSource?.objective || flow.definition.prompt}</p>{flow.eventSource && <details className={styles.artifact}><summary>{t('Event source', '事件来源')} · {flow.eventSource.type} · {flow.eventSource.eventId}</summary><pre>{JSON.stringify(flow.eventSource.data, null, 2)}</pre></details>}<div className={styles.metrics}><span><strong>{money(flow.spent_usd)}</strong>{t(' used', ' 已用')}</span><span>{money(flow.definition.maxCostUsd)} {t('budget', '预算')}</span><span>{flow.definition.steps.length} {t('steps', '步骤')}</span></div>
            {flow.checkpoint.error && <p className={styles.error}>{errorText(flow.checkpoint.error)}</p>}
            {flow.status === 'awaiting_accounting' && <p className={styles.notice}>{t('Usage is being reconciled before dependent steps continue.', '正在核对用量，完成后后续步骤才会继续。')}</p>}
            <ol className={styles.steps}>{flow.definition.steps.map((step, index) => {
              const attempt = latest(flow, step.id), reviewed = flow.checkpoint.reviews?.some(review => review.stepId === step.id && review.decision === 'approve');
              const needsReview = attempt?.status === 'done' && step.reviewRequired && !reviewed && !terminal.has(flow.status) && flow.status !== 'cancelling';
              const state = needsReview ? 'awaiting_review' : reviewed ? 'approved' : attempt?.status || 'waiting';
              return <li key={step.id} className={styles.step} data-state={state}><div className={styles.stepHeader}><span className={styles.number}>{String(index + 1).padStart(2, '0')}</span><h3>{step.name}</h3><span className={styles.badge}>{label(state)}</span></div><p>{step.instruction}</p><p className={styles.help}>{step.dependsOn.length ? t('After: ', '前置：') + step.dependsOn.map(id => flow.definition.steps.find(item => item.id === id)?.name || id).join(' · ') : t('Independent step', '独立步骤')} · {step.output}</p>
                {attempt && <p className={styles.help}>{t('Attempt', '尝试')} {flow.checkpoint.attempts.filter(item => item.stage === step.id).length}/{flow.definition.maxAttempts} · {money(attempt.cost)}</p>}
                {attempt?.artifacts.map(artifact => <div className={styles.artifact} key={artifact.id}><div className={styles.sectionTitle}><strong>{artifact.path}</strong><button disabled={!!busy || !attempt.runId} onClick={() => void download(attempt.runId!, artifact)}>{t('Download', '下载')} ↓</button></div><details><summary>{t('Preview & verification', '预览与验证信息')} · {artifact.byteSize.toLocaleString()} B</summary><pre>{artifact.preview || t('Preview unavailable. Download the verified file to review it.', '暂无预览，请下载验证后的文件进行审核。')}</pre><p className={styles.help}>{t('Preview may be partial. Verify the full file before approval.', '预览可能截断，审核前请核对完整文件。')}</p><code>SHA-256 {artifact.sha256}</code></details></div>)}
                {needsReview && <div className={styles.review}><p>{t('Check the file and sources before allowing the next step.', '请核对文件和来源，再允许后续步骤继续。')}</p><div className={styles.actions}><button className={styles.primary} disabled={!!busy} onClick={() => decide(step, 'approve')}>{t('Approve this step', '通过此步骤')}</button><button disabled={!!busy} onClick={() => setConfirmStop('reject:' + step.id)}>{t('Reject & stop', '拒绝并停止')}</button></div>{confirmStop === 'reject:' + step.id && <div className={styles.confirm}><p>{t('Rejecting stops the whole workflow, including running branches. Usage already incurred remains chargeable.', '拒绝会停止整个工作流，包括正在执行的分支。已产生用量仍会计费。')}</p><button disabled={!!busy} onClick={() => decide(step, 'reject')}>{t('Confirm rejection', '确认拒绝')}</button><button onClick={() => setConfirmStop('')}>{t('Keep reviewing', '继续审核')}</button></div>}</div>}
                {attempt?.runId && <button className={styles.textButton} disabled={!!busy} onClick={() => void act('details', async () => { const data = await request(`/agent-runs/${encodeURIComponent(attempt.runId!)}/details`); if (mounted.current) setRunDetails(data); })}>{t('Run details & action approvals', '运行详情与操作授权')} ↗</button>}
              </li>;
            })}</ol>
            {runDetails && <section className={styles.runDetails} aria-label={t('Run details', '运行详情')}><div className={styles.sectionTitle}><h3>{runDetails.run?.name || t('Run details', '运行详情')}</h3><button onClick={() => setRunDetails(null)}>{t('Close', '关闭')}</button></div><p>{label(runDetails.run?.status || '')}</p>{runDetails.run?.error && <p className={styles.error}>{runDetails.run.error}</p>}{runDetails.approval?.status === 'pending' && <><p>{runDetails.approval.request_summary || runDetails.approval.reason}</p><pre>{runDetails.tools?.find((tool: any) => tool.id === runDetails.approval.tool_call_id)?.input || t('Request details unavailable. Refresh before approving.', '操作详情不可用，请刷新后再授权。')}</pre><div className={styles.actions}>{(['approve', 'reject'] as const).map(decision => <button key={decision} disabled={!!busy} onClick={() => void act('approval', async () => { const id = runDetails.run.id; await request(`/agent-runs/${encodeURIComponent(id)}/approvals/${encodeURIComponent(runDetails.approval.id)}/${decision}`, post()); const data = await request(`/agent-runs/${encodeURIComponent(id)}/details`); if (mounted.current) setRunDetails(data); })}>{decision === 'approve' ? t('Allow this action', '允许此操作') : t('Reject this action', '拒绝此操作')}</button>)}</div></>}<details><summary>{t('Execution record', '执行记录')}</summary><pre>{JSON.stringify(runDetails.events || runDetails.run?.result || [], null, 2)}</pre></details></section>}
            {!terminal.has(flow.status) && <div className={styles.actions}>{flow.status === 'blocked' && <button className={styles.primary} disabled={!!busy} onClick={() => void act('resume', async () => { await request(`/pi-workflows/${encodeURIComponent(flow.id)}/resume`, post({ expectedVersion: flow.version })); })}>{t('Resume workflow', '恢复工作流')}</button>}<button disabled={!!busy || flow.status === 'cancelling'} onClick={() => setConfirmStop('cancel')}>{t('Stop workflow', '停止工作流')}</button></div>}
            {confirmStop === 'cancel' && <div className={styles.confirm}><p>{t('Stop all running steps? Existing files and usage records are preserved.', '停止所有正在执行的步骤？已有文件和用量记录会保留。')}</p><button disabled={!!busy} onClick={() => void act('cancel', async () => { await request(`/pi-workflows/${encodeURIComponent(flow.id)}/cancel`, post()); if (mounted.current) setConfirmStop(''); })}>{t('Confirm stop', '确认停止')}</button><button onClick={() => setConfirmStop('')}>{t('Keep running', '继续执行')}</button></div>}
          </>}
        </div>
      </div>}
      {!editing && <WorkflowEventTriggers request={request} apiBase={apiBase} zh={zh} secret={receiverSecret} onSecret={setReceiverSecret} onOpen={id => void act('open-event', async () => { const result = await request('/pi-workflows/' + encodeURIComponent(id)); if (!mounted.current) return; setFlows(current => [result.data, ...current.filter(item => item.id !== id)]); setSelected(id); setRunDetails(null); document.getElementById('workflow-results')?.scrollIntoView({ behavior: 'auto', block: 'start' }); })} />}
    </div>
  </section>;
}
