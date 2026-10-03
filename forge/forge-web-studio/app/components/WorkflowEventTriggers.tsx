'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './WorkflowWorkspace.module.css';

export const newReceiverKey = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), value => value.toString(16).padStart(2, '0')).join('');
export type ReceiverSecret = { id: string; key: string };
type Trigger = { id: string; definition: { name: string; maxCostUsd: number }; eventType: string; status: string; version: number; runCount: number; maxRuns: number; totalBudgetUsd: number; expiresAt: number; receipts: { eventId: string; workflowId: string; status: string; createdAt: number }[] };
type Api = (path: string, options?: RequestInit) => Promise<any>;
export function eventError(code: string, zh: boolean) {
  const messages: Record<string, [string, string]> = {
    EVENT_VERSION_CONFLICT: ['This entry changed. Refresh before trying again.', '入口状态已变化，请刷新后重试。'],
    EVENT_CLOSED: ['This entry has expired or reached its run limit. Create a new entry to continue.', '入口已到期或达到次数上限，请新建入口继续。'],
    EVENT_INVALID_EXPIRY: ['Choose an expiry within the next 90 days.', '请选择未来 90 天内的截止时间。'],
    EVENT_INVALID_TYPE: ['Use letters, numbers, dots, underscores or hyphens, starting with a letter.', '事件名称须以字母开头，可包含数字、点、下划线和连字符。'],
    EVENT_PROMPT_TOO_LONG: ['Keep event workflow context within 6,000 characters.', '事件工作流的目标与背景请控制在 6,000 字符以内。'],
    EVENT_BUDGET_CONFIRMATION_REQUIRED: ['Confirm the total budget for all accepted events.', '请确认全部事件执行的总预算。'],
    EVENT_TRIGGER_LIMIT: ['This account has reached its 100-entry limit.', '此账号已达到 100 个事件入口上限。'],
    EVENT_IDEMPOTENCY_CONFLICT: ['This request is already saved with different details. Refresh to find it.', '此请求已保存，但内容与当前不同，请刷新查看。'],
    EVENT_INVALID_MAX_RUNS: ['Allow between 1 and 100 events.', '允许的事件次数须为 1 至 100 次。'],
    EVENT_NOT_FOUND: ['This event entry is no longer available.', '此事件入口已不可用。'],
    CLIPBOARD_UNAVAILABLE: ['Copy could not finish. Select and copy the value manually.', '自动复制未完成，请选中内容手动复制。'],
  };
  return messages[code]?.[zh ? 1 : 0] || (zh ? '操作未完成，请刷新确认状态后重试。' : 'The operation could not finish. Refresh to check its state, then retry.');
}

