import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  availableDraftReleases, createDraftThread, DraftArtifact, DraftClient, DraftJob, DraftKind, DraftRelease, DraftReport,
  draftLabel, knownCharge, newDraftJob, readDraftRequest, restoreDraftJob, SavedThread, submitDraft, verifyDraft,
  canRecoverMail, freezeMail, listMailReceipts, MailEnvelope, MailPreparation, MailReceipt, mailReceiptAction, mailStatusText,
  newMailPreparation, readMailReceipt, resendConfiguration, saveResendCredential, singleMailAddress,
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
    MAIL_SINGLE_ADDRESS_REQUIRED: '请填写一个真实的发件邮箱和一个收件邮箱，不要填姓名或多个地址。',
    MAIL_CONTENT_INVALID: '请填写完整的主题和正文；主题不能换行。',
    MAIL_CREDENTIAL_REQUIRED: '请先保存你自己的 Resend API key。',
    MAIL_CONFIGURATION_UNCONFIRMED: '邮件凭据状态尚未确认，请重新读取配置。',
    MAIL_RECEIPT_UNCONFIRMED: '邮件回执尚未确认，请查看原邮件记录，暂时不要重复发送。',
    MAIL_REQUEST_UNCONFIRMED: '等待响应超时了。请查看原邮件记录，暂时不要重复发送。',
    MAIL_SOURCE_CHANGED: '源草稿或核对记录已变化。请重新核对草稿，原邮件记录仍保留。',
    MAIL_CREDENTIAL_CHANGED: '原邮件使用的凭据已变化。请查看原邮件记录，不要重复发送。',
    MAIL_CONTENT_CHANGED: '邮件预览与原记录不一致，请重新读取原邮件。',
    MAIL_STATUS_CHANGED: '邮件状态已经变化，请查看原邮件记录。',
    MAIL_RECOVERY_WINDOW_EXPIRED: '恢复提交的去重有效期已过，无法再次提交。请核实原邮件结果。',
    MAIL_PROVIDER_QUERY_UNAVAILABLE: '暂时无法查询邮件服务。已接收的状态和原内容会保留。',
    MAIL_QUERY_PERMISSION_REQUIRED: '此凭据可能只能发送；需要查询权限才能核实送达。原邮件记录会保留。',
    MAIL_RECEIPT_QUERY_UNCONFIRMED: '邮件服务查询暂未完成。此凭据可能只有发送权限；需要查询权限才能核实送达，原记录会保留。',
    MAIL_PROVIDER_RECEIPT_MISMATCH: '邮件服务返回的内容与原邮件不一致，暂时不能据此确认送达。',
    MAIL_PROVIDER_EVENT_UNRECOGNIZED: '邮件服务返回了尚不能核实的事件，原记录会保留。',
    MAIL_SOURCE_UNVERIFIED: '请先核对源草稿文件与模型费用，再准备邮件。',
    MAIL_INVALID_ADDRESS: '请填写单个真实邮箱地址，不要包含姓名或多个收件人。',
    MAIL_INVALID_SUBJECT: '邮件主题不能换行，长度需在 500 字节以内。',
    MAIL_INVALID_TEXT: '请填写完整正文，长度需在 60 KB 以内。',
    MAIL_INPUT_TOO_LARGE: '邮件内容较长，请精简后再准备预览。',
    MAIL_APPROVAL_NOT_AVAILABLE: '原邮件已经处理，请查看保存的状态。',
    MAIL_CANCELLATION_NOT_AVAILABLE: '原邮件已离开待批准状态，不能确认撤回。请查看保存的状态。',
    MAIL_RECOVERY_NOT_AVAILABLE: '原邮件暂时不能恢复提交，请先核实保存的状态。',
    MAIL_STATE_CONFLICT: '邮件状态已变化，请查看原记录。',
    MAIL_IDEMPOTENCY_CONFLICT: '原邮件编号对应的内容不同，请读取原预览，不要重复发送。',
    MAIL_EXISTING_DELIVERY_REQUIRED: '服务端已有相同内容的邮件。请查看原邮件记录，不要再次准备或发送。',
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
  const [busyKind, setBusyKind] = useState<'draft' | 'mail' | 'other'>('other');
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
  const [mailOpen, setMailOpen] = useState(false);
  const [mailFields, setMailFields] = useState<MailEnvelope>({ from: '', to: '', subject: '', text: '' });
  const [mailRecords, setMailRecords] = useState<MailReceipt[]>([]);
  const [mailReceipt, setMailReceipt] = useState<MailReceipt | null>(null);
  const [mailListKnown, setMailListKnown] = useState(false);
  const [mailUncertain, setMailUncertain] = useState(false);
  const [mailChecked, setMailChecked] = useState(false);
  const [mailRetryPreparation, setMailRetryPreparation] = useState(false);
  const [resendState, setResendState] = useState<'unread' | 'missing' | 'saved' | 'unconfirmed'>('unread');
  const [resendKey, setResendKey] = useState('');
  const [mailNotice, setMailNotice] = useState('');
  const [mailError, setMailError] = useState('');
  const mounted = useRef(true);
  const operation = useRef(0);
  const busyRef = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const jobRef = useRef<DraftJob | null>(null);
  const clientRef = useRef(client);
  const busyCallback = useRef(onBusyChange);
  const mailThread = useRef('');
  const preparation = useRef<MailPreparation | null>(null);
  const preparationConflict = useRef(false);
  const selectedMail = useRef<MailReceipt | null>(null);
  clientRef.current = client; busyCallback.current = onBusyChange;
  selectedMail.current = mailReceipt;

  const begin = (purpose: 'draft' | 'mail' | 'other' = 'other') => {
    // A callback from an earlier account must never borrow the new client's credentials.
    if (!mounted.current || busyRef.current || clientRef.current !== client) return null;
    const id = ++operation.current;
    const accountClient = clientRef.current;
    const abort = new AbortController(); controller.current = abort;
    busyRef.current = true; setBusy(true); setBusyKind(purpose); setError('');
    let timedOut = false;
    const timer = purpose === 'mail' ? setTimeout(() => { timedOut = true; abort.abort(); }, 20000) : undefined;
    const ensure = () => {
      if (!mounted.current || operation.current !== id || clientRef.current !== accountClient) throw new Error('DRAFT_STOPPED');
      if (timedOut) throw new Error('MAIL_REQUEST_UNCONFIRMED');
      if (abort.signal.aborted) throw new Error('DRAFT_STOPPED');
    };
    const scoped: DraftClient = {
      request: async <T,>(path: string, init?: RequestInit) => {
        ensure();
        try { const reply = await accountClient.request<T>(path, { ...init, signal: init?.signal || abort.signal }); ensure(); return reply; }
        catch (e) { ensure(); throw e; }
      },
      requestText: async (path, init) => {
        ensure();
        try { const reply = await accountClient.requestText(path, { ...init, signal: init?.signal || abort.signal }); ensure(); return reply; }
        catch (e) { ensure(); throw e; }
      },
    };
    return { id, client: scoped, signal: abort.signal, ensure, finish: () => { clearTimeout(timer); if (mounted.current && operation.current === id) { busyRef.current = false; setBusy(false); controller.current = null; } } };
  };
  const cancelled = (e: unknown) => e instanceof Error && ['DRAFT_STOPPED', 'REQUEST_CANCELLED', 'SESSION_CHANGED'].includes(e.message.split(':')[0]);
  const resetMail = (threadId = '') => {
    mailThread.current = threadId; preparation.current = null; preparationConflict.current = false; selectedMail.current = null;
    setMailOpen(false); setMailFields({ from: '', to: '', subject: '', text: '' }); setMailRecords([]); setMailReceipt(null);
    setMailListKnown(false); setMailUncertain(false); setMailChecked(false); setMailRetryPreparation(false);
    setMailNotice(''); setMailError(''); setResendKey('');
  };
  const adoptMail = (receipt: MailReceipt) => {
    selectedMail.current = receipt; setMailReceipt(receipt);
    setMailRecords(previous => [receipt, ...previous.filter(row => row.id !== receipt.id)]);
    setMailListKnown(true); setMailUncertain(false); setMailRetryPreparation(false);
    if (preparation.current?.clientRequestId === receipt.clientRequestId) { preparation.current = null; preparationConflict.current = false; }
    if (receipt.refreshError || receipt.errorCode?.startsWith('MAIL_RECEIPT_QUERY_') || ['MAIL_PROVIDER_RECEIPT_MISMATCH', 'MAIL_PROVIDER_EVENT_UNRECOGNIZED'].includes(receipt.errorCode || '')) setMailError(friendly(new Error(receipt.refreshError || receipt.errorCode!)));
  };
  const loadMailRecords = async (api: DraftClient, threadId: string) => {
    const records = await listMailReceipts(api, threadId);
    setMailRecords(records); setMailListKnown(true); setMailChecked(true);
    // An unresolved preparation can only be recovered by its own request ID.
    // An older history record must never replace its locked editor or body.
    const active = preparation.current ? records.find(row => row.clientRequestId === preparation.current!.clientRequestId)
      : records.find(row => row.id === selectedMail.current?.id) || records[0];
    if (active) adoptMail(active);
    return records;
  };
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
    mounted.current = true;
    resetMail(); setResendState('unread'); jobRef.current = null;
    setName(''); setSource(''); setChosen(''); setReleases([]); setHistory([]); setFiles([]); setPreview(null); setCharge(null);
    setView('compose'); setNotice(''); setError(''); setPhase(''); setRetryAllowed(false); setCanStop(false); setRaw(false);
    busyRef.current = false; setBusy(false);
    const accountBusyCallback = busyCallback.current;
    void refreshAssistants();
    return () => {
      mounted.current = false; operation.current += 1; controller.current?.abort(); busyRef.current = false;
      preparation.current = null; preparationConflict.current = false; selectedMail.current = null; mailThread.current = '';
      accountBusyCallback?.(false);
    };
  }, [client]);
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);

  const start = async () => {
    const release = releases.find(item => item.releaseId === chosen);
    if (!release) return;
    const op = begin('draft'); if (!op) return;
    setView('result'); setPhase('正在准备工作区'); setNotice(''); setPreview(null); setFiles([]); setCharge(null); setRaw(false); setRetryAllowed(false); setCanStop(false);
    resetMail();
    try {
      let job = newDraftJob({ kind, name, source }, release); jobRef.current = job;
      job = await createDraftThread(op.client, job); op.ensure(); jobRef.current = job; mailThread.current = job.threadId; setCanStop(true);
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
    const op = begin('draft'); if (!op) return;
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
    if (!mounted.current || operation.current !== expectedOperation || clientRef.current !== client) return;
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
    resetMail(thread.id);
    try {
      const job = await restoreDraftJob(op.client, thread); op.ensure(); jobRef.current = job;
      if (job) { await inspect(op.client, job); op.ensure(); }
      else { await loadFiles(op.client, thread.id); op.ensure(); setPhase('已保存的工作'); setNotice('这是已有工作区文件，可阅读和复制。没有完整的本次草稿核对记录时，不会标记为已交付。'); }
    } catch (e) { if (!cancelled(e) && mounted.current && operation.current === op.id) { setError(friendly(e)); try { await loadFiles(op.client, thread.id); } catch {} } }
    finally {
      try { op.ensure(); await loadMailRecords(op.client, thread.id); op.ensure(); }
      catch (e) { if (!cancelled(e) && mounted.current && operation.current === op.id) setMailError('邮件记录尚未确认。可以重新读取；不会自动再次发送。'); }
      op.finish();
    }
  };
  const mailFailure = (e: unknown, id: number, uncertain = false) => {
    if (!cancelled(e) && mounted.current && operation.current === id) {
      setMailError(friendly(e));
      if (uncertain) { setMailUncertain(true); setMailChecked(false); setMailNotice('最近操作的结果尚未确认。请先读取原邮件记录；不会自动重复发送。'); }
    }
  };
  const openMail = async () => {
    if (!mailThread.current) return;
    const op = begin('mail'); if (!op) return;
    setMailOpen(true); setMailError(''); setMailNotice('');
    if (preview?.verified && preview.value && !selectedMail.current && !preparation.current) {
      const draft = jobRef.current?.input.kind === 'reply' ? preview.value : preview.value.emailDraft;
      setMailFields(previous => ({ ...previous, subject: String(draft?.subject || ''), text: String(draft?.body || '') }));
    }
    try {
      const config = await resendConfiguration(op.client); op.ensure(); setResendState(config.configured ? 'saved' : 'missing');
      await loadMailRecords(op.client, mailThread.current); op.ensure();
      setMailNotice('当前支持自己的 Resend 账号。保存凭据仅表示已保存，连接与发件权限尚未验证。');
    } catch (e) { mailFailure(e, op.id); if (mounted.current && operation.current === op.id) setMailListKnown(false); }
    finally { op.finish(); }
  };
  const readMailSetup = async () => {
    if (!mailThread.current) return;
    const op = begin('mail'); if (!op) return;
    setMailError(''); setMailNotice('');
    try {
      const config = await resendConfiguration(op.client); op.ensure(); setResendState(config.configured ? 'saved' : 'missing');
      const records = await loadMailRecords(op.client, mailThread.current); op.ensure();
      const pending = preparation.current;
      if (pending && !records.some(row => row.clientRequestId === pending.clientRequestId)) {
        setMailRetryPreparation(!preparationConflict.current); setMailUncertain(true);
        setMailNotice(preparationConflict.current ? '服务端尚未返回对应原邮件记录。请继续读取，不会重新提交或生成新的邮件编号。'
          : '服务端尚未找到这份预览。可以使用原编号和原内容重新准备；这一步仍不会发送。');
      } else setMailUncertain(false);
    } catch (e) { mailFailure(e, op.id); }
    finally { op.finish(); }
  };
  const saveMailKey = async () => {
    if (!resendKey.trim() || selectedMail.current && !['cancelled', 'rejected'].includes(selectedMail.current.status) || preparation.current) return;
    const op = begin('mail'); if (!op) return;
    const key = resendKey; setResendKey(''); setMailError(''); setMailNotice('');
    try {
      await saveResendCredential(op.client, key); op.ensure(); setResendState('saved');
      setMailNotice('凭据已按账号加密保存。连接和发件权限尚未验证，请使用自己已验证发件域名的地址。');
    } catch (e) { mailFailure(e, op.id); if (mounted.current && operation.current === op.id) setResendState('unconfirmed'); }
    finally { op.finish(); }
  };
  const prepareMail = async (retry = false) => {
    if (!preview?.verified || !preview.value || knownCharge(preview.report) !== 0 || !mailListKnown || resendState !== 'saved') return;
    if (selectedMail.current && !['cancelled', 'rejected'].includes(selectedMail.current.status)) return;
    if (retry ? !preparation.current || !mailRetryPreparation : !!preparation.current || mailUncertain) return;
    const op = begin('mail'); if (!op) return;
    setMailError(''); setMailNotice(''); setMailChecked(false);
    try {
      const pending = retry ? preparation.current! : newMailPreparation(preview.artifact, mailFields);
      preparation.current = pending; setMailUncertain(true); setMailRetryPreparation(false);
      const receipt = await freezeMail(op.client, pending); op.ensure(); adoptMail(receipt);
      setMailNotice('请核对下方冻结的完整内容。这份预览尚未发送；批准只适用于这一个收件地址和这些文字。');
    } catch (e) {
      const code = e instanceof Error ? e.message.split(':')[0] : '';
      const status = e && typeof e === 'object' && 'status' in e ? e.status : undefined;
      const conflict = ['MAIL_EXISTING_DELIVERY_REQUIRED', 'MAIL_IDEMPOTENCY_CONFLICT'].includes(code);
      const refused = !conflict && ([400, 413, 404].includes(status as number) || /^MAIL_(INVALID_|SOURCE_|CREDENTIAL_)/.test(code));
      mailFailure(e, op.id, !!preparation.current && !refused);
      if (refused && !cancelled(e) && mounted.current && operation.current === op.id) {
        preparation.current = null; preparationConflict.current = false;
        setMailUncertain(false); setMailRetryPreparation(false); setMailChecked(false);
        setMailNotice('这次准备请求已被拒绝，没有批准或发送。请修改内容、更新凭据或重新核对源草稿后，再准备预览。');
      }
      if (conflict && preparation.current) {
        preparationConflict.current = true;
        try {
          const pending = preparation.current, expected = JSON.parse(pending.body);
          const records = await listMailReceipts(op.client, pending.threadId); op.ensure();
          setMailRecords(records); setMailListKnown(true); setMailChecked(true);
          const existing = records.find(row => row.clientRequestId === pending.clientRequestId)
            || records.find(row => row.artifactId === pending.artifactId && row.artifactVersion === pending.artifactVersion
            && ['from', 'to', 'subject', 'text'].every(field => row.envelope[field as keyof MailEnvelope] === expected[field]));
          if (existing) { preparation.current = null; preparationConflict.current = false; adoptMail(existing); setMailError(''); setMailNotice('已找回服务端的原邮件。这次只读取记录，没有再次批准或发送。'); }
        } catch (lookupError) { mailFailure(lookupError, op.id, true); }
      }
    }
    finally { op.finish(); }
  };
  const actOnMail = async (receipt: MailReceipt, action: 'read' | 'approve' | 'cancel' | 'refresh' | 'recover', expectedOperation: number, editAfterCancel = false) => {
    if (operation.current !== expectedOperation || selectedMail.current?.id !== receipt.id || selectedMail.current.contentHash !== receipt.contentHash) return;
    if (mailUncertain && !['read', 'refresh'].includes(action) || action === 'recover' && !mailChecked) return;
    const op = begin('mail'); if (!op) return;
    setMailError(''); setMailNotice('');
    const changesState = ['approve', 'cancel', 'recover'].includes(action);
    if (changesState) { setMailUncertain(true); setMailChecked(false); }
    try {
      const updated = action === 'read' ? await readMailReceipt(op.client, receipt) : await mailReceiptAction(op.client, receipt, action);
      op.ensure(); adoptMail(updated);
      if (action === 'read' || action === 'refresh') setMailChecked(true);
      setMailNotice(action === 'approve' || action === 'recover' ? '已读取原邮件的最新回执。服务接收和实际送达分别显示，不会把接收当作送达。'
        : action === 'cancel' ? '已读取取消结果。只有“已取消 · 尚未提交邮件服务”才表示未提交。' : '已读取原邮件记录；本次查看不会发送或生成新邮件。');
      if (editAfterCancel && updated.status === 'cancelled') {
        setMailFields({ ...updated.envelope }); selectedMail.current = null; setMailReceipt(null); preparation.current = null; preparationConflict.current = false;
        setMailNotice('原预览已取消，尚未提交邮件服务。现在可以编辑，再准备新的完整预览。');
      }
    } catch (e) { mailFailure(e, op.id, changesState); }
    finally { op.finish(); }
  };
  const editCancelledMail = () => {
    if (busyRef.current || clientRef.current !== client || preparation.current || !selectedMail.current || !['cancelled', 'rejected'].includes(selectedMail.current.status) || mailUncertain) return;
    setMailFields({ ...selectedMail.current.envelope }); selectedMail.current = null; setMailReceipt(null); preparationConflict.current = false;
    setMailChecked(false); setMailNotice('请编辑后重新准备完整预览；再次发送仍需你的批准。');
  };
  const changeMailField = (field: keyof MailEnvelope, value: string) => {
    if (!mounted.current || clientRef.current !== client || busyRef.current || preparation.current || selectedMail.current && !['cancelled', 'rejected'].includes(selectedMail.current.status) || mailUncertain) return;
    setMailFields(previous => ({ ...previous, [field]: value }));
  };
  const selectSavedMail = (receipt: MailReceipt, expectedOperation: number) => {
    if (!mounted.current || clientRef.current !== client || busyRef.current || preparation.current || operation.current !== expectedOperation) return;
    selectedMail.current = receipt; setMailReceipt(receipt); setMailChecked(false); setMailUncertain(true); setMailError('');
    setMailNotice('这是上次读取的记录，请先查看保存的状态，再执行下一步。');
  };
  const button = (label: string, action: () => void, disabled = false, secondary = false) => <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={action} style={[s.button, secondary && s.secondary, disabled && s.disabled]}><Text style={[s.buttonText, secondary && { color: C.ink }]}>{label}</Text></TouchableOpacity>;
  const text = (value: string) => <Text selectable style={s.previewText}>{value}</Text>;
  const content = preview?.value;
  const displayedOperation = operation.current;
  const mailLocked = !!mailReceipt && !['cancelled', 'rejected'].includes(mailReceipt.status) || !!preparation.current || mailUncertain;
  const mailSourceVerified = preview?.verified === true && !!preview.value && knownCharge(preview.report) === 0;

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
      <View style={s.phase}><Text style={s.title}>{phase || '工作结果'}</Text>{busy && busyKind === 'draft' && <ActivityIndicator color={C.green} />}</View>
      <Text style={s.small}>{charge === null ? '模型费用：尚未确认' : `模型费用：$${charge === 0 ? '0.00' : charge.toFixed(6)} · 已核对`}</Text>
      {busy ? busyKind === 'draft' && button('停止本次任务', () => { void stop(displayedOperation); }, phase === '正在请求停止', true) : jobRef.current?.threadId ? <>{button('查看任务结果', () => { void checkResult(); }, false, true)}{retryAllowed && button('重新提交原任务', () => { void checkResult(true); })}{canStop && button('请求停止原任务', () => { void stop(displayedOperation); }, false, true)}</> : null}
      {files.length > 1 && files.map(file => button(file.filename, () => { setPreview({ artifact: file, report: null, verified: false }); setRaw(true); }, busy, true))}
      {preview && <View style={s.saved}><Text style={s.eyebrow}>{preview.verified ? '文件与交付要求已核对' : '已保存文件 · 请检查内容'}</Text><Text style={s.filename}>{preview.artifact.filename}</Text><Text style={s.small}>长按正文即可选择并复制。草稿仍需本人审阅。</Text>
        {content && !raw ? <>{jobRef.current?.input.kind === 'reply' ? <><Text style={s.label}>主题</Text>{text(String(content.subject))}<Text style={s.label}>回复草稿</Text>{text(String(content.body))}{content.followUpDraft && <><Text style={s.label}>后续跟进草稿</Text>{text(String(content.followUpDraft))}</>}</> : <><Text style={s.label}>邮件主题</Text>{text(String(content.emailDraft?.subject || ''))}{text(String(content.emailDraft?.body || ''))}{content.socialDrafts?.map((item: any, index: number) => <View key={index}><Text style={s.label}>{String(item.channel)}</Text>{text(String(item.text))}</View>)}</>}
          {Array.isArray(content.missingInformation) && content.missingInformation.length > 0 && <><Text style={s.label}>还需要你补充</Text>{text(content.missingInformation.map((item: unknown) => String(item)).join('\n'))}</>}
          {Array.isArray(content.unverifiedClaims) && content.unverifiedClaims.length > 0 && <><Text style={s.label}>尚未核实的说法</Text>{text(content.unverifiedClaims.map((item: unknown) => String(item)).join('\n'))}</>}
        </> : text(preview.artifact.content)}
        {content && button(raw ? '阅读草稿正文' : '查看 JSON 文件', () => setRaw(!raw), false, true)}
        {preview.report?.checkedAt && <Text style={s.footnote}>最近核对：{new Date(preview.report.checkedAt).toLocaleString()}</Text>}
      </View>}
      {(mailSourceVerified || mailRecords.length > 0) && !mailOpen && button(mailRecords.length ? '查看邮件准备与发送记录' : '准备一封邮件 →', () => { void openMail(); }, busy, true)}
      {mailOpen && <View style={s.mailSection}>
        <View style={s.mailHeading}><View style={{ flex: 1 }}><Text style={s.eyebrow}>FORGE / MAIL</Text><Text style={s.templateTitle}>发出去之前，先看清楚。</Text></View>{busy && busyKind === 'mail' && <ActivityIndicator color={C.green} />}</View>
        <Text style={s.footnote}>只发送本次完整预览中的一封邮件。原草稿文件保持不变，后续跟进与社交内容不会自动发送。</Text>
        {mailError ? <View accessibilityLiveRegion="polite" style={[s.message, s.error]}><Text style={[s.small, { color: C.red }]}>{mailError}</Text></View> : null}
        {mailNotice ? <View accessibilityLiveRegion="polite" style={s.message}><Text style={s.small}>{mailNotice}</Text></View> : null}
        <Text style={s.label}>本次邮件服务</Text><View style={s.mailConnection}><Text style={s.body}>Resend · 使用你自己的账号</Text><Text style={s.small}>{resendState === 'saved' ? '凭据已保存 · 连接与发件权限未验证' : resendState === 'missing' ? '尚未保存邮件凭据' : '凭据保存状态尚未确认'}</Text></View>
        <Text style={s.footnote}>发件邮箱需属于你在 Resend 验证过的域名。resend.dev 地址通常只供发送给本人测试。邮箱服务费用独立，尚未确认；以你的服务账单为准。</Text>
        {!mailLocked && <><Text style={s.label}>{resendState === 'saved' ? '更新邮件凭据（可选）' : '你的 Resend API key'}</Text><TextInput accessibilityLabel="Resend API key" value={resendKey} onChangeText={value => { if (mounted.current && clientRef.current === client && !busyRef.current) setResendKey(value); }} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="off" editable={!busy} maxLength={8192} placeholder="仅用于你的邮件服务账号" placeholderTextColor={C.muted} style={s.input} />{button('加密保存邮件凭据', () => { void saveMailKey(); }, busy || !resendKey.trim(), true)}</>}
        {button('重新读取配置与邮件记录', () => { void readMailSetup(); }, busy, true)}
        {mailRecords.length > 0 && <><Text style={s.label}>本工作区的邮件记录</Text>{mailRecords.map(receipt => <TouchableOpacity key={receipt.id} accessibilityRole="button" accessibilityState={{ selected: mailReceipt?.id === receipt.id, disabled: busy || !!preparation.current }} disabled={busy || !!preparation.current} onPress={() => selectSavedMail(receipt, displayedOperation)} style={[s.mailHistory, mailReceipt?.id === receipt.id && s.selected]}><Text style={s.body}>{receipt.envelope.subject}</Text><Text style={s.small}>{receipt.envelope.to}</Text><Text style={s.small}>{mailStatusText(receipt)}</Text></TouchableOpacity>)}</>}
        {!mailReceipt && <>
          <Text style={s.label}>发件邮箱</Text><TextInput accessibilityLabel="邮件发件地址" value={mailFields.from} onChangeText={value => changeMailField('from', value)} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!busy && !mailLocked} maxLength={254} placeholder="you@your-verified-domain.com" placeholderTextColor={C.muted} style={s.input} />
          <Text style={s.label}>真实收件邮箱</Text><TextInput accessibilityLabel="邮件收件地址" value={mailFields.to} onChangeText={value => changeMailField('to', value)} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!busy && !mailLocked} maxLength={254} placeholder="recipient@company.com" placeholderTextColor={C.muted} style={s.input} />
          <Text style={s.label}>邮件主题 · 可以修改</Text><TextInput accessibilityLabel="邮件主题" value={mailFields.subject} onChangeText={value => changeMailField('subject', value)} editable={!busy && !mailLocked} maxLength={500} placeholder="填写完整主题" placeholderTextColor={C.muted} style={s.input} />
          <Text style={s.label}>邮件正文 · 可以修改</Text><TextInput accessibilityLabel="邮件正文" value={mailFields.text} onChangeText={value => changeMailField('text', value)} editable={!busy && !mailLocked} multiline maxLength={60000} placeholder="检查事实、称呼与承诺，再准备预览。" placeholderTextColor={C.muted} style={[s.input, s.mailBody]} />
          {!mailSourceVerified && <Text style={s.footnote}>源草稿尚未通过核对，请先查看任务结果。已有邮件记录仍可读取。</Text>}
          {preparation.current ? <>{button('查找原邮件预览', () => { void readMailSetup(); }, busy, true)}{mailRetryPreparation && button('按原编号与内容重新准备预览', () => { void prepareMail(true); }, busy)}<Text style={s.footnote}>原准备请求的结果尚未确定，文字暂时锁定。这一步没有批准发送。</Text></> : button('准备完整预览 · 这一步不发送', () => { void prepareMail(); }, busy || mailUncertain || !mailListKnown || resendState !== 'saved' || !mailSourceVerified || !singleMailAddress(mailFields.from) || !singleMailAddress(mailFields.to) || !mailFields.subject.trim() || !mailFields.text.trim())}
        </>}
        {mailReceipt && <View style={s.mailPreview}>
          <Text accessibilityLiveRegion="polite" style={s.mailStatus}>{mailUncertain ? '最近操作的结果尚未确认' : mailStatusText(mailReceipt)}</Text>
          <Text style={s.footnote}>下方是原记录保存的完整内容，发送和恢复均以此为准。</Text>
          <Text style={s.label}>发件邮箱</Text>{text(mailReceipt.envelope.from)}<Text style={s.label}>收件邮箱</Text>{text(mailReceipt.envelope.to)}<Text style={s.label}>主题</Text>{text(mailReceipt.envelope.subject)}<Text style={s.label}>完整正文</Text>{text(mailReceipt.envelope.text)}
          <View style={s.mailCosts}><Text style={s.small}>本次草稿模型费用：$0.00 · 已核对</Text><Text style={s.small}>{mailReceipt.providerChargeUsd === null ? '邮箱服务费用：尚未确认' : `邮箱服务费用：$${mailReceipt.providerChargeUsd.toFixed(6)}`}</Text></View>
          <Text style={s.small}>准备时间：{new Date(mailReceipt.createdAt).toLocaleString()}</Text>{mailReceipt.providerMessageId && <Text selectable style={s.footnote}>服务消息编号：{mailReceipt.providerMessageId}</Text>}
          {button('查看保存的状态', () => { void actOnMail(mailReceipt, 'read', displayedOperation); }, busy, true)}
          {mailReceipt.status !== 'awaiting_approval' && mailReceipt.status !== 'cancelled' && button('查询邮件服务结果', () => { void actOnMail(mailReceipt, 'refresh', displayedOperation); }, busy, true)}
          {mailReceipt.status === 'awaiting_approval' && <><Text style={s.footnote}>批准仅限这封邮件。需要修改时，先取消原预览再编辑。</Text>{button(`批准并发送给 ${mailReceipt.envelope.to}`, () => { void actOnMail(mailReceipt, 'approve', displayedOperation); }, busy || mailUncertain || !mailSourceVerified || preview?.artifact.id !== mailReceipt.artifactId || preview?.artifact.version !== mailReceipt.artifactVersion)}{button('取消原预览并继续编辑', () => { void actOnMail(mailReceipt, 'cancel', displayedOperation, true); }, busy || mailUncertain, true)}</>}
          {mailReceipt.status === 'unknown' && <><Text style={s.footnote}>请先查看原记录。只有首次提交后 23 小时内、原批准内容和凭据仍有效时，才能显式恢复原请求；不会生成新的邮件编号。</Text>{canRecoverMail(mailReceipt) && button('按原批准内容恢复提交（邮件服务会在幂等有效期内去重）', () => { void actOnMail(mailReceipt, 'recover', displayedOperation); }, busy || mailUncertain || !mailChecked)}{!canRecoverMail(mailReceipt) && <Text style={s.footnote}>当前不在可恢复提交的有效期内，请核实原邮件结果。</Text>}</>}
          {['cancelled', 'rejected'].includes(mailReceipt.status) && button('返回编辑，再准备新的预览', editCancelledMail, busy || mailUncertain, true)}
          {mailReceipt.status === 'accepted' && <Text style={s.footnote}>邮件服务接收后不能在这里撤回。核实送达需要邮件服务查询权限；客户回复、成交和收入尚未核实。</Text>}
        </View>}
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
  mailSection: { borderTopWidth: 1, borderColor: C.line, marginTop: 28, paddingTop: 8 }, mailHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 }, mailConnection: { paddingVertical: 14, paddingHorizontal: 16, gap: 5, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 12 }, mailBody: { minHeight: 230, textAlignVertical: 'top', lineHeight: 25 }, mailPreview: { marginTop: 24, padding: 18, backgroundColor: C.paper, borderLeftWidth: 3, borderColor: C.green }, mailStatus: { color: C.green, fontSize: 17, fontWeight: '600', lineHeight: 27 }, mailCosts: { borderTopWidth: 1, borderColor: C.line, paddingTop: 14, marginTop: 24, marginBottom: 10, gap: 5 }, mailHistory: { padding: 14, gap: 5, marginBottom: 8, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 10 },
});
