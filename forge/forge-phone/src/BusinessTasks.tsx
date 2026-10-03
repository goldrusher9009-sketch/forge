import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, BackHandler, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  availableDraftReleases, createDraftThread, DraftArtifact, DraftClient, DraftJob, DraftKind, DraftRelease, DraftReport,
  draftLabel, knownCharge, newDraftJob, readDraftRequest, restoreDraftJob, SavedThread, submitDraft, verifyDraft,
  canRecoverMail, freezeMail, listMailReceipts, MailEnvelope, MailPreparation, MailReceipt, mailReceiptAction, mailStatusText,
  newMailPreparation, readMailReceipt, resendConfiguration, saveResendCredential, singleMailAddress,
  MailFollowUp, MailFollowUpForm, mailFollowUpForm, newMailFollowUpInput, readMailFollowUp, saveMailFollowUp,
  TaskFollowUp, TaskFollowUpTarget, newTaskFollowUpInput, readTaskFollowUp, saveTaskFollowUp,
  DraftAssistantPreparation, newDraftAssistantPreparation, prepareDraftAssistant,
} from './business-tasks';
import IncomingMail from './IncomingMail';
import IncomingCalls from './IncomingCalls';
import { APPTOPIA_MARKETPLACE_URL, forgeWebUrlForApi } from './config';
import { clearComposeDraft, ComposeDraft, readComposeDraft, saveComposeDraft } from './compose-draft-store';

type Props = { client: DraftClient; apiUrl: string; userId: string; active: boolean; onBusyChange?: (busy: boolean) => void };
type LocalCompose = { client: DraftClient; apiUrl: string; userId: string; draft: ComposeDraft; ready: boolean; revision: number; stored: number; queued: number; clearing: boolean; timer?: ReturnType<typeof setTimeout> };
const C = { bg: '#f3f0e8', paper: '#fffdf7', ink: '#20251f', muted: '#686f63', line: '#dcded2', green: '#3d6229', accent: '#b5db57', red: '#a33d30' };
type Preview = { artifact: DraftArtifact; value?: Record<string, any>; report: DraftReport | null; verified: boolean };
function friendly(error: unknown): string {
  const code = error instanceof Error ? error.message.split(':')[0] : '';
  const messages: Record<string, string> = {
    NETWORK_UNAVAILABLE: '连接中断了。任务可能已被保存，请先查看服务端结果。',
    REQUEST_READ_UNAVAILABLE: '连接中断了。记录尚未读取完成，请检查网络后重新读取。',
    DRAFT_READ_TIMEOUT: '读取等待超时，请重新查看；不会重新提交任务。',
    REQUEST_READ_TIMEOUT: '记录读取超时了。已保存内容仍保留，请重新读取原记录。',
    DRAFT_HISTORY_UNCONFIRMED: '工作记录尚未确认，请重新查看。',
    DRAFT_FREE_AGENT_UNAVAILABLE: '这位助手暂时没有可用的免费模型，请刷新后重新选择。',
    DRAFT_INPUT_REQUIRED: '请填写对象名称和需要参考的真实资料。',
    DRAFT_ASSISTANT_TEMPLATE_UNAVAILABLE: '当前没有与内置草稿模板匹配的可用免费模型。请稍后刷新，或在工作区准备自己的助手。',
    DRAFT_ASSISTANT_IMPORT_UNCONFIRMED: '助手保存结果尚未确认。继续原准备会使用同一编号，避免重复导入。',
    DRAFT_ASSISTANT_RESULT_UNCONFIRMED: '准备结果尚未完整核对。请继续查看原准备，暂时不能选择这位助手。',
    DRAFT_ASSISTANT_CONFIGURATION_CHANGED: '助手配置或检查规则已经变化。你的修改和原记录会保留，请到工作区检查后再测评。',
    DRAFT_ASSISTANT_EVALUATION_RUNNING: '这位助手仍有测评未完成。请稍后继续查看原准备，暂时不会另开测评。',
    DRAFT_ASSISTANT_EVALUATION_FAILED: '原答题测评没有通过，记录已保留。可明确选择重新免费测评，或先到工作区检查。',
    DRAFT_ASSISTANT_COST_UNCONFIRMED: '这位助手仍有测评费用未确认。请继续查看原记录，暂时不会重新测评或发布版本。',
    AGENT_EVALUATION_RUNNING: '这位助手已有测评正在运行。请继续查看原准备，暂时不能新开测评。',
    AGENT_EVALUATION_COST_UNCONFIRMED: '这位助手的原测评费用仍待核对。请继续查看原准备，暂时不能新开测评。',
    AGENT_EVALUATION_BUDGET_INVALID: '当前服务暂不支持零预算测评。原助手保留，请等待服务更新后继续准备。',
    AGENT_EVALUATION_ZERO_BUDGET_REQUIRES_FREE_MODEL: '这位助手已不符合免费测评要求，请刷新可用模型。',
    AGENT_RELEASE_STALE_EVALUATION: '助手或检查规则在测评后变化了。原记录保留，请到工作区检查后再测评。',
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
    MAIL_FOLLOWUP_CHANGED: '跟进记录已被更新，请先读取最新记录，再决定怎样保存。',
    MAIL_FOLLOWUP_UNCONFIRMED: '跟进保存结果尚未确认，请先读取保存的记录。',
    MAIL_FOLLOWUP_INPUT_INVALID: '请检查跟进内容的格式与长度。',
    MAIL_FOLLOWUP_DATE_INVALID: '请填写真实的 YYYY-MM-DD 日期，并说明下一步。',
    MAIL_FOLLOWUP_AMOUNT_INVALID: '金额请填写非负数字，最多两位小数；留空表示未记录。',
    MAIL_FOLLOWUP_INVALID: '跟进内容未通过检查，请核对日期、金额和文字长度。',
    TASK_FOLLOWUP_CHANGED: '跟进记录已被更新，请先读取最新记录，再决定怎样保存。',
    TASK_FOLLOWUP_SOURCE_CHANGED: '原草稿发生了变化，请先查看任务结果重新核对，再读取跟进记录。',
    TASK_FOLLOWUP_SOURCE_UNVERIFIED: '原草稿的交付或费用尚未通过核对，请先查看任务结果。',
    TASK_FOLLOWUP_NOT_FOUND: '没有找到当前账号可使用的任务跟进记录。',
    TASK_FOLLOWUP_UNCONFIRMED: '跟进保存结果尚未确认，请先读取保存的记录。',
    TASK_FOLLOWUP_INVALID: '跟进内容未通过检查，请核对日期、金额和文字长度。',
  };
  return messages[code] || '本次操作没有完成。请查看任务结果或稍后重试。';
}