export function WorkflowEventTriggers({ request, apiBase, zh, secret, onSecret, onOpen }: { request: Api; apiBase: string; zh: boolean; secret: ReceiverSecret | null; onSecret: (value: ReceiverSecret | null) => void; onOpen: (id: string) => void }) {
  const t = (en: string, cn: string) => zh ? cn : en;
  const [entries, setEntries] = useState<Trigger[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(''), [rotate, setRotate] = useState('');
  const alive = useRef(false), acting = useRef(false), sequence = useRef(0);
  const rotation = useRef<{ id: string; key: string; version: number } | null>(null);
  const load = async () => {
    const version = sequence.current;
    try { const result = await request('/pi-event-triggers'); if (alive.current && version === sequence.current) setEntries(result.data); }
    catch (caught: any) { if (alive.current && version === sequence.current) setError(caught.message); }
    finally { if (alive.current) setLoading(false); }
  };
  useEffect(() => {
    alive.current = true; void load();
    const timer = setInterval(() => { if (!acting.current && document.visibilityState === 'visible') void load(); }, 4000);
    return () => { alive.current = false; sequence.current++; clearInterval(timer); rotation.current = null; };
  // request is stable and account changes remount the parent workspace.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);
  const change = async (entry: Trigger, action: 'pause' | 'resume' | 'rotate') => {
    if (acting.current) return;
    acting.current = true; sequence.current++; setBusy(entry.id); setError(''); setNotice('');
    try {
      if (action === 'rotate' && rotation.current?.id !== entry.id) rotation.current = { id: entry.id, key: newReceiverKey(), version: entry.version };
      const pending = action === 'rotate' ? rotation.current : null;
      const result = await request('/pi-event-triggers/' + entry.id, { method: 'POST', body: JSON.stringify({ action, expectedVersion: pending?.version ?? entry.version, ...(pending ? { receiverKey: pending.key } : {}) }) });
      if (!alive.current) return;
      setEntries(current => current.map(item => item.id === entry.id ? result.data : item));
      if (pending) { onSecret({ id: entry.id, key: pending.key }); rotation.current = null; setRotate(''); }
      setNotice(action === 'pause' ? t('New events are paused. Accepted workflows remain in your workflow list.', '已暂停接收新事件。已接收的任务仍可在工作流列表查看或停止。') : action === 'resume' ? t('New events can be accepted again.', '已恢复接收新事件。') : t('Key replaced. Update the sending system; the previous key no longer works.', '密钥已更换，请更新发送系统；旧密钥已失效。'));
    } catch (caught: any) { if (alive.current) { setError(caught.message); if (caught.message === 'EVENT_VERSION_CONFLICT') rotation.current = null; } }
    finally { acting.current = false; if (alive.current) { setBusy(''); void load(); } }
  };
  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); if (alive.current) setNotice(t('Copied.', '已复制。')); }
    catch { if (alive.current) setError('CLIPBOARD_UNAVAILABLE'); }
  };
  const state = (value: string) => ({ active: t('Listening', '等待事件'), paused: t('Paused', '已暂停'), expired: t('Expired', '已到期'), exhausted: t('Run limit reached', '次数已用完') }[value] || value);
  const resultState = (value: string) => ({ completed: t('Completed', '已完成'), awaiting_review: t('Review required', '待审核'), running: t('Running', '执行中'), failed: t('Failed', '未通过'), cancelled: t('Cancelled', '已取消'), queued: t('Queued', '排队中'), blocked: t('Needs attention', '需要处理') }[value] || t('View progress', '查看进展'));
  return <section className={styles.eventSection} aria-label={t('External events', '外部事件')}>
    <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>{t('CONNECTED WORK', '让事件带动工作')}</p><h2>{t('An event arrives. Work begins.', '事件到达，工作开始。')}</h2></div><button disabled={!!busy} onClick={() => { setError(''); void load(); }}>{t('Refresh entries', '刷新入口')}</button></div>
    <p className={styles.help}>{t('Connect an order, form or alert to a fixed workflow. Each unique event uses one run; retries return the same result. Set up an entry in the workflow editor.', '让订单、表单或通知触发固定工作流。每个新事件占用一次执行，重试返回同一任务。在新建工作流中选择「外部事件触发」即可配置。')}</p>
    {error && <p role="alert" className={styles.error}>{eventError(error, zh)}</p>}
    {notice && <p role="status" className={styles.notice}>{notice}</p>}
    {loading ? <p role="status">{t('Loading entries…', '正在读取事件入口…')}</p> : entries.length === 0 ? <p className={styles.eventEmpty}>{t('No connected events yet.', '还没有连接外部事件。')}</p> : <div className={styles.eventGrid}>{entries.map(entry => {
      const endpointPath = apiBase.replace(/\/$/, '') + '/pi-events/' + entry.id;
      const endpoint = typeof window === 'undefined' ? endpointPath : new URL(endpointPath, window.location.origin).href;
      return <article className={styles.eventCard} key={entry.id}>
        <div className={styles.sectionTitle}><h3>{entry.definition.name}</h3><span className={styles.badge}>{state(entry.status)}</span></div>
        <p className={styles.eventType}>{entry.eventType}</p>
        <div className={styles.eventMetrics}><span><strong>{entry.runCount}<small> / {entry.maxRuns}</small></strong>{t('events accepted', '已接收事件')}</span><span><strong>${entry.totalBudgetUsd.toFixed(2)}</strong>{t('total budget cap', '总预算上限')}</span></div>
        <p className={styles.help}>{t('Expires ', '有效至 ')}{new Date(entry.expiresAt).toLocaleString(zh ? 'zh-CN' : 'en-US')} · ${entry.definition.maxCostUsd.toFixed(2)}{t(' per run', ' / 次')}</p>
        {secret?.id === entry.id && <div className={styles.eventSecret} role="region" aria-label={t('New receiver key', '新的接收密钥')}>
          <strong>{t('Save your receiver key now', '现在保存接收密钥')}</strong><p>{t('Shown only in this visit. Store it in your sending system. If lost, replace it below.', '密钥仅在本次页面显示，请保存到发送系统；丢失后可在下方更换。')}</p>
          <label>{t('Receiver key', '接收密钥')}<input readOnly value={secret.key} autoComplete="off" spellCheck={false} onFocus={event => event.target.select()} /></label>
          <div className={styles.actions}><button onClick={() => void copy(secret.key)}>{t('Copy key', '复制密钥')}</button><button onClick={() => onSecret(null)}>{t('Saved · hide key', '已保存，隐藏密钥')}</button></div>
        </div>}
        <details className={styles.checks}><summary>{t('Connection details', '连接说明')}</summary><label>{t('Receiver URL · POST', '接收地址 · POST')}<input readOnly value={endpoint} onFocus={event => event.target.select()} /></label><button onClick={() => void copy(endpoint)}>{t('Copy URL', '复制地址')}</button>
          <p className={styles.help}>{t('Send JSON with the headers below. Replace the key placeholder. Reuse eventId only when retrying the same event. Data must be a JSON object up to 4 KB.', '使用以下请求头发送 JSON，并替换密钥占位符。同一事件重试时复用 eventId；data 为不超过 4 KB 的 JSON 对象。')}</p>
          <pre className={styles.eventCode}>{'Authorization: Bearer <' + t('receiver-key', '接收密钥') + '>\nContent-Type: application/json\n\n' + JSON.stringify({ eventId: 'event-001', type: entry.eventType, data: { message: t('Your event details', '你的事件内容') } }, null, 2)}</pre>
          <p className={styles.help}>{t('A success receipt means the workflow was accepted, not completed. Event content is source data. Existing action approvals and review steps still apply.', '成功回执表示任务已接收，完成结果请在下方查看。事件内容作为资料输入，原有操作授权与人工审核仍然有效。')}</p>
        </details>
        <div className={styles.actions}>{['active', 'paused'].includes(entry.status) && <button disabled={!!busy} onClick={() => void change(entry, entry.status === 'active' ? 'pause' : 'resume')}>{busy === entry.id ? t('Saving…', '保存中…') : entry.status === 'active' ? t('Pause new events', '暂停接收新事件') : t('Resume events', '恢复接收事件')}</button>}<button disabled={!!busy} onClick={() => setRotate(entry.id)}>{t('Replace key', '更换密钥')}</button></div>
        {rotate === entry.id && <div className={styles.confirm}><p>{t('Replace this key? The previous key stops working immediately. Update the sending system after saving the new key.', '确认更换密钥？旧密钥将立即失效，保存新密钥后请同步更新发送系统。')}</p><button disabled={!!busy} onClick={() => void change(entry, 'rotate')}>{t('Confirm replacement', '确认更换')}</button><button disabled={!!busy} onClick={() => setRotate('')}>{t('Keep current key', '保留当前密钥')}</button></div>}
        {entry.receipts.length > 0 && <div className={styles.eventReceipts}><p className={styles.eyebrow}>{t('RECENT EVENTS', '最近接收')}</p>{entry.receipts.map(receipt => <button key={receipt.eventId} onClick={() => onOpen(receipt.workflowId)}><span>{receipt.eventId}</span><span>{resultState(receipt.status)} ↗</span></button>)}</div>}
      </article>;
    })}</div>}
  </section>;
}
