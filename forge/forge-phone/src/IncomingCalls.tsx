import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { availableDraftReleases, DraftClient, DraftRelease } from './business-tasks';
import { ForgeURL } from './config';

type Credential = { configured: boolean; accountSid: string | null; verification: 'saved_unverified' };
type Binding = { id: string; number: string; scope: 'business_cloud_number'; agentId: string; releaseId: string; enabled: boolean; configurationStatus: 'awaiting_webhook' | 'enabled' | 'disabled'; webhooks: { voice: string; gather: string; status: string }; providerPermissions: 'unverified'; createdAt: number };
type Call = { id: string; callSid: string; bindingId: string; from: string; to: string; providerCallStatus: string | null; terminalStatus: string | null; durationSeconds: number | null; telephoneCostUsd: null; transcript: string | null; speechConfidence: number | null; draftStatus: 'receiving' | 'queued' | 'dispatching' | 'ready' | 'attention' | 'cancelled' | 'no_transcript'; threadId: string | null; requestId: string; artifactId: string | null; errorCode: string | null; createdAt: number; updatedAt: number; callerIdentityVerified: false; telephonePricingVerified: false };
type State = { credential: Credential; bindings: Binding[]; calls: Call[] };
type Props = { client: DraftClient; onBusyChange?: (busy: boolean) => void; onOpenDraft: (threadId: string) => void };
const C = { paper: '#fffdf7', ink: '#20251f', muted: '#686f63', line: '#dcded2', green: '#3d6229', accent: '#b5db57', red: '#a33d30' };
const statuses: Record<Call['draftStatus'], string> = { receiving: '正在接收需求 · 尚未起草', queued: '需求已保存 · 等待后台起草', dispatching: '正在生成并保存跟进草稿', ready: '草稿已准备 · 仍需本人审阅', attention: '需要你检查 · 不会自动重试', cancelled: '已停止自动处理', no_transcript: '未取得可用转录 · 未起草' };
const phoneStatuses: Record<string, string> = { queued: '排队中', initiated: '已发起', ringing: '振铃中', 'in-progress': '通话中', completed: '通话已结束', canceled: '已取消', busy: '占线', 'no-answer': '未接通', failed: '通话失败' };
const sid = (value: unknown, prefix: 'AC' | 'CA') => typeof value === 'string' && new RegExp(`^${prefix}[a-f0-9]{32}$`, 'i').test(value);
const numberValid = (value: unknown): value is string => typeof value === 'string' && /^\+[1-9]\d{7,14}$/.test(value);
const text = (value: unknown): value is string => typeof value === 'string' && !!value;
const nullableText = (value: unknown) => value === null || text(value);
const httpsUrl = (value: unknown) => {
  if (!text(value)) return false;
  try { const url = new ForgeURL(value); return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password && !url.hash; } catch { return false; }
};
const credentialValid = (value: any): value is Credential => !!value && typeof value.configured === 'boolean' && value.verification === 'saved_unverified'
  && (value.configured ? sid(value.accountSid, 'AC') : value.accountSid === null);
const bindingValid = (row: any): row is Binding => !!row && text(row.id) && numberValid(row.number) && row.scope === 'business_cloud_number'
  && text(row.agentId) && text(row.releaseId) && typeof row.enabled === 'boolean'
  && ['awaiting_webhook', 'enabled', 'disabled'].includes(row.configurationStatus) && row.enabled === (row.configurationStatus === 'enabled')
  && row.providerPermissions === 'unverified' && httpsUrl(row.webhooks?.voice) && httpsUrl(row.webhooks?.gather) && httpsUrl(row.webhooks?.status) && Number.isFinite(row.createdAt);