type FollowUpTarget = ({ kind: 'task' } & TaskFollowUpTarget) | { kind: 'mail'; receipt: MailReceipt };
type FollowUpRecord = TaskFollowUp | MailFollowUp;
type FollowUpOperation = { id: number; client: DraftClient; ensure(): void; finish(): void };
type FollowUpSnapshot = {
  identity: string; sourceId: string; open: boolean; record: FollowUpRecord | null; fields: MailFollowUpForm;
  readRequired: boolean; keepInput: boolean; notice: string; error: string;
};
type FollowUpProps = {
  target: FollowUpTarget; busy: boolean; operationId: number; sourceVerified?: boolean;
  snapshot: React.MutableRefObject<FollowUpSnapshot | null>;
  begin(purpose: 'mail' | 'other'): FollowUpOperation | null;
  isCurrent(target: FollowUpTarget, operationId: number): boolean;
};
function FollowUpCard({ target, busy, operationId, sourceVerified = true, snapshot, begin, isCurrent }: FollowUpProps) {
  const identity = target.kind === 'mail' ? target.receipt.id : target.job.threadId;
  const sourceId = target.kind === 'mail' ? target.receipt.id
    : [target.job.threadId, target.artifact.id, target.artifact.version, target.runId, target.job.requestId, target.job.release.releaseId, target.artifactSha256].join(':');
  const initial = snapshot.current?.identity === identity ? snapshot.current : null;
  const [followUpOpen, setFollowUpOpen] = useState(initial?.open || false);
  const [followUpRecord, setFollowUpRecord] = useState<FollowUpRecord | null>(initial?.record || null);
  const [followUpFields, setFollowUpFields] = useState<MailFollowUpForm>(() => initial?.fields || mailFollowUpForm());
  const [followUpReadRequired, setFollowUpReadRequired] = useState(!initial || initial.readRequired || initial.sourceId !== sourceId);
  const [followUpNotice, setFollowUpNotice] = useState(initial?.notice || '');
  const [followUpError, setFollowUpError] = useState(initial?.error || '');
  const [pending, setPending] = useState(false);
  const followUpSaved = useRef<FollowUpRecord | null>(null);
  const followUpDraft = useRef<MailFollowUpForm>(followUpFields);
  const keepFollowUpInput = useRef(initial?.keepInput || initial?.sourceId !== sourceId && !!initial);
  const mounted = useRef(true);
  followUpSaved.current = followUpRecord; followUpDraft.current = followUpFields;
  snapshot.current = { identity, sourceId, open: followUpOpen, record: followUpRecord, fields: followUpFields,
    readRequired: followUpReadRequired, keepInput: keepFollowUpInput.current, notice: followUpNotice, error: followUpError };
  const previousSourceId = useRef(initial?.sourceId || sourceId);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (followUpSaved.current && previousSourceId.current !== sourceId) {
      keepFollowUpInput.current = true; setFollowUpReadRequired(true);
      setFollowUpNotice('原草稿已变化，已保留你的输入。请重新核对任务，再读取跟进记录。');
    }
    previousSourceId.current = sourceId;
  }, [sourceId]);
  const current = (expectedOperation: number, saved?: FollowUpRecord) => mounted.current && isCurrent(target, expectedOperation)
    && (!saved || followUpSaved.current === saved);
  const readFollowUp = async () => {
    if (!current(operationId) || busy || !sourceVerified) return;
    const op = begin(target.kind === 'mail' ? 'mail' : 'other'); if (!op) return;
    setPending(true);
    setFollowUpOpen(true); setFollowUpError(''); setFollowUpNotice('');
    try {
      const saved = target.kind === 'mail' ? await readMailFollowUp(op.client, target.receipt) : await readTaskFollowUp(op.client, target);
      op.ensure(); if (!current(op.id)) return;
      followUpSaved.current = saved; setFollowUpRecord(saved); setFollowUpReadRequired(false);
      if (!keepFollowUpInput.current) { followUpDraft.current = mailFollowUpForm(saved); setFollowUpFields(followUpDraft.current); }
      setFollowUpNotice(keepFollowUpInput.current ? '已读取最新记录，保留了你的输入。请对照下方已保存摘要，确认后再保存。' : '已读取跟进记录。结果由本人填写。');
    } catch (e) {
      if (current(op.id)) { setFollowUpReadRequired(true); setFollowUpError(friendly(e)); }
    } finally { if (mounted.current) setPending(false); op.finish(); }
  };
  const toggleFollowUp = () => {
    if (!current(operationId) || busy || !sourceVerified) return;
    if (followUpOpen) { setFollowUpOpen(false); return; }
    setFollowUpOpen(true);
    if (!followUpSaved.current || followUpReadRequired) void readFollowUp();
  };
  const changeFollowUpField = <K extends keyof MailFollowUpForm,>(saved: FollowUpRecord, field: K, value: MailFollowUpForm[K]) => {
    if (!current(operationId, saved) || busy || followUpReadRequired || !sourceVerified) return;
    const next = { ...followUpDraft.current, [field]: value }; followUpDraft.current = next; setFollowUpFields(next);
    keepFollowUpInput.current = true; setFollowUpNotice(''); setFollowUpError('');
  };
  const saveFollowUp = async (saved: FollowUpRecord) => {
    if (!current(operationId, saved) || busy || followUpReadRequired || !sourceVerified) return;
    const op = begin(target.kind === 'mail' ? 'mail' : 'other'); if (!op) return;
    setPending(true);
    setFollowUpError(''); setFollowUpNotice('');
    let requested = false;
    try {
      let updated: FollowUpRecord;
      if (target.kind === 'mail' && 'mailDeliveryId' in saved) {
        const input = newMailFollowUpInput(saved, followUpDraft.current); requested = true;
        updated = await saveMailFollowUp(op.client, target.receipt, saved, input);
      } else if (target.kind === 'task' && 'sourceHash' in saved) {
        const input = newTaskFollowUpInput(saved, followUpDraft.current); requested = true;
        updated = await saveTaskFollowUp(op.client, target, saved, input);
      } else throw new Error('TASK_FOLLOWUP_UNCONFIRMED');
      op.ensure(); if (!current(op.id, saved)) return;
      followUpSaved.current = updated; setFollowUpRecord(updated); followUpDraft.current = mailFollowUpForm(updated); setFollowUpFields(followUpDraft.current);
      keepFollowUpInput.current = false; setFollowUpReadRequired(false); setFollowUpNotice('本人填写的跟进记录已保存。');
    } catch (e) {
      if (current(op.id, saved)) {
        setFollowUpError(friendly(e));
        if (requested || e instanceof Error && ['MAIL_FOLLOWUP_CHANGED', 'TASK_FOLLOWUP_CHANGED', 'TASK_FOLLOWUP_SOURCE_CHANGED'].includes(e.message.split(':')[0])) {
          keepFollowUpInput.current = true; setFollowUpReadRequired(true);
          setFollowUpNotice('已保留你的输入。请先读取最新跟进记录，再继续编辑或保存。');
        }
      }
    } finally { if (mounted.current) setPending(false); op.finish(); }
  };
  const followUpEditable = !!followUpRecord && !busy && !followUpReadRequired && sourceVerified;
  const button = (label: string, action: () => void, disabled = false, secondary = false) => <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={action} style={[s.button, secondary && s.secondary, disabled && s.disabled]}><Text style={[s.buttonText, secondary && { color: C.ink }]}>{label}</Text></TouchableOpacity>;
  const followUpFeedback = <>
    {pending && <ActivityIndicator accessibilityLabel="正在读取或保存跟进记录" color={C.green} style={{ marginTop: 16 }} />}
    {followUpError ? <View accessibilityLiveRegion="polite" style={[s.message, s.error]}><Text style={[s.small, { color: C.red }]}>{followUpError}</Text></View> : null}
    {followUpNotice ? <View accessibilityLiveRegion="polite" style={s.message}><Text style={s.small}>{followUpNotice}</Text></View> : null}
  </>;
  const followUpResults: Array<{ value: MailFollowUp['result']; label: string }> = [{ value: null, label: '未记录' }, { value: 'pending', label: '待跟进' }, { value: 'replied', label: '已回复' }, { value: 'won', label: '已成交' }, { value: 'lost', label: '未成交' }];
  return <View style={s.followUpCard}>
            <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: followUpOpen, disabled: busy || !sourceVerified }} disabled={busy || !sourceVerified} onPress={() => toggleFollowUp()} style={s.followUpToggle}>
              <View style={{ flex: 1 }}><Text style={s.followUpTitle}>{target.kind === 'task' ? '客户跟进 · 本人记录' : '邮件跟进 · 本人记录'}</Text><Text style={s.small}>{!!followUpRecord ? `${followUpResults.find(item => item.value === followUpRecord.result)?.label || '未记录'}${followUpRecord.followUpOn ? ` · ${followUpRecord.followUpOn}` : ''}` : target.kind === 'task' ? '下一步、结果和证据，留在这项任务下。' : '下一步、结果和证据，留在这封邮件下。'}</Text></View>
              <Text style={s.followUpLink}>{followUpOpen ? '收起 −' : '展开 +'}</Text>
            </TouchableOpacity>
            {followUpOpen && <>
              {!sourceVerified && <Text style={s.footnote}>请先查看任务结果，重新核对原草稿。你的跟进输入仍保留在这里。</Text>}
              <Text style={s.footnote}>{target.kind === 'task' ? '复制草稿到微信或线下沟通后，也可在这里记录进展。无需连接邮箱。' : '仅保存本人填写的记录。'}客户结果与金额尚未独立核实。</Text>
              {followUpFeedback}
              {button(followUpReadRequired ? '先读取最新跟进记录' : '重新读取跟进记录', () => { void readFollowUp(); }, busy || !sourceVerified, true)}
              {!!followUpRecord && <>
                <View style={s.followUpSummary}><Text style={s.small}>{followUpRecord.version === 0 ? '尚未记录' : '已保存'} · {followUpResults.find(item => item.value === followUpRecord.result)?.label || '未记录'}</Text><Text style={s.small}>下一步：{followUpRecord.nextStep || '未记录'}{followUpRecord.followUpOn ? ` · ${followUpRecord.followUpOn}` : ''}</Text><Text style={s.small}>证据引用：{followUpRecord.evidenceReference || '未记录'}</Text><Text style={s.small}>本人填写金额：{followUpRecord.reportedRevenueMinor === null ? '未记录' : `${followUpRecord.reportedRevenueCurrency} ${mailFollowUpForm(followUpRecord).reportedRevenue}`}</Text></View>
                <Text style={s.label}>下一步</Text><TextInput accessibilityLabel="客户跟进下一步" value={followUpFields.nextStep} onChangeText={value => changeFollowUpField(followUpRecord, 'nextStep', value)} editable={followUpEditable} maxLength={1000} placeholder="例如：确认客户方便沟通的时间" placeholderTextColor={C.muted} style={s.input} />
                <Text style={s.label}>跟进日期（可选）</Text><TextInput accessibilityLabel="客户跟进日期" value={followUpFields.followUpOn} onChangeText={value => changeFollowUpField(followUpRecord, 'followUpOn', value)} editable={followUpEditable} maxLength={10} autoCapitalize="none" autoCorrect={false} placeholder="YYYY-MM-DD" placeholderTextColor={C.muted} style={s.input} />
                <Text style={s.label}>本人标记的结果</Text><View style={s.followUpChoices}>{followUpResults.map(item => <TouchableOpacity key={item.value || 'unrecorded'} accessibilityRole="button" accessibilityState={{ selected: followUpFields.result === item.value, disabled: !followUpEditable }} disabled={!followUpEditable} onPress={() => changeFollowUpField(followUpRecord, 'result', item.value)} style={[s.followUpChoice, followUpFields.result === item.value && s.selected, !followUpEditable && s.disabled]}><Text style={s.small}>{item.label}</Text></TouchableOpacity>)}</View>
                <Text style={s.label}>说明（可选）</Text><TextInput accessibilityLabel="客户跟进说明" value={followUpFields.notes} onChangeText={value => changeFollowUpField(followUpRecord, 'notes', value)} editable={followUpEditable} multiline maxLength={8000} placeholder="写下本人确认的情况与仍待核实的内容" placeholderTextColor={C.muted} style={[s.input, s.followUpNotes]} />
                <Text style={s.label}>证据引用（可选）</Text><TextInput accessibilityLabel="客户跟进证据引用" value={followUpFields.evidenceReference} onChangeText={value => changeFollowUpField(followUpRecord, 'evidenceReference', value)} editable={followUpEditable} multiline maxLength={2000} autoCapitalize="none" autoCorrect={false} placeholder="例如：合同编号、客户回复日期或记录链接" placeholderTextColor={C.muted} style={s.input} />
                <Text style={s.label}>本人填写金额（可选）</Text><TextInput accessibilityLabel="本人填写客户金额" value={followUpFields.reportedRevenue} onChangeText={value => changeFollowUpField(followUpRecord, 'reportedRevenue', value)} editable={followUpEditable} keyboardType="decimal-pad" placeholder="留空表示未记录，例如 1200.00" placeholderTextColor={C.muted} style={s.input} /><View style={s.followUpChoices}>{(['CNY', 'USD'] as const).map(currency => <TouchableOpacity key={currency} accessibilityRole="button" accessibilityState={{ selected: followUpFields.reportedRevenueCurrency === currency, disabled: !followUpEditable }} disabled={!followUpEditable} onPress={() => changeFollowUpField(followUpRecord, 'reportedRevenueCurrency', currency)} style={[s.followUpChoice, followUpFields.reportedRevenueCurrency === currency && s.selected, !followUpEditable && s.disabled]}><Text style={s.small}>{currency === 'CNY' ? 'CNY · 人民币' : 'USD · 美元'}</Text></TouchableOpacity>)}</View>
                <Text style={s.footnote}>留空会保存为“未记录”；填写 0 会保留为 0。金额由本人填写。</Text>
                {followUpFeedback}
                {button('保存客户跟进记录', () => { void saveFollowUp(followUpRecord); }, !followUpEditable)}
              </>}
            </>}
          </View>;
}

