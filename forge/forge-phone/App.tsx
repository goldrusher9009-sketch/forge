import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, NativeModules, Platform, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as FileSystem from 'expo-file-system';
import { ForgeAgentLoop } from './src/ForgeAgent';
import { AgentStep, FORGE_API, NativeExecutionResult, normalizeForgeApiUrl, PhoneAction } from './src/config';
import { ForgeIdentity, ForgeSessionClient } from './src/session';
import BusinessTasks from './src/BusinessTasks';
import type { DraftClient } from './src/business-tasks';

type InstalledApp = { packageName: string; label: string };
type ForgeAccessibilityBridge = {
  isAccessibilityEnabled(): Promise<boolean>;
  openAccessibilitySettings(): Promise<boolean>;
  listLaunchableApps(): Promise<InstalledApp[]>;
  openApp(packageName: string): Promise<boolean>;
  openReview(): Promise<boolean>;
  captureScreen(expectedPackage: string): Promise<string>;
  getCurrentPackage(): Promise<string>;
  performAction(actionJson: string, expectedPackage: string): Promise<NativeExecutionResult>;
};
const accessibility = NativeModules.ForgeAccessibility as ForgeAccessibilityBridge | undefined;
const C = { bg: '#f3f0e8', paper: '#fffdf7', ink: '#20251f', muted: '#686f63', line: '#dcded2', accent: '#b5db57', green: '#3d6229', red: '#a33d30' };
const STATUS: Record<AgentStep['status'], string> = { simulated: '仅预览', pending_approval: '等你确认', approved: '已批准', executing: '正在执行', succeeded: '已执行', failed: '执行失败', not_executed: '未执行', rejected: '已拒绝', completed: '已结束' };
const TASKS = [
  { name: '客户回复', hint: '读懂来意，准备回复', goal: '在当前聊天页面，阅读对方最后一条消息，准备一份礼貌、简洁的回复。不要编造价格或承诺。把回复填入输入框后结束，不要点击发送；信息不足时请说明。' },
  { name: '邮件起草', hint: '写好草稿，由你发送', goal: '在当前邮件页面，阅读邮件内容，起草一份清晰的回复。不要编造事实或承诺。只填写草稿并结束，不要点击发送；需要补充信息时请说明。' },
  { name: '营销文案', hint: '把真实卖点写成内容', goal: '根据当前页面可见的产品信息，在已打开的编辑器中写一段简短的营销文案。只使用真实、可核实的卖点，不编造优惠或客户数据。保存为草稿后结束，不要发布。' },
];

function errorText(value: unknown): string {
  const code = value instanceof Error ? value.message.split(':')[0] : String(value).split(':')[0];
  const messages: Record<string, string> = {
    INVALID_CREDENTIALS: '邮箱或密码不正确，请重新输入。', AUTH_RATE_LIMITED: '尝试次数较多，请稍后再登录。',
    NETWORK_UNAVAILABLE: '连接未完成，请检查网络后再试。', AUTH_REQUIRED: '请先登录 Forge。',
    SESSION_EXPIRED: '登录已过期，请重新登录。', SESSION_CHANGED: '登录状态已变化，请重新登录。',
    AUTH_RESPONSE_INVALID: '此服务尚未支持手机登录，请使用已更新的测试服务。',
    PHONE_COOKIE_AUTH_UNSUPPORTED: '手机登录凭据与浏览器凭据冲突，请重新打开应用。',
    PHONE_SESSION_STOPPED: '任务已停止。', PHONE_ACTION_REJECTED: '你已拒绝这一步，任务已停止。',
    PHONE_MAX_STEPS_REACHED: '已达到本次步骤上限。请查看结果后再决定是否继续。',
    PHONE_PACKAGE_CHANGED: '目标应用发生变化，任务已停止。请重新打开目标应用后开始。',
    PHONE_SCREEN_CHANGED: '审核后目标页面发生变化，本次动作未执行。请检查页面后重新开始。',
    PHONE_SCREENSHOT_REQUIRED: '无法读取屏幕，请检查无障碍权限和目标应用。',
    PHONE_ACCESSIBILITY_DISABLED: '请在系统设置中开启 Forge 无障碍服务。',
    PHONE_NATIVE_ACTION_FAILED: '手机未能完成这一步，请查看目标应用后重试。',
    DESKTOP_PROVIDER_FUNDING_UNAVAILABLE: '免费模型暂时不可用，请稍后再试。',
    DESKTOP_FREE_MODEL_UNAVAILABLE: '免费模型暂时不可用，请稍后再试。',
    PHONE_SESSION_ACTIVE: '已有任务在运行，请先结束当前任务。', APP_UNAVAILABLE: '无法打开所选应用，请重新选择。',
    SERVICE_URL_REQUIRED: '请先设置 Forge 服务地址。',
    SERVICE_URL_INVALID: '请输入完整的服务网址，不要附带路径、参数或账号密码。',
    SERVICE_HTTPS_REQUIRED: '请使用 HTTPS 服务地址。开发版仅支持本机或局域网的 HTTP 地址。',
  };
  return messages[code] || '本次操作未完成。请检查网络、登录状态或所选应用后重试。';
}