const callValid = (row: any): row is Call => !!row && text(row.id) && sid(row.callSid, 'CA') && text(row.bindingId) && text(row.from) && numberValid(row.to)
  && nullableText(row.providerCallStatus) && nullableText(row.terminalStatus) && (row.durationSeconds === null || Number.isSafeInteger(row.durationSeconds) && row.durationSeconds >= 0)
  && row.telephoneCostUsd === null && (row.transcript === null || typeof row.transcript === 'string')
  && (row.speechConfidence === null || typeof row.speechConfidence === 'number' && Number.isFinite(row.speechConfidence) && row.speechConfidence >= 0 && row.speechConfidence <= 1)
  && Object.prototype.hasOwnProperty.call(statuses, row.draftStatus) && nullableText(row.threadId) && text(row.requestId) && nullableText(row.artifactId) && nullableText(row.errorCode)
  && Number.isFinite(row.createdAt) && Number.isFinite(row.updatedAt) && row.callerIdentityVerified === false && row.telephonePricingVerified === false;
function failure(error: unknown): string {
  const code = error instanceof Error ? error.message.split(':')[0] : '';
  const messages: Record<string, string> = {
    CALL_CREDENTIAL_REQUIRED: '请检查自己的 Twilio Account SID 与 Auth Token，并加密保存。',
    CALL_CREDENTIAL_INVALID: '请检查电话服务凭据，保存不代表权限已验证。',
    CALL_PUBLIC_HTTPS_ORIGIN_REQUIRED: '平台运营方尚未配置可公开访问的 HTTPS 回调地址，请先完成服务配置。',
    CALL_NOT_CONFIGURED: '电话服务尚未配置，请由平台运营方完成公开 HTTPS 服务设置。',
    CALL_FREE_DRAFT_AGENT_REQUIRED: '请选择只保存草稿、使用免费模型的已发布助手版本。',
    CALL_E164_NUMBER_REQUIRED: '请填写自己的 Twilio 业务云号码，使用加号与国家代码开头的国际格式。',
    CALL_EXISTING_BINDING_REQUIRED: '此号码已有原配置，请先查看原记录，不要重复准备。',
    CALL_BINDING_LIMIT: '当前最多准备或启用 3 个业务云号码，请先取消或停用不再使用的配置。',
    CALL_AUTOMATION_DISABLED: '原配置已停用，请检查已保存的号码配置。',
    CALL_NEW_BINDING_REQUIRED: '原号码配置已停用，请先核对记录，再准备新的配置。',
    CALL_CREDENTIAL_CHANGED: '电话服务凭据已变化，请检查原号码配置。',
    CALL_AUTHORIZATION_REVOKED: '原后台授权已失效，请检查账号与号码配置。',
    CALL_OWNER_ENABLE_REQUIRED: '请核对云号码、POST 回调配置与电话费用，再明确确认启用。',
    CALL_DRAFT_SOURCE_TOO_LARGE: '完整需求超过草稿查看器的处理上限，原转录已保留，没有截断后继续起草。',
    CALL_SPEECH_NOT_RECEIVED: '没有取得可用的识别文字，未编造需求后起草。',
    CALL_DISPATCH_UNCONFIRMED: '原草稿提交状态尚未确认，已保留记录，不会自动重新起草。',
    CALL_RUN_INTERRUPTED: '原草稿未完整结束，请检查原来电记录；不会自动重新起草。',
    CALL_DRAFT_UNVERIFIED: '原文件、来源或费用尚未通过核对，暂不标记为草稿准备完成。',
    INCOMING_CALL_RESULT_UNCONFIRMED: '操作结果尚未确认，请先刷新原配置与记录。不会自动重复提交。',
    NETWORK_UNAVAILABLE: '连接中断了。操作可能已保存，请先刷新原配置与记录。',
    REQUEST_READ_UNAVAILABLE: '来电记录读取未完成，请检查网络后重新读取。',
    SESSION_EXPIRED: '登录已过期，请重新登录。', AUTH_REQUIRED: '请重新登录后继续。',
  };
  return messages[code] || '本次结果尚未确认，请刷新并检查原记录；不会自动重试。';
}

