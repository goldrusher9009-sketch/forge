'use client';
import React, { useEffect, useRef, useState } from 'react';
import styles from './ConnectorSettings.module.css';

type Connector = { id: string; name?: string; category?: string; setupUrl?: string };
type Saved = { id: string; configured?: boolean; credential_status?: string; created_at?: string };
type Editor = { connector: Connector; mode: 'save' | 'delete' };
type Props = { accountId: string; zh: boolean; catalog: Connector[]; request: (path: string, options?: RequestInit) => Promise<any> };
const validId = (id: unknown): id is string => typeof id === 'string' && /^[a-z0-9][a-z0-9_-]{0,63}$/.test(id);
function documentation(value?: string) {
  try { const u = new URL(value || ''); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.href : undefined; } catch { return undefined; }
}

export function ConnectorSettings({ accountId, zh, catalog, request }: Props) {
  const t = (cn: string, en: string) => zh ? cn : en;
  const api = useRef(request); api.current = request;
  const alive = useRef(false), loadingVersion = useRef(0), mutation = useRef(0), pending = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null), secretInput = useRef<HTMLInputElement>(null), cancel = useRef<HTMLButtonElement>(null), opener = useRef<HTMLButtonElement | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [saved, setSaved] = useState<Saved[]>([]), [query, setQuery] = useState(''), [onlySaved, setOnlySaved] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null), [secret, setSecret] = useState(''), [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const load = async () => {
    const version = ++loadingVersion.current; setState('loading');
    try {
      const result = await api.current('/connectors', { signal: AbortSignal.timeout(15000) });
      if (!result?.success || !Array.isArray(result.data)) throw Error('INVALID_CONNECTOR_LIST');
      if (!alive.current || version !== loadingVersion.current) return;
      setSaved(result.data.filter((row: Saved) => validId(row.id))); setState('ready');
    } catch { if (alive.current && version === loadingVersion.current) setState('error'); }
  };
  useEffect(() => {
    alive.current = true; void load();
    return () => { alive.current = false; loadingVersion.current++; mutation.current++; };
  }, [accountId]);
  useEffect(() => {
    if (!editor) return;
    dialog.current?.showModal();
    if (editor.mode === 'save') secretInput.current?.focus(); else cancel.current?.focus();
  }, [editor]);
  const close = () => {
    if (pending.current) return;
    dialog.current?.close(); setEditor(null); setSecret(''); setVisible(false); setError('');
    opener.current?.focus();
  };
  const open = (connector: Connector, mode: Editor['mode'], target: HTMLButtonElement) => {
    if (state !== 'ready' || pending.current) return;
    opener.current = target; setSecret(''); setVisible(false); setError(''); setNotice(''); setEditor({ connector, mode });
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editor || state !== 'ready' || pending.current || (editor.mode === 'save' && (!secret.trim() || secret.trim().length > 8192))) return;
    const selected = editor, version = ++mutation.current;
    pending.current = true; setBusy(true); setError('');
    try {
      const result = await api.current(selected.mode === 'save' ? '/connectors' : '/connectors/' + encodeURIComponent(selected.connector.id), {
        method: selected.mode === 'save' ? 'POST' : 'DELETE', signal: AbortSignal.timeout(15000),
        ...(selected.mode === 'save' ? { body: JSON.stringify({ id: selected.connector.id, key: secret.trim() }) } : {}),
      });
      if (!result?.success || (selected.mode === 'save' && result.data?.id !== selected.connector.id)) throw Error('UNCONFIRMED_SAVE');
      if (!alive.current || version !== mutation.current) return;
      setSaved(rows => selected.mode === 'delete' ? rows.filter(row => row.id !== selected.connector.id)
        : [...rows.filter(row => row.id !== selected.connector.id), { id: selected.connector.id, configured: true, credential_status: result.data?.credential_status }]);
      setNotice(selected.mode === 'save' ? t('凭据已保存。连接尚未验证，工具不会自动启用。', 'Credentials saved. The connection is unverified and tools are not automatically enabled.')
        : t('已删除保存的凭据。', 'Saved credentials deleted.'));
      pending.current = false; close();
    } catch {
      if (alive.current && version === mutation.current) setError(selected.mode === 'save'
        ? t('未能确认保存。输入仍保留，请重试；也可以关闭此窗口后重新加载查看保存状态。', 'Saving could not be confirmed. Your input is kept. Retry, or close this dialog and reload the saved status.')
        : t('未能确认删除。请重试，或关闭此窗口后重新加载查看保存状态。', 'Deletion could not be confirmed. Retry, or close this dialog and reload the saved status.'));
    } finally { if (alive.current && version === mutation.current) { pending.current = false; setBusy(false); } }
  };
  const entries = new Map<string, Connector>();
  for (const row of catalog) if (validId(row.id)) entries.set(row.id, row);
  for (const row of saved) if (!entries.has(row.id)) entries.set(row.id, { id: row.id, name: row.id, category: t('自定义', 'Custom') });
  const savedIds = new Set(saved.map(row => row.id));
  const items = [...entries.values()].filter(row => (!onlySaved || savedIds.has(row.id)) && `${row.name || row.id} ${row.category || ''}`.toLowerCase().includes(query.trim().toLowerCase()));
  const currentName = editor?.connector.name || editor?.connector.id;
  const docs = documentation(editor?.connector.setupUrl);
  return <section className={styles.root} aria-label={t('连接凭据', 'Connection credentials')}>
    <header className={styles.header}>
      <div><span className={styles.eyebrow}>FORGE / CONNECTIONS</span><h2>{t('连接凭据', 'Connection credentials')}</h2></div>
      <span className={styles.count}>{t('已保存', 'Saved')} <b>{state === 'ready' ? saved.length : '—'}</b></span>
    </header>
    <p className={styles.intro}>{t('按账号加密保存在 Forge。保存凭据不代表已连通，也不会自动注册或启用聊天工具。实际使用仍需要对应集成和业务调用验证。', 'Encrypted in Forge for your account. Saving credentials does not verify a connection or automatically register chat tools. Using a service still requires its integration and a verified business call.')}</p>
    <div className={styles.toolbar}>
      <input type="search" aria-label={t('搜索连接配置', 'Search connections')} placeholder={t('搜索服务名称…', 'Find a service…')} value={query} onChange={e => setQuery(e.target.value)} />
      <button type="button" aria-pressed={onlySaved} onClick={() => setOnlySaved(value => !value)}>{t('仅看已保存', 'Saved only')}</button>
      <button type="button" disabled={busy || state === 'loading'} onClick={() => void load()}>{t('重新加载', 'Reload')}</button>
    </div>
    {state === 'loading' && <p role="status" className={styles.feedback}>{t('正在读取已保存的配置…', 'Loading saved configurations…')}</p>}
    {state === 'error' && <p role="alert" className={styles.error}>{t('暂时无法确认保存状态，请重新加载后再操作。', 'Saved status could not be confirmed. Reload before making changes.')}</p>}
    {notice && <p role="status" className={styles.feedback}>{notice}</p>}
    <div className={styles.list}>
      {items.map(row => {
        const configured = savedIds.has(row.id);
        return <article key={row.id} className={styles.row} aria-label={row.name || row.id}>
          <span className={styles.monogram} aria-hidden="true">{(row.name || row.id).slice(0, 2).toUpperCase()}</span>
          <div className={styles.identity}><h3>{row.name || row.id}</h3><span>{state !== 'ready' ? t('状态未确认', 'Status unconfirmed') : configured ? t('已保存 · 未验证连接', 'Saved · connection unverified') : t('未保存凭据', 'No saved credentials')}</span></div>
          <div className={styles.actions}>
            <button type="button" disabled={state !== 'ready' || busy} onClick={e => open(row, 'save', e.currentTarget)}>{configured ? t('更新凭据', 'Update credentials') : t('保存凭据', 'Save credentials')}</button>
            {configured && <button type="button" disabled={state !== 'ready' || busy} aria-label={t(`删除 ${row.name || row.id} 的凭据`, `Delete credentials for ${row.name || row.id}`)} onClick={e => open(row, 'delete', e.currentTarget)}>{t('删除', 'Delete')}</button>}
          </div>
        </article>;
      })}
      {!items.length && state === 'ready' && <p className={styles.empty}>{onlySaved ? t('没有符合筛选条件的已保存配置。', 'No saved configurations match this filter.') : t('没有找到匹配的服务。', 'No matching services found.')}</p>}
    </div>
    {editor && <dialog ref={dialog} className={styles.dialog} aria-labelledby="connector-editor-title" aria-describedby="connector-editor-help" aria-busy={busy}
      onCancel={event => { event.preventDefault(); close(); }} onClick={event => { const r = event.currentTarget.getBoundingClientRect(); if (event.target === event.currentTarget && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) close(); }}>
      <form onSubmit={submit}>
        <div className={styles.dialogHeader}><span className={styles.eyebrow}>{editor.mode === 'save' ? 'CONFIGURATION' : 'REMOVE CREDENTIALS'}</span><button type="button" disabled={busy} onClick={close} aria-label={t('关闭连接配置', 'Close connection settings')}>×</button></div>
        <h2 id="connector-editor-title">{editor.mode === 'save' ? currentName : t(`删除 ${currentName} 的凭据？`, `Delete credentials for ${currentName}?`)}</h2>
        <p id="connector-editor-help">{editor.mode === 'save' ? t('只保存到当前 Forge 账号。请使用服务提供的 API 密钥或访问凭据；保存后仍需验证实际业务调用。', 'Saved only to this Forge account. Use credentials issued by the service. A successful business call is still needed to verify the integration.') : t('删除后，该账号需要重新保存凭据才能再次使用相关集成。', 'This account will need to save credentials again before using the relevant integration.')}</p>
        {editor.mode === 'save' && <>
          {docs && <a href={docs} target="_blank" rel="noopener noreferrer">{t('查看服务文档 ↗', 'Service documentation ↗')}</a>}
          <label className={styles.label} htmlFor="connector-secret">{t('访问凭据', 'Access credential')}</label>
          <div className={styles.secret}><input id="connector-secret" ref={secretInput} type={visible ? 'text' : 'password'} value={secret} onChange={e => setSecret(e.target.value)} autoComplete="new-password" spellCheck={false} disabled={busy} /><button type="button" disabled={busy} aria-pressed={visible} onClick={() => setVisible(value => !value)}>{visible ? t('隐藏', 'Hide') : t('显示', 'Show')}</button></div>
          {secret.trim().length > 8192 && <p role="alert" className={styles.error}>{t('凭据超过 8,192 字符，请检查是否粘贴了多余内容。没有截断或发送。', 'Credentials exceed 8,192 characters. Check for extra pasted content. Nothing was truncated or sent.')}</p>}
        </>}
        {error && <p role="alert" className={styles.error}>{error}</p>}
        <div className={styles.footer}><button type="button" ref={cancel} onClick={close} disabled={busy}>{t('取消', 'Cancel')}</button><button type="submit" className={styles.primary} disabled={busy || (editor.mode === 'save' && (!secret.trim() || secret.trim().length > 8192))}>{busy ? t('正在处理…', 'Working…') : editor.mode === 'save' ? t('保存凭据', 'Save credentials') : t('确认删除', 'Delete credentials')}</button></div>
      </form>
    </dialog>}
  </section>;
}
