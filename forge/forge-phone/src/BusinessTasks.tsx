import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  availableDraftReleases, createDraftThread, DraftArtifact, DraftClient, DraftJob, DraftKind, DraftRelease, DraftReport,
  draftLabel, knownCharge, newDraftJob, readDraftRequest, restoreDraftJob, SavedThread, submitDraft, verifyDraft,
} from './business-tasks';

type Props = { client: DraftClient; onBusyChange?: (busy: boolean) => void };
const C = { bg: '#f3f0e8', paper: '#fffdf7', ink: '#20251f', muted: '#686f63', line: '#dcded2', green: '#3d6229', accent: '#b5db57', red: '#a33d30' };
type Preview = { artifact: DraftArtifact; value?: Record<string, any>; report: DraftReport | null; verified: boolean };
function friendly(error: unknown): string {
  const code = error instanceof Error ? error.message.split(':')[0] : '';
  const messages: Record<string, string> = {
    NETWORK_UNAVAILABLE: '连接中断了。任务可能已被保存，请先查看服务端结果。',
    DRAFT_FREE_AGENT_UNAVAILABLE: '这位助手暂时没有可用的免费模型，请刷新后重新选择。',
    DRAFT_INPUT_REQUIRED: '请填写对象名称和需要参考的真实资料。',
    DRAFT_RESULT_UNKNOWN: '暂未收到完整结果，请查看服务端任务状态。',
    DRAFT_STILL_RUNNING: '草稿仍在准备，请稍后查看结果。',
    DRAFT_DELIVERY_UNVERIFIED: '文件或费用尚未通过核对，请先查看已保存的内容。',
    DRAFT_DELIVERY_CHANGED: '文件在核对后发生了变化，请重新查看并核对。',
    DRAFT_FILE_INVALID: '已保存文件的格式或固定字段不符合本次要求，请检查内容。',
    DRAFT_FILE_INCOMPLETE: '草稿缺少完整的主题或正文，请先检查文件内容。',
    PI_RUNTIME_UNAVAILABLE: '草稿服务暂时未连接，请稍后再试。',
    DESKTOP_PROVIDER_FUNDING_UNAVAILABLE: '免费模型暂时繁忙，请稍后查看结果。',
    THREAD_REQUEST_IN_PROGRESS: '这项任务已在运行，请查看原任务结果。',
    DRAFT_RUN_NOT_COMPLETED: '本次任务尚未完成，已保存的文件仍可查看。',
    SESSION_EXPIRED: '登录已过期，请重新登录。', AUTH_REQUIRED: '请重新登录后继续。', SESSION_CHANGED: '账号已切换，本次页面已停止更新。',
  };
  return messages[code] || '本次操作没有完成。请查看任务结果或稍后重试。';
}