export default function IncomingCalls({ client, onBusyChange, onOpenDraft }: Props) {
  const [credential, setCredential] = useState<Credential | null>(null);
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [releases, setReleases] = useState<DraftRelease[]>([]);
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [number, setNumber] = useState('');
  const [chosen, setChosen] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [known, setKnown] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const mounted = useRef(true), busyRef = useRef(false), generation = useRef(0);
  const clientRef = useRef(client), controller = useRef<AbortController | null>(null);
  clientRef.current = client;

  const begin = () => {
    if (!mounted.current || busyRef.current || clientRef.current !== client) return null;
    const id = ++generation.current, accountClient = client, abort = new AbortController();
    controller.current = abort;
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; abort.abort(); }, 20000);
    busyRef.current = true; setBusy(true); setError(''); setNotice('');
    const ensure = () => {
      if (!mounted.current || clientRef.current !== accountClient || generation.current !== id) throw new Error('DRAFT_STOPPED');
      if (timedOut) throw new Error('INCOMING_CALL_RESULT_UNCONFIRMED');
      if (abort.signal.aborted) throw new Error('DRAFT_STOPPED');
    };
    const api: DraftClient = {
      request: async <T,>(path: string, init?: RequestInit) => { ensure(); try { const reply = await accountClient.request<T>(path, { ...init, signal: abort.signal }); ensure(); return reply; } catch (e) { ensure(); throw e; } },
      requestText: async (path, init) => { ensure(); const reply = await accountClient.requestText(path, { ...init, signal: abort.signal }); ensure(); return reply; },
    };
    return { id, api, ensure, finish: () => { clearTimeout(timer); if (mounted.current && clientRef.current === accountClient && generation.current === id) { busyRef.current = false; setBusy(false); controller.current = null; } } };
  };
  type Operation = NonNullable<ReturnType<typeof begin>>;
  const current = (op: Operation) => mounted.current && clientRef.current === client && generation.current === op.id;
  const reportError = (e: unknown, op: Operation) => {
    if (current(op) && !(e instanceof Error && ['DRAFT_STOPPED', 'SESSION_CHANGED', 'REQUEST_CANCELLED'].includes(e.message.split(':')[0]))) setError(failure(e));
  };
  const readState = async (op: Operation) => {
    const reply = await op.api.request<{ success: boolean; data: State }>('/api/incoming-call');
    if (reply.success !== true || !credentialValid(reply.data?.credential) || !Array.isArray(reply.data.bindings) || !reply.data.bindings.every(bindingValid)
      || !Array.isArray(reply.data.calls) || !reply.data.calls.every(callValid)) throw new Error('INCOMING_CALL_RESULT_UNCONFIRMED');
    op.ensure(); setCredential(reply.data.credential); setBindings(reply.data.bindings); setCalls(reply.data.calls); setKnown(true);
    return reply.data;
  };
  const refresh = async () => {
    const op = begin(); if (!op) return;
    try {
      const [state, list] = await Promise.all([readState(op), availableDraftReleases(op.api, true)]);
      op.ensure(); setReleases(list); setChosen(previous => list.some(row => row.releaseId === previous) ? previous : list[0]?.releaseId || '');
      setAccountSid(state.credential.accountSid || ''); setUncertain(false); setConfirmed(false);
      setNotice('已读取当前账号的号码与来电记录。凭据已保存不代表 Voice 能力、号码权限或电话费用已验证。');
    } catch (e) { reportError(e, op); if (current(op)) setKnown(false); }
    finally { op.finish(); }
  };
  useEffect(() => {
    mounted.current = true; busyRef.current = false; setBusy(false);
    setCredential(null); setBindings([]); setCalls([]); setReleases([]); setAccountSid(''); setAuthToken(''); setNumber(''); setChosen('');
    setConfirmed(false); setKnown(false); setUncertain(false); setError(''); setNotice('');
    void refresh();
    const accountBusyCallback = onBusyChange;
    return () => { mounted.current = false; generation.current += 1; controller.current?.abort(); controller.current = null; busyRef.current = false; accountBusyCallback?.(false); };
  }, [client]);
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  const editable = () => mounted.current && clientRef.current === client && !busyRef.current;
  const chosenRelease = releases.find(row => row.releaseId === chosen);
  const existing = bindings.find(row => row.configurationStatus !== 'disabled' && row.number === number.trim());
  const pending = existing?.configurationStatus === 'awaiting_webhook' && existing.releaseId === chosen && existing.agentId === chosenRelease?.agentId ? existing : null;

  const saveCredential = async () => {
    if (!sid(accountSid.trim(), 'AC') || !authToken.trim() || uncertain) return;
    const op = begin(); if (!op) return;
    const input = { accountSid: accountSid.trim(), authToken: authToken.trim() };
    setUncertain(true); setConfirmed(false);
    try {
      const reply = await op.api.request<{ success: boolean }>('/api/incoming-call/credentials', { method: 'POST', body: JSON.stringify(input) });
      if (reply.success !== true) throw new Error('INCOMING_CALL_RESULT_UNCONFIRMED');
      op.ensure(); setAuthToken('');
      const state = await readState(op);
      if (!state.credential.configured || state.credential.accountSid !== input.accountSid) throw new Error('INCOMING_CALL_RESULT_UNCONFIRMED');
      op.ensure(); setUncertain(false); setNotice('凭据已按账号在服务器加密保存，尚未连接验证。更新凭据后，请重新核对原号码配置。');
    } catch (e) { reportError(e, op); try { await readState(op); } catch { if (current(op)) setKnown(false); } }
    finally { op.finish(); }
  };
  const prepare = async () => {
    if (!known || uncertain || !credential?.configured || !chosenRelease || !numberValid(number.trim())) return;
    const op = begin(); if (!op) return;
    const input = { scope: 'business_cloud_number' as const, number: number.trim(), agentId: chosenRelease.agentId, releaseId: chosenRelease.releaseId };
    setUncertain(true); setConfirmed(false);
    try {
      const state = await readState(op);
      if (state.bindings.some(row => row.number === input.number && row.configurationStatus !== 'disabled')) throw new Error('CALL_EXISTING_BINDING_REQUIRED');
      const reply = await op.api.request<{ success: boolean; data: Binding }>('/api/incoming-call/bindings', { method: 'POST', body: JSON.stringify(input) });
      if (reply.success !== true || !bindingValid(reply.data) || reply.data.configurationStatus !== 'awaiting_webhook' || reply.data.number !== input.number || reply.data.agentId !== input.agentId || reply.data.releaseId !== input.releaseId) throw new Error('INCOMING_CALL_RESULT_UNCONFIRMED');
      await readState(op); op.ensure(); setUncertain(false); setNotice('回调地址已准备，来电草稿尚未启用。请在 Twilio 配置 Voice 和最终状态回调，再完成下方确认。');
    } catch (e) { reportError(e, op); try { await readState(op); } catch { if (current(op)) setKnown(false); } }
    finally { op.finish(); }
  };
  const changeBinding = async (binding: Binding, enable: boolean) => {
    if (!known || uncertain || enable && (!credential?.configured || !confirmed || pending?.id !== binding.id)) return;
    const op = begin(); if (!op) return;
    setUncertain(true); setConfirmed(false);
    try {
      const state = await readState(op), saved = state.bindings.find(row => row.id === binding.id);
      if (!saved || saved.configurationStatus === 'disabled' || enable && saved.configurationStatus !== 'awaiting_webhook') throw new Error('CALL_AUTOMATION_DISABLED');
      const body = enable ? { confirmCloudNumberWebhookSetup: true, enableIncomingBusinessCalls: true, acknowledgeTelephoneCosts: true } : {};
      const reply = await op.api.request<{ success: boolean; data: Binding }>(`/api/incoming-call/bindings/${encodeURIComponent(binding.id)}/${enable ? 'enable' : 'disable'}`, { method: 'POST', body: JSON.stringify(body) });
      if (reply.success !== true || !bindingValid(reply.data) || reply.data.id !== binding.id || reply.data.enabled !== enable || reply.data.configurationStatus !== (enable ? 'enabled' : 'disabled')) throw new Error('INCOMING_CALL_RESULT_UNCONFIRMED');
      await readState(op); op.ensure(); setUncertain(false);
      setNotice(enable ? '后台来电草稿已启用。电话只接收一次口述需求并固定确认收到；通话结束后异步准备草稿，不自动回拨或发送。' : '已停用后续来电草稿。停用不表示 Twilio 号码已退订或停止计费；请在自己的电话服务账号核对。');
    } catch (e) { reportError(e, op); try { await readState(op); } catch { if (current(op)) setKnown(false); } }
    finally { op.finish(); }
  };
  const button = (label: string, action: () => void, disabled = false, primary = false) => <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={action} style={[s.button, primary && s.primary, disabled && s.disabled]}><Text style={[s.buttonText, primary && { color: C.accent }]}>{label}</Text></TouchableOpacity>;

  return <View style={s.section}>
    <Text style={s.intro}>业务云号码接收一次口述需求，通话结束后在后台准备跟进草稿。手机关闭后也可继续处理；这是 Twilio 云号码，不会接管本机 SIM 来电。</Text>
    <View style={s.promise}><Text style={s.promiseTitle}>先记下需求，稍后审阅草稿。</Text><Text style={s.small}>电话播放固定提示、接收一次语音识别结果，再固定确认收到并结束。不提供模型即时语音对话，也不自动回拨、发送或重试。</Text><Text style={s.warning}>电话与识别服务可能收费，费用尚未核对，不能视为免费。草稿仅使用免费模型，模型费用上限 $0，无付费回退。</Text></View>
    {error ? <View accessibilityLiveRegion="polite" style={s.caution}><Text style={s.warning}>{error}</Text></View> : null}
    {notice ? <View accessibilityLiveRegion="polite" style={s.note}><Text style={s.small}>{notice}</Text></View> : null}
    {busy && <ActivityIndicator color={C.green} style={{ marginTop: 16 }} />}
    {button('刷新号码配置与来电记录', () => { void refresh(); }, busy)}
    {uncertain && <Text style={s.warning}>最近保存结果尚未确认，请先刷新原配置，再决定下一步。</Text>}
    <Text style={s.label}>01 / 你的 Twilio 账号</Text>
    <View style={s.card}><Text style={s.title}>业务云号码 · Twilio</Text><Text style={s.small}>{credential?.configured ? '凭据已保存 · 服务与号码权限未验证' : credential ? '尚未保存电话服务凭据' : '凭据状态尚未确认'}</Text><Text style={s.small}>需要你自己的 Twilio 账号及支持 Voice 的业务云号码；平台运营方需先配置公开 HTTPS 服务地址。保存凭据不会验证连接、购买号码或拨打电话。凭据按账号在服务器加密保存。</Text>
      <TextInput accessibilityLabel="Twilio Account SID" value={accountSid} onChangeText={value => { if (editable()) setAccountSid(value); }} autoCapitalize="none" autoCorrect={false} editable={!busy} maxLength={34} placeholder="AC…" placeholderTextColor={C.muted} style={s.input} />
      <TextInput accessibilityLabel="Twilio Auth Token" value={authToken} onChangeText={value => { if (editable()) setAuthToken(value); }} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="off" editable={!busy} maxLength={256} placeholder={credential?.configured ? '更新自己的 Auth Token（可选）' : '填写自己的 Auth Token'} placeholderTextColor={C.muted} style={s.input} />
      {button('加密保存电话服务凭据', () => { void saveCredential(); }, busy || uncertain || !sid(accountSid.trim(), 'AC') || !authToken.trim())}
    </View>
    <Text style={s.label}>02 / 业务号码与草稿助手</Text><Text style={s.small}>只绑定你有权管理的 Twilio 云号码。来电与识别文字是待核实的资料，不能授权助手执行操作或联系任何人。</Text>
    <TextInput accessibilityLabel="Twilio 业务云号码" value={number} onChangeText={value => { if (editable()) { setNumber(value); setConfirmed(false); } }} keyboardType="phone-pad" autoCapitalize="none" autoCorrect={false} editable={!busy} maxLength={16} placeholder="国际格式，例如 +12025550123" placeholderTextColor={C.muted} style={s.input} />
    {releases.map(release => <TouchableOpacity key={release.releaseId} accessibilityRole="button" accessibilityState={{ selected: chosen === release.releaseId, disabled: busy }} disabled={busy} onPress={() => { if (editable()) { setChosen(release.releaseId); setConfirmed(false); } }} style={[s.card, chosen === release.releaseId && s.selected]}><Text style={s.title}>{release.name}</Text><Text style={s.small}>v{release.version} · 免费模型 · 只保存草稿{chosen === release.releaseId ? ' · 已选择' : ''}</Text></TouchableOpacity>)}
    {!releases.length && <Text style={s.small}>{busy ? '正在查看可用助手…' : '暂无符合条件的免费草稿助手，请在工作区准备并发布后刷新。'}</Text>}
    {button('准备云号码回调地址 · 暂不启用', () => { void prepare(); }, busy || !known || uncertain || !credential?.configured || !chosenRelease || !numberValid(number.trim()) || !!existing)}
    {existing && !pending && <Text style={s.small}>此号码已有原配置，请查看下方记录并核对助手版本。</Text>}
    {pending && <View style={s.promise}><Text style={s.promiseTitle}>等待手动配置 · 尚未启用</Text><Text style={s.small}>在 Twilio 此号码的 Voice 设置中，将来电 Webhook 配置为下方 Voice 地址，方法 POST。将最终通话状态回调配置为 Status 地址，方法 POST，仅最终状态。Gather 地址由来电流程使用，无需另设为号码入口。</Text>
      <Text style={s.label}>Voice · 来电入口 · POST</Text><Text selectable style={s.path}>{pending.webhooks.voice}</Text>
      <Text style={s.label}>Status · 最终通话状态 · POST</Text><Text selectable style={s.path}>{pending.webhooks.status}</Text>
      <Text style={s.label}>Gather · 单次需求识别回调 · POST</Text><Text selectable style={s.path}>{pending.webhooks.gather}</Text>
      <TouchableOpacity accessibilityRole="checkbox" accessibilityLabel="确认业务云号码、Webhook 配置、后台起草授权及电话费用" accessibilityState={{ checked: confirmed, disabled: busy || uncertain }} disabled={busy || uncertain} onPress={() => { if (editable()) setConfirmed(value => !value); }} style={[s.confirm, (busy || uncertain) && s.disabled]}><Text style={s.check}>{confirmed ? '☑' : '☐'}</Text><Text style={[s.small, { flex: 1 }]}>我确认这是自己有权管理的业务云号码，已按上述地址完成 POST 配置；授权后台接收来电需求并起草，且知悉电话与识别服务可能收费、费用未核对。</Text></TouchableOpacity>
      {button('明确启用云号码来电草稿', () => { void changeBinding(pending, true); }, busy || !known || uncertain || !credential?.configured || !confirmed, true)}
    </View>}
    <Text style={s.label}>已保存的号码配置</Text>
    {!bindings.length && <Text style={s.small}>{known ? '尚无云号码配置。' : '号码配置尚未确认。'}</Text>}
    {bindings.map(binding => <View key={binding.id} style={s.card}><Text selectable style={s.title}>{binding.number}</Text><Text style={s.small}>{binding.configurationStatus === 'awaiting_webhook' ? '回调地址已准备 · 等待手动配置，尚未启用' : binding.enabled ? '后台来电草稿已启用 · Voice 与号码权限尚未验证' : '已停用 · 保留原记录'}</Text><Text style={s.small}>助手版本：{releases.find(row => row.releaseId === binding.releaseId)?.name || '已绑定版本'}</Text>
      <Text style={s.label}>Voice · POST</Text><Text selectable style={s.path}>{binding.webhooks.voice}</Text><Text style={s.label}>Status · 最终状态 · POST</Text><Text selectable style={s.path}>{binding.webhooks.status}</Text><Text style={s.label}>Gather · POST</Text><Text selectable style={s.path}>{binding.webhooks.gather}</Text>
      {binding.configurationStatus === 'awaiting_webhook' && button('继续配置此云号码', () => { if (editable()) { setNumber(binding.number); setChosen(binding.releaseId); setConfirmed(false); } }, busy || uncertain || !releases.some(row => row.releaseId === binding.releaseId && row.agentId === binding.agentId))}
      {binding.configurationStatus !== 'disabled' && button(binding.enabled ? '停用此号码的后台来电草稿' : '取消此待配置号码', () => { void changeBinding(binding, false); }, busy || !known || uncertain)}
    </View>)}
    <Text style={s.label}>03 / 最近来电与跟进草稿</Text>
    {!calls.length && <Text style={s.small}>{known ? '尚无来电记录。完成电话服务配置并启用后，等待业务云号码收到来电。' : '来电记录尚未确认。'}</Text>}
    {calls.map(call => <View key={call.id} style={s.card}><Text style={s.status}>{statuses[call.draftStatus]}</Text><Text selectable style={s.title}>{call.from}</Text><Text selectable style={s.small}>业务号码：{call.to}</Text><Text style={s.small}>来电时间：{new Date(call.createdAt).toLocaleString()}</Text><Text style={s.small}>电话服务状态：{phoneStatuses[call.terminalStatus || call.providerCallStatus || ''] || '尚未确认'} · 时长：{call.durationSeconds === null ? '未知' : `${call.durationSeconds} 秒`}</Text><Text style={s.warning}>来电者身份未核实 · 电话费用未知，价格未核对</Text>
      <Text style={s.label}>电话服务识别的需求原文</Text><Text selectable style={s.body}>{call.transcript === null ? '尚未取得可用识别文字，不会编造需求后起草。' : call.transcript}</Text><Text style={s.small}>识别置信度：{call.speechConfidence === null ? '未知' : `${Math.round(call.speechConfidence * 100)}%`}。文字由电话服务提供，请核对误识别、身份与事实。</Text>
      {call.errorCode && <Text style={s.warning}>{failure(new Error(call.errorCode))}</Text>}
      {call.draftStatus === 'ready' && call.threadId && call.artifactId && button('查看来电需求记录与后续草稿', () => { if (editable()) onOpenDraft(call.threadId!); }, busy)}
    </View>)}
    <Text style={s.footnote}>页面刷新只读取原配置与记录。不会自动重新识别、重新起草或发起电话操作；跟进内容仍需本人检查后决定怎样使用。</Text>
  </View>;
}