export default function BusinessTasks({ client, apiUrl, userId, active, onBusyChange }: Props) {
  const [kind, setKind] = useState<DraftKind>('reply');
  const [name, setName] = useState('');
  const [source, setSource] = useState('');
  const [releases, setReleases] = useState<DraftRelease[]>([]);
  const [chosen, setChosen] = useState('');
  const [composeReady, setComposeReady] = useState(false);
  const [composeClearing, setComposeClearing] = useState(false);
  const [composeMessage, setComposeMessage] = useState('正在读取本机草稿…');
  const [composeError, setComposeError] = useState(false);
  const localCompose = useRef<LocalCompose | null>(null);
  const composeOwner = useRef({ client, apiUrl, userId });
  composeOwner.current = { client, apiUrl, userId };
  const [assistantsKnown, setAssistantsKnown] = useState(false);
  const [assistantPreparation, setAssistantPreparation] = useState<DraftAssistantPreparation | null>(null);
  const [assistantPhase, setAssistantPhase] = useState('');
  const [assistantHandoffOpen, setAssistantHandoffOpen] = useState(false);
  const [assistantHandoffNotice, setAssistantHandoffNotice] = useState('');
  const [assistantHandoffError, setAssistantHandoffError] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyKind, setBusyKind] = useState<'draft' | 'mail' | 'assistant' | 'other'>('other');
  const [phase, setPhase] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [view, setView] = useState<'compose' | 'result' | 'history' | 'incoming' | 'incoming-calls'>('compose');
  const resultParent = useRef<'compose' | 'history' | 'incoming' | 'incoming-calls'>('compose');
  const scroll = useRef<ScrollView>(null);
  const [incomingBusy, setIncomingBusy] = useState(false);
  const [history, setHistory] = useState<SavedThread[]>([]);
  const [historyKnown, setHistoryKnown] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(30);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyQuery, setHistoryQuery] = useState('');
  const [files, setFiles] = useState<DraftArtifact[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const previewRef = useRef<Preview | null>(null); previewRef.current = preview;
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
  const savedThread = useRef('');
  const assistantRef = useRef<DraftAssistantPreparation | null>(null);
  const clientRef = useRef(client);
  const assistantUi = useRef({ active, view, apiUrl, open: assistantHandoffOpen, incomingBusy });
  const assistantLinkRequest = useRef(0);
  const assistantLinkOpening = useRef(false);
  const busyCallback = useRef(onBusyChange);
  const mailThread = useRef('');
  const preparation = useRef<MailPreparation | null>(null);
  const preparationConflict = useRef(false);
  const selectedMail = useRef<MailReceipt | null>(null);
  const taskFollowUpSnapshot = useRef<FollowUpSnapshot | null>(null);
  const mailFollowUpSnapshot = useRef<FollowUpSnapshot | null>(null);
  clientRef.current = client; busyCallback.current = onBusyChange;
  assistantUi.current = { active, view, apiUrl, open: assistantHandoffOpen, incomingBusy };
  selectedMail.current = mailReceipt;

  const localCurrent = (entry: LocalCompose | null): entry is LocalCompose => !!entry && mounted.current && localCompose.current === entry
    && entry.client === client && composeOwner.current.client === client && entry.apiUrl === apiUrl && composeOwner.current.apiUrl === apiUrl
    && entry.userId === userId && composeOwner.current.userId === userId;
  const flushCompose = (entry: LocalCompose) => {
    clearTimeout(entry.timer); entry.timer = undefined;
    if (!entry.ready || entry.clearing || entry.revision <= entry.stored || entry.queued === entry.revision) return;
    const revision = entry.revision; entry.queued = revision;
    // Capture the old account and snapshot before logout can mount another account.
    void saveComposeDraft(entry.apiUrl, entry.userId, { ...entry.draft }).then(() => {
      entry.stored = Math.max(entry.stored, revision);
      if (localCurrent(entry) && entry.revision === revision && !entry.clearing) { setComposeMessage('已保存到本机。'); setComposeError(false); }
    }).catch(() => {
      if (entry.queued === revision) entry.queued = -1;
      if (localCurrent(entry) && entry.revision === revision && !entry.clearing) { setComposeMessage('本机保存未完成，当前输入仍在。请重试保存。'); setComposeError(true); }
    });
  };
  const changeCompose = (patch: Partial<ComposeDraft>, internal = false) => {
    const entry = localCompose.current;
    if (!localCurrent(entry) || !entry.ready || entry.clearing || !internal && (!assistantUi.current.active || assistantUi.current.view !== 'compose' || busyRef.current)) return;
    const next = { ...entry.draft, ...patch };
    if (JSON.stringify(next) === JSON.stringify(entry.draft)) return;
    entry.draft = next; entry.revision += 1;
    setKind(next.kind); setName(next.name); setSource(next.source); setChosen(next.releaseId);
    setComposeMessage('正在保存到本机…'); setComposeError(false);
    clearTimeout(entry.timer); entry.timer = setTimeout(() => flushCompose(entry), 500);
  };
  const clearLocalCompose = async () => {
    const entry = localCompose.current;
    if (!localCurrent(entry) || !entry.ready || entry.clearing || !assistantHandoffCurrent()) return;
    clearTimeout(entry.timer); entry.timer = undefined; entry.clearing = true; entry.revision += 1;
    setComposeClearing(true); setComposeMessage('正在清除本机草稿…'); setComposeError(false);
    try {
      await clearComposeDraft(entry.apiUrl, entry.userId);
      entry.draft = { kind: 'reply', name: '', source: '', releaseId: '' }; entry.stored = entry.revision; entry.queued = entry.revision;
      if (localCurrent(entry)) { setKind('reply'); setName(''); setSource(''); setChosen(''); setComposeMessage('本机草稿已清除。'); }
    } catch {
      entry.stored = entry.revision; entry.queued = entry.revision;
      if (localCurrent(entry)) { setComposeMessage('本机草稿未能清除，当前输入仍保留。'); setComposeError(true); }
    } finally { entry.clearing = false; if (localCurrent(entry)) setComposeClearing(false); }
  };

  const begin = (purpose: 'draft' | 'mail' | 'assistant' | 'other' = 'other') => {
    // A callback from an earlier account must never borrow the new client's credentials.
    if (!mounted.current || busyRef.current || clientRef.current !== client) return null;
    const id = ++operation.current;
    const accountClient = clientRef.current;
    const abort = new AbortController(); controller.current = abort;
    busyRef.current = true; setBusy(true); setBusyKind(purpose); setError('');
    let timedOut = false;
    const timer = purpose === 'mail' || purpose === 'other' ? setTimeout(() => { timedOut = true; abort.abort(); }, 20000) : undefined;
    const ensure = () => {
      if (!mounted.current || operation.current !== id || clientRef.current !== accountClient) throw new Error('DRAFT_STOPPED');
      if (timedOut) throw new Error(purpose === 'mail' ? 'MAIL_REQUEST_UNCONFIRMED' : 'DRAFT_READ_TIMEOUT');
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
    // Preserve only the current task/mail editor while reopening that same task.
    if (!threadId || taskFollowUpSnapshot.current?.identity !== threadId) taskFollowUpSnapshot.current = null;
    if (!threadId || mailThread.current !== threadId) mailFollowUpSnapshot.current = null;
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
    setRetryAllowed(!state && !['resend-received', 'twilio-inbound'].includes(job.origin || ''));
    setCanStop(state?.status === 'running' && job.origin !== 'twilio-inbound');
    if (!state) { setPhase('等待确认'); setNotice(job.origin === 'twilio-inbound' ? '来电草稿请求尚未确认。请返回云号码记录核对；这里不会停止或重新起草。' : job.origin === 'resend-received' ? '来信草稿请求尚未确认。请返回收件草稿查看原处理记录，需要检查时从原记录明确重试。' : '服务端尚未找到这项请求。可以用同一个任务编号重新提交，内容保持不变。'); return; }
    if (state.status === 'running') { setPhase('草稿仍在准备'); setNotice(job.origin === 'twilio-inbound' ? '原后台工作仍在处理。请返回云号码记录核对；这里只读取现有记录。' : '任务已被服务端接收。请稍后查看结果，或明确停止。'); return; }
    setRetryAllowed(false);
    if (state.status !== 'completed' || state.result?.success !== true) {
      await loadFiles(api, job.threadId); setPhase(state.status === 'cancelled' ? '任务已停止' : '任务需要检查');
      setNotice('本次运行没有完整交付。已保存的文件可以查看，发送与发布仍需你处理。'); return;
    }
    const result = await verifyDraft(api, job);
    setFiles([result.artifact]); setPreview({ ...result, verified: true }); setCharge(knownCharge(result.report));
    setPhase('草稿已保存'); setNotice(job.origin === 'twilio-inbound' ? '文件与模型费用已核对。来电身份、电话费用与转录事实仍需本人核实；草稿仅供后续跟进参考。' : '文件与模型费用已核对。请检查事实、措辞和收件对象，再自行发送或发布。');
  };
  const assistantHandoffCurrent = () => mounted.current && clientRef.current === client
    && assistantUi.current.active && assistantUi.current.view === 'compose' && assistantUi.current.apiUrl === apiUrl
    && localCurrent(localCompose.current) && localCompose.current.ready && !localCompose.current.clearing
    && !busyRef.current && !assistantUi.current.incomingBusy;
  const toggleAssistantHandoff = () => {
    if (!assistantHandoffCurrent()) return;
    assistantLinkRequest.current += 1; assistantLinkOpening.current = false;
    setAssistantHandoffError(''); setAssistantHandoffOpen(previous => !previous);
  };
  const openAssistantWebsite = async (target: 'marketplace' | 'forge') => {
    if (!assistantHandoffCurrent() || !assistantUi.current.open || assistantLinkOpening.current) return;
    const url = target === 'marketplace' ? APPTOPIA_MARKETPLACE_URL : forgeWebUrlForApi(apiUrl);
    if (!url) return;
    const accountClient = client;
    const id = ++assistantLinkRequest.current;
    assistantLinkOpening.current = true; setAssistantHandoffError('');
    try { await Linking.openURL(url); }
    catch {
      if (assistantLinkRequest.current === id && clientRef.current === accountClient && assistantHandoffCurrent() && assistantUi.current.open) {
        setAssistantHandoffError(target === 'marketplace' ? '暂时无法打开助手市场，请检查手机是否有可用浏览器后重试。当前草稿已保留。' : '暂时无法打开对应 Forge 网页，请检查手机是否有可用浏览器后重试。当前草稿已保留。');
      }
    } finally { if (assistantLinkRequest.current === id) assistantLinkOpening.current = false; }
  };
  const refreshAssistants = async (explicit = false, restored = false) => {
    if (!localCurrent(localCompose.current) || !localCompose.current.ready || localCompose.current.clearing) return;
    if (explicit && !assistantHandoffCurrent()) return;
    const op = begin(); if (!op) return;
    if (explicit) { setAssistantHandoffNotice(''); setAssistantHandoffError(''); }
    try {
      const list = await availableDraftReleases(op.client); op.ensure(); setReleases(list); setAssistantsKnown(true);
      const entry = localCompose.current;
      if (!localCurrent(entry)) return;
      const previous = entry.draft.releaseId;
      const next = list.some(item => item.releaseId === previous) ? previous : explicit || restored ? '' : list[0]?.releaseId || '';
      if (explicit || restored) changeCompose({ releaseId: next }, true);
      else { entry.draft.releaseId = next; setChosen(next); }
      if (restored && previous && !next) setComposeMessage('已恢复草稿文字，原助手暂不可用，请重新选择。');
      if (explicit) setAssistantHandoffNotice(list.length ? '可用助手已刷新，当前草稿已保留。请确认选择后继续。' : '已刷新，暂未找到可用于零价模型草稿任务的私人版本。当前草稿已保留，请在对应网页版检查模型、工具和发布状态。');
    }
    catch (e) {
      if (!cancelled(e) && mounted.current && operation.current === op.id) {
        const code = e instanceof Error ? e.message.split(':')[0] : '';
        const message = ['DRAFT_READ_TIMEOUT', 'REQUEST_READ_TIMEOUT', 'REQUEST_READ_UNAVAILABLE'].includes(code)
          ? friendly(e) : '助手列表读取未完成，原列表、选择和草稿仍保留。请稍后刷新。';
        setError(message); if (explicit) setAssistantHandoffError(message);
      }
    }
    finally { op.finish(); }
  };
  useEffect(() => {
    mounted.current = true;
    const entry: LocalCompose = { client, apiUrl, userId, draft: { kind: 'reply', name: '', source: '', releaseId: '' }, ready: false, revision: 0, stored: 0, queued: -1, clearing: false };
    localCompose.current = entry; setComposeReady(false); setComposeClearing(false); setComposeError(false); setComposeMessage('正在读取本机草稿…');
    resetMail(); setResendState('unread'); jobRef.current = null; savedThread.current = '';
    setKind('reply'); setName(''); setSource(''); setChosen(''); setReleases([]); setAssistantsKnown(false); assistantRef.current = null; setAssistantPreparation(null); setAssistantPhase(''); setHistory([]); setHistoryKnown(false); setFiles([]); setPreview(null); setCharge(null);
    assistantLinkRequest.current += 1; assistantLinkOpening.current = false;
    setAssistantHandoffOpen(false); setAssistantHandoffNotice(''); setAssistantHandoffError('');
    setHistoryLimit(30); setHistoryHasMore(false); setHistoryQuery('');
    resultParent.current = 'compose'; setView('compose'); setNotice(''); setError(''); setPhase(''); setRetryAllowed(false); setCanStop(false); setRaw(false);
    busyRef.current = false; setBusy(false); setIncomingBusy(false);
    const accountBusyCallback = busyCallback.current;
    void (async () => {
      let restored = false;
      try {
        const saved = await readComposeDraft(apiUrl, userId);
        if (!localCurrent(entry)) return;
        if (saved) { entry.draft = saved; restored = true; setKind(saved.kind); setName(saved.name); setSource(saved.source); setChosen(saved.releaseId); }
        setComposeMessage(saved ? '已恢复此账号在本机保存的草稿。' : '输入会自动保存到本机，供此账号下次继续。');
      } catch {
        if (!localCurrent(entry)) return;
        setComposeMessage('本机草稿暂未恢复，当前输入仍可使用。重新打开后可重试恢复。'); setComposeError(true);
      }
      if (!localCurrent(entry)) return;
      entry.ready = true; setComposeReady(true); void refreshAssistants(false, restored);
    })();
    const background = AppState.addEventListener('change', state => { if (state !== 'active') flushCompose(entry); });
    return () => {
      mounted.current = false; operation.current += 1; controller.current?.abort(); busyRef.current = false;
      background.remove(); flushCompose(entry);
      preparation.current = null; preparationConflict.current = false; selectedMail.current = null; mailThread.current = '';
      accountBusyCallback?.(false);
    };
  }, [client, apiUrl, userId]);
  useEffect(() => {
    if (!active || view !== 'compose') { assistantLinkRequest.current += 1; assistantLinkOpening.current = false; }
  }, [active, view]);
  useEffect(() => { onBusyChange?.(busy || incomingBusy); }, [busy, incomingBusy, onBusyChange]);
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [view]);
  useEffect(() => {
    if (!active || Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!mounted.current || clientRef.current !== client) return false;
      if (busyRef.current || incomingBusy) return true;
      if (view === 'compose') return false;
      setView(view === 'result' ? resultParent.current : 'compose');
      setNotice(''); setError('');
      return true;
    });
    return () => subscription.remove();
  }, [active, client, view, incomingBusy]);

  const prepareAssistant = async (retryEvaluation = false) => {
    if (!assistantHandoffCurrent() || incomingBusy || retryEvaluation && !assistantRef.current?.retryAllowed) return;
    const op = begin('assistant'); if (!op) return;
    setNotice(''); setAssistantPhase('正在查看可用免费模型');
    try {
      const preparation = { ...(assistantRef.current || await newDraftAssistantPreparation(op.client)), retryAllowed: false }; op.ensure();
      assistantRef.current = preparation; setAssistantPreparation(preparation);
      const result = await prepareDraftAssistant(op.client, preparation, (saved, phase) => {
        op.ensure(); assistantRef.current = saved; setAssistantPreparation(saved); setAssistantPhase(phase);
      }, retryEvaluation);
      op.ensure(); setReleases(result.releases); changeCompose({ releaseId: result.release.releaseId }, true); setAssistantsKnown(true);
      setNotice('你的助手版本已准备好，答题测评费用已核对为 $0。接下来填写真实资料生成草稿；实际文件与费用会另行核对。');
    } catch (e) {
      if (!cancelled(e) && mounted.current && operation.current === op.id) {
        setError(friendly(e)); setAssistantPhase('准备尚未完成 · 原记录会保留');
      }
    } finally { op.finish(); }
  };

  const start = async () => {
    if (!assistantHandoffCurrent()) return;
    const release = releases.find(item => item.releaseId === chosen);
    if (!release) return;
    const op = begin('draft'); if (!op) return;
    savedThread.current = '';
    resultParent.current = 'compose';
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
    if (retry && ['resend-received', 'twilio-inbound'].includes(job.origin || '')) return;
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
    if (!mounted.current || operation.current !== expectedOperation || clientRef.current !== client || jobRef.current?.origin === 'twilio-inbound') return;
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
  const showHistory = async (limit = historyLimit) => {
    if (!Number.isSafeInteger(limit) || limit < 30 || limit % 30 !== 0) return;
    const op = begin(); if (!op) return;
    setView('history'); setHistoryKnown(false); setNotice('');
    try {
      const reply = await op.client.request<{ success: boolean; data: SavedThread[] }>(`/api/threads?limit=${limit}&published_only=true`); op.ensure();
      if (reply.success !== true || !Array.isArray(reply.data) || reply.data.some(thread => !thread || typeof thread.id !== 'string' || !thread.id
        || typeof thread.title !== 'string' || typeof thread.model !== 'string' || !thread.model
        || thread.created_at !== undefined && typeof thread.created_at !== 'string'
        || !thread.publishedAgent || typeof thread.publishedAgent.agentId !== 'string' || !thread.publishedAgent.agentId
        || typeof thread.publishedAgent.releaseId !== 'string' || !thread.publishedAgent.releaseId || typeof thread.publishedAgent.name !== 'string'
        || !Number.isSafeInteger(thread.publishedAgent.version) || thread.publishedAgent.version < 1)) throw new Error('DRAFT_HISTORY_UNCONFIRMED');
      const seen = new Set<string>();
      setHistory(reply.data.filter(thread => { if (seen.has(thread.id)) return false; seen.add(thread.id); return true; }));
      setHistoryHasMore(reply.data.length >= limit); setHistoryLimit(limit); setHistoryKnown(true);
    }
    catch (e) { if (!cancelled(e) && mounted.current && operation.current === op.id) setError(friendly(e)); }
    finally { op.finish(); }
  };
  const openSaved = async (saved: SavedThread | string) => {
    const op = begin('other'); if (!op) return;
    const threadId = typeof saved === 'string' ? saved : saved.id;
    savedThread.current = threadId;
    jobRef.current = null;
    if (view !== 'result') resultParent.current = view;
    setView('result'); setPreview(null); setFiles([]); setCharge(null); setRetryAllowed(false); setCanStop(false); setRaw(false); setNotice(''); setPhase('正在读取已保存的工作');
    resetMail(threadId);
    try {
      const thread = typeof saved === 'string' ? (await op.client.request<{ data: SavedThread }>(`/api/threads/${encodeURIComponent(threadId)}`)).data : saved;
      if (thread?.id !== threadId) throw new Error('DRAFT_THREAD_INVALID');
      const job = await restoreDraftJob(op.client, thread); op.ensure(); jobRef.current = job;
      if (job) { await inspect(op.client, job); op.ensure(); }
      else { await loadFiles(op.client, thread.id); op.ensure(); setPhase('已保存的工作'); setNotice('这是已有工作区文件，可阅读和复制。没有完整的本次草稿核对记录时，不会标记为已交付。'); }
    } catch (e) { if (!cancelled(e) && mounted.current && operation.current === op.id) { setError(friendly(e)); setPhase('读取尚未完成'); try { await loadFiles(op.client, threadId); } catch {} } }
    finally {
      try { op.ensure(); if (jobRef.current?.origin !== 'twilio-inbound') await loadMailRecords(op.client, threadId); op.ensure(); }
      catch (e) { if (!cancelled(e) && mounted.current && operation.current === op.id) { setMailError('邮件记录尚未确认。可以重新读取；不会自动再次发送。'); setNotice('原工作与已保存文件仍保留。邮件记录暂未读取完成，可以重新读取原工作后查看；不会自动发送。'); } }
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

  const followUpCurrent = (target: FollowUpTarget, expectedOperation: number) => mounted.current
    && clientRef.current === client && operation.current === expectedOperation
    && (target.kind === 'mail' ? selectedMail.current?.id === target.receipt.id
      : jobRef.current?.threadId === target.job.threadId && jobRef.current.requestId === target.job.requestId
        && jobRef.current.release.releaseId === target.job.release.releaseId
        && previewRef.current?.artifact.id === target.artifact.id && previewRef.current.artifact.version === target.artifact.version
        && previewRef.current.report?.runId === target.runId && previewRef.current.verified && knownCharge(previewRef.current.report) === 0
        && previewRef.current.report.files.find(file => file.id === target.artifact.id && file.version === target.artifact.version && file.original)?.sha256 === target.artifactSha256);
  const button = (label: string, action: () => void, disabled = false, secondary = false) => <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={action} style={[s.button, secondary && s.secondary, disabled && s.disabled]}><Text style={[s.buttonText, secondary && { color: C.ink }]}>{label}</Text></TouchableOpacity>;
  const text = (value: string) => <Text selectable style={s.previewText}>{value}</Text>;
  const content = preview?.value;
  const displayedOperation = operation.current;
  const savedThreadId = savedThread.current;
  const mailLocked = !!mailReceipt && !['cancelled', 'rejected'].includes(mailReceipt.status) || !!preparation.current || mailUncertain;
  const mailSourceVerified = jobRef.current?.origin !== 'twilio-inbound' && preview?.verified === true && !!preview.value && knownCharge(preview.report) === 0;
  const taskSourceSha256 = preview?.report?.files.find(file => file.id === preview.artifact.id && file.version === preview.artifact.version && file.original)?.sha256 || '';
  const historyMatches = history.filter(thread => `${thread.title.split('\n')[0]}\n${thread.publishedAgent?.name || ''}`.toLocaleLowerCase().includes(historyQuery.trim().toLocaleLowerCase()));
  const forgeWebUrl = forgeWebUrlForApi(apiUrl);
  const composeDisabled = busy || !composeReady || composeClearing || !localCurrent(localCompose.current);


  return <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
    {view === 'compose' ? <View style={s.heading}><Text style={s.eyebrow}>工作先有草稿</Text><Text style={s.hero}>把想法，{'\n'}变成可用的文字。</Text><Text style={s.intro}>给一份真实资料，收一份保存好的草稿。{'\n'}由你检查，再决定怎样使用。</Text></View> : <View style={s.heading}><Text style={s.eyebrow}>{view === 'history' ? '工作记录' : view === 'incoming' ? 'FORGE / INBOX' : view === 'incoming-calls' ? 'FORGE / CALLS' : '本次草稿'}</Text><Text style={s.title}>{view === 'history' ? '已保存的工作' : view === 'incoming' ? '来信先有草稿。' : view === 'incoming-calls' || jobRef.current?.origin === 'twilio-inbound' ? '来电需求记录与后续草稿。' : draftLabel(jobRef.current?.input.kind || kind)}</Text>{view === 'result' && jobRef.current && <Text style={s.small}>{jobRef.current.input.name}</Text>}</View>}
    <View style={s.tabs}>{button('新建草稿', () => { setView('compose'); setError(''); setNotice(''); }, busy || incomingBusy, view !== 'compose')}{button('已保存的工作', () => { void showHistory(); }, busy || incomingBusy, view !== 'history')}</View>
    {error ? <View accessibilityLiveRegion="polite" style={[s.message, s.error]}><Text style={[s.small, { color: C.red }]}>{error}</Text></View> : null}
    {notice ? <View accessibilityLiveRegion="polite" style={s.message}><Text style={s.small}>{notice}</Text></View> : null}
    {busy && view !== 'result' && <ActivityIndicator accessibilityLabel="正在处理当前操作" style={{ marginTop: 20 }} color={C.green} />}
    {view === 'incoming' && <IncomingMail client={client} onBusyChange={setIncomingBusy} onOpenDraft={threadId => { if (mounted.current && clientRef.current === client && !busyRef.current) void openSaved(threadId); }} />}
    {view === 'incoming-calls' && <IncomingCalls client={client} onBusyChange={setIncomingBusy} onOpenDraft={threadId => { if (mounted.current && clientRef.current === client && !busyRef.current) void openSaved(threadId); }} />}
    {view === 'compose' && <>
      <View style={s.templates}>{(['reply', 'marketing'] as DraftKind[]).map((value, index) => <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: kind === value, disabled: composeDisabled }} disabled={composeDisabled} key={value} onPress={() => changeCompose({ kind: value })} style={[s.template, kind === value && s.selected]}><Text style={s.number}>0{index + 1}</Text><Text style={s.templateTitle}>{draftLabel(value)}</Text><Text style={s.small}>{value === 'reply' ? '回复正文 + 后续跟进草稿' : '邮件文案 + 社交媒体文案'}</Text></TouchableOpacity>)}</View>
      <Text style={s.label}>{kind === 'reply' ? '收件对象' : '品牌或产品名称'}</Text><TextInput accessibilityLabel="草稿对象名称" value={name} onChangeText={value => changeCompose({ name: value })} editable={!composeDisabled} maxLength={100} placeholder={kind === 'reply' ? '例如：王经理' : '例如：Northstar Studio'} placeholderTextColor={C.muted} style={s.input} />
      <Text style={s.label}>{kind === 'reply' ? '来信内容与需要说明的事实' : '真实卖点、目标用户与使用场景'}</Text><TextInput accessibilityLabel="草稿参考资料" value={source} onChangeText={value => changeCompose({ source: value })} editable={!composeDisabled} multiline maxLength={6000} placeholder={kind === 'reply' ? '粘贴来信，并补充可以确认的交付时间、产品信息和你的回复意图。' : '写下已确认的功能、优势和适用人群。没有证据的效果或价格，请明确说明。'} placeholderTextColor={C.muted} style={[s.input, s.source]} />
      <View accessibilityLiveRegion="polite" style={s.message}><Text style={[s.small, composeError && { color: C.red }]}>{composeMessage}</Text><Text style={s.small}>仅保存在这部手机；退出登录后，输入草稿仍为此账号保留。</Text></View>
      {composeError && localCompose.current && localCompose.current.revision > localCompose.current.stored && button('重试保存到本机', () => { const entry = localCompose.current; if (localCurrent(entry) && !composeDisabled) { setComposeMessage('正在保存到本机…'); flushCompose(entry); } }, composeDisabled, true)}
      {button('清除本机草稿', () => { void clearLocalCompose(); }, composeDisabled || !name && !source && kind === 'reply' && !chosen, true)}
      <Text style={s.label}>本次使用的助手</Text>{releases.map(release => <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: chosen === release.releaseId, disabled: composeDisabled }} disabled={composeDisabled} key={release.releaseId} onPress={() => changeCompose({ releaseId: release.releaseId })} style={[s.assistant, chosen === release.releaseId && s.selected]}><Text style={s.body}>{release.name}</Text><Text style={s.small}>v{release.version} · 当前零价模型{chosen === release.releaseId ? ' · 已选择' : ''}</Text></TouchableOpacity>)}
      {!releases.length && <View style={s.saved}>
        <Text style={s.eyebrow}>从第一份草稿开始</Text><Text style={s.templateTitle}>{assistantsKnown ? '还没有草稿助手。' : '先看看你的可用助手。'}</Text>
        <Text style={s.small}>{assistantsKnown ? '在这里准备你自己的免费助手：保存模板、完成答题测评，再发布固定版本供你使用。' : '可用助手尚未读取成功，请先刷新。'}</Text>
        {assistantPhase ? <View accessibilityLiveRegion="polite" style={s.phase}><Text style={s.body}>{assistantPhase}</Text>{busyKind === 'assistant' && busy && <ActivityIndicator color={C.green} />}</View> : null}
        {assistantsKnown && button(assistantPreparation ? '继续查看原准备 →' : '准备免费草稿助手 →', () => { void prepareAssistant(); }, busy || incomingBusy)}
        {assistantPreparation?.retryAllowed && button('重新免费测评原助手', () => { void prepareAssistant(true); }, busy || incomingBusy, true)}
        <Text style={s.footnote}>点击准备只会为当前账号保存助手并进行 $0 答题测评。不会发出邮件、联系他人或发布外部内容。答题检查不代表实际文件交付或事实准确性已经通过。</Text>
      </View>}
      <View style={s.saved}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="获取更多助手" accessibilityState={{ expanded: assistantHandoffOpen, disabled: busy || incomingBusy }} disabled={busy || incomingBusy} onPress={toggleAssistantHandoff} style={[s.followUpToggle, (busy || incomingBusy) && s.disabled]}>
          <View style={{ flex: 1 }}><Text style={s.followUpTitle}>获取更多助手</Text><Text style={s.small}>浏览市场 · 网页准备 · 回到草稿</Text></View><Text style={s.followUpLink}>{assistantHandoffOpen ? '收起' : '展开'}</Text>
        </TouchableOpacity>
        {assistantHandoffOpen && <>
          <Text style={s.small}>手机当前不直接购买或安装助手。市场入口仅用于浏览，导入与发布需在对应网页版完成。</Text>
          <Text style={s.label}>01 / 浏览商品与许可</Text><Text style={s.body}>查看市场中的商品与许可，使用自己合法获得的 Forge 助手包。</Text>
          {button('浏览助手市场', () => { void openAssistantWebsite('marketplace'); }, busy || incomingBusy || !APPTOPIA_MARKETPLACE_URL, true)}
          {!APPTOPIA_MARKETPLACE_URL && <Text style={s.footnote}>助手市场地址尚未配置正确，请联系服务提供者。</Text>}
          <Text style={s.footnote}>零价模型仅指当前模型调用费用。Agent 商品价格与使用许可需要单独核对。</Text>
          <Text style={s.label}>02 / 在对应网页版准备</Text><Text style={s.body}>在对应 Forge 网页单独登录同一账号，并确认使用与手机相同的服务。进入菜单“Agent 工作台与资料库” → “Agent 工作台”，导入 JSON/ZIP，绑定必要资料、测评，再发布自己的私人固定版本。</Text>
          {button('打开对应 Forge 网页', () => { void openAssistantWebsite('forge'); }, busy || incomingBusy || !forgeWebUrl, true)}
          {!forgeWebUrl && <Text style={s.footnote}>当前服务尚未配置对应网页版地址。请向服务提供者获取网页地址，并确认同一账号与服务。</Text>}
          <Text style={s.label}>03 / 回到手机继续</Text><Text style={s.body}>返回这里后，手动刷新可用助手。对象名称与参考资料会保留；确认助手选择后，再继续原草稿。</Text>
          {button('导入发布后，刷新可用助手', () => { if (assistantHandoffCurrent() && assistantUi.current.open) void refreshAssistants(true); }, busy || incomingBusy, true)}
          {assistantHandoffError ? <View accessibilityLiveRegion="polite" style={[s.message, s.error]}><Text style={[s.small, { color: C.red }]}>{assistantHandoffError}</Text></View> : null}
          <Text style={s.footnote}>网页版发布的是你自己的私人固定版本，不是发布到 Apptopia。浏览网页或刷新助手不会自动生成草稿。</Text>
        </>}
      </View>
      {button('刷新可用助手', () => { void refreshAssistants(true); }, busy, true)}
      {assistantHandoffNotice ? <View accessibilityLiveRegion="polite" style={s.message}><Text style={s.small}>{assistantHandoffNotice}</Text></View> : null}
      {button(busy ? '正在准备…' : '生成并保存草稿 →', () => { void start(); }, composeDisabled || !assistantsKnown || !releases.some(item => item.releaseId === chosen) || !name.trim() || !source.trim())}
      <Text style={s.footnote}>本次模型费用上限为 $0。只起草，不自动发送或发布。免费模型繁忙时可稍后查看原任务。</Text>
    </>}
    {view === 'history' && <><Text style={s.label}>最近保存的工作</Text><Text style={s.small}>已载入 {history.length} 条最近记录 · 本次读取上限 {historyLimit} 条</Text>
      <TextInput accessibilityLabel="查找已载入的工作" value={historyQuery} onChangeText={value => { if (mounted.current && clientRef.current === client && !busyRef.current) setHistoryQuery(value); }} editable={!busy} maxLength={100} autoCapitalize="none" autoCorrect={false} placeholder="按对象名称、任务标题或助手查找" placeholderTextColor={C.muted} style={[s.input, { marginTop: 12 }]} />
      <Text style={s.small}>仅查找当前已载入的记录。</Text>
      {!busy && !historyKnown && <Text style={s.body}>这次读取尚未完成，上次载入的记录仍保留。请重新读取。</Text>}
      {!busy && historyKnown && !history.length && <Text style={s.body}>这里还没有已发布助手的工作记录。</Text>}
      {!busy && history.length > 0 && !historyMatches.length && <Text style={s.body}>已载入的记录中没有匹配项，可以修改查找内容或读取更多记录。</Text>}
      {historyMatches.map(thread => <TouchableOpacity accessibilityRole="button" disabled={busy} key={thread.id} onPress={() => { void openSaved(thread); }} style={s.history}><Text style={s.body}>{thread.title.split('\n')[0]}</Text>{thread.created_at && <Text style={s.small}>创建时间（UTC）：{thread.created_at}</Text>}<Text style={s.small}>{thread.publishedAgent?.name} · 查看文件与核对记录 →</Text></TouchableOpacity>)}
      {button('重新读取已载入范围', () => { void showHistory(); }, busy, true)}
      {/* ponytail: refetches the loaded range; use a cursor API if history volume warrants. */}
      {historyHasMore && button(`读取最近 ${historyLimit + 30} 条记录`, () => { void showHistory(historyLimit + 30); }, busy, true)}
      {historyKnown && !historyHasMore && history.length > 0 && <Text style={s.footnote}>本次读取已包含全部现有记录。新保存的工作可重新读取查看。</Text>}
    </>}
    {view === 'result' && <>
      <View style={s.phase}><Text style={s.title}>{busy && busyKind === 'other' && phase !== '正在读取已保存的工作' ? '正在读取或保存记录' : phase || '工作结果'}</Text>{busy && (busyKind === 'draft' || busyKind === 'other') && <ActivityIndicator accessibilityLabel="正在处理工作" color={C.green} />}</View>
      <Text style={s.small}>{charge === null ? '模型费用：尚未确认' : `模型费用：$${charge === 0 ? '0.00' : charge.toFixed(6)} · 已核对`}</Text>
      {busy ? busyKind === 'draft' && jobRef.current?.origin !== 'twilio-inbound' && button('停止本次任务', () => { void stop(displayedOperation); }, phase === '正在请求停止', true) : jobRef.current?.threadId ? <>{button('查看任务结果', () => { void checkResult(); }, false, true)}{retryAllowed && button('重新提交原任务', () => { void checkResult(true); })}{canStop && button('请求停止原任务', () => { void stop(displayedOperation); }, false, true)}</> : null}
      {!busy && savedThreadId && (error || mailError || !jobRef.current) && button('重新读取原工作', () => { if (operation.current === displayedOperation && savedThread.current === savedThreadId) void openSaved(savedThreadId); }, false, true)}
      {preview && jobRef.current && <FollowUpCard key={jobRef.current.threadId} target={{ kind: 'task', job: jobRef.current, artifact: preview.artifact, runId: preview.report?.runId || '', artifactSha256: taskSourceSha256 }} sourceVerified={preview.verified && !!preview.value && knownCharge(preview.report) === 0 && /^[a-f0-9]{64}$/.test(taskSourceSha256)} snapshot={taskFollowUpSnapshot} busy={busy} operationId={displayedOperation} begin={begin} isCurrent={followUpCurrent} />}
      {files.length > 1 && files.map(file => button(file.filename, () => { setPreview({ artifact: file, report: null, verified: false }); setRaw(true); }, busy, true))}
      {preview && <View style={s.saved}><Text style={s.eyebrow}>{preview.verified ? '文件与交付要求已核对' : '已保存文件 · 请检查内容'}</Text><Text style={s.filename}>{preview.artifact.filename}</Text><Text style={s.small}>长按正文即可选择并复制。草稿仍需本人审阅。</Text>
        {content && !raw ? <>{jobRef.current?.input.kind === 'reply' ? <><Text style={s.label}>主题</Text>{text(String(content.subject))}<Text style={s.label}>{jobRef.current?.origin === 'twilio-inbound' ? '来电跟进草稿' : '回复草稿'}</Text>{text(String(content.body))}{content.followUpDraft && <><Text style={s.label}>后续跟进草稿</Text>{text(String(content.followUpDraft))}</>}</> : <><Text style={s.label}>邮件主题</Text>{text(String(content.emailDraft?.subject || ''))}{text(String(content.emailDraft?.body || ''))}{content.socialDrafts?.map((item: any, index: number) => <View key={index}><Text style={s.label}>{String(item.channel)}</Text>{text(String(item.text))}</View>)}</>}
          {Array.isArray(content.missingInformation) && content.missingInformation.length > 0 && <><Text style={s.label}>还需要你补充</Text>{text(content.missingInformation.map((item: unknown) => String(item)).join('\n'))}</>}
          {Array.isArray(content.unverifiedClaims) && content.unverifiedClaims.length > 0 && <><Text style={s.label}>尚未核实的说法</Text>{text(content.unverifiedClaims.map((item: unknown) => String(item)).join('\n'))}</>}
        </> : text(preview.artifact.content)}
        {content && button(raw ? '阅读草稿正文' : '查看 JSON 文件', () => setRaw(!raw), false, true)}
        {preview.report?.checkedAt && <Text style={s.footnote}>最近核对：{new Date(preview.report.checkedAt).toLocaleString()}</Text>}
      </View>}
      {jobRef.current?.origin !== 'twilio-inbound' && (mailSourceVerified || mailRecords.length > 0) && !mailOpen && button(mailRecords.length ? '查看邮件准备与发送记录' : '准备一封邮件 →', () => { void openMail(); }, busy, true)}
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

          <FollowUpCard key={mailReceipt.id} target={{ kind: 'mail', receipt: mailReceipt }} snapshot={mailFollowUpSnapshot} busy={busy} operationId={displayedOperation} begin={begin} isCurrent={followUpCurrent} />

        </View>}
      </View>}
      {!preview && !busy && <Text style={s.footnote}>尚未确认有完整交付文件。可以查看原任务状态，或从“已保存的工作”找回服务器记录。</Text>}
    </>}
    {view !== 'incoming' && view !== 'incoming-calls' && <View style={s.moreTasks}><Text style={s.label}>更多业务场景</Text><Text style={s.small}>连接自己的邮箱或业务云号码，查看后台草稿与处理记录。</Text>
      {button('收件草稿 · 设置与记录', () => { if (mounted.current && clientRef.current === client && !busyRef.current && !incomingBusy) { setView('incoming'); setError(''); setNotice(''); } }, busy || incomingBusy, true)}
      {button('云号码来电 · 设置与记录', () => { if (mounted.current && clientRef.current === client && !busyRef.current && !incomingBusy) { setView('incoming-calls'); setError(''); setNotice(''); } }, busy || incomingBusy, true)}
    </View>}
    <View style={s.footer}><Text style={s.small}>草稿有据，决定在你。</Text><Text style={s.small}>FORGE / WORK</Text></View>
  </ScrollView>;
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 44, backgroundColor: C.bg }, heading: { paddingBottom: 16 }, eyebrow: { color: C.green, fontSize: 12, fontWeight: '600', letterSpacing: 1.2, marginTop: 20, marginBottom: 12 }, hero: { color: C.ink, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 33, lineHeight: 45 }, intro: { color: C.muted, fontSize: 15, lineHeight: 24, marginTop: 16 },
  tabs: { flexDirection: 'row', gap: 10, marginBottom: 12 }, button: { flexGrow: 1, minHeight: 50, backgroundColor: C.ink, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', marginTop: 12 }, buttonText: { color: C.accent, fontWeight: '700', fontSize: 14 }, secondary: { backgroundColor: C.paper, borderWidth: 1, borderColor: C.line }, disabled: { opacity: 0.45 },
  templates: { marginTop: 12, gap: 12, flexDirection: 'row' }, template: { flex: 1, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 14, gap: 7 }, selected: { borderColor: C.green, borderWidth: 1.5 }, number: { color: C.green, fontSize: 12, fontFamily: 'monospace' }, templateTitle: { color: C.ink, fontSize: 18, lineHeight: 26, fontWeight: '600' }, label: { color: C.muted, fontSize: 12, fontWeight: '600', marginTop: 24, marginBottom: 10 }, input: { minHeight: 52, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 15, color: C.ink, fontSize: 16 }, source: { minHeight: 180, textAlignVertical: 'top', lineHeight: 24 }, moreTasks: { marginTop: 28, borderTopWidth: 1, borderColor: C.line },
  assistant: { padding: 15, marginBottom: 8, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 12, gap: 5 }, body: { color: C.ink, fontSize: 15, lineHeight: 24 }, small: { color: C.muted, fontSize: 12, lineHeight: 20 }, footnote: { color: C.muted, fontSize: 12, lineHeight: 20, marginTop: 16 }, message: { backgroundColor: C.paper, padding: 14, borderWidth: 1, borderColor: C.line, borderRadius: 10, marginTop: 12 }, error: { borderColor: '#dab4a9' },
  history: { borderBottomWidth: 1, borderColor: C.line, paddingVertical: 18, gap: 6 }, phase: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24, marginBottom: 12 }, title: { color: C.ink, fontSize: 23, lineHeight: 32, fontWeight: '600', flexShrink: 1 }, saved: { borderLeftWidth: 3, borderColor: C.green, backgroundColor: C.paper, padding: 18, marginTop: 24 }, filename: { color: C.ink, fontSize: 16, lineHeight: 24, fontFamily: 'monospace', marginBottom: 10 }, previewText: { color: C.ink, fontSize: 15, lineHeight: 25, marginTop: 8 }, footer: { borderTopWidth: 1, borderColor: C.line, paddingTop: 18, marginTop: 32, flexDirection: 'row', justifyContent: 'space-between' },
  followUpCard: { marginTop: 24, paddingTop: 18, borderTopWidth: 1, borderColor: C.line }, followUpToggle: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12 }, followUpTitle: { color: C.ink, fontSize: 16, fontWeight: '600', lineHeight: 26 }, followUpLink: { color: C.green, fontSize: 13, fontWeight: '600' }, followUpSummary: { padding: 12, marginTop: 14, backgroundColor: C.bg, borderRadius: 10, gap: 4 }, followUpChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }, followUpChoice: { paddingVertical: 10, paddingHorizontal: 12, minHeight: 42, borderWidth: 1, borderColor: C.line, borderRadius: 9, backgroundColor: C.paper }, followUpNotes: { minHeight: 120, textAlignVertical: 'top', lineHeight: 24 },
  mailSection: { borderTopWidth: 1, borderColor: C.line, marginTop: 28, paddingTop: 8 }, mailHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 }, mailConnection: { paddingVertical: 14, paddingHorizontal: 16, gap: 5, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 12 }, mailBody: { minHeight: 230, textAlignVertical: 'top', lineHeight: 25 }, mailPreview: { marginTop: 24, padding: 18, backgroundColor: C.paper, borderLeftWidth: 3, borderColor: C.green }, mailStatus: { color: C.green, fontSize: 17, fontWeight: '600', lineHeight: 27 }, mailCosts: { borderTopWidth: 1, borderColor: C.line, paddingTop: 14, marginTop: 24, marginBottom: 10, gap: 5 }, mailHistory: { padding: 14, gap: 5, marginBottom: 8, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 10 },
});
