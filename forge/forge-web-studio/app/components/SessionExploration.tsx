'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import styles from './SessionExploration.module.css';

type Turn = { id: string; text: string; timestamp: string };
type Milestone = { id: string; label: string; note: string; preview: string; createdAt: string };
type Conclusion = { id: string; title: string; summary: string; source_text: string; source_thread_id: string; source_entry_id: string; source_sha256: string; target_thread_id: string; status: string; version: number };
type Exploration = { status: string; revision: number; turns: Turn[]; milestones: Milestone[]; parent: any; branches: any[]; conclusions: Conclusion[] };
type Api = (path: string, options?: RequestInit) => Promise<any>;

export function SessionExploration({ threadId, api, zh, sending, onNavigate, onCreateSkill }: { threadId: string; api: Api; zh: boolean; sending: boolean; onNavigate: (thread: any) => Promise<void>; onCreateSkill?: (source: { threadId: string; entryId: string; expectedRevision: number; preview?: string }) => void }) {
  const t = (en: string, cn: string) => zh ? cn : en;
  const panelId = useId();
  const apiRef = useRef(api); apiRef.current = api;
  const mounted = useRef(false), sequence = useRef(0), acting = useRef(false);
  const submission = useRef<{ signature: string; key: string } | null>(null);
  const [open, setOpen] = useState(false), [data, setData] = useState<Exploration | null>(null);
  const [loading, setLoading] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [entryId, setEntryId] = useState(''), [label, setLabel] = useState(''), [note, setNote] = useState('');
  const [branchFrom, setBranchFrom] = useState<Milestone | null>(null), [branchTitle, setBranchTitle] = useState(''), [deleteId, setDeleteId] = useState('');
  const [title, setTitle] = useState(''), [summary, setSummary] = useState('');
  const base = `/threads/${encodeURIComponent(threadId)}/pi-session`;
  const request = useCallback(async (path: string, options?: RequestInit) => {
    const result = await apiRef.current(path, options);
    if (result?.success === false || result?.error) throw new Error(result.error || 'REQUEST_FAILED');
    return result.data;
  }, []);
  const refresh = useCallback(async () => {
    const current = ++sequence.current; setLoading(true);
    try {
      const next: Exploration = await request(`${base}/exploration`);
      if (!mounted.current || current !== sequence.current) return;
      setData(next); setEntryId(previous => next.turns.some(turn => turn.id === previous) ? previous : next.turns[0]?.id || ''); setError('');
    } catch (caught: any) { if (mounted.current && current === sequence.current) setError(caught.message || 'REQUEST_FAILED'); }
    finally { if (mounted.current && current === sequence.current) setLoading(false); }
  }, [base, request]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; sequence.current++; }; }, []);
  useEffect(() => { if (open && !sending) void refresh(); }, [open, sending, refresh]);
  const mutate = async (path: string, body: unknown, method = 'POST') => {
    const signature = JSON.stringify([path, body, method]);
    if (submission.current?.signature !== signature) submission.current = { signature, key: crypto.randomUUID() };
    const result = await request(path, { method, headers: { 'Idempotency-Key': submission.current.key }, ...(method !== 'DELETE' ? { body: JSON.stringify(body) } : {}) });
    submission.current = null;
    return result;
  };
  const act = async (operation: () => Promise<void>) => {
    if (acting.current) return;
    acting.current = true; sequence.current++; setBusy(true); setLoading(false); setError(''); setNotice('');
    try { await operation(); }
    catch (caught: any) { if (mounted.current) setError(caught.message || 'REQUEST_FAILED'); }
    finally { acting.current = false; if (mounted.current) { setBusy(false); } }
  };
  const errors: Record<string, [string, string]> = {
    THREAD_RUN_ACTIVE: ['Wait for the current reply to finish, then refresh.', '请等待当前回复完成，再刷新重试。'],
    PI_SESSION_REVISION_CONFLICT: ['The conversation changed. Refresh and select the turn again.', '对话已更新，请刷新后重新选择回复。'],
    PI_CONCLUSION_VERSION_CONFLICT: ['This review changed. Refresh to see the latest decision.', '审核状态已更新，请刷新查看最新决定。'],
    PI_MILESTONE_CONTEXT_CHANGED: ['Your references changed after this milestone. Save a new milestone from a current reply.', '此里程碑之后引用资料已变更，请从最新回复重新保存里程碑。'],
    PI_CONCLUSION_SOURCE_CHANGED: ['The source changed. Submit a fresh conclusion from the branch.', '来源已变更，请从探索分支重新提交结论。'],
    PI_SESSION_ENTRY_NOT_FOUND: ['This reply is no longer in the active session. Refresh and select a current reply.', '这条回复已不在当前会话中，请刷新并重新选择。'],
    PI_CONCLUSION_SCOPE_MISMATCH: ['The source and main task no longer share the same project and Agent version.', '来源与主任务的项目或 Agent 版本已不同，无法采用。'],
    CHAT_IMAGE_STORAGE_LIMIT: ['Image storage is full. Delete unneeded tasks before creating a branch. Your current task is unchanged.', '图片存储已满，请删除不再需要的任务后再创建分支；当前任务保持原样。'],
    CHAT_IMAGE_ORIGINAL_UNAVAILABLE: ['An original image is unavailable. Your current task is unchanged.', '部分历史原图已不可用，当前任务保持原样。'],
    PI_MILESTONE_STORAGE_LIMIT: ['Milestone storage is full. Remove an unused milestone first.', '里程碑存储已满，请先删除不再使用的里程碑。'],
    PI_CONCLUSION_CONTEXT_LIMIT: ['Keep up to 8 adopted conclusions and 16,000 summary characters. Revoke an older reference first.', '最多采用 8 条结论、共 16,000 字，请先撤销不再需要的引用。'],
    PI_CONCLUSION_QUEUE_FULL: ['Review existing pending conclusions before submitting more.', '请先处理主任务中待审核的结论，再提交新结论。'],
    ACCOUNT_SESSION_CHANGED: ['Your account changed. Reopen this task.', '登录账户已切换，请重新打开任务。'],
  };
  const locked = busy || sending || data?.status === 'running';
  const turn = data?.turns.find(item => item.id === entryId);
  const incoming = data?.conclusions.filter(item => item.target_thread_id === threadId) || [];
  const outgoing = data?.conclusions.filter(item => item.source_thread_id === threadId) || [];
  const status = (value: string) => ({ pending: t('Awaiting review', '待审核'), accepted: t('Adopted', '已采用'), rejected: t('Declined', '未采用'), revoked: t('Revoked', '已撤销') }[value] || value);
  const decide = (item: Conclusion, decision: string) => act(async () => {
    await mutate(`${base}/conclusions/${item.id}/decision`, { decision, expectedVersion: item.version });
    if (!mounted.current) return;
    setNotice(decision === 'accept' ? t('Adopted. This reference applies on your next message.', '已采用，下次发送消息时将引用此结论。') : decision === 'revoke' ? t('Revoked. Future replies will start with refreshed context.', '已撤销，后续回复将使用更新后的上下文。') : t('Conclusion declined.', '已拒绝采用此结论。'));
    await refresh();
  });
  return <section className={styles.root} aria-label={t('Milestones and branches', '里程碑与分支')}>
    <button type="button" className={styles.toggle} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(value => !value)}>
      <span className={styles.mark} aria-hidden="true">⑂</span><strong>{t('Milestones & branches', '里程碑与分支')}</strong>
      <span className={styles.hint}>{data ? t(`${data.milestones.length} saved · ${incoming.filter(item => item.status === 'pending').length} to review`, `${data.milestones.length} 个已保存 · ${incoming.filter(item => item.status === 'pending').length} 条待审核`) : t('Save a point. Explore an idea.', '保存阶段成果，探索更多可能')}</span>
      <span aria-hidden="true">{open ? '−' : '+'}</span>
    </button>
    {open && <div id={panelId} className={styles.panel}>
      <div className={styles.intro}><p>{t('A milestone preserves a conversation. A branch explores independently. Bring findings back for review.', '里程碑保留会话状态；分支独立探索；有价值的结论可带回主任务审核。')}</p><button type="button" disabled={busy || loading} onClick={() => void refresh()}>{loading ? t('Refreshing…', '刷新中…') : t('Refresh', '刷新')}</button></div>
      <p className={styles.boundary}>{t('Branching does not undo files or external actions. Adopting a conclusion starts no model call; it refreshes context on the next message.', '创建分支不会撤销文件或外部操作。采用结论不会立即调用模型，会在下次发送消息时更新上下文。')}</p>
      {error && <p role="alert" className={styles.error}>{errors[error]?.[zh ? 1 : 0] || t('Could not complete this action. Refresh to check whether it was saved before retrying.', '操作暂未完成，请先刷新确认是否已保存，再重试。')}</p>}
      {notice && <p role="status" className={styles.notice}>{notice}</p>}
      {sending && <p className={styles.boundary}>{t('The reply is in progress. Save and review once it finishes.', '回复正在生成，完成后可保存和审核。')}</p>}
      {!data && !error && <p role="status">{t('Loading conversation history…', '正在读取会话历史…')}</p>}
      {data && <>
        {data.parent && <button type="button" className={styles.parent} disabled={busy || sending} onClick={() => void act(async () => { if (mounted.current) await onNavigate(data.parent); })}>← {t('Main task', '返回主任务')} · {data.parent.title}</button>}
        <div className={styles.columns}>
          <div>
            <h3><span>01</span>{t('Keep a milestone', '保存里程碑')}</h3>
            {!data.turns.length ? <p className={styles.empty}>{t('Complete a reply to save your first milestone.', '完成一次对话后，即可保存第一个里程碑。')}</p> : <>
              <label className={styles.field}>{t('Completed reply', '选择已完成的回复')}<select value={entryId} disabled={locked} onChange={event => setEntryId(event.target.value)}>{data.turns.map((item, index) => <option key={item.id} value={item.id}>{index === 0 ? t('Latest · ', '最新 · ') : ''}{item.text.slice(0, 80) || t('Completed reply', '已完成的回复')}</option>)}</select></label>
              {turn && <details className={styles.source}><summary>{t('Read selected reply', '查看所选回复')}</summary><pre>{turn.text}</pre></details>}
              {turn && onCreateSkill && <button type="button" disabled={locked} onClick={() => onCreateSkill({ threadId, entryId, expectedRevision: data.revision, preview: turn.text })}>{t('Turn this experience into a Skill', '将这次经验整理为 Skill')} ↗</button>}
              <form onSubmit={event => { event.preventDefault(); void act(async () => {
                await mutate(`${base}/milestones`, { entryId, label, note, expectedRevision: data.revision });
                if (!mounted.current) return; setLabel(''); setNote(''); setNotice(t('Milestone saved. You can explore from this point later.', '里程碑已保存，之后可从这里创建探索分支。')); await refresh();
              }); }}>
                <label className={styles.field}>{t('Milestone name', '里程碑名称')}<input required maxLength={120} value={label} disabled={locked} onChange={event => setLabel(event.target.value)} placeholder={t('e.g. Research reviewed', '例如：需求确认完成')} /></label>
                <label className={styles.field}>{t('Note (optional)', '备注（选填）')}<input maxLength={2000} value={note} disabled={locked} onChange={event => setNote(event.target.value)} placeholder={t('What is worth preserving?', '记录值得保留的内容')} /></label>
                <button className={styles.primary} disabled={locked || !label.trim() || !turn}>{t('Save milestone', '保存里程碑')}</button>
              </form>
            </>}
            {data.parent && turn && <details className={styles.proposal}><summary>{t('Bring a conclusion to the main task', '向主任务提交结论')}</summary><p>{t('Your selected reply is attached as the source. Review the summary before submitting.', '所选回复会作为原文来源附上，请核对摘要后再提交。')}</p><form onSubmit={event => { event.preventDefault(); void act(async () => {
              await mutate(`${base}/conclusions`, { entryId, title, summary, expectedRevision: data.revision });
              if (!mounted.current) return; setTitle(''); setSummary(''); setNotice(t('Submitted for review. Return to the main task to adopt or decline it.', '已提交审核，返回主任务后可查看并决定是否采用。')); await refresh();
            }); }}>
              <label className={styles.field}>{t('Conclusion title', '结论标题')}<input required maxLength={120} value={title} disabled={locked} onChange={event => setTitle(event.target.value)} /></label>
              <label className={styles.field}>{t('Summary to bring back', '带回主任务的摘要')}<textarea required rows={4} maxLength={4000} value={summary} disabled={locked} onChange={event => setSummary(event.target.value)} placeholder={t('Findings, evidence and remaining uncertainty…', '写明结论、依据和仍不确定的内容…')} /></label>
              <button className={styles.primary} disabled={locked || !title.trim() || !summary.trim()}>{t('Submit for review', '提交审核')}</button>
            </form></details>}
          </div>
          <div>
            <h3><span>02</span>{t('Explore from a saved point', '从阶段成果继续探索')}</h3>
            {!data.milestones.length && <p className={styles.empty}>{t('Saved milestones will appear here.', '保存后的里程碑会出现在这里。')}</p>}
            {data.milestones.map(item => <article className={styles.card} key={item.id}><strong>{item.label}</strong>{item.note && <p>{item.note}</p>}<details className={styles.source}><summary>{t('Preview snapshot', '预览会话快照')}</summary><pre>{item.preview}</pre></details><div className={styles.actions}>
              <button type="button" disabled={locked} onClick={() => { setBranchFrom(item); setBranchTitle(`${item.label} · ${t('exploration', '探索')}`.slice(0, 200)); }}>{t('Explore branch', '创建探索分支')}</button>
              <button type="button" disabled={locked} onClick={() => setDeleteId(item.id)}>{t('Remove', '删除')}</button>
            </div>{deleteId === item.id && <div className={styles.confirm}><p>{t('Remove this saved snapshot? Existing branches are kept.', '删除这个会话快照？已经创建的分支会保留。')}</p><button type="button" disabled={locked} onClick={() => void act(async () => { await mutate(`${base}/milestones/${item.id}`, {}, 'DELETE'); if (!mounted.current) return; setDeleteId(''); await refresh(); })}>{t('Confirm removal', '确认删除')}</button><button type="button" disabled={busy} onClick={() => setDeleteId('')}>{t('Keep', '保留')}</button></div>}</article>)}
            {branchFrom && <form className={styles.branchForm} onSubmit={event => { event.preventDefault(); void act(async () => {
              const branch = await mutate(`${base}/milestones/${branchFrom.id}/branch`, { title: branchTitle });
              if (!mounted.current) return; setBranchFrom(null); await onNavigate(branch);
            }); }}><p>{t('Start from', '起点')} <strong>{branchFrom.label}</strong></p><label className={styles.field}>{t('Branch name', '分支名称')}<input autoFocus required maxLength={200} value={branchTitle} disabled={locked} onChange={event => setBranchTitle(event.target.value)} /></label><div className={styles.actions}><button className={styles.primary} disabled={locked || !branchTitle.trim()}>{t('Create & open branch', '创建并打开分支')}</button><button type="button" disabled={busy} onClick={() => setBranchFrom(null)}>{t('Cancel', '取消')}</button></div></form>}
            {data.branches.length > 0 && <nav className={styles.branches} aria-label={t('Exploration branches', '探索分支')}>{data.branches.map(branch => <button type="button" key={branch.id} disabled={busy || sending} onClick={() => void act(async () => { if (mounted.current) await onNavigate(branch); })}>⑂ <span>{branch.title}</span><span aria-hidden="true">↗</span></button>)}</nav>}
          </div>
        </div>
        <div className={styles.reviews}><h3><span>03</span>{t('Review branch findings', '审核探索结论')}</h3>
          {!incoming.length && !outgoing.length && <p className={styles.empty}>{t('Conclusions submitted from a branch appear here. You decide what the main task adopts.', '探索分支提交的结论会显示在这里，由你决定主任务采用哪些内容。')}</p>}
          {[...incoming, ...outgoing].map(item => <article className={styles.card} key={item.id}><div className={styles.reviewHeading}><strong>{item.title}</strong><span className={styles.badge} data-status={item.status}>{status(item.status)}</span></div><p className={styles.summary}>{item.summary}</p><details className={styles.source}><summary>{t('Inspect original reply & source', '查看原始回复与来源')}</summary><pre>{item.source_text}</pre><small>{t('Source task', '来源任务')}: {item.source_thread_id}<br />{t('Reply', '回复')}: {item.source_entry_id}<br />SHA-256: {item.source_sha256}</small></details>
            {item.target_thread_id === threadId ? <div className={styles.actions}>{item.status === 'pending' && <><button type="button" className={styles.primary} disabled={locked} onClick={() => void decide(item, 'accept')}>{t('Adopt in main task', '主任务采用')}</button><button type="button" disabled={locked} onClick={() => void decide(item, 'reject')}>{t('Decline', '不采用')}</button></>}{item.status === 'accepted' && <button type="button" disabled={locked} onClick={() => void decide(item, 'revoke')}>{t('Revoke reference', '撤销引用')}</button>}</div> : <p className={styles.boundary}>{t('Submitted to the main task for review.', '已提交至主任务，由主任务审核。')}</p>}
          </article>)}
        </div>
      </>}
    </div>}
  </section>;
}
