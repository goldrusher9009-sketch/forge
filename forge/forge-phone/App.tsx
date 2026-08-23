import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  NativeModules,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ForgeAgentLoop } from './src/ForgeAgent';
import { AgentStep, FORGE_API, NativeExecutionResult, PhoneAction } from './src/config';

type ForgeAccessibilityBridge = {
  isAccessibilityEnabled(): Promise<boolean>;
  openAccessibilitySettings(): Promise<boolean>;
  captureScreen(): Promise<string>;
  getCurrentPackage(): Promise<string>;
  performAction(actionJson: string, expectedPackage: string): Promise<NativeExecutionResult>;
};

const accessibility = NativeModules.ForgeAccessibility as ForgeAccessibilityBridge | undefined;

const C = {
  bg: '#0a0a0f', surface: '#12121a', surface2: '#1a1a28',
  border: '#2a2a3a', text: '#e8e8f0', text2: '#9090a0', text3: '#5a5a70',
  purple: '#8b5cf6', green: '#10b981', red: '#ef4444', yellow: '#f59e0b',
  blue: '#3b82f6', orange: '#f97316',
};

const ACTION_COLORS: Record<string, string> = {
  tap: C.blue, long_press: C.blue, type: C.green, swipe: C.yellow,
  scroll: C.yellow, back: C.orange, home: C.orange, wait: C.text3, done: C.green,
};

const ACTION_ICONS: Record<string, string> = {
  tap: '👆', long_press: '👇', type: '⌨️', swipe: '👉',
  scroll: '📜', back: '◀️', home: '🏠', wait: '⏳', done: '✅',
};

const PACKAGE_PATTERN = /^[A-Za-z0-9_.]{3,200}$/;

function parsePackages(value: string): string[] {
  return Array.from(new Set(value.split(/[\s,]+/).map(item => item.trim()).filter(Boolean)));
}

function approvalPrompt(step: AgentStep): Promise<boolean> {
  const details = [
    `Action: ${step.action}`,
    `Arguments: ${JSON.stringify(step.args)}`,
    `Package: ${step.currentPackage || 'unknown'}`,
    `Risk: ${step.riskLevel}`,
    step.reasoning ? `Reason: ${step.reasoning}` : '',
  ].filter(Boolean).join('\n\n');
  return new Promise(resolve => {
    Alert.alert('Approve this exact action?', details, [
      { text: 'Reject and stop', style: 'destructive', onPress: () => resolve(false) },
      { text: 'Approve once', onPress: () => resolve(true) },
    ], { cancelable: false });
  });
}

