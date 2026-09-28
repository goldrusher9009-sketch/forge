'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PortableAgentOffer } from './PortableAgentOffer';
type Rule = { kind: 'contains' | 'excludes' | 'json_keys' | 'citation'; value: string };
type Case = { name: string; prompt: string; rules: Rule[] };
type Evaluation = { id: string; status: string; error?: string; passed: boolean; configurationHash: string; chargeUsd: number; costPending: boolean; model: string; cases: Case[]; results: { name: string; response: string; status: string; chargeUsd: number | null; durationMs?: number; requestId: string; checks: (Rule & { passed: boolean })[] }[] };
type State = { cases: Case[]; currentHash: string | null; evaluations: Evaluation[]; releases: { id: string; version: number; evaluation_id: string; content_hash: string; created_at: string }[]; buyerSourceSetup?: {instructions:string;ready:boolean;readableFiles:number} | null };
const initial: State = { cases: [], currentHash: null, evaluations: [], releases: [] };
type Api = (path: string, options?: RequestInit) => Promise<any>;
export function AgentReleasePanel({ agentId, dirty, zh, api, onRestored, onUseRelease }: { agentId: string; dirty: boolean; zh: boolean; api: Api; onRestored: () => Promise<void>; onUseRelease?: (agentId:string,releaseId:string)=>Promise<void> }) {
  const [state, setState] = useState<State>(initial), [cases, setCases] = useState<Case[]>([]), [changed, setChanged] = useState(false);
  const [maximum, setMaximum] = useState('1'), [working, setWorking] = useState(''), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [restoreId, setRestoreId] = useState(''), [loaded, setLoaded] = useState(false);
  const apiRef = useRef(api); apiRef.current = api;
  const alive = useRef(true), controller = useRef<AbortController | null>(null);
  const t = (en: string, cn: string) => zh ? cn : en;
  const base = `/workspace-agents/${encodeURIComponent(agentId)}`;
  const load = async () => {
    const result = await apiRef.current(`${base}/lifecycle`);
    if (alive.current) { setState(result.data); setCases(result.data.cases); setChanged(false); setLoaded(true); }
  };
  useEffect(() => { alive.current = true; void load().catch(error => { if (alive.current) setError(error.message); });
    return () => { alive.current = false; controller.current?.abort(); };
    // Parent keys the panel by agent ID, preserving the operation's identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (dirty || !loaded) return;
    let current = true;
    apiRef.current(`${base}/lifecycle`).then(result => { if (current && alive.current) setState(result.data); })
      .catch(error => { if (current && alive.current) setError(error.message); });
    return () => { current = false; };
  }, [dirty, loaded, base]);
  const action = async (name: string, fn: () => Promise<void>) => {
    if (working) return; setWorking(name); setError(''); setNotice('');
    try { await fn(); } catch (error: any) { if (alive.current) setError(error.message); }
    finally { if (alive.current) setWorking(''); }
  };
  const send = (suffix: string, body: any, method = 'POST', key?: string, signal?: AbortSignal) => apiRef.current(`${base}${suffix}`, {
    method, signal, headers: { 'Content-Type': 'application/json', ...(key ? { 'Idempotency-Key': key } : {}) }, body: JSON.stringify(body),
  });
  const update = (index: number, value: Partial<Case>) => { setCases(current => current.map((item, i) => i === index ? { ...item, ...value } : item)); setChanged(true); };
  const updateRule = (index: number, rule: number, value: Partial<Rule>) => update(index, { rules: cases[index].rules.map((r, i) => i === rule ? { ...r, ...value } : r) });
  const run = () => action('run', async () => {
    controller.current = new AbortController();
    await send('/evaluations', { maximumUsd: Number(maximum) }, 'POST', crypto.randomUUID(), controller.current.signal);
    if (alive.current) await load();
  });
  const download = async (id: string, version: number) => {
    const result = await apiRef.current(`${base}/releases/${id}/package`);
    const url = URL.createObjectURL(new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `Forge-agent-v${version}.forge-agent.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const messages: Record<string, string> = {
    AGENT_RELEASE_CHAT_TOOLS_UNAVAILABLE: t('This version requires tools that are unavailable in published chat. Review its tools and publish a compatible version.', '此版本要求的部分工具无法在已发布的对话中运行。请检查工具配置并发布兼容版本。'),
    AGENT_RELEASE_PI_REQUIRED: t('This published version requires the Pi execution service. Reconnect it before starting a task.', '此已发布版本需要 Pi 执行服务，请恢复连接后再开始任务。'),
    AGENT_RELEASE_STALE_EVALUATION: t('The configuration, sources or checks changed. Run the checks again before publishing.', '配置、资料或检查规则已变化，请重新测评后发布。'),
    AGENT_PACKAGE_SOURCES_REQUIRED: t('Attach and save at least one readable source document that meets the package instructions before evaluating.', '测评前请按安装包要求绑定并保存至少一份可读取的资料。'),
    AGENT_RELEASE_PASS_REQUIRED: t('A completed, passing evaluation is required.', '需要完成并通过测评后才能发布。'),
    AGENT_EVALUATION_BUDGET_EXCEEDED: t('The next request would exceed your budget. Increase the limit or choose a lighter model.', '下一次请求的费用预占将超过预算，请提高上限或选择轻量模型。'),
    AGENT_EVALUATION_CONFIGURATION_CHANGED: t('The agent or its sources changed during the evaluation. Review and run a new evaluation.', '测评过程中 Agent 或资料发生变化，请检查后重新测评。'),
    LIBRARY_FILE_NOT_FOUND: t('A source from this version no longer exists. The current draft was preserved.', '此版本绑定的资料已不存在，当前草稿已保留。'),
    FILE_NOT_FOUND: t('A source from this version no longer exists. The current draft was preserved.', '此版本绑定的资料已不存在，当前草稿已保留。'),
  };
  const compatible = (value: Evaluation) => !dirty && !changed && value.passed && value.configurationHash === state.currentHash && JSON.stringify(value.cases) === JSON.stringify(cases);
  return <>{state.buyerSourceSetup && <section className="pw-message" aria-label={t('Required source setup', '必需的资料配置')}>
    <h3>{t('Provide your own source documents', '请提供你自己的资料')}</h3>
    <p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{state.buyerSourceSetup.instructions}</p>
    <p>{t('Upload documents to Personal library, select them under this agent’s attached sources, and save. Seller documents and prior evaluations were not imported.', '请在个人资料库上传文档，在此 Agent 的资料绑定中选择并保存。卖家的文档和原测评结果不会被导入。')}</p>
    <p role="status">{dirty ? t('Save your source selection to check readiness.', '请保存资料选择后检查配置状态。') : state.buyerSourceSetup.ready
      ? t(`${state.buyerSourceSetup.readableFiles} readable document(s) attached. Check their suitability and run your own evaluation.`, `已绑定 ${state.buyerSourceSetup.readableFiles} 份可读取文档。请确认内容符合要求，并进行你自己的测评。`)
      : t('No readable source documents are attached yet. Evaluation and publication are unavailable until setup is complete.', '尚未绑定可读取的文档。完成配置后才能测评和发布。')}</p>
  </section>}<details className="ar-panel">
    <style>{CSS}</style>
    <summary><span className="pw-section-label">04 / {t('EVALUATE & RELEASE', '测评与版本交付')}</span><strong>{t('A version you can stand behind.', '让每个版本都有依据。')}</strong><span className="ar-count">{state.releases.length} {t('versions', '个版本')} ↗</span></summary>
    <div className="ar-body">
      <p className="pw-muted">{t('Define expected answers, check the saved agent, then freeze a version. These checks verify answer properties; they do not prove factual accuracy or tool execution.', '定义期望结果，测评已保存的 Agent，再冻结一个版本。这些检查验证回答特征，不代表事实正确性或工具执行已经通过验收。')}</p>
      {error && <p role="alert" className="pw-message pw-error">{messages[error] || t('The operation could not finish. Refresh the evaluation status before starting another paid run.', '操作未完成。发起新的付费测评前，请先刷新查看原测评状态。')}</p>}
      {notice && <p role="status" className="pw-message">{notice}</p>}
      {dirty && <p className="pw-message">{t('Save your agent and sources before evaluating or publishing.', '请先保存 Agent 和资料绑定，再测评或发布。')}</p>}
      <div className="ar-columns"><div>
        <div className="ar-heading"><h2>{t('Define success.', '定义完成标准。')}</h2><span className="pw-muted">{cases.length}/5</span></div>
        <fieldset disabled={!!working || !loaded}>
          {cases.map((item, index) => <article className="ar-case" key={index}>
            <div className="ar-heading"><span className="pw-section-label">{t('CASE', '用例')} {String(index + 1).padStart(2, '0')}</span><button className="pw-subtle" onClick={() => { setCases(cases.filter((_, i) => i !== index)); setChanged(true); }}>{t('Remove case', '移除用例')}</button></div>
            <label>{t('Case name', '用例名称')}<input maxLength={100} value={item.name} onChange={e => update(index, { name: e.target.value })}/></label>
            <label>{t('Test prompt', '测评问题')}<textarea rows={3} maxLength={4000} value={item.prompt} onChange={e => update(index, { prompt: e.target.value })}/></label>
            {item.rules.map((rule, ruleIndex) => <div className="ar-rule" key={ruleIndex}>
              <select aria-label={t('Check type', '检查类型')} value={rule.kind} onChange={e => updateRule(index, ruleIndex, { kind: e.target.value as Rule['kind'], value: '' })}>
                <option value="contains">{t('Must contain', '必须包含')}</option><option value="excludes">{t('Must not contain', '不能包含')}</option><option value="json_keys">{t('JSON fields', 'JSON 字段')}</option><option value="citation">{t('Known source citations', '有效资料引用')}</option>
              </select>
              {rule.kind === 'citation' ? <span className="pw-muted">{t('Cites at least one provided source; no unknown file IDs.', '至少引用一份已提供的资料，不包含未知文件编号。')}</span> : <input aria-label={t('Expected value', '期望值')} maxLength={500} value={rule.value} placeholder={rule.kind === 'json_keys' ? 'price, currency' : t('Expected text', '期望文本')} onChange={e => updateRule(index, ruleIndex, { value: e.target.value })}/>}
              <button disabled={item.rules.length <= 1} aria-label={t('Remove check', '移除检查')} onClick={() => update(index, { rules: item.rules.filter((_, i) => i !== ruleIndex) })}>×</button>
            </div>)}
            <button className="pw-subtle" disabled={item.rules.length >= 8} onClick={() => update(index, { rules: [...item.rules, { kind: 'contains', value: '' }] })}>{t('+ Add check', '+ 添加检查')}</button>
          </article>)}
          {!cases.length && <p className="ar-empty">{t('Start with a real task and an answer you can verify.', '从一项真实任务开始，设定你能核验的回答标准。')}</p>}
          <div className="pw-actions"><button disabled={cases.length >= 5} onClick={() => { setCases([...cases, { name: '', prompt: '', rules: [{ kind: 'contains', value: '' }] }]); setChanged(true); }}>{t('+ Add test case', '+ 添加测评用例')}</button><button disabled={!changed || !cases.length} onClick={() => void action('save', async () => { await send('/evaluation-suite', { cases }, 'PUT'); await load(); setNotice(t('Test cases saved.', '测评用例已保存。')); })}>{t('Save checks', '保存检查')}</button></div>
        </fieldset>
        <div className="ar-run"><label>{t('Maximum evaluation budget (USD)', '本次测评预算上限（美元）')}<input type="number" min="0.01" max="25" step="0.01" value={maximum} disabled={!!working} onChange={e => setMaximum(e.target.value)}/></label><button className="pw-primary" disabled={!!working || dirty || changed || !cases.length || !loaded || !!(state.buyerSourceSetup && !state.buyerSourceSetup.ready)} onClick={() => void run()}>{working === 'run' ? t('Evaluating…', '测评中…') : t('Run evaluation →', '开始测评 →')}</button></div>
        <p className="pw-muted">{t('Each case uses Forge credit. The next request must fit within the remaining budget before it is sent. Uncertain charges stop the run.', '每条用例都会消耗 Forge 额度。发送前检查下一次请求的费用预占是否在剩余预算内；费用不明时停止后续请求。')}</p>
      </div><div>
        <div className="ar-heading"><h2>{t('Evidence & versions.', '结果与版本。')}</h2><button className="pw-subtle" disabled={!!working || changed} onClick={() => void action('refresh', load)}>{t('Refresh status', '刷新状态')}</button></div>
        {!state.evaluations.length && <p className="ar-empty">{t('Your first evaluation will appear here with its checks and cost.', '首次测评后，这里会显示检查结果和费用。')}</p>}
        {state.evaluations.map(value => <article key={value.id} className="ar-result">
          <div className="ar-heading"><strong className={value.passed ? 'ar-pass' : 'ar-review'}>{value.status === 'completed' ? value.passed ? t('Checks passed', '检查通过') : t('Checks failed', '检查未通过') : value.status === 'running' ? t('In progress / check status', '进行中 / 请核对状态') : t('Evaluation stopped', '测评已停止')}</strong><span className="pw-muted">${value.chargeUsd.toFixed(6)}{value.costPending ? t(' + pending', ' + 待核对') : ''}</span></div>
          <p className="pw-muted">{value.model} · {value.results.filter(r => r.status === 'completed').length}/{value.cases.length}</p>
          {value.error && <p className="ar-review">{messages[value.error] || t('A request could not finish. Review billing and results before retrying.', '有请求未能完成，请检查费用和结果后再发起新的测评。')}</p>}
          {value.results.map((result, index) => <details className="ar-answer" key={index}><summary>{result.checks.length && result.checks.every(c => c.passed) ? '✓' : '○'} {result.name}</summary><p>{result.response || t('No verified answer saved.', '尚未保存可核验的回答。')}</p><ul>{result.checks.map((check, i) => <li key={i}>{check.passed ? '✓' : '×'} {check.kind === 'citation' ? t('Known citations', '有效引用') : `${check.kind === 'contains' ? t('Contains', '包含') : check.kind === 'excludes' ? t('Excludes', '不包含') : t('JSON fields', 'JSON 字段')}: ${check.value}`}</li>)}</ul></details>)}
          {value.passed && <button disabled={!!working || !compatible(value)} onClick={() => void action('publish', async () => { const result = await send('/releases', { evaluationId: value.id }); await load(); setNotice(t(`Version ${result.data.version} published to your private workspace.`, `版本 ${result.data.version} 已发布到你的个人工作区。`)); })}>{t('Publish tested version', '发布已测评版本')}</button>}
          {value.passed && !compatible(value) && <p className="pw-muted">{t('This result belongs to a different draft or set of checks.', '此结果对应其他草稿或检查规则。')}</p>}
        </article>)}
        {state.releases.length > 0 && <h3>{t('Published versions', '已发布版本')}</h3>}
        {state.releases.map(version => <PortableAgentOffer key={version.id} agentId={agentId} releaseId={version.id} version={version.version} api={api} zh={zh}/>)}
        {state.releases.map(version => <article className="ar-version" key={version.id}><div className="ar-heading"><strong>v{version.version}</strong><span className="pw-muted">{version.created_at} UTC</span></div><div className="pw-actions">{onUseRelease && <button className="pw-primary" disabled={!!working} onClick={() => void action("use", () => onUseRelease(agentId,version.id))}>{t("Use this version", "使用此版本")}</button>}<button disabled={!!working} onClick={() => void action('export', () => download(version.id, version.version))}>{t('Download agent', '下载 Agent')}</button><button disabled={!!working || dirty || changed} onClick={() => setRestoreId(version.id)}>{t('Restore to draft', '恢复为草稿')}</button></div>
          {restoreId === version.id && <div className="ar-confirm"><p>{t('Replace the saved configuration and source bindings with this version? Its tests and history remain unchanged.', '将已保存的配置和资料绑定恢复到此版本？原有测评与版本历史会保留。')}</p><button className="pw-primary" disabled={!!working} onClick={() => void action('restore', async () => { await send(`/releases/${version.id}/restore`, {}); await onRestored(); await load(); setRestoreId(''); setNotice(t('Version restored to the draft. Review sources before using it.', '已恢复为草稿，请检查资料后使用。')); })}>{t('Confirm restore', '确认恢复')}</button><button onClick={() => setRestoreId('')}>{t('Cancel', '取消')}</button></div>}
        </article>)}
        <p className="pw-muted">{t('Downloads contain configuration only. Private documents, answers and account credentials are excluded. Imported agents need source binding and fresh evaluation; downloading does not install a desktop agent.', '下载包包含配置，不包含私人资料、回答或账号凭据。导入后需要重新绑定资料并测评；下载不代表已经安装到桌面。')}</p>
      </div></div>
    </div>
  </details></>;
}
const CSS = `.ar-panel{margin-top:32px;border:1px solid var(--pw-line);border-radius:12px;background:var(--pw-panel);overflow:hidden}.ar-panel>summary{display:flex;align-items:center;gap:22px;padding:24px;cursor:pointer;list-style:none}.ar-panel>summary::-webkit-details-marker{display:none}.ar-panel>summary .pw-section-label{margin:0}.ar-panel>summary>strong{font-family:Georgia,serif;font-size:22px;font-weight:400}.ar-count{margin-left:auto;color:var(--pw-accent);font-size:12px;white-space:nowrap}.ar-body{padding:0 24px 24px}.ar-columns{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:32px}.ar-columns>div{min-width:0}.ar-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}.ar-heading h2{margin-bottom:12px}.ar-panel fieldset{border:0;padding:0;min-width:0}.ar-case,.ar-result,.ar-version{padding:18px;margin:16px 0;border:1px solid var(--pw-line);border-radius:8px;background:#101313}.ar-case .pw-section-label{margin:0}.ar-rule{display:grid;grid-template-columns:minmax(120px,.8fr) minmax(0,1fr) 32px;gap:8px;align-items:center;margin:12px 0}.ar-rule button{padding:7px!important}.ar-rule .pw-muted{font-size:10px}.ar-empty{padding:25px 0;color:var(--pw-muted);font-size:13px;line-height:1.8}.ar-run{display:flex;align-items:end;gap:12px;margin-top:25px}.ar-run label{flex:1;margin:0!important}.ar-run button{min-height:40px}.ar-pass{color:var(--pw-accent)}.ar-review{color:#e8b895;font-size:12px}.ar-answer{font-size:12px;margin:14px 0}.ar-answer summary{cursor:pointer}.ar-answer p{white-space:pre-wrap;overflow-wrap:anywhere;max-height:240px;overflow:auto;line-height:1.7}.ar-answer ul{padding-left:20px;line-height:1.8;overflow-wrap:anywhere}.ar-version .pw-actions{margin-top:14px}.ar-confirm{font-size:12px;line-height:1.7;margin-top:15px;padding-top:10px;border-top:1px solid var(--pw-line)}.ar-confirm button{margin-right:8px}.ar-panel button:focus-visible,.ar-panel summary:focus-visible{outline:2px solid var(--pw-accent);outline-offset:3px}@media(max-width:1000px){.ar-columns{grid-template-columns:1fr}.ar-panel>summary{flex-wrap:wrap;gap:10px}.ar-count{margin-left:0}}@media(max-width:650px){.ar-panel>summary{padding:18px}.ar-body{padding:0 14px 18px}.ar-case,.ar-result,.ar-version{padding:12px}.ar-rule{grid-template-columns:minmax(0,1fr) 32px}.ar-rule select{grid-column:1/-1}.ar-run{flex-direction:column;align-items:stretch}.ar-heading{flex-wrap:wrap}}`;
