import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { availableDraftReleases, DraftClient, DraftRelease, ResendConfiguration, resendConfiguration, saveResendCredential, singleMailAddress } from './business-tasks';

type Binding = { id: string; address: string; agentId: string; releaseId: string; enabled: boolean; configurationStatus: 'awaiting_webhook' | 'enabled' | 'disabled'; credentialStatus: 'saved_unverified'; webhookPath: string; createdAt: number };
type Event = { id: string; bindingId: string; emailId: string; status: 'queued' | 'retrieving' | 'drafting' | 'ready' | 'attention' | 'cancelled'; attempt: number; errorCode: string | null; threadId: string | null; requestId: string; from: string | null; subject: string | null; attachmentsNotRead: number; createdAt: number; updatedAt: number };
type Source = Event & { text: string | null; to: string[]; replyTo: string | null; authentication: Record<string, unknown> | null };
type Props = { client: DraftClient; onBusyChange?: (busy: boolean) => void; onOpenDraft: (threadId: string) => void };
const C = { paper: '#fffdf7', ink: '#20251f', muted: '#686f63', line: '#dcded2', green: '#3d6229', accent: '#b5db57', red: '#a33d30' };
const statuses: Record<Event['status'], string> = { queued: '已排队 · 等待读取来信', retrieving: '正在读取来信', drafting: '正在生成并保存草稿', ready: '草稿已准备 · 仍需本人审阅', attention: '需要你检查', cancelled: '已停止自动处理' };
const segment = (value: string) => encodeURIComponent(value);
function failure(error: unknown): string {
  const code = error instanceof Error ? error.message.split(':')[0] : '';
  const messages: Record<string, string> = {
    INCOMING_CREDENTIAL_REQUIRED: '请先加密保存自己的 Resend API key。',
    INCOMING_FREE_DRAFT_AGENT_REQUIRED: '此助手版本不能用于收件草稿。请刷新并选择只保存草稿、使用免费模型的助手。',
    INCOMING_WEBHOOK_SECRET_REQUIRED: '请填写 Resend 提供的 whsec_ 开头的 Webhook 签名密钥。',
    INCOMING_INVALID_ADDRESS: '请填写一个真实的收件邮箱地址。',
    INCOMING_EXISTING_BINDING_REQUIRED: '此地址已有原配置，请继续配置或读取原记录，不要重复准备。',
    INCOMING_BINDING_LIMIT: '当前最多准备或启用 3 个收件地址，请先取消或停用不再使用的地址。',
    INCOMING_DAILY_LIMIT: '今天的 20 封处理上限已用完，这封来信不会自动再次处理。',
    INCOMING_ATTEMPT_LIMIT: '这封来信已达到最多 3 次尝试，请检查已有工作记录。',
    INCOMING_RETRY_NOT_AVAILABLE: '原记录的状态已经变化，请先刷新处理记录。',
    INCOMING_STILL_RUNNING: '原草稿仍在生成，请查看工作区，暂时不能再次起草。',
    INCOMING_AUTOMATION_DISABLED: '原收件配置已停用，不能继续自动起草。',
    INCOMING_CREDENTIAL_CHANGED: '邮件凭据已变化，请检查原收件配置和服务账号。',
    INCOMING_AUTHORIZATION_REVOKED: '原后台授权已失效，请检查账号和收件配置。',
    INCOMING_PLAIN_TEXT_REQUIRED: '这封邮件没有可用的纯文本正文；HTML 和附件内容不会自动读取。',
    INCOMING_SOURCE_TOO_LARGE: '完整来信超过 60 KB 的处理上限，没有截断后继续起草。',
    INCOMING_SOURCE_MISMATCH: '邮件服务原文与收到的通知不一致，暂时不能据此起草。',
    INCOMING_MULTIPLE_REPLY_ADDRESSES: '来信包含多个回复地址，需要本人确认回复对象。',
    INCOMING_RESULT_UNCONFIRMED: '响应尚未确认。请先读取原配置和记录，再决定下一步。',
    NETWORK_UNAVAILABLE: '连接中断了。操作可能已被保存，请先读取原配置和记录。',
    SESSION_EXPIRED: '登录已过期，请重新登录。', AUTH_REQUIRED: '请重新登录后继续。',
  };
  return messages[code] || '本次处理尚未确认，请检查原记录并刷新。';
}
const bindingValid = (row: any): row is Binding => !!row && typeof row.id === 'string' && !!row.id && singleMailAddress(row.address)
  && typeof row.agentId === 'string' && typeof row.releaseId === 'string' && typeof row.enabled === 'boolean' && row.credentialStatus === 'saved_unverified'
  && ['awaiting_webhook', 'enabled', 'disabled'].includes(row.configurationStatus) && row.enabled === (row.configurationStatus === 'enabled')
  && row.webhookPath === `/api/incoming-mail/webhooks/${row.id}` && Number.isFinite(row.createdAt);