export default function App() {
  const [token, setToken] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [goal, setGoal] = useState('');
  const [allowedPackageInput, setAllowedPackageInput] = useState('');
  const [maxSteps, setMaxSteps] = useState(8);
  const [planningOnly, setPlanningOnly] = useState(true);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [screen, setScreen] = useState<'login' | 'main' | 'running'>('login');
  const agentRef = useRef<ForgeAgentLoop | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const connect = () => {
    const trimmed = tokenInput.trim();
    if (!trimmed) { Alert.alert('Token required', 'Enter your Forge access token.'); return; }
    setToken(trimmed);
    setTokenInput('');
    setScreen('main');
  };

  const showAccessibilitySettings = async () => {
    if (!accessibility) {
      Alert.alert('Native build required', 'Install the Forge Phone Android build; Expo Go cannot load the Accessibility Service.');
      return;
    }
    await accessibility.openAccessibilitySettings();
  };

  const startAgent = async () => {
    const trimmedGoal = goal.trim();
    if (!trimmedGoal) { Alert.alert('Goal required', 'Enter a bounded goal.'); return; }

    const allowedPackages = parsePackages(allowedPackageInput);
    if (allowedPackages.some(item => !PACKAGE_PATTERN.test(item))) {
      Alert.alert('Invalid package allowlist', 'Use Android package names such as com.android.settings, separated by commas.');
      return;
    }
    if (!planningOnly) {
      if (Platform.OS !== 'android' || !accessibility) {
        Alert.alert('Android native build required', 'Real execution is available only in the Android native build. Use planning mode on this device.');
        return;
      }
      if (!allowedPackages.length) {
        Alert.alert('Package allowlist required', 'List every Android app package the session may control.');
        return;
      }
      if (!(await accessibility.isAccessibilityEnabled())) {
        Alert.alert('Accessibility Service disabled', 'Enable Forge Phone Agent in Android Accessibility settings before starting.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => { void showAccessibilitySettings(); } },
        ]);
        return;
      }
    }

    setRunning(true);
    setDone(false);
    setSteps([]);
    setSummary('');
    setError('');
    setScreen('running');

    if (!planningOnly) {
      // Give the Owner time to foreground one of the explicitly allowed apps.
      await new Promise(resolve => setTimeout(resolve, 5000));
      const currentPackage = (await accessibility!.getCurrentPackage()).trim();
      if (!allowedPackages.includes(currentPackage)) {
        setRunning(false);
        setError(`Current app ${currentPackage || 'unknown'} is not in the package allowlist.`);
        return;
      }
    }

    agentRef.current = new ForgeAgentLoop({
      token,
      captureScreenshot: async () => planningOnly ? null : accessibility!.captureScreen(),
      getCurrentPackage: async () => planningOnly ? '' : accessibility!.getCurrentPackage(),
      executeAction: async (action: PhoneAction, expectedPackage: string) => {
        if (planningOnly) throw new Error('PHONE_ACTION_PLANNING_ONLY');
        if (!accessibility || !(await accessibility.isAccessibilityEnabled())) {
          throw new Error('PHONE_ACCESSIBILITY_DISABLED');
        }
        const currentPackage = (await accessibility.getCurrentPackage()).trim();
        if (currentPackage !== expectedPackage) throw new Error('PHONE_PACKAGE_CHANGED');
        return accessibility.performAction(JSON.stringify(action), expectedPackage);
      },
      requestApproval: approvalPrompt,
      onStep: step => {
        setSteps(previous => {
          const existing = previous.findIndex(item => item.id === step.id);
          if (existing < 0) return [...previous, step];
          const updated = [...previous];
          updated[existing] = step;
          return updated;
        });
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      },
      onDone: (message) => {
        setSummary(message);
        setDone(true);
        setRunning(false);
      },
      onError: message => {
        setError(message);
        setRunning(false);
      },
    });

    await agentRef.current.start(trimmedGoal, {
      maxSteps,
      planningOnly,
      allowedPackages,
      confirmationMode: 'every_action',
      tokenBudget: 8000,
      costBudgetUsd: 0.5,
    });
  };

  const stopAgent = async () => {
    await agentRef.current?.stop();
    setRunning(false);
  };

  if (screen === 'login') {
    return (
      <SafeAreaView style={[s.root, s.centered]}>
        <StatusBar style="light" />
        <Text style={{ fontSize: 40, marginBottom: 8 }}>🦾</Text>
        <Text style={[s.h1, { fontSize: 28, marginBottom: 4 }]}>Forge Phone</Text>
        <Text style={[s.muted, { marginBottom: 28, textAlign: 'center' }]}>Permissioned phone actions with Owner approval.</Text>
        <View style={{ width: '100%', maxWidth: 340 }}>
          <TextInput
            value={tokenInput}
            onChangeText={setTokenInput}
            placeholder="Forge access token"
            placeholderTextColor={C.text3}
            style={s.input}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={connect} style={s.btn}><Text style={s.btnText}>Connect to Forge →</Text></TouchableOpacity>
          <Text style={[s.muted, { textAlign: 'center', fontSize: 11, marginTop: 12 }]}>
            Token stays only in this app session. API: {FORGE_API}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === 'running') {
    const successfulActions = steps.filter(step => step.executed && step.success).length;
    return (
      <SafeAreaView style={s.root}>
        <StatusBar style="light" />
        <View style={[s.header, { gap: 8 }]}>
          <TouchableOpacity onPress={() => { void stopAgent(); setScreen('main'); }}><Text style={{ color: C.text2, fontSize: 16 }}>← Back</Text></TouchableOpacity>
          <Text style={[s.h1, { flex: 1 }]} numberOfLines={1}>{goal}</Text>
          {running && <TouchableOpacity onPress={() => { void stopAgent(); }} style={[s.btn, s.stopButton]}><Text style={[s.btnText, { fontSize: 12 }]}>⏹ Stop</Text></TouchableOpacity>}
        </View>

        <View style={[s.notice, { borderColor: planningOnly ? C.yellow : C.green }]}>
          <Text style={{ color: planningOnly ? C.yellow : C.green, fontSize: 12, textAlign: 'center' }}>
            {planningOnly
              ? 'PLANNING ONLY — No native action can be authorized or executed.'
              : 'CONTROLLED EXECUTION — Switch to an allowed app. Every executable action requires one-time Owner approval.'}
          </Text>
        </View>

        <ScrollView ref={scrollRef} style={s.stepList} contentContainerStyle={{ padding: 12, gap: 8 }}>
          {steps.map(step => (
            <View key={step.id} style={[s.stepCard, { borderColor: (ACTION_COLORS[step.action] || C.border) + '60' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Text style={{ fontSize: 20 }}>{ACTION_ICONS[step.action] || '⚙️'}</Text>
                <Text style={[s.stepAction, { color: ACTION_COLORS[step.action] || C.text }]}>{step.action.toUpperCase()}</Text>
                <Text style={[s.muted, { marginLeft: 'auto', fontSize: 11 }]}>#{step.stepIndex} · {step.status}</Text>
              </View>
              {Object.keys(step.args).length > 0 && <Text style={[s.muted, s.code]}>{JSON.stringify(step.args)}</Text>}
              {step.currentPackage && <Text style={[s.muted, { fontSize: 11 }]}>Package: {step.currentPackage}</Text>}
              <Text style={[s.muted, { fontSize: 12 }]}>{step.reasoning}</Text>
              {step.progress && <Text style={[s.muted, { fontSize: 11, color: C.green, marginTop: 2 }]}>↳ {step.progress}</Text>}
              {step.error && <Text style={{ color: C.red, fontSize: 11, marginTop: 4 }}>{step.error}</Text>}
            </View>
          ))}

          {running && <View style={[s.stepCard, { borderColor: C.purple + '40', flexDirection: 'row', alignItems: 'center', gap: 8 }]}><ActivityIndicator color={C.purple} size="small" /><Text style={[s.muted, { fontSize: 12 }]}>{steps.length ? 'Waiting for the next bounded action…' : planningOnly ? 'Creating the planning session…' : 'Switch to an allowed app now…'}</Text></View>}

          {done && <View style={[s.stepCard, s.successCard]}><Text style={{ fontSize: 24, marginBottom: 8 }}>✅</Text><Text style={[s.h2, { color: C.green, marginBottom: 8 }]}>Session Complete</Text><Text style={{ color: C.text, fontSize: 13, lineHeight: 20 }}>{summary}</Text><Text style={[s.muted, { marginTop: 8, fontSize: 11 }]}>{planningOnly ? `${steps.length} actions planned` : `${successfulActions} native actions succeeded`}</Text></View>}
          {error !== '' && <View style={[s.stepCard, s.errorCard]}><Text style={{ color: C.red, fontSize: 13 }}>❌ {error}</Text></View>}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const examples = [
    'Open Android Settings and navigate to the Wi-Fi screen',
    'Open the Clock app and prepare a 25-minute timer for review',
    'Open the browser and search for restaurants near me',
    'Navigate back to the home screen and open Maps',
  ];

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 40 }}>🦾</Text>
          <Text style={[s.h1, { fontSize: 26 }]}>Forge Phone Agent</Text>
          <Text style={[s.muted, { textAlign: 'center', marginTop: 4 }]}>Bounded actions, explicit permissions, and verifiable native receipts.</Text>
        </View>

        <Text style={s.label}>Bounded goal</Text>
        <TextInput value={goal} onChangeText={setGoal} multiline maxLength={2000} placeholder="e.g. Open Settings and navigate to Wi-Fi…" placeholderTextColor={C.text3} style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]} />

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={s.label}>Planning only</Text>
            <Switch value={planningOnly} onValueChange={setPlanningOnly} trackColor={{ true: C.purple, false: C.border }} thumbColor="#fff" />
          </View>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <Text style={[s.label, { marginRight: 4 }]}>Max:</Text>
            {[5, 8, 10, 12].map(value => <TouchableOpacity key={value} onPress={() => setMaxSteps(value)} style={[s.stepChoice, maxSteps === value && { backgroundColor: C.purple }]}><Text style={{ color: maxSteps === value ? '#fff' : C.text2, fontSize: 12 }}>{value}</Text></TouchableOpacity>)}
          </View>
        </View>

        {!planningOnly && <View style={{ marginTop: 12 }}><Text style={s.label}>Allowed Android packages</Text><TextInput value={allowedPackageInput} onChangeText={setAllowedPackageInput} autoCapitalize="none" autoCorrect={false} placeholder="com.android.settings, com.google.android.apps.maps" placeholderTextColor={C.text3} style={s.input} /><Text style={[s.muted, { fontSize: 11 }]}>The session fails closed if the foreground app is outside this allowlist.</Text></View>}

        <TouchableOpacity onPress={() => { void startAgent(); }} disabled={!goal.trim()} style={[s.btn, { marginTop: 16, backgroundColor: goal.trim() ? C.purple : C.surface2 }]}><Text style={s.btnText}>🚀 {planningOnly ? 'Plan Safely' : 'Start Controlled Session'}</Text></TouchableOpacity>

        {!planningOnly && Platform.OS === 'android' && <View style={[s.card, { borderColor: C.yellow, marginTop: 12 }]}><Text style={{ color: C.yellow, fontSize: 13, fontWeight: '700', marginBottom: 4 }}>Accessibility Service Required</Text><Text style={[s.muted, { fontSize: 12, marginBottom: 10 }]}>The native build verifies the foreground package before every authorized action. Screenshots are hashed by Forge and are not stored.</Text><TouchableOpacity onPress={() => { void showAccessibilitySettings(); }} style={[s.btn, { backgroundColor: C.surface2 }]}><Text style={[s.btnText, { color: C.text }]}>Open Accessibility Settings</Text></TouchableOpacity></View>}

        <Text style={[s.label, { marginTop: 20 }]}>Pilot examples</Text>
        <View style={{ gap: 8 }}>{examples.map(example => <TouchableOpacity key={example} onPress={() => setGoal(example)} style={s.card}><Text style={{ color: C.text, fontSize: 13 }}>{example}</Text></TouchableOpacity>)}</View>

        <TouchableOpacity onPress={() => { setToken(''); setTokenInput(''); setScreen('login'); }} style={[s.btn, { marginTop: 24, backgroundColor: C.surface2 }]}><Text style={[s.btnText, { color: C.text2 }]}>Disconnect</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center' },
  h1: { fontSize: 22, fontWeight: '800', color: C.text },
  h2: { fontSize: 18, fontWeight: '700', color: C.text },
  muted: { color: C.text2, fontSize: 13 },
  label: { color: C.text2, fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: C.surface, color: C.text, borderRadius: 12, padding: 14, fontSize: 14, borderWidth: 1, borderColor: C.border, marginBottom: 4 },
  btn: { backgroundColor: C.purple, borderRadius: 12, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  stopButton: { backgroundColor: C.red, paddingVertical: 6, paddingHorizontal: 14 },
  card: { backgroundColor: C.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border },
  notice: { margin: 12, padding: 10, backgroundColor: C.surface, borderRadius: 8, borderWidth: 1 },
  stepCard: { backgroundColor: C.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.border },
  stepAction: { fontSize: 14, fontWeight: '700' },
  stepList: { flex: 1 },
  code: { fontFamily: 'monospace', fontSize: 11, marginBottom: 4 },
  successCard: { borderColor: C.green, backgroundColor: 'rgba(16,185,129,0.08)' },
  errorCard: { borderColor: C.red, backgroundColor: 'rgba(239,68,68,0.08)' },
  stepChoice: { padding: 6, paddingHorizontal: 10, backgroundColor: C.surface2, borderRadius: 6 },
});
