/**
 * Forge Phone Agent — Main App
 *
 * This app turns your phone into an AI-controlled device.
 * Give it a goal → it reads your screen → AI decides what to tap/type → executes.
 *
 * Platform capabilities:
 *  - Android: Full accessibility control via AccessibilityService (APK required)
 *  - iOS: Limited (Shortcuts integration) — full control requires TestFlight build
 *
 * For DEMO mode (no accessibility service), it shows what it WOULD do without executing.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, Alert, Platform, ActivityIndicator, Switch, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { ForgeAgentLoop } from './src/ForgeAgent';
import { AgentStep } from './src/config';

const FORGE_API = 'https://forge-production-2692.up.railway.app';
const { width: SCREEN_W } = Dimensions.get('window');

// ─── Color palette ──────────────────────────────────────────────────────────
const C = {
  bg: '#0a0a0f', surface: '#12121a', surface2: '#1a1a28',
  border: '#2a2a3a', text: '#e8e8f0', text2: '#9090a0', text3: '#5a5a70',
  purple: '#8b5cf6', green: '#10b981', red: '#ef4444', yellow: '#f59e0b',
  blue: '#3b82f6', orange: '#f97316',
};

// ─── Action colors ─────────────────────────────────────────────────────────
const ACTION_COLORS: Record<string, string> = {
  tap: C.blue, long_press: C.blue, type: C.green, swipe: C.yellow,
  scroll: C.yellow, back: C.orange, home: C.orange, wait: C.text3, done: C.green,
};

const ACTION_ICONS: Record<string, string> = {
  tap: '👆', long_press: '👇', type: '⌨️', swipe: '👉',
  scroll: '📜', back: '◀️', home: '🏠', wait: '⏳', done: '✅',
};

export default function App() {
  const [token, setToken] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [goal, setGoal] = useState('');
  const [maxSteps, setMaxSteps] = useState(15);
  const [demoMode, setDemoMode] = useState(true);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [screen, setScreen] = useState<'login' | 'main' | 'running'>('login');
  const agentRef = useRef<ForgeAgentLoop | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Load saved token
  useEffect(() => {
    AsyncStorage.getItem('forge_token').then(t => {
      if (t) { setToken(t); setScreen('main'); }
    });
  }, []);

  const saveToken = async () => {
    if (!tokenInput.trim()) { Alert.alert('Error', 'Enter your Forge token'); return; }
    await AsyncStorage.setItem('forge_token', tokenInput.trim());
    setToken(tokenInput.trim());
    setScreen('main');
  };

  const startAgent = async () => {
    if (!goal.trim()) { Alert.alert('Error', 'Enter a goal'); return; }
    setRunning(true);
    setDone(false);
    setSteps([]);
    setSummary('');
    setError('');
    setScreen('running');

    // Mock screenshot capture (in real app, use AccessibilityService / UIAutomation)
    const captureScreenshot = async (): Promise<string | null> => {
      if (demoMode) return null; // No real screenshot in demo
      // In production: call native bridge to capture screen
      // Example: await NativeModules.ForgeAccessibility.captureScreen()
      return null;
    };

    // Mock action executor (in real app, use AccessibilityService)
    const executeAction = async (action: any): Promise<boolean> => {
      if (demoMode) {
        // Simulate execution time
        await new Promise(r => setTimeout(r, 500));
        return true;
      }
      // In production: await NativeModules.ForgeAccessibility.performAction(action)
      return true;
    };

    agentRef.current = new ForgeAgentLoop({
      token,
      captureScreenshot,
      executeAction,
      onStep: (step) => {
        setSteps(prev => [...prev, step]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      },
      onDone: (sum, allSteps) => {
        setSummary(sum);
        setDone(true);
        setRunning(false);
      },
      onError: (msg) => {
        setError(msg);
        setRunning(false);
      }
    });

    agentRef.current.start(goal, maxSteps);
  };

  const stopAgent = () => {
    agentRef.current?.stop();
    setRunning(false);
  };

  // ─── LOGIN SCREEN ──────────────────────────────────────────────────────────
  if (screen === 'login') {
    return (
      <SafeAreaView style={[s.root, { justifyContent:'center', alignItems:'center' }]}>
        <StatusBar style="light" />
        <Text style={{ fontSize:40, marginBottom:8 }}>🦾</Text>
        <Text style={[s.h1, { fontSize:28, marginBottom:4 }]}>Forge Phone</Text>
        <Text style={[s.muted, { marginBottom:32, textAlign:'center' }]}>
          AI that controls your phone.{'\n'}Enter your Forge API token to start.
        </Text>
        <View style={{ width:'100%', maxWidth:340 }}>
          <TextInput
            value={tokenInput} onChangeText={setTokenInput}
            placeholder="Paste your Forge token..."
            placeholderTextColor={C.text3}
            style={s.input}
            secureTextEntry autoCapitalize="none"
          />
          <TouchableOpacity onPress={saveToken} style={[s.btn, { backgroundColor:C.purple }]}>
            <Text style={s.btnText}>Connect to Forge →</Text>
          </TouchableOpacity>
          <Text style={[s.muted, { textAlign:'center', fontSize:11, marginTop:12 }]}>
            Get your token at forge-sand-two.vercel.app → Settings → API Token
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── RUNNING SCREEN ────────────────────────────────────────────────────────
  if (screen === 'running') {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar style="light" />
        <View style={[s.header, { gap:8 }]}>
          <TouchableOpacity onPress={() => { stopAgent(); setScreen('main'); }}>
            <Text style={{ color:C.text2, fontSize:16 }}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.h1} numberOfLines={1} ellipsizeMode="tail">{goal}</Text>
          {running && (
            <TouchableOpacity onPress={stopAgent} style={[s.btn, { backgroundColor:C.red, paddingVertical:6, paddingHorizontal:14 }]}>
              <Text style={[s.btnText, { fontSize:12 }]}>⏹ Stop</Text>
            </TouchableOpacity>
          )}
        </View>

        {demoMode && (
          <View style={{ margin:12, padding:10, background:'rgba(245,158,11,0.15)', borderRadius:8, borderWidth:1, borderColor:C.yellow }}>
            <Text style={{ color:C.yellow, fontSize:12, textAlign:'center' }}>
              🎭 DEMO MODE — Actions are planned but not executed on device.{'\n'}
              Enable Accessibility Service for real phone control.
            </Text>
          </View>
        )}

        <ScrollView ref={scrollRef} style={s.stepList} contentContainerStyle={{ padding:12, gap:8 }}>
          {steps.map((step, i) => (
            <View key={i} style={[s.stepCard, { borderColor: (ACTION_COLORS[step.action] || C.border) + '60' }]}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:4 }}>
                <Text style={{ fontSize:20 }}>{ACTION_ICONS[step.action] || '⚙️'}</Text>
                <Text style={[s.stepAction, { color: ACTION_COLORS[step.action] || C.text }]}>{step.action.toUpperCase()}</Text>
                <Text style={[s.muted, { marginLeft:'auto', fontSize:11 }]}>#{i+1}</Text>
              </View>
              {Object.keys(step.args).length > 0 && (
                <Text style={[s.muted, { fontFamily:'monospace', fontSize:11, marginBottom:4 }]}>
                  {JSON.stringify(step.args)}
                </Text>
              )}
              <Text style={[s.muted, { fontSize:12 }]}>{step.reasoning}</Text>
              {step.progress && <Text style={[s.muted, { fontSize:11, color:C.green, marginTop:2 }]}>↳ {step.progress}</Text>}
            </View>
          ))}

          {running && steps.length === 0 && (
            <View style={{ alignItems:'center', padding:40 }}>
              <ActivityIndicator color={C.purple} size="large" />
              <Text style={[s.muted, { marginTop:12 }]}>Agent is analyzing the goal…</Text>
            </View>
          )}

          {running && steps.length > 0 && (
            <View style={[s.stepCard, { borderColor:C.purple+'40', flexDirection:'row', alignItems:'center', gap:8 }]}>
              <ActivityIndicator color={C.purple} size="small" />
              <Text style={[s.muted, { fontSize:12 }]}>Deciding next action…</Text>
            </View>
          )}

          {done && (
            <View style={[s.stepCard, { borderColor:C.green, backgroundColor:'rgba(16,185,129,0.08)' }]}>
              <Text style={{ fontSize:24, marginBottom:8 }}>✅</Text>
              <Text style={[s.h2, { color:C.green, marginBottom:8 }]}>Task Complete</Text>
              <Text style={{ color:C.text, fontSize:13, lineHeight:20 }}>{summary}</Text>
              <Text style={[s.muted, { marginTop:8, fontSize:11 }]}>{steps.length} steps executed</Text>
            </View>
          )}

          {error !== '' && (
            <View style={[s.stepCard, { borderColor:C.red, backgroundColor:'rgba(239,68,68,0.08)' }]}>
              <Text style={{ color:C.red, fontSize:13 }}>❌ {error}</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── MAIN SCREEN ──────────────────────────────────────────────────────────
  const EXAMPLES = [
    'Open WhatsApp and send "I\'ll be 10 minutes late" to the last person I texted',
    'Search Google for best restaurants near me and text the top result to mom',
    'Open Gmail and summarize my 3 most recent unread emails',
    'Set a timer for 25 minutes in the Clock app',
    'Take a screenshot and send it via WhatsApp to John',
    'Open Spotify and play lo-fi hip hop',
    'Reply to the most recent text message with "Got it, thanks!"',
    'Open Maps and navigate home',
  ];

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ padding:16 }}>
        {/* Header */}
        <View style={{ alignItems:'center', marginBottom:24 }}>
          <Text style={{ fontSize:40 }}>🦾</Text>
          <Text style={[s.h1, { fontSize:26 }]}>Forge Phone Agent</Text>
          <Text style={[s.muted, { textAlign:'center', marginTop:4 }]}>
            AI that controls your phone — browse, text, reply, and more
          </Text>
        </View>

        {/* Goal input */}
        <Text style={s.label}>What do you want me to do?</Text>
        <TextInput
          value={goal} onChangeText={setGoal} multiline
          placeholder="e.g. Open WhatsApp and reply to the last message saying I'm on my way..."
          placeholderTextColor={C.text3}
          style={[s.input, { minHeight:80, textAlignVertical:'top' }]}
        />

        {/* Settings row */}
        <View style={{ flexDirection:'row', alignItems:'center', marginTop:12, gap:12 }}>
          <View style={{ flex:1, flexDirection:'row', alignItems:'center', gap:8 }}>
            <Text style={s.label}>Demo mode</Text>
            <Switch
              value={demoMode} onValueChange={setDemoMode}
              trackColor={{ true:C.purple, false:C.border }}
              thumbColor={demoMode ? '#fff' : C.text3}
            />
          </View>
          <View style={{ flexDirection:'row', gap:4 }}>
            <Text style={[s.label, { marginRight:4 }]}>Max steps:</Text>
            {[5, 10, 15, 20].map(n => (
              <TouchableOpacity key={n} onPress={() => setMaxSteps(n)}
                style={{ padding:6, paddingHorizontal:10, backgroundColor:maxSteps===n?C.purple:C.surface2, borderRadius:6 }}>
                <Text style={{ color:maxSteps===n?'#fff':C.text2, fontSize:12 }}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {demoMode && (
          <Text style={[s.muted, { fontSize:11, marginTop:6 }]}>
            ℹ️ Demo mode plans actions without executing them. Enable Accessibility Service for real control.
          </Text>
        )}

        {/* Run button */}
        <TouchableOpacity onPress={startAgent} disabled={!goal.trim()} style={[s.btn, { marginTop:16, backgroundColor:goal.trim()?C.purple:C.surface2 }]}>
          <Text style={s.btnText}>🚀 {demoMode ? 'Plan Task (Demo)' : 'Run on Phone'}</Text>
        </TouchableOpacity>

        {/* Accessibility setup banner */}
        {!demoMode && Platform.OS === 'android' && (
          <View style={[s.card, { borderColor:C.yellow, marginTop:12 }]}>
            <Text style={{ color:C.yellow, fontSize:13, fontWeight:'700', marginBottom:4 }}>⚠️ Accessibility Service Required</Text>
            <Text style={[s.muted, { fontSize:12 }]}>
              To control other apps, enable Forge in Settings → Accessibility → Forge Phone Agent.{'\n'}
              This lets the AI tap, type, and navigate across all your apps.
            </Text>
          </View>
        )}

        {/* Example goals */}
        <Text style={[s.label, { marginTop:20 }]}>Example tasks</Text>
        <View style={{ gap:8 }}>
          {EXAMPLES.map((eg, i) => (
            <TouchableOpacity key={i} onPress={() => setGoal(eg)} style={s.card}>
              <Text style={{ color:C.text, fontSize:13 }}>{eg}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Capabilities */}
        <Text style={[s.label, { marginTop:20 }]}>What I can do</Text>
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
          {[
            '💬 WhatsApp', '📱 SMS', '🌐 Browse Web', '📧 Gmail',
            '📍 Maps', '🎵 Spotify', '📷 Camera', '⏰ Alarms',
            '📞 Calls', '📋 Copy/Paste', '🔍 Search', '📤 Share',
          ].map(cap => (
            <View key={cap} style={[s.chip]}>
              <Text style={{ color:C.text2, fontSize:12 }}>{cap}</Text>
            </View>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity onPress={() => { AsyncStorage.removeItem('forge_token'); setToken(''); setScreen('login'); }}
          style={[s.btn, { marginTop:24, backgroundColor:C.surface2 }]}>
          <Text style={[s.btnText, { color:C.text2 }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:      { flex:1, backgroundColor:C.bg },
  header:    { padding:16, paddingBottom:8, flexDirection:'row', alignItems:'center' },
  h1:        { fontSize:22, fontWeight:'800', color:C.text },
  h2:        { fontSize:18, fontWeight:'700', color:C.text },
  muted:     { color:C.text2, fontSize:13 },
  label:     { color:C.text2, fontSize:12, fontWeight:'600', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 },
  input:     { backgroundColor:C.surface, color:C.text, borderRadius:12, padding:14, fontSize:14, borderWidth:1, borderColor:C.border, marginBottom:4 },
  btn:       { backgroundColor:C.purple, borderRadius:12, padding:14, alignItems:'center' },
  btnText:   { color:'#fff', fontSize:15, fontWeight:'700' },
  card:      { backgroundColor:C.surface, borderRadius:12, padding:14, borderWidth:1, borderColor:C.border },
  stepCard:  { backgroundColor:C.surface, borderRadius:10, padding:12, borderWidth:1, borderColor:C.border },
  stepAction:{ fontSize:14, fontWeight:'700' },
  chip:      { backgroundColor:C.surface2, borderRadius:20, paddingVertical:5, paddingHorizontal:10, borderWidth:1, borderColor:C.border },
  stepList:  { flex:1 },
});