const eventValid = (row: any): row is Event => !!row && typeof row.id === 'string' && !!row.id && typeof row.bindingId === 'string'
  && typeof row.status === 'string' && Object.prototype.hasOwnProperty.call(statuses, row.status) && (row.threadId === null || typeof row.threadId === 'string' && !!row.threadId)
  && typeof row.emailId === 'string' && typeof row.requestId === 'string' && (row.from === null || typeof row.from === 'string') && (row.subject === null || typeof row.subject === 'string')
  && Number.isSafeInteger(row.attempt) && row.attempt >= 1 && row.attempt <= 3
  && (row.errorCode === null || typeof row.errorCode === 'string') && Number.isFinite(row.createdAt) && Number.isFinite(row.updatedAt)
  && Number.isSafeInteger(row.attachmentsNotRead) && row.attachmentsNotRead >= 0 && row.attachmentsNotRead <= 100;

export default function IncomingMail({ client, onBusyChange, onOpenDraft }: Props) {
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [releases, setReleases] = useState<DraftRelease[]>([]);
  const [chosen, setChosen] = useState('');
  const [address, setAddress] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [key, setKey] = useState('');
  const [credentials, setCredentials] = useState<ResendConfiguration | null>(null);
  const [known, setKnown] = useState(false);
  const [saveUnknown, setSaveUnknown] = useState(false);
  const [source, setSource] = useState<Source | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const mounted = useRef(true), busyRef = useRef(false), generation = useRef(0);
  const clientRef = useRef(client), controller = useRef<AbortController | null>(null);
  clientRef.current = client;

  const begin = () => {
    if (!mounted.current || busyRef.current || clientRef.current !== client) return null;
    const id = ++generation.current, accountClient = client;
    const abort = new AbortController(); controller.current = abort;
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; abort.abort(); }, 20000);
    busyRef.current = true; setBusy(true); setError(''); setNotice('');
    const ensure = () => {
      if (!mounted.current || clientRef.current !== accountClient || generation.current !== id) throw new Error('INCOMING_STOPPED');
      if (timedOut) throw new Error('INCOMING_RESULT_UNCONFIRMED');
      if (abort.signal.aborted) throw new Error('INCOMING_STOPPED');
    };
    const api: DraftClient = {
      request: async <T,>(path: string, init?: RequestInit) => { ensure(); try { const reply = await accountClient.request<T>(path, { ...init, signal: abort.signal }); ensure(); return reply; } catch (e) { ensure(); throw e; } },
      requestText: async (path, init) => { ensure(); const reply = await accountClient.requestText(path, { ...init, signal: abort.signal }); ensure(); return reply; },
    };
    return { id, api, ensure, finish: () => { clearTimeout(timer); if (mounted.current && clientRef.current === accountClient && generation.current === id) { busyRef.current = false; setBusy(false); controller.current = null; } } };
  };
  type Operation = NonNullable<ReturnType<typeof begin>>;
  const reportError = (e: unknown, op: Operation) => {
    if (mounted.current && clientRef.current === client && generation.current === op.id && !(e instanceof Error && ['INCOMING_STOPPED', 'SESSION_CHANGED', 'REQUEST_CANCELLED'].includes(e.message.split(':')[0]))) setError(failure(e));
  };
  const readState = async (op: Operation) => {
    const reply = await op.api.request<{ success: boolean; data: { bindings: Binding[]; events: Event[] } }>('/api/incoming-mail');
    if (reply.success !== true || !Array.isArray(reply.data?.bindings) || !reply.data.bindings.every(bindingValid) || !Array.isArray(reply.data.events) || !reply.data.events.every(eventValid)) throw new Error('INCOMING_RESULT_UNCONFIRMED');
    op.ensure(); setBindings(reply.data.bindings); setEvents(reply.data.events); setKnown(true);
    setSource(previous => { const current = previous && reply.data.events.find(row => row.id === previous.id); return previous && current ? { ...previous, ...current } : previous; });
    return reply.data;
  };
  const refresh = async () => {
    const op = begin(); if (!op) return;
    try {
      const [, config, list] = await Promise.all([readState(op), resendConfiguration(op.api), availableDraftReleases(op.api, true)]);
      op.ensure(); setCredentials(config); setReleases(list); setChosen(previous => list.some(item => item.releaseId === previous) ? previous : list[0]?.releaseId || '');
      setSaveUnknown(false); setNotice('已读取当前账号的配置与记录。保存凭据和签名密钥不代表收件域名或服务权限已验证。');
    } catch (e) { reportError(e, op); if (mounted.current && clientRef.current === client && generation.current === op.id) setKnown(false); }
    finally { op.finish(); }
  };
  useEffect(() => {
    mounted.current = true; busyRef.current = false; setBusy(false);
    setBindings([]); setEvents([]); setReleases([]); setChosen(''); setAddress(''); setWebhookSecret(''); setKey('');
    setCredentials(null); setKnown(false); setSaveUnknown(false); setSource(null); setError(''); setNotice('');
    void refresh();
    const accountBusyCallback = onBusyChange;
    return () => { mounted.current = false; generation.current += 1; controller.current?.abort(); controller.current = null; busyRef.current = false; accountBusyCallback?.(false); };
  }, [client]);
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  const editable = () => mounted.current && clientRef.current === client && !busyRef.current;
  const sameAddress = (left: string, right: string) => left.trim().toLowerCase() === right.trim().toLowerCase();
  const existing = bindings.find(row => row.enabled && sameAddress(row.address, address));
  const chosenRelease = releases.find(row => row.releaseId === chosen);
  const pending = bindings.find(row => row.configurationStatus === 'awaiting_webhook' && sameAddress(row.address, address) && row.releaseId === chosen && row.agentId === chosenRelease?.agentId);
  const saveKey = async () => {
    if (!key.trim()) return;
    const op = begin(); if (!op) return;
    try {
      await saveResendCredential(op.api, key); op.ensure(); setKey('');
      const config = await resendConfiguration(op.api); op.ensure(); setCredentials(config);
      setNotice('凭据已按账号加密保存，收件与发送权限仍需实际服务结果确认。更新凭据会使旧收件授权失效，请检查已有配置。');
    } catch (e) {
      reportError(e, op);
      try { const config = await resendConfiguration(op.api); op.ensure(); setCredentials(config); }
      catch { if (mounted.current && clientRef.current === client && generation.current === op.id) setCredentials(null); }
    } finally { op.finish(); }
  };
  const prepareCallback = async () => {
    const release = releases.find(row => row.releaseId === chosen);
    if (!known || saveUnknown || !credentials?.configured || !release || !singleMailAddress(address)) return;
    const op = begin(); if (!op) return;
    const input = { address: address.trim(), agentId: release.agentId, releaseId: release.releaseId };
    try {
      // Read before every preparation, including after an uncertain save; never blind-recreate a binding.
      const current = await readState(op);
      if (current.bindings.some(row => row.configurationStatus !== 'disabled' && sameAddress(row.address, input.address))) throw new Error('INCOMING_EXISTING_BINDING_REQUIRED');
      const reply = await op.api.request<{ success: boolean; data: Binding }>('/api/incoming-mail/bindings', { method: 'POST', body: JSON.stringify(input) });
      if (reply.success !== true || !bindingValid(reply.data) || reply.data.configurationStatus !== 'awaiting_webhook' || !sameAddress(reply.data.address, input.address) || reply.data.agentId !== input.agentId || reply.data.releaseId !== input.releaseId) throw new Error('INCOMING_RESULT_UNCONFIRMED');
      op.ensure(); setBindings(previous => [reply.data, ...previous.filter(row => row.id !== reply.data.id)]); setSaveUnknown(false);
      setNotice('回调路径已准备，后台草稿尚未启用。请先在 Resend 创建 Webhook，再填写其签名密钥并明确启用。');
    } catch (e) {
      reportError(e, op);
      try {
        const current = await readState(op);
        const saved = current.bindings.find(row => row.configurationStatus !== 'disabled' && sameAddress(row.address, input.address));
        if (saved?.agentId === input.agentId && saved.releaseId === input.releaseId) { setSaveUnknown(false); setNotice('已读到此地址的原配置；没有重复准备。请核对助手版本与回调路径。'); }
        else { setSaveUnknown(true); setNotice('最近准备结果尚未确认。请先刷新并核对原配置，再决定是否重新提交。'); }
      } catch { if (mounted.current && clientRef.current === client && generation.current === op.id) { setKnown(false); setSaveUnknown(true); } }
    } finally { op.finish(); }
  };
  const enable = async () => {
    if (!known || saveUnknown || !credentials?.configured || !pending || !webhookSecret.trim()) return;
    const op = begin(); if (!op) return;
    try {
      const current = await readState(op), saved = current.bindings.find(row => row.id === pending.id);
      if (saved?.configurationStatus === 'enabled') { setWebhookSecret(''); setNotice('已读取原配置：后台草稿已启用，没有重复提交。'); return; }
      if (saved?.configurationStatus !== 'awaiting_webhook') throw new Error('INCOMING_AUTOMATION_DISABLED');
      const reply = await op.api.request<{ success: boolean; data: Binding }>(`/api/incoming-mail/bindings/${segment(pending.id)}/enable`, { method: 'POST', body: JSON.stringify({ webhookSecret: webhookSecret.trim() }) });
      if (reply.success !== true || !bindingValid(reply.data) || reply.data.id !== pending.id || reply.data.configurationStatus !== 'enabled') throw new Error('INCOMING_RESULT_UNCONFIRMED');
      op.ensure(); setBindings(previous => previous.map(row => row.id === pending.id ? reply.data : row)); setWebhookSecret(''); setSaveUnknown(false);
      setNotice('后台草稿已明确启用。首次来信处理结果才是实际收件验证；没有批准发送邮件。');
    } catch (e) {
      reportError(e, op);
      try {
        const current = await readState(op), saved = current.bindings.find(row => row.id === pending.id);
        if (saved?.configurationStatus === 'enabled') { setWebhookSecret(''); setSaveUnknown(false); setNotice('已读到原配置的启用状态，没有重复提交。'); }
        else { setSaveUnknown(true); setNotice('最近启用结果尚未确认。请先刷新原配置，再决定下一步。'); }
      } catch { if (mounted.current && clientRef.current === client && generation.current === op.id) { setKnown(false); setSaveUnknown(true); } }
    } finally { op.finish(); }
  };
  const disable = async (binding: Binding) => {
    const op = begin(); if (!op) return;
    try {
      const reply = await op.api.request<{ success: boolean; data: Binding }>(`/api/incoming-mail/bindings/${segment(binding.id)}/disable`, { method: 'POST' });
      if (reply.success !== true || !bindingValid(reply.data) || reply.data.id !== binding.id || reply.data.enabled) throw new Error('INCOMING_RESULT_UNCONFIRMED');
      await readState(op); op.ensure(); setNotice('已停用后续自动处理。已有草稿保留；正在生成中的工作可能完成，请查看原记录。');
    } catch (e) { reportError(e, op); try { await readState(op); } catch { /* Preserve the last saved configuration until a confirmed read. */ } }
    finally { op.finish(); }
  };
  const viewSource = async (event: Event) => {
    const op = begin(); if (!op) return;
    setSource(null);
    try {
      const reply = await op.api.request<{ success: boolean; data: Source }>(`/api/incoming-mail/events/${segment(event.id)}`);
      if (reply.success !== true || !eventValid(reply.data) || reply.data.id !== event.id || !(reply.data.text === null || typeof reply.data.text === 'string') || !Array.isArray(reply.data.to) || !reply.data.to.every(item => typeof item === 'string')) throw new Error('INCOMING_RESULT_UNCONFIRMED');
      op.ensure(); setSource(reply.data); setEvents(previous => previous.map(row => row.id === event.id ? reply.data : row));
    } catch (e) { reportError(e, op); }
    finally { op.finish(); }
  };
  const retry = async (event: Event) => {
    if (event.status !== 'attention' || event.attempt >= 3 || ['INCOMING_DAILY_LIMIT', 'INCOMING_ATTEMPT_LIMIT'].includes(event.errorCode || '')) return;
    const op = begin(); if (!op) return;
    try {
      const reply = await op.api.request<{ success: boolean; data: Event }>(`/api/incoming-mail/events/${segment(event.id)}/retry`, { method: 'POST' });
      if (reply.success !== true || !eventValid(reply.data) || reply.data.id !== event.id) throw new Error('INCOMING_RESULT_UNCONFIRMED');
      op.ensure(); setEvents(previous => previous.map(row => row.id === event.id ? reply.data : row));
      setSource(previous => previous?.id === event.id ? { ...previous, ...reply.data } : previous);
      setNotice('已读取原事件的重试状态。重试只起草，不发送；请稍后刷新记录。');
    } catch (e) { reportError(e, op); try { await readState(op); } catch { /* Do not automatically retry a state-changing request. */ } }
    finally { op.finish(); }
  };
  const button = (label: string, action: () => void, disabled = false, primary = false) => <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={action} style={[s.button, primary && s.primary, disabled && s.disabled]}><Text style={[s.buttonText, primary && { color: C.accent }]}>{label}</Text></TouchableOpacity>;
  const openDraft = (threadId: string) => { if (editable()) onOpenDraft(threadId); };
  const attachments = (count: number) => <View style={s.caution}><Text style={s.warning}>{count > 0 ? `${count} 个附件未读取 · 草稿不包含附件内容` : '附件内容不会自动读取或执行'}</Text></View>;

  return <View style={s.section}>
    <Text style={s.intro}>收到来信，先准备一份回复。后台起草可在手机关闭后继续，完整原文和草稿留在你的工作记录里。</Text>
    <View style={s.promise}><Text style={s.promiseTitle}>自动起草，由你决定发送。</Text><Text style={s.small}>每天每账号最多处理 20 封，每封最多尝试 3 次。模型费用上限 $0，无付费回退；只有费用核对完整才会标记草稿准备完成。邮件服务费用尚未确认。</Text></View>
    {error ? <View accessibilityLiveRegion="polite" style={s.caution}><Text style={s.warning}>{error}</Text></View> : null}
    {notice ? <View accessibilityLiveRegion="polite" style={s.note}><Text style={s.small}>{notice}</Text></View> : null}
    {busy && <ActivityIndicator color={C.green} style={{ marginTop: 16 }} />}
    {button('刷新收件配置与处理记录', () => { void refresh(); }, busy)}
    <Text style={s.label}>01 / 你的邮件服务</Text><View style={s.card}><Text style={s.title}>Resend</Text><Text style={s.small}>{credentials?.configured ? '凭据已保存 · 服务权限尚未验证' : credentials ? '尚未保存邮件凭据' : '凭据状态尚未确认'}</Text>
      <Text style={s.small}>先在自己的 Resend 账号设置接收域名，并准备有邮件读取权限的 API key。凭据按账号加密保存。</Text>
      <TextInput accessibilityLabel="收件 Resend API key" value={key} onChangeText={value => { if (editable()) setKey(value); }} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="off" editable={!busy} maxLength={8192} placeholder={credentials?.configured ? '更新自己的 API key（可选）' : '填写自己的 Resend API key'} placeholderTextColor={C.muted} style={s.input} />
      {button('加密保存收件邮件凭据', () => { void saveKey(); }, busy || !key.trim())}
    </View>
    <Text style={s.label}>02 / 收件后交给谁起草</Text><Text style={s.small}>助手只允许保存草稿文件；已有知识与工具回执可由平台提供。来信不能授权联网、执行操作或发送邮件。</Text>
    <TextInput accessibilityLabel="自动草稿收件地址" value={address} onChangeText={value => { if (editable()) setAddress(value); }} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!busy} maxLength={254} placeholder="接收来信的邮箱地址" placeholderTextColor={C.muted} style={s.input} />
    {releases.map(release => <TouchableOpacity key={release.releaseId} accessibilityRole="button" accessibilityState={{ selected: chosen === release.releaseId, disabled: busy }} disabled={busy} onPress={() => { if (editable()) setChosen(release.releaseId); }} style={[s.card, chosen === release.releaseId && s.selected]}><Text style={s.title}>{release.name}</Text><Text style={s.small}>v{release.version} · 免费模型 · 只保存草稿{chosen === release.releaseId ? ' · 已选择' : ''}</Text></TouchableOpacity>)}
    {!releases.length && <Text style={s.small}>{busy ? '正在查看可用助手…' : '暂时没有符合条件的免费草稿助手，请在工作区准备并发布后刷新。'}</Text>}
    {button('准备收件回调地址', () => { void prepareCallback(); }, busy || !known || saveUnknown || !credentials?.configured || !chosenRelease || !singleMailAddress(address) || !!existing || !!pending)}
    <Text style={s.small}>这一步只保存地址与助手版本，先取得回调路径，不会启用自动草稿。</Text>
    {pending && <View style={s.promise}><Text style={s.promiseTitle}>待配置 Webhook · 尚未启用</Text><Text selectable style={s.path}>{pending.webhookPath}</Text><Text style={s.small}>将当前 Forge 服务的可访问 HTTPS 地址与此路径组合，在 Resend 创建 Webhook，选择 email.received。取得签名密钥后，填写下方输入框。</Text></View>}
    <Text style={s.label}>Resend Webhook 签名密钥</Text><Text style={s.small}>签名密钥应来自上方回调地址对应的 Webhook，格式以 whsec_ 开头。</Text>
    <TextInput accessibilityLabel="收件 Webhook 签名密钥" value={webhookSecret} onChangeText={value => { if (editable()) setWebhookSecret(value); }} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="off" editable={!busy} maxLength={256} placeholder="whsec_…" placeholderTextColor={C.muted} style={s.input} />
    {existing && <Text style={s.warning}>此地址已有启用的配置，请查看下方原记录。</Text>}
    {saveUnknown && <Text style={s.warning}>配置保存结果尚未确认，请先刷新原配置。</Text>}
    {button('启用后台收件草稿 · 不自动发送', () => { void enable(); }, busy || !known || saveUnknown || !credentials?.configured || !pending || !webhookSecret.trim(), true)}
    <Text style={s.small}>点击启用即授权后台按此地址和助手版本自动准备草稿，包括手机关闭后。你可以随时停用；发送仍需逐封查看完整预览并明确批准。</Text>
    <Text style={s.label}>已保存的收件配置</Text>
    {!bindings.length && <Text style={s.small}>{known ? '尚无收件配置。' : '配置尚未确认，请先刷新。'}</Text>}
    {bindings.map(binding => <View key={binding.id} style={s.card}><Text selectable style={s.title}>{binding.address}</Text><Text style={s.small}>{binding.configurationStatus === 'awaiting_webhook' ? '回调路径已准备 · 等待签名密钥，尚未启用' : binding.enabled ? '后台草稿已启用 · 凭据与签名密钥已保存，服务权限未验证' : '已停用 · 原后台授权不能再次启用'}</Text><Text style={s.small}>助手版本：{releases.find(row => row.releaseId === binding.releaseId)?.name || '已绑定版本'}</Text>
      <Text style={s.label}>此服务的回调路径</Text><Text selectable style={s.path}>{binding.webhookPath}</Text><Text style={s.small}>在 Resend 填写当前 Forge 服务的可访问 HTTPS 地址，加上此路径。</Text>
      {binding.configurationStatus === 'awaiting_webhook' && button('继续配置此收件地址', () => { if (editable()) { setAddress(binding.address); setChosen(binding.releaseId); setWebhookSecret(''); } }, busy || !releases.some(row => row.releaseId === binding.releaseId && row.agentId === binding.agentId))}
      {binding.configurationStatus !== 'disabled' && button(binding.enabled ? '停用此地址的后台草稿' : '取消此待配置地址', () => { void disable(binding); }, busy)}
    </View>)}
    <Text style={s.label}>03 / 最近来信与草稿</Text>
    {!events.length && <Text style={s.small}>{known ? '尚无来信处理记录。启用配置后，等待自己的邮件服务送达接收通知。' : '来信记录尚未确认。'}</Text>}
    {events.map(event => <View key={event.id} style={s.card}><Text style={s.status}>{statuses[event.status]}</Text><Text selectable style={s.title}>{event.subject || '来信主题尚未读取'}</Text><Text selectable style={s.small}>{event.from || '发件地址尚未读取'}</Text><Text style={s.small}>记录时间：{new Date(event.createdAt).toLocaleString()} · 草稿尝试 {event.attempt}/3</Text>
      {attachments(event.attachmentsNotRead)}
      {event.status === 'attention' && <Text style={s.warning}>{event.attempt >= 3 ? '这封来信已达到最多 3 次尝试，请检查已有工作记录。' : failure(new Error(event.errorCode || ''))}</Text>}
      {button('查看来信原文与处理状态', () => { void viewSource(event); }, busy)}
      {event.threadId && button('查看草稿工作区', () => openDraft(event.threadId!), busy)}
      {event.status === 'attention' && button('明确重试此来信 · 只起草', () => { void retry(event); }, busy || event.attempt >= 3 || ['INCOMING_DAILY_LIMIT', 'INCOMING_ATTEMPT_LIMIT'].includes(event.errorCode || ''))}
    </View>)}
    {source && <View style={s.source}><Text style={s.status}>已保存的来信原文</Text><Text style={s.small}>{statuses[source.status]}</Text><Text style={s.label}>发件地址</Text><Text selectable style={s.body}>{source.from || '尚未读取'}</Text><Text style={s.label}>收件地址</Text><Text selectable style={s.body}>{source.to.join('\n') || '尚未读取'}</Text><Text style={s.label}>回复地址</Text><Text selectable style={s.body}>{source.replyTo || '尚未读取'}</Text><Text style={s.label}>主题</Text><Text selectable style={s.body}>{source.subject || '尚未读取'}</Text>
      {attachments(source.attachmentsNotRead)}<Text style={s.label}>完整纯文本正文</Text><Text selectable style={s.body}>{source.text === null ? '尚未取得可用的纯文本正文。不会改用 HTML 或读取附件后自动起草。' : source.text}</Text>
      <Text style={s.label}>邮件服务提供的认证信息</Text><Text selectable style={s.small}>{source.authentication ? JSON.stringify(source.authentication, null, 2) : '未取得认证信息，发件人身份尚未核实。'}</Text><Text style={s.small}>认证信息由邮件服务提供，不能替代你对发件人身份与正文事实的核实。</Text>
      {source.threadId && button('查看此来信的草稿工作区', () => openDraft(source.threadId!), busy)}
    </View>}
    <Text style={s.footnote}>只处理完整纯文本来信，序列化原文最多 60 KB；HTML、附件和邮件中的操作指令不会自动执行。没有人工批准，不会发送邮件。</Text>
  </View>;
}