export default function BusinessTasks({ client, onBusyChange }: Props) {
  const [kind, setKind] = useState<DraftKind>('reply');
  const [name, setName] = useState('');
  const [source, setSource] = useState('');
  const [releases, setReleases] = useState<DraftRelease[]>([]);
  const [chosen, setChosen] = useState('');
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [view, setView] = useState<'compose' | 'result' | 'history'>('compose');
  const [history, setHistory] = useState<SavedThread[]>([]);
  const [files, setFiles] = useState<DraftArtifact[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [charge, setCharge] = useState<number | null>(null);
  const [retryAllowed, setRetryAllowed] = useState(false);
  const [canStop, setCanStop] = useState(false);
  const [raw, setRaw] = useState(false);
  const mounted = useRef(true);
  const operation = useRef(0);
  const busyRef = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const jobRef = useRef<DraftJob | null>(null);
  const clientRef = useRef(client);
  const busyCallback = useRef(onBusyChange);
  clientRef.current = client; busyCallback.current = onBusyChange;

  const begin = () => {
    if (!mounted.current || busyRef.current) return null;
    const id = ++operation.current;
    const accountClient = clientRef.current;
    const abort = new AbortController(); controller.current = abort;
    busyRef.current = true; setBusy(true); setError('');
    const ensure = () => { if (!mounted.current || operation.current !== id || clientRef.current !== accountClient || abort.signal.aborted) throw new Error('DRAFT_STOPPED'); };
    const scoped: DraftClient = {
      request: async <T,>(path: string, init?: RequestInit) => {
        ensure(); const reply = await accountClient.request<T>(path, { ...init, signal: init?.signal || abort.signal }); ensure(); return reply;
      },
      requestText: async (path, init) => {
        ensure(); const reply = await accountClient.requestText(path, { ...init, signal: init?.signal || abort.signal }); ensure(); return reply;
      },
    };
    return { id, client: scoped, signal: abort.signal, ensure, finish: () => { if (mounted.current && operation.current === id) { busyRef.current = false; setBusy(false); controller.current = null; } } };
  };
  const cancelled = (e: unknown) => e instanceof Error && ['DRAFT_STOPPED', 'REQUEST_CANCELLED', 'SESSION_CHANGED'].includes(e.message.split(':')[0]);
  const loadFiles = async (api: DraftClient, threadId: string) => {
    const [saved, checks] = await Promise.all([
      api.request<{ data: DraftArtifact[] }>(`/api/artifacts?thread_id=${encodeURIComponent(threadId)}`),
      api.request<{ data: { report: DraftReport | null } }>(`/api/threads/${encodeURIComponent(threadId)}/delivery-checks`),
    ]);
    const owned = Array.isArray(saved.data) ? saved.data.filter(file => file.thread_id === threadId && typeof file.content === 'string') : [];
    const report = checks.data?.report?.threadId === threadId ? checks.data.report : null;
    setFiles(owned); setCharge(knownCharge(report));
    if (owned.length) setPreview({ artifact: owned[0], report, verified: false });
  };
  const inspect = async (api: DraftClient, job: DraftJob) => {
    const state = await readDraftRequest(api, job);
    setRetryAllowed(!state);
    setCanStop(state?.status === 'running');
    if (!state) { setPhase('等待确认'); setNotice('服务端尚未找到这项请求。可以用同一个任务编号重新提交，内容保持不变。'); return; }
    if (state.status === 'running') { setPhase('草稿仍在准备'); setNotice('任务已被服务端接收。请稍后查看结果，或明确停止。'); return; }
    setRetryAllowed(false);
    if (state.status !== 'completed' || state.result?.success !== true) {
      await loadFiles(api, job.threadId); setPhase(state.status === 'cancelled' ? '任务已停止' : '任务需要检查');
      setNotice('本次运行没有完整交付。已保存的文件可以查看，发送与发布仍需你处理。'); return;
    }
    const result = await verifyDraft(api, job);
    setFiles([result.artifact]); setPreview({ ...result, verified: true }); setCharge(knownCharge(result.report));
    setPhase('草稿已保存'); setNotice('文件与模型费用已核对。请检查事实、措辞和收件对象，再自行发送或发布。');
  };
  const refreshAssistants = async () => {
    const op = begin(); if (!op) return;
    try { const list = await availableDraftReleases(op.client); op.ensure(); setReleases(list); setChosen(previous => list.some(item => item.releaseId === previous) ? previous : list[0]?.releaseId || ''); }
    catch (e) { if (!cancelled(e) && mounted.current && operation.current === op.id) setError(friendly(e)); }
    finally { op.finish(); }
  };
  useEffect(() => {
    mounted.current = true; void refreshAssistants();
    return () => { mounted.current = false; operation.current += 1; controller.current?.abort(); busyRef.current = false; busyCallback.current?.(false); };
  }, [client]);
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);

  const start = async () => {
    const release = releases.find(item => item.releaseId === chosen);
    if (!release) return;
    const op = begin(); if (!op) return;
    setView('result'); setPhase('正在准备工作区'); setNotice(''); setPreview(null); setFiles([]); setCharge(null); setRaw(false); setRetryAllowed(false); setCanStop(false);
    try {
      let job = newDraftJob({ kind, name, source }, release); jobRef.current = job;
      job = await createDraftThread(op.client, job); op.ensure(); jobRef.current = job; setCanStop(true);
      setPhase('正在起草并保存文件'); await submitDraft(op.client, job, op.signal); op.ensure();
      await inspect(op.client, job); op.ensure();
    } catch (e) {
      if (!cancelled(e) && mounted.current && operation.current === op.id) {
        setError(friendly(e)); setPhase('结果待确认');
        const job = jobRef.current;
        if (job?.threadId) { try { await inspect(op.client, job); } catch { try { await loadFiles(op.client, job.threadId); } catch { /* Unknown costs stay unknown. */ } } }
      }
    } finally { op.finish(); }
  };
  const checkResult = async (retry = false) => {
    const job = jobRef.current; if (!job?.threadId) return;
    const op = begin(); if (!op) return;
    try {
      const state = await readDraftRequest(op.client, job);
      if (retry && !state) {
        const eligible = await availableDraftReleases(op.client);
        if (!eligible.some(item => item.releaseId === job.release.releaseId && item.model === job.release.model)) throw new Error('DRAFT_FREE_AGENT_UNAVAILABLE');
        setRetryAllowed(false); setPhase('正在提交原任务'); await submitDraft(op.client, job, op.signal);
      }
      await inspect(op.client, job); op.ensure();
    } catch (e) {
      if (!cancelled(e) && mounted.current && operation.current === op.id) { setError(friendly(e)); try { await loadFiles(op.client, job.threadId); } catch { /* Keep the last confirmed view. */ } }
    } finally { op.finish(); }
  };
  const stop = async (expectedOperation: number) => {
    if (!mounted.current || operation.current !== expectedOperation) return;
    const job = jobRef.current; const accountClient = clientRef.current;
    operation.current += 1; controller.current?.abort(); controller.current = null;
    busyRef.current = true; setBusy(true); setRetryAllowed(false); setPhase('正在请求停止'); setNotice('');
    try {
      if (!job?.threadId) { setPhase('已停止准备'); setNotice('已停止本机准备，没有继续提交草稿请求。'); return; }
      if (!mounted.current || clientRef.current !== accountClient) return;
      const reply = await accountClient.request<{ data: { accepted: boolean; cancelled: boolean } }>(`/api/threads/${encodeURIComponent(job.threadId)}/control`, { method: 'POST', body: JSON.stringify({ mode: 'cancel' }) });
      if (!mounted.current || clientRef.current !== accountClient) return;
      if (reply.data?.accepted !== true || reply.data.cancelled !== true) throw new Error('DRAFT_STOP_UNCONFIRMED');
      setCanStop(false);
      setPhase('已请求停止'); setNotice('请查看任务结果确认最后状态。已经保存的文件会保留，停止不能撤回已完成的动作。');
    } catch (e) { if (mounted.current && clientRef.current === accountClient) { setPhase('停止状态待确认'); setNotice('暂未确认服务端停止。请查看任务结果后再决定下一步。'); } }
    finally { if (mounted.current && clientRef.current === accountClient) { busyRef.current = false; setBusy(false); } }
  };
  const showHistory = async () => {
    const op = begin(); if (!op) return;
    setView('history');
    try { const reply = await op.client.request<{ data: SavedThread[] }>('/api/threads?limit=30'); op.ensure(); setHistory(Array.isArray(reply.data) ? reply.data.filter(thread => !!thread.publishedAgent?.releaseId) : []); }
    catch (e) { if (!cancelled(e) && mounted.current && operation.current === op.id) setError(friendly(e)); }
    finally { op.finish(); }
  };
  const openSaved = async (thread: SavedThread) => {
    const op = begin(); if (!op) return;
    setView('result'); setPreview(null); setFiles([]); setCharge(null); setRetryAllowed(false); setCanStop(false); setRaw(false); setNotice(''); setPhase('正在读取已保存的工作');
    try {
      const job = await restoreDraftJob(op.client, thread); op.ensure(); jobRef.current = job;
      if (job) { await inspect(op.client, job); op.ensure(); }
      else { await loadFiles(op.client, thread.id); op.ensure(); setPhase('已保存的工作'); setNotice('这是已有工作区文件，可阅读和复制。没有完整的本次草稿核对记录时，不会标记为已交付。'); }
    } catch (e) { if (!cancelled(e) && mounted.current && operation.current === op.id) { setError(friendly(e)); try { await loadFiles(op.client, thread.id); } catch {} } }
    finally { op.finish(); }
  };
  const button = (label: string, action: () => void, disabled = false, secondary = false) => <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={action} style={[s.button, secondary && s.secondary, disabled && s.disabled]}><Text style={[s.buttonText, secondary && { color: C.ink }]}>{label}</Text></TouchableOpacity>;
  const text = (value: string) => <Text selectable style={s.previewText}>{value}</Text>;
  const content = preview?.value;
  const displayedOperation = operation.current;

  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
    {view === 'compose' ? <View style={s.heading}><Text style={s.eyebrow}>工作先有草稿</Text><Text style={s.hero}>把想法，{'\n'}变成可用的文字。</Text><Text style={s.intro}>给一份真实资料，收一份保存好的草稿。{'\n'}由你检查，再决定怎样使用。</Text></View> : <View style={s.heading}><Text style={s.eyebrow}>{view === 'history' ? '工作记录' : '本次草稿'}</Text><Text style={s.title}>{view === 'history' ? '已保存的工作' : draftLabel(jobRef.current?.input.kind || kind)}</Text>{view === 'result' && jobRef.current && <Text style={s.small}>{jobRef.current.input.name}</Text>}</View>}
    <View style={s.tabs}>{button('新建草稿', () => { setView('compose'); setError(''); }, busy, view !== 'compose')}{button('已保存的工作', () => { void showHistory(); }, busy, view !== 'history')}</View>
    {error ? <View accessibilityLiveRegion="polite" style={[s.message, s.error]}><Text style={[s.small, { color: C.red }]}>{error}</Text></View> : null}
    {notice ? <View accessibilityLiveRegion="polite" style={s.message}><Text style={s.small}>{notice}</Text></View> : null}
    {view === 'compose' && <>
      <View style={s.templates}>{(['reply', 'marketing'] as DraftKind[]).map((value, index) => <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: kind === value, disabled: busy }} disabled={busy} key={value} onPress={() => setKind(value)} style={[s.template, kind === value && s.selected]}><Text style={s.number}>0{index + 1}</Text><Text style={s.templateTitle}>{draftLabel(value)}</Text><Text style={s.small}>{value === 'reply' ? '回复正文 + 后续跟进草稿' : '邮件文案 + 社交媒体文案'}</Text></TouchableOpacity>)}</View>
      <Text style={s.label}>{kind === 'reply' ? '收件对象' : '品牌或产品名称'}</Text><TextInput accessibilityLabel="草稿对象名称" value={name} onChangeText={setName} editable={!busy} maxLength={100} placeholder={kind === 'reply' ? '例如：王经理' : '例如：Northstar Studio'} placeholderTextColor={C.muted} style={s.input} />
      <Text style={s.label}>{kind === 'reply' ? '来信内容与需要说明的事实' : '真实卖点、目标用户与使用场景'}</Text><TextInput accessibilityLabel="草稿参考资料" value={source} onChangeText={setSource} editable={!busy} multiline maxLength={6000} placeholder={kind === 'reply' ? '粘贴来信，并补充可以确认的交付时间、产品信息和你的回复意图。' : '写下已确认的功能、优势和适用人群。没有证据的效果或价格，请明确说明。'} placeholderTextColor={C.muted} style={[s.input, s.source]} />
      <Text style={s.label}>本次使用的助手</Text>{releases.map(release => <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: chosen === release.releaseId, disabled: busy }} disabled={busy} key={release.releaseId} onPress={() => setChosen(release.releaseId)} style={[s.assistant, chosen === release.releaseId && s.selected]}><Text style={s.body}>{release.name}</Text><Text style={s.small}>v{release.version} · 免费模型{chosen === release.releaseId ? ' · 已选择' : ''}</Text></TouchableOpacity>)}
      {!releases.length && <Text style={s.small}>{busy ? '正在查看可用助手…' : '暂无可用的免费草稿助手。请先在工作区准备并发布支持保存文件的助手，或稍后刷新。'}</Text>}
      {button('刷新可用助手', () => { void refreshAssistants(); }, busy, true)}{button(busy ? '正在准备…' : '生成并保存草稿 →', () => { void start(); }, busy || !chosen || !name.trim() || !source.trim())}
      <Text style={s.footnote}>本次模型费用上限为 $0。只起草，不自动发送或发布。免费模型繁忙时可稍后查看原任务。</Text>
    </>}
    {view === 'history' && <><Text style={s.label}>最近保存的工作</Text>{!busy && !history.length && <Text style={s.body}>这里还没有已发布助手的工作记录。</Text>}{history.map(thread => <TouchableOpacity accessibilityRole="button" disabled={busy} key={thread.id} onPress={() => { void openSaved(thread); }} style={s.history}><Text style={s.body}>{thread.title}</Text><Text style={s.small}>{thread.publishedAgent?.name} · 查看文件与核对记录 →</Text></TouchableOpacity>)}</>}
    {view === 'result' && <>
      <View style={s.phase}><Text style={s.title}>{phase || '工作结果'}</Text>{busy && <ActivityIndicator color={C.green} />}</View>
      <Text style={s.small}>{charge === null ? '模型费用：尚未确认' : `模型费用：$${charge === 0 ? '0.00' : charge.toFixed(6)} · 已核对`}</Text>
      {busy ? button('停止本次任务', () => { void stop(displayedOperation); }, phase === '正在请求停止', true) : jobRef.current?.threadId ? <>{button('查看任务结果', () => { void checkResult(); }, false, true)}{retryAllowed && button('重新提交原任务', () => { void checkResult(true); })}{canStop && button('请求停止原任务', () => { void stop(displayedOperation); }, false, true)}</> : null}
      {files.length > 1 && files.map(file => button(file.filename, () => { setPreview({ artifact: file, report: null, verified: false }); setRaw(true); }, busy, true))}
      {preview && <View style={s.saved}><Text style={s.eyebrow}>{preview.verified ? '文件与交付要求已核对' : '已保存文件 · 请检查内容'}</Text><Text style={s.filename}>{preview.artifact.filename}</Text><Text style={s.small}>长按正文即可选择并复制。草稿仍需本人审阅。</Text>
        {content && !raw ? <>{jobRef.current?.input.kind === 'reply' ? <><Text style={s.label}>主题</Text>{text(String(content.subject))}<Text style={s.label}>回复草稿</Text>{text(String(content.body))}{content.followUpDraft && <><Text style={s.label}>后续跟进草稿</Text>{text(String(content.followUpDraft))}</>}</> : <><Text style={s.label}>邮件主题</Text>{text(String(content.emailDraft?.subject || ''))}{text(String(content.emailDraft?.body || ''))}{content.socialDrafts?.map((item: any, index: number) => <View key={index}><Text style={s.label}>{String(item.channel)}</Text>{text(String(item.text))}</View>)}</>}
          {Array.isArray(content.missingInformation) && content.missingInformation.length > 0 && <><Text style={s.label}>还需要你补充</Text>{text(content.missingInformation.map((item: unknown) => String(item)).join('\n'))}</>}
          {Array.isArray(content.unverifiedClaims) && content.unverifiedClaims.length > 0 && <><Text style={s.label}>尚未核实的说法</Text>{text(content.unverifiedClaims.map((item: unknown) => String(item)).join('\n'))}</>}
        </> : text(preview.artifact.content)}
        {content && button(raw ? '阅读草稿正文' : '查看 JSON 文件', () => setRaw(!raw), false, true)}
        {preview.report?.checkedAt && <Text style={s.footnote}>最近核对：{new Date(preview.report.checkedAt).toLocaleString()}</Text>}
      </View>}
      {!preview && !busy && <Text style={s.footnote}>尚未确认有完整交付文件。可以查看原任务状态，或从“已保存的工作”找回服务器记录。</Text>}
    </>}
    {busy && view !== 'result' && <ActivityIndicator style={{ marginTop: 20 }} color={C.green} />}
    <View style={s.footer}><Text style={s.small}>草稿有据，决定在你。</Text><Text style={s.small}>FORGE / WORK</Text></View>
  </ScrollView>;
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 44, backgroundColor: C.bg }, heading: { paddingBottom: 16 }, eyebrow: { color: C.green, fontSize: 12, fontWeight: '600', letterSpacing: 1.2, marginTop: 20, marginBottom: 12 }, hero: { color: C.ink, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 33, lineHeight: 45 }, intro: { color: C.muted, fontSize: 15, lineHeight: 24, marginTop: 16 },
  tabs: { flexDirection: 'row', gap: 10, marginBottom: 12 }, button: { flexGrow: 1, minHeight: 50, backgroundColor: C.ink, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', marginTop: 12 }, buttonText: { color: C.accent, fontWeight: '700', fontSize: 14 }, secondary: { backgroundColor: C.paper, borderWidth: 1, borderColor: C.line }, disabled: { opacity: 0.45 },
  templates: { marginTop: 12, gap: 12 }, template: { backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 18, gap: 7 }, selected: { borderColor: C.green, borderWidth: 1.5 }, number: { color: C.green, fontSize: 12, fontFamily: 'monospace' }, templateTitle: { color: C.ink, fontSize: 20, fontWeight: '600' }, label: { color: C.muted, fontSize: 12, fontWeight: '600', marginTop: 24, marginBottom: 10 }, input: { minHeight: 52, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 15, color: C.ink, fontSize: 16 }, source: { minHeight: 180, textAlignVertical: 'top', lineHeight: 24 },
  assistant: { padding: 15, marginBottom: 8, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 12, gap: 5 }, body: { color: C.ink, fontSize: 15, lineHeight: 24 }, small: { color: C.muted, fontSize: 12, lineHeight: 20 }, footnote: { color: C.muted, fontSize: 12, lineHeight: 20, marginTop: 16 }, message: { backgroundColor: C.paper, padding: 14, borderWidth: 1, borderColor: C.line, borderRadius: 10, marginTop: 12 }, error: { borderColor: '#dab4a9' },
  history: { borderBottomWidth: 1, borderColor: C.line, paddingVertical: 18, gap: 6 }, phase: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24, marginBottom: 12 }, title: { color: C.ink, fontSize: 23, lineHeight: 32, fontWeight: '600', flexShrink: 1 }, saved: { borderLeftWidth: 3, borderColor: C.green, backgroundColor: C.paper, padding: 18, marginTop: 24 }, filename: { color: C.ink, fontSize: 16, lineHeight: 24, fontFamily: 'monospace', marginBottom: 10 }, previewText: { color: C.ink, fontSize: 15, lineHeight: 25, marginTop: 8 }, footer: { borderTopWidth: 1, borderColor: C.line, paddingTop: 18, marginTop: 32, flexDirection: 'row', justifyContent: 'space-between' },
});