const s = StyleSheet.create({
  section: { paddingTop: 18, gap: 10 }, intro: { color: C.muted, fontSize: 15, lineHeight: 25 }, promise: { backgroundColor: '#e8eddc', borderLeftWidth: 3, borderColor: C.green, padding: 18, gap: 8, marginTop: 8 }, promiseTitle: { color: C.green, fontSize: 18, fontWeight: '600', lineHeight: 28 },
  label: { color: C.muted, fontSize: 12, fontWeight: '600', marginTop: 22, marginBottom: 3 }, card: { backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 16, gap: 8, marginTop: 5 }, selected: { borderColor: C.green, borderWidth: 1.5 }, title: { color: C.ink, fontSize: 17, lineHeight: 26, fontWeight: '600' }, small: { color: C.muted, fontSize: 12, lineHeight: 21 }, body: { color: C.ink, fontSize: 15, lineHeight: 25 },
  input: { minHeight: 52, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 15, color: C.ink, fontSize: 15 }, button: { minHeight: 50, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 14, alignItems: 'center', justifyContent: 'center', marginTop: 5 }, primary: { backgroundColor: C.ink, borderColor: C.ink }, buttonText: { color: C.ink, fontSize: 14, lineHeight: 21, fontWeight: '600', textAlign: 'center' }, disabled: { opacity: 0.45 },
  note: { backgroundColor: C.paper, padding: 14, borderWidth: 1, borderColor: C.line, borderRadius: 10 }, caution: { backgroundColor: '#fbefe4', borderLeftWidth: 3, borderColor: '#b87a49', padding: 12 }, warning: { color: C.red, fontSize: 12, lineHeight: 22 }, status: { color: C.green, fontSize: 15, lineHeight: 24, fontWeight: '600' }, path: { color: C.ink, fontSize: 12, lineHeight: 22, fontFamily: 'monospace' }, confirm: { flexDirection: 'row', gap: 12, minHeight: 48, alignItems: 'flex-start', paddingVertical: 12 }, check: { color: C.green, fontSize: 24 }, footnote: { color: C.muted, fontSize: 12, lineHeight: 22, marginTop: 18 },
});