function describeAction(step: AgentStep): string {
  const a = step.args;
  switch (step.action) {
    case 'tap': return `点击「${String(a.element || '目标位置')}」`;
    case 'long_press': return `长按「${String(a.element || '目标位置')}」`;
    case 'type': return `在${a.element ? `「${String(a.element)}」` : '当前输入框'}填写：\n${String(a.text || '')}`;
    case 'swipe': case 'scroll': return `向${({ up: '上', down: '下', left: '左', right: '右' } as Record<string, string>)[String(a.direction)] || ''}${step.action === 'swipe' ? '滑动' : '滚动'}${a.element ? `「${String(a.element)}」` : '屏幕'}`;
    case 'back': return '返回上一页';
    case 'home': return '返回手机桌面';
    case 'wait': return `等待 ${(Number(a.ms) / 1000).toFixed(1)} 秒`;
    case 'done': return '结束本次任务';
  }
}

export default function App() {
  const [apiUrl, setApiUrl] = useState(FORGE_API);
  const [serviceInput, setServiceInput] = useState(FORGE_API);
  const [editingService, setEditingService] = useState(!FORGE_API);
  const [loadingService, setLoadingService] = useState(true);
  const [savingService, setSavingService] = useState(false);
  const session = useMemo(() => new ForgeSessionClient(apiUrl), [apiUrl]);
  const [identity, setIdentity] = useState<ForgeIdentity | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [goal, setGoal] = useState('');
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [target, setTarget] = useState<InstalledApp | null>(null);
  const [choosingApp, setChoosingApp] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);
  const [maxSteps, setMaxSteps] = useState(8);
  const [planningOnly, setPlanningOnly] = useState(true);
  const [running, setRunning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [draining, setDraining] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [phase, setPhase] = useState('正在准备');
  const [pendingStep, setPendingStep] = useState<AgentStep | null>(null);
  const [existingTask, setExistingTask] = useState<{ id: number; goal: string; generation: number } | null>(null);
  const [closingTask, setClosingTask] = useState(false);
  const [screen, setScreen] = useState<'main' | 'running'>('main');
  const [taskMode, setTaskMode] = useState<'business' | 'phone'>('business');
  const [businessBusy, setBusinessBusy] = useState(false);
  const agentRef = useRef<ForgeAgentLoop | null>(null);
  const runRef = useRef(0);
  const authRef = useRef(0);
  const authBusyRef = useRef(false);
  const startingRef = useRef(false);
  const approvalRef = useRef<((approved: boolean) => void) | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const businessClient = useMemo<DraftClient & { onBusyChange(busy: boolean): void }>(() => {
    const generation = authRef.current;
    const current = () => { if (authRef.current !== generation) throw new Error('SESSION_CHANGED'); };
    return {
      request: async <T,>(path: string, init?: RequestInit) => { current(); const result = await session.request<T>(path, init); current(); return result; },
      requestText: async (path, init) => { current(); const result = await session.requestText(path, init); current(); return result; },
      onBusyChange: busy => { if (authRef.current === generation) setBusinessBusy(busy); },
    };
  }, [session, identity?.user.id]);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        if (!FileSystem.documentDirectory) return;
        const file = `${FileSystem.documentDirectory}forge-service.json`;
        const info = await FileSystem.getInfoAsync(file);
        if (!info.exists || info.isDirectory || info.size > 4096) return;
        const saved = JSON.parse(await FileSystem.readAsStringAsync(file));
        const restored = normalizeForgeApiUrl(saved.apiUrl);
        if (active) { setApiUrl(restored); setServiceInput(restored); setEditingService(false); }
      } catch { /* Invalid or unavailable local settings leave the visible default unchanged. */ }
      finally { if (active) setLoadingService(false); }
    };
    void restore();
    return () => { active = false; };
  }, []);

  const saveService = async () => {
    if (authBusyRef.current || loadingService || savingService || identity) return;
    let selected: string;
    try { selected = normalizeForgeApiUrl(serviceInput); }
    catch (e) { setError(errorText(e)); return; }
    setSavingService(true); setPassword(''); setError(''); setNotice('');
    try {
      if (FileSystem.documentDirectory) {
        await FileSystem.writeAsStringAsync(`${FileSystem.documentDirectory}forge-service.json`, JSON.stringify({ apiUrl: selected }));
      }
    } catch { setNotice('本次已使用此服务；地址未能保存，下次打开时请重新设置。'); }
    finally {
      setApiUrl(selected); setServiceInput(selected); setEditingService(false); setSavingService(false);
    }
  };

  useEffect(() => () => {
    runRef.current += 1;
    approvalRef.current?.(false);
    void agentRef.current?.stop();
    authRef.current += 1; void session.signOut();
  }, [session]);

  const signIn = async () => {
    if (authBusyRef.current || loadingService || savingService || editingService || !apiUrl || !email.trim() || !password) return;
    const attempt = ++authRef.current;
    authBusyRef.current = true; setSigningIn(true); setError(''); setNotice('');
    const enteredPassword = password; setPassword('');
    try {
      const signedIn = await session.signIn(email.trim(), enteredPassword);
      if (authRef.current === attempt) { setIdentity(signedIn); setScreen('main'); }
    } catch (e) { if (authRef.current === attempt) setError(errorText(e)); }
    finally { if (authRef.current === attempt) { authBusyRef.current = false; setSigningIn(false); } }
  };
  const stopAgent = async () => {
    runRef.current += 1;
    setDraining(startingRef.current);
    setStarting(false); setRunning(false); setPhase('已停止');
    approvalRef.current?.(false); approvalRef.current = null; setPendingStep(null);
    await agentRef.current?.stop();
  };
  const signOut = async () => {
    const stopped = stopAgent();
    const attempt = ++authRef.current;
    const revoked = session.signOut();
    agentRef.current = null; authBusyRef.current = false;
    setIdentity(null); setSigningIn(false); setPassword(''); setSteps([]); setSummary(''); setError(''); setTarget(null);
    setGoal(''); setApps([]); setChoosingApp(false); setLoadingApps(false); setNotice('');
    setExistingTask(null); setClosingTask(false);
    setTaskMode('business'); setBusinessBusy(false);
    const result = await revoked;
    if (authRef.current === attempt) setNotice(result.serverRevoked ? '' : '本机已退出；服务端撤销尚未确认，请检查网络后重新登录。');
    await stopped;
  };
  const chooseApp = async () => {
    if (!accessibility) { setError('请安装 Forge Android 应用，才能选择和操作手机应用。'); return; }
    const attempt = authRef.current;
    setChoosingApp(true); setLoadingApps(true); setError('');
    try { const installed = await accessibility.listLaunchableApps(); if (authRef.current === attempt) setApps(installed); }
    catch { if (authRef.current === attempt) setError('应用列表读取失败，请稍后重试。'); }
    finally { if (authRef.current === attempt) setLoadingApps(false); }
  };
  const showAccessibilitySettings = async () => {
    try { await accessibility?.openAccessibilitySettings(); }
    catch { setError('无法打开系统设置，请手动进入设置中的无障碍服务。'); }
  };
  const findExistingTask = async () => {
    const generation = authRef.current;
    try {
      const history = await session.request<{ rows: Array<{ id: number; user_id: string; goal: string; status: string }> }>('/api/phone-agent/sessions');
      const task = history.rows?.find(row => row.status === 'active' && row.user_id === identity?.user.id && Number.isSafeInteger(row.id));
      if (authRef.current === generation && task) setExistingTask({ id: task.id, goal: task.goal, generation });
    } catch { if (authRef.current === generation) setNotice('已有任务读取失败，请检查网络后再次查看。'); }
  };
  const closeExistingTask = async () => {
    if (!existingTask || closingTask || existingTask.generation !== authRef.current) return;
    const generation = authRef.current;
    setClosingTask(true);
    try {
      const reply = await session.request<{ session: { id: number; status: string } }>(`/api/phone-agent/sessions/${existingTask.id}/cancel`, { method: 'POST', body: '{}' });
      if (reply.session?.id !== existingTask.id || !['cancelled', 'completed', 'interrupted', 'budget_exhausted'].includes(reply.session.status)) throw new Error('PHONE_SESSION_ACTIVE');
      if (authRef.current === generation) { setExistingTask(null); setError(''); setNotice('上次任务已结束，可以重新开始。'); }
    } catch (e) { if (authRef.current === generation) setError(errorText(e)); }
    finally { if (authRef.current === generation) setClosingTask(false); }
  };
  const startAgent = async () => {
    if (startingRef.current || running || !identity || !goal.trim()) return;
    if (!planningOnly && (!accessibility || Platform.OS !== 'android' || !target)) { setError('请先选择本次要操作的 Android 应用。'); return; }
    startingRef.current = true; setStarting(true); setError(''); setNotice('');
    const runId = ++runRef.current;
    const authGeneration = authRef.current;
    const isCurrentRun = () => runRef.current === runId;
    const ensureCurrent = () => { if (!isCurrentRun()) throw new Error('PHONE_SESSION_STOPPED'); };
    const allowedPackages = planningOnly ? [] : [target!.packageName];
    // Owner navigation only; the model cannot request an application launch.
    const returnToTarget = async (expectedPackage: string) => {
      ensureCurrent();
      if (!allowedPackages.includes(expectedPackage)) throw new Error('PHONE_PACKAGE_CHANGED');
      await accessibility!.openApp(expectedPackage); ensureCurrent();
      const deadline = Date.now() + 10000;
      while (Date.now() < deadline) {
        ensureCurrent(); const current = (await accessibility!.getCurrentPackage()).trim(); ensureCurrent();
        if (current === expectedPackage) return;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      throw new Error('PHONE_PACKAGE_CHANGED');
    };
    try {
      if (!planningOnly && !(await accessibility!.isAccessibilityEnabled())) {
        ensureCurrent();
        Alert.alert('开启无障碍服务', 'Forge 需要这项权限读取目标屏幕、执行你逐项批准的操作。你可以随时在设置中关闭。', [
          { text: '稍后', style: 'cancel' }, { text: '前往设置', onPress: () => { void showAccessibilitySettings(); } },
        ]); return;
      }
      ensureCurrent();
      setRunning(true); setDone(false); setSteps([]); setSummary(''); setScreen('running'); setPhase('正在准备');
      if (!planningOnly) await returnToTarget(target!.packageName);
      ensureCurrent();
      const agent: ForgeAgentLoop = new ForgeAgentLoop({
        request: <T,>(path: string, init?: RequestInit) => {
          if (authRef.current !== authGeneration) return Promise.reject(new Error('SESSION_CHANGED'));
          return session.request<T>(path, init);
        },
        captureScreenshot: async () => planningOnly ? null : accessibility!.captureScreen(target!.packageName),
        getCurrentPackage: async () => planningOnly ? '' : accessibility!.getCurrentPackage(),
        executeAction: async (action: PhoneAction, expectedPackage: string) => {
          const ensureRunning = () => { ensureCurrent(); if (!agent.isRunning()) throw new Error('PHONE_SESSION_STOPPED'); };
          ensureRunning(); if (planningOnly) throw new Error('PHONE_ACTION_PLANNING_ONLY');
          if (!accessibility || !(await accessibility.isAccessibilityEnabled())) throw new Error('PHONE_ACCESSIBILITY_DISABLED');
          ensureRunning(); const currentPackage = (await accessibility.getCurrentPackage()).trim(); ensureRunning();
          if (currentPackage !== expectedPackage) throw new Error('PHONE_PACKAGE_CHANGED');
          return accessibility.performAction(JSON.stringify(action), expectedPackage);
        },
        requestApproval: async step => {
          ensureCurrent(); setPendingStep(step); setPhase('等你确认下一步');
          const decision = new Promise<boolean>(resolve => { approvalRef.current = resolve; });
          try { await accessibility!.openReview(); }
          catch { if (isCurrentRun()) setNotice('请切回 Forge，查看并确认下一步。'); }
          const approved = await decision; ensureCurrent();
          if (!approved) return false;
          setPhase('正在返回目标应用'); await returnToTarget(step.currentPackage || ''); ensureCurrent(); return true;
        },
        onStep: step => {
          if (agentRef.current !== agent) return;
          // Keep actual native receipts visible when Stop follows dispatch.
          setSteps(previous => previous.some(item => item.id === step.id) ? previous.map(item => item.id === step.id ? step : item) : [...previous, step]);
          if (isCurrentRun()) setPhase(step.status === 'executing' ? '正在执行已批准的动作' : '正在准备下一步');
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        },
        onDone: message => { if (isCurrentRun()) { setSummary(message); setDone(true); setRunning(false); setPhase('任务已结束'); } },
        onError: message => { if (isCurrentRun()) {
          if (message.split(':')[0] === 'PHONE_SESSION_ACTIVE') void findExistingTask();
          if (['SESSION_EXPIRED', 'AUTH_REQUIRED', 'SESSION_CHANGED'].includes(message.split(':')[0])) void signOut();
          setError(errorText(new Error(message))); setRunning(false); setPhase('需要你检查');
        } },
      });
      agentRef.current = agent; setPhase(planningOnly ? '正在预览步骤' : '正在读取所选应用');
      await agent.start(goal.trim(), { maxSteps, planningOnly, allowedPackages, confirmationMode: 'every_action', tokenBudget: 1_200_000, costBudgetUsd: 0 });
    } catch (e) { if (isCurrentRun()) { setError(errorText(e)); setRunning(false); } }
    finally {
      // Stop may precede a native receipt; do not overlap a new task with it.
      startingRef.current = false;
      setDraining(false);
      if (isCurrentRun()) { setStarting(false); setRunning(false); }
    }
  };
  const decide = (approved: boolean) => { const resolve = approvalRef.current; approvalRef.current = null; setPendingStep(null); setNotice(''); resolve?.(approved); };
  const successfulActions = steps.filter(step => step.executed && step.success).length;
  const message = (text: string, bad = false) => text ? <View accessibilityLiveRegion="polite" style={[s.message, bad && s.error]}><Text style={[s.small, { color: bad ? C.red : C.muted }]}>{text}</Text></View> : null;
  const button = (label: string, onPress: () => void, disabled = false, secondary = false) => <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} onPress={onPress} disabled={disabled} style={[s.button, secondary && s.secondary, disabled && s.disabled]}><Text style={[s.buttonText, secondary && { color: C.ink }]}>{label}</Text></TouchableOpacity>;
  const mark = <View style={s.brand}><View style={s.brandMark}><Text style={s.brandLetter}>F</Text></View><Text style={s.wordmark}>FORGE <Text style={s.wordmarkLight}>/ POCKET</Text></Text></View>;
  const recovery = existingTask && <View style={s.message}><Text style={s.body}>已有手机任务未结束</Text><Text style={s.small}>{existingTask.goal}</Text><Text style={s.footnote}>结束后才能开始新任务。结束不会撤回已派发到手机的操作。</Text>{button(closingTask ? '正在结束…' : '结束未完成任务', () => { void closeExistingTask(); }, closingTask, true)}</View>;

  if (!identity) return <SafeAreaView style={s.root}><StatusBar style="dark" /><KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.loginContent}>
    {mark}<Text style={s.eyebrow}>你的随身工作助手</Text><Text style={s.hero}>少一点琐事。{'\n'}多一点时间。</Text><Text style={s.intro}>把重复操作交给 Forge。{'\n'}每一步，都由你掌握。</Text>
    <View style={s.service}><Text style={s.label}>连接到你的 Forge</Text>
      {loadingService ? <ActivityIndicator accessibilityLabel="正在读取服务设置" color={C.green} /> : editingService ? <>
        <TextInput accessibilityLabel="Forge 服务地址" value={serviceInput} onChangeText={setServiceInput} autoCapitalize="none" autoCorrect={false} keyboardType="url" maxLength={2048} placeholder="https://你的服务网址" placeholderTextColor={C.muted} style={s.input} editable={!savingService && !signingIn} />
        <Text style={s.footnote}>使用团队提供或你自己部署的 Forge 地址。请确认网址后再输入账号密码。</Text>
        {button(savingService ? '正在保存…' : '使用此服务', () => { void saveService(); }, savingService || signingIn || !serviceInput.trim())}
        {!!apiUrl && button('取消修改', () => { setServiceInput(apiUrl); setEditingService(false); setError(''); }, savingService || signingIn, true)}
      </> : <><Text selectable style={s.body}>{apiUrl}</Text>{button('更换服务', () => { setPassword(''); setEditingService(true); setError(''); setNotice(''); }, signingIn || savingService, true)}</>}
    </View>
    <View style={s.loginForm}><Text style={s.label}>邮箱</Text><TextInput accessibilityLabel="邮箱" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="username" autoComplete="email" placeholder="you@company.com" placeholderTextColor={C.muted} style={s.input} editable={!loadingService && !savingService && !editingService && !signingIn} />
      <Text style={s.label}>密码</Text><TextInput accessibilityLabel="密码" value={password} onChangeText={setPassword} secureTextEntry textContentType="password" autoComplete="current-password" placeholder="输入 Forge 密码" placeholderTextColor={C.muted} style={s.input} editable={!loadingService && !savingService && !editingService && !signingIn} onSubmitEditing={() => { void signIn(); }} />
      {message(error, true)}{message(notice)}{button(signingIn ? '正在登录…' : '登录 Forge →', () => { void signIn(); }, loadingService || savingService || editingService || !apiUrl || signingIn || !email.trim() || !password)}
      {signingIn && button('取消登录', () => { void signOut(); }, false, true)}<Text style={s.footnote}>使用已有 Forge 账号。登录凭据只保留在本次应用会话中，关闭后需重新登录。</Text>
    </View><View style={s.footer}><Text style={s.small}>逐项确认 · 随时停止</Text><Text style={s.small}>01 / ANDROID</Text></View>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;

  if (screen === 'running') return <SafeAreaView style={s.root}><StatusBar style="dark" /><View style={s.topbar}>{mark}{running || starting ? button('停止', () => { void stopAgent(); }, false, true) : button('返回', () => setScreen('main'), false, true)}</View>
    <ScrollView ref={scrollRef} contentContainerStyle={s.content}><Text style={s.eyebrow}>{planningOnly ? '步骤预览' : target?.label || '手机任务'}</Text><View style={s.phaseRow}><Text style={s.title}>{phase}</Text>{running && <ActivityIndicator color={C.green} />}</View><Text style={s.goalSummary}>{goal}</Text><View style={s.meta}><Text style={s.small}>{planningOnly ? '未操作手机' : `${successfulActions} 步已执行`}</Text><Text style={s.small}>最多 {maxSteps} 步</Text></View>
      {!planningOnly && running && message('审核时会切回 Forge。批准后返回所选应用继续；请保持目标页面不变。')}{message(notice)}{message(error, true)}{recovery}
      {pendingStep && <View style={s.approval}><Text style={s.eyebrow}>下一步 · 需要你的确认</Text><Text style={s.title}>{describeAction(pendingStep)}</Text><Text style={s.body}>目标：{target?.label || '所选应用'}</Text><Text style={s.body}>{pendingStep.reasoning}</Text><Text style={s.small}>风险：{({ low: '低', medium: '中', high: '高' })[pendingStep.riskLevel]}。批准仅限此动作；发送、删除等操作请仔细检查。</Text>
        {(pendingStep.action === 'tap' || pendingStep.action === 'long_press') && <Text style={s.small}>屏幕位置：横向 {Number(pendingStep.args.x) / 10}% · 纵向 {Number(pendingStep.args.y) / 10}%</Text>}
        {button(`批准并返回${target?.label || '目标应用'}`, () => decide(true))}{button('拒绝并结束', () => decide(false), false, true)}
      </View>}
      <Text style={[s.label, { marginTop: 22 }]}>操作记录</Text>{steps.length === 0 && <Text style={s.body}>正在准备第一步…</Text>}{steps.map(step => <View key={step.id} style={s.step}><Text style={s.stepNumber}>{String(step.stepIndex).padStart(2, '0')}</Text><View style={s.flex}><Text style={s.body}>{describeAction(step)}</Text><Text style={[s.small, { color: step.success ? C.green : C.muted }]}>{STATUS[step.status]}</Text>{step.error && <Text style={[s.small, { color: C.red }]}>{errorText(new Error(step.error))}</Text>}</View></View>)}
      {done && <View style={s.result}><Text style={s.label}>{planningOnly ? '预览已结束' : '结果待你核对'}</Text><Text style={s.body}>{summary}</Text><Text style={s.small}>{planningOnly ? '预览不会操作手机，也不代表任务已实际完成。' : '上方记录反映手机动作回执。请打开目标应用确认草稿或最终结果。'}</Text></View>}{!running && message('停止不能撤回已经执行的操作；已交给手机的动作仍会补充实际结果。')}
    </ScrollView></SafeAreaView>;

  return <SafeAreaView style={s.root}><StatusBar style="dark" /><View style={s.topbar}>{mark}<TouchableOpacity accessibilityRole="button" accessibilityLabel="退出登录" onPress={() => { void signOut(); }} style={s.account}><Text style={s.small}>退出</Text></TouchableOpacity></View>
    <View style={s.taskModes}>{(['business', 'phone'] as const).map(mode => <TouchableOpacity key={mode} accessibilityRole="button" accessibilityState={{ selected: taskMode === mode, disabled: businessBusy && taskMode !== mode }} disabled={businessBusy && taskMode !== mode} onPress={() => setTaskMode(mode)} style={[s.taskMode, taskMode === mode && s.activeTaskMode, businessBusy && taskMode !== mode && s.disabled]}><Text style={[s.body, taskMode === mode && { color: C.paper }]}>{mode === 'business' ? '业务草稿' : '手机操作'}</Text></TouchableOpacity>)}</View>
    {taskMode === 'business' ? <BusinessTasks key={identity.user.id} client={businessClient} onBusyChange={businessClient.onBusyChange} /> : <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}><Text style={s.eyebrow}>你好，{identity.user.firstName || identity.user.email.split('@')[0]}</Text><Text style={s.hero}>这次，{'\n'}交给 Forge。</Text><Text style={s.intro}>从一个小任务开始。你确认，助手执行。</Text>
      <View style={s.taskShelf}>{TASKS.map((task, i) => <TouchableOpacity accessibilityRole="button" key={task.name} onPress={() => setGoal(task.goal)} style={s.task}><Text style={s.taskNumber}>0{i + 1}</Text><Text style={s.taskName}>{task.name}</Text><Text style={s.small}>{task.hint}</Text></TouchableOpacity>)}</View>
      <Text style={s.label}>你想完成什么？</Text><TextInput accessibilityLabel="任务目标" value={goal} onChangeText={setGoal} multiline maxLength={2000} placeholder="例如：根据客户消息写好回复，先不发送…" placeholderTextColor={C.muted} style={[s.input, s.goalInput]} />
      <View style={s.mode}><View style={s.flex}><Text style={s.body}>先预览步骤</Text><Text style={s.small}>{planningOnly ? '只生成计划，不操作手机' : '逐项批准后，操作所选应用'}</Text></View><Switch accessibilityLabel="先预览步骤" value={planningOnly} onValueChange={setPlanningOnly} trackColor={{ true: C.green, false: C.line }} thumbColor={C.paper} /></View>
      {!planningOnly && <View style={s.appSection}><Text style={s.label}>本次只操作这个应用</Text>{button(target?.label || '选择手机应用', () => { void chooseApp(); }, loadingApps, true)}{choosingApp && <View style={s.appList}>{loadingApps ? <ActivityIndicator color={C.green} /> : apps.length ? apps.map(app => <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: target?.packageName === app.packageName }} key={app.packageName} onPress={() => { setTarget(app); setChoosingApp(false); }} style={s.appRow}><Text style={s.body}>{app.label}</Text><Text style={s.small}>{target?.packageName === app.packageName ? '已选择' : '选择'}</Text></TouchableOpacity>) : <Text style={s.small}>暂无可打开的应用。请安装目标应用后重试。</Text>}</View>}
        <Text style={s.footnote}>开始前请把目标页面准备好。Forge 仅在所选应用中执行操作，屏幕截图会用于规划；审批时会返回这里。</Text>{button('设置无障碍权限', () => { void showAccessibilitySettings(); }, false, true)}
      </View>}
      <View style={s.limit}><Text style={s.small}>本次最多</Text><View style={s.choices}>{[5, 8, 10, 12].map(value => <TouchableOpacity accessibilityRole="button" accessibilityLabel={`最多 ${value} 步`} accessibilityState={{ selected: maxSteps === value }} key={value} onPress={() => setMaxSteps(value)} style={[s.choice, maxSteps === value && s.chosen]}><Text style={[s.small, maxSteps === value && { color: C.paper }]}>{value} 步</Text></TouchableOpacity>)}</View></View>
      {message(error, true)}{message(notice)}{recovery}{button(draining ? '上一任务正在收尾…' : starting ? '正在准备…' : planningOnly ? '预览任务 →' : '打开应用并开始 →', () => { void startAgent(); }, !!existingTask || draining || starting || !goal.trim() || (!planningOnly && !target))}{button('查看未完成任务', () => { void findExistingTask(); }, false, true)}<Text style={s.footnote}>当前使用免费模型，繁忙时可能需要稍后再试。草稿需你核对，发送与发布也需逐项确认。</Text><View style={s.footer}><Text style={s.small}>时间留给更值得的事。</Text><Text style={s.small}>FORGE</Text></View>
    </ScrollView>}</SafeAreaView>;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg }, flex: { flex: 1 }, content: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 40 }, loginContent: { flexGrow: 1, padding: 28, paddingTop: 42 },
  taskModes: { flexDirection: 'row', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: 1, borderColor: C.line }, taskMode: { flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: C.paper, borderRadius: 10 }, activeTaskMode: { backgroundColor: C.green },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 }, brandMark: { width: 30, height: 30, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }, brandLetter: { color: C.accent, fontSize: 21, fontWeight: '800' },
  wordmark: { color: C.ink, fontSize: 14, fontWeight: '800', letterSpacing: 1 }, wordmarkLight: { fontWeight: '400', color: C.muted }, topbar: { minHeight: 68, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: C.line, gap: 14 }, account: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: C.green, fontSize: 12, fontWeight: '600', letterSpacing: 1.2, marginTop: 24, marginBottom: 14 }, hero: { color: C.ink, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 36, lineHeight: 48, marginTop: 8 }, intro: { color: C.muted, fontSize: 15, lineHeight: 24, marginTop: 18 },
  service: { marginTop: 22, paddingBottom: 16, borderBottomWidth: 1, borderColor: C.line }, loginForm: { marginTop: 8 }, label: { color: C.muted, fontSize: 12, fontWeight: '600', marginTop: 16, marginBottom: 10 }, input: { minHeight: 52, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 15, color: C.ink, fontSize: 16 }, goalInput: { minHeight: 120, textAlignVertical: 'top', lineHeight: 24 },
  button: { minHeight: 50, backgroundColor: C.ink, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', marginTop: 12 }, buttonText: { color: C.accent, fontWeight: '700', fontSize: 15 }, secondary: { backgroundColor: C.paper, borderWidth: 1, borderColor: C.line }, disabled: { opacity: 0.45 },
  small: { color: C.muted, fontSize: 12, lineHeight: 19 }, footnote: { color: C.muted, fontSize: 12, lineHeight: 20, marginTop: 14 }, body: { color: C.ink, fontSize: 15, lineHeight: 24 }, title: { color: C.ink, fontSize: 23, lineHeight: 32, fontWeight: '600', flexShrink: 1 }, footer: { borderTopWidth: 1, borderColor: C.line, paddingTop: 18, marginTop: 32, flexDirection: 'row', justifyContent: 'space-between' },
  taskShelf: { marginTop: 28, marginBottom: 18 }, task: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: C.line, minHeight: 64, gap: 12 }, taskNumber: { color: C.green, fontSize: 12, fontFamily: 'monospace' }, taskName: { color: C.ink, fontSize: 16, fontWeight: '600' }, mode: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, gap: 16 }, appSection: { paddingBottom: 12 },
  appList: { backgroundColor: C.paper, borderRadius: 12, padding: 12, marginTop: 10, borderWidth: 1, borderColor: C.line }, appRow: { paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', gap: 12, borderBottomWidth: 1, borderColor: C.line }, limit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 10, flexWrap: 'wrap', gap: 12 }, choices: { flexDirection: 'row', gap: 6 }, choice: { minHeight: 44, minWidth: 48, padding: 10, backgroundColor: C.paper, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, chosen: { backgroundColor: C.green },
  message: { backgroundColor: C.paper, padding: 14, borderWidth: 1, borderColor: C.line, borderRadius: 10, marginTop: 12 }, error: { borderColor: '#dab4a9' }, phaseRow: { flexDirection: 'row', alignItems: 'center', gap: 16 }, goalSummary: { color: C.muted, fontSize: 14, lineHeight: 23, marginTop: 14 }, meta: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line, paddingVertical: 14, marginTop: 20 },
  approval: { borderWidth: 1, borderColor: C.green, backgroundColor: C.paper, borderRadius: 16, padding: 18, marginTop: 20, gap: 12 }, step: { borderTopWidth: 1, borderColor: C.line, paddingVertical: 16, flexDirection: 'row', gap: 16 }, stepNumber: { color: C.green, fontFamily: 'monospace', fontSize: 13, paddingTop: 3 }, result: { borderLeftWidth: 3, borderColor: C.green, paddingLeft: 18, marginTop: 20, gap: 8 },
});