const s = StyleSheet.create({
  section: { paddingTop: 18, gap: 10 }, intro: { color: C.muted, fontSize: 15, lineHeight: 25 }, promise: { backgroundColor: '#e8eddc', borderLeftWidth: 3, borderColor: C.green, padding: 18, gap: 8, marginTop: 8 }, promiseTitle: { color: C.green, fontSize: 18, fontWeight: '600', lineHeight: 28 },
  label: { color: C.muted, fontSize: 12, fontWeight: '600', marginTop: 22, marginBottom: 3 }, card: { backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 16, gap: 8, marginTop: 5 }, selected: { borderColor: C.green, borderWidth: 1.5 }, title: { color: C.ink, fontSize: 17, lineHeight: 26, fontWeight: '600' }, small: { color: C.muted, fontSize: 12, lineHeight: 21 }, body: { color: C.ink, fontSize: 15, lineHeight: 25 },
  input: { minHeight: 52, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 15, color: C.ink, fontSize: 15 }, button: { minHeight: 50, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 14, alignItems: 'center', justifyContent: 'center', marginTop: 5 }, primary: { backgroundColor: C.ink, borderColor: C.ink }, buttonText: { color: C.ink, fontSize: 14, lineHeight: 21, fontWeight: '600', textAlign: 'center' }, disabled: { opacity: 0.45 },
  note: { backgroundColor: C.paper, padding: 14, borderWidth: 1, borderColor: C.line, borderRadius: 10 }, caution: { backgroundColor: '#fbefe4', borderLeftWidth: 3, borderColor: '#b87a49', padding: 12 }, warning: { color: C.red, fontSize: 12, lineHeight: 22 }, status: { color: C.green, fontSize: 15, lineHeight: 24, fontWeight: '600' }, path: { color: C.ink, fontSize: 12, lineHeight: 22, fontFamily: 'monospace' }, source: { backgroundColor: C.paper, padding: 18, borderLeftWidth: 3, borderColor: C.green, gap: 6, marginTop: 20 }, footnote: { color: C.muted, fontSize: 12, lineHeight: 22, marginTop: 18 },
});
