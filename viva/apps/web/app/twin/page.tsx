'use client'
import { useState, useEffect } from 'react'
import { useAppStore, mockUser, RING_META } from '@/lib/store'
import { twin as twinApi } from '@/lib/api'
import clsx from 'clsx'

type AutonomyLevel = 'L1' | 'L2' | 'L3'

const AUTONOMY_META: Record<AutonomyLevel, { label: string; desc: string; color: string }> = {
  L1: { label: 'Suggestions', desc: 'Twin observes and advises. You decide everything.', color: '#6B7280' },
  L2: { label: 'Semi-Auto', desc: 'Twin handles routine tasks. Reviews required for high-stakes.', color: 'var(--ring-nutrition)' },
  L3: { label: 'Full Auto', desc: 'Twin manages autonomously. You set goals and review outcomes.', color: 'var(--v)' },
}

const TASK_AGENTS = [
  { id: 'health-agent', name: 'Health Agent', icon: '◎', status: 'active', task: 'Analyzing sleep data from last 7 days', ring: 'sleep' },
  { id: 'finance-agent', name: 'Finance Agent', icon: '◈', status: 'active', task: 'Monitoring 3 open prediction market positions', ring: 'wealth' },
  { id: 'social-agent', name: 'Social Agent', icon: '◉', status: 'idle', task: 'Waiting for feed signal threshold', ring: 'social' },
  { id: 'schedule-agent', name: 'Schedule Agent', icon: '◇', status: 'active', task: 'Blocked 2hrs focus time tomorrow 9-11am', ring: 'activity' },
  { id: 'market-agent', name: 'Market Agent', icon: '↗', status: 'active', task: 'Tracking 4 prediction markets, 1 flagged', ring: 'wealth' },
  { id: 'identity-agent', name: 'Identity Agent', icon: '◫', status: 'idle', task: 'ZK proof renewal due in 14 days', ring: 'nutrition' },
]

interface AgentLog {
  id: string
  agent: string
  action: string
  ts: number
  status: 'completed' | 'pending' | 'flagged'
  ring?: string
}

const INITIAL_LOGS: AgentLog[] = [
  { id: 'l1', agent: 'Schedule Agent', action: 'Blocked focus time 9–11am tomorrow based on calendar analysis', ts: Date.now() - 1800000, status: 'completed', ring: 'activity' },
  { id: 'l2', agent: 'Finance Agent', action: 'Flagged market: "GPT-5 AGI" — high volatility, recommend review', ts: Date.now() - 3600000, status: 'flagged', ring: 'wealth' },
  { id: 'l3', agent: 'Health Agent', action: 'Sleep average 7.2h this week. Nutrition ring -8pts. Suggest earlier meal window.', ts: Date.now() - 7200000, status: 'completed', ring: 'sleep' },
  { id: 'l4', agent: 'Social Agent', action: 'Feed signal threshold reached. 4 posts queued for review.', ts: Date.now() - 14400000, status: 'pending' },
  { id: 'l5', agent: 'Market Agent', action: 'Staked 50 $VIVA on "BTC > $150K" market at 63% odds', ts: Date.now() - 28800000, status: 'completed', ring: 'wealth' },
]

export default function TwinPage() {
  const { user, setUser } = useAppStore()
  const [autonomy, setAutonomy] = useState<AutonomyLevel>('L2')
  const [logs, setLogs] = useState<AgentLog[]>(INITIAL_LOGS)
  const [thinking, setThinking] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [mounted, setMounted] = useState(false)
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)
  const [twinMsg, setTwinMsg] = useState<string | null>(null)
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([])

  useEffect(() => {
    setMounted(true)
    if (!user) setUser(mockUser())
    loadTasks()
  }, [])

  async function loadTasks() {
    try {
      const tasks = await twinApi.tasks()
      if (Array.isArray(tasks) && tasks.length) {
        const apiLogs: AgentLog[] = tasks.map((t: any) => ({
          id: t.id,
          agent: t.agentType ?? 'Agent',
          action: t.description ?? t.goal ?? '',
          ts: new Date(t.createdAt ?? Date.now()).getTime(),
          status: t.status === 'DONE' ? 'completed' : t.status === 'FLAGGED' ? 'flagged' : 'pending',
          ring: t.ring,
        }))
        setLogs(apiLogs)
      }
    } catch { /* keep mock */ }
  }

  if (!mounted) return null
  const u = user || mockUser()

  async function askTwin() {
    if (!prompt.trim()) return
    setThinking(true)
    const q = prompt
    setPrompt('')
    const newHistory = [...chatHistory, { role: 'user', content: q }]
    setChatHistory(newHistory)
    try {
      const res = await twinApi.chat(q, newHistory)
      const reply = res.response ?? res.message ?? res.content ?? ''
      setTwinMsg(reply)
      setChatHistory([...newHistory, { role: 'assistant', content: reply }])
    } catch {
      const responses: Record<string, string> = {
        default: `Based on your current rings — Activity 91, Sleep 82, Nutrition 67 — your weakest signal is nutrition. I recommend a 16:8 eating window. Your calendar shows 3 afternoon meetings tomorrow; I can block 12-1pm as meal time. Shall I proceed?`,
        sleep: `Your sleep ring is at 82. Average this week: 7.2h. Pattern shows weekend deficit (-1.4h). Recommend consistent 10:30pm bedtime. Schedule Agent can set a reminder.`,
        money: `Finance Agent tracking: 3 open positions, total stake 750 $VIVA. Highest risk: GPT-5 AGI market at 29% odds. Recommend partial hedge if stake >500. Current wealth ring: 58.`,
      }
      const key = q.toLowerCase().includes('sleep') ? 'sleep' : q.toLowerCase().includes('money') || q.toLowerCase().includes('market') ? 'money' : 'default'
      setTwinMsg(responses[key])
    }
    setThinking(false)
    const newLog: AgentLog = {
      id: `l${Date.now()}`,
      agent: 'MetaAgent',
      action: `Query processed: "${q.slice(0, 60)}${q.length > 60 ? '…' : ''}"`,
      ts: Date.now(),
      status: 'completed',
    }
    setLogs(prev => [newLog, ...prev])
  }

  const activeLevel = AUTONOMY_META[autonomy]

  return (
    <div className="min-h-screen" style={{ background: 'var(--ink)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-6 lg:px-10 py-5 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.9)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="t-caption" style={{ fontSize: '0.625rem' }}>HYPERAGENT SYSTEM</p>
            <h1 className="font-bold mt-0.5" style={{ fontSize: 'clamp(1.2rem,3vw,1.8rem)', letterSpacing: '-0.03em' }}>
              AI Twin
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--ring-activity)' }} />
            <span className="text-xs text-white/40">6 agents online</span>
          </div>
        </div>
      </header>

      <div className="container-editorial py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT */}
          <div className="lg:col-span-4 space-y-6">
            {/* Autonomy control */}
            <section>
              <p className="t-caption mb-4" style={{ fontSize: '0.625rem' }}>AUTONOMY LEVEL</p>
              <div className="space-y-2">
                {(Object.entries(AUTONOMY_META) as [AutonomyLevel, typeof AUTONOMY_META[AutonomyLevel]][]).map(([level, meta]) => (
                  <button
                    key={level}
                    onClick={() => setAutonomy(level)}
                    className={clsx(
                      'w-full flex items-start gap-4 p-4 border text-left transition-all',
                      autonomy === level
                        ? 'border-violet-500/40 bg-violet-500/8'
                        : 'border-white/6 hover:border-white/15 bg-white/1'
                    )}
                    style={{ borderRadius: 'var(--radius)' }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="t-mono text-xs font-bold" style={{ color: meta.color }}>{level}</span>
                        <span className="text-sm font-semibold text-white/80">{meta.label}</span>
                        {autonomy === level && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
                        )}
                      </div>
                      <p className="text-xs text-white/40 leading-relaxed">{meta.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/25 mt-3">
                Current: <span style={{ color: activeLevel.color }}>{autonomy} — {activeLevel.label}</span>
              </p>
            </section>

            <div className="rule" />

            {/* Task Agents */}
            <section>
              <p className="t-caption mb-4" style={{ fontSize: '0.625rem' }}>TASK AGENTS · 6 ACTIVE</p>
              <div className="space-y-2">
                {TASK_AGENTS.map(agent => {
                  const ringColor = agent.ring ? RING_META[agent.ring as keyof typeof RING_META]?.color : 'rgba(245,244,240,0.3)'
                  const isExpanded = expandedAgent === agent.id
                  return (
                    <div key={agent.id}>
                      <button
                        onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                        className="w-full flex items-center gap-3 p-3 border border-white/6 hover:border-white/12 transition-all text-left"
                        style={{ borderRadius: 'var(--radius)' }}
                      >
                        <span className="text-sm" style={{ color: ringColor, fontFamily: 'monospace' }}>{agent.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white/70">{agent.name}</p>
                          {isExpanded && <p className="text-xs text-white/35 mt-0.5 leading-relaxed">{agent.task}</p>}
                        </div>
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: agent.status === 'active' ? 'var(--ring-activity)' : 'rgba(255,255,255,0.15)' }}
                        />
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-8 space-y-6">
            {/* Twin chat */}
            <section
              className="border border-white/8 p-5"
              style={{ borderRadius: 'var(--radius)' }}
            >
              <p className="t-caption mb-4" style={{ fontSize: '0.625rem' }}>ASK HYPERAGENT</p>

              {twinMsg && (
                <div
                  className="mb-4 p-4 border-l-2 text-sm text-white/80 leading-relaxed"
                  style={{ borderColor: 'var(--v)', background: 'rgba(124,58,237,0.05)', borderRadius: '0 4px 4px 0' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--v)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--v)' }}>MetaAgent · {autonomy}</span>
                  </div>
                  {twinMsg}
                </div>
              )}

              <div className="flex gap-3">
                <input
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && askTwin()}
                  placeholder="Ask your twin anything… 'optimize my sleep', 'check my markets'"
                  className="flex-1 bg-white/4 border border-white/8 px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/40 transition-colors"
                  style={{ borderRadius: 'var(--radius)' }}
                  disabled={thinking}
                />
                <button
                  onClick={askTwin}
                  disabled={!prompt.trim() || thinking}
                  className="px-5 py-3 text-sm font-semibold text-white disabled:opacity-30 transition-opacity"
                  style={{ background: 'var(--v)', borderRadius: 'var(--radius)' }}
                >
                  {thinking ? '…' : '→'}
                </button>
              </div>
              {thinking && (
                <p className="text-xs text-white/30 mt-2 animate-pulse">Twin is thinking across 6 agents…</p>
              )}
            </section>

            {/* Activity log */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <p className="t-caption" style={{ fontSize: '0.625rem' }}>AGENT ACTIVITY LOG</p>
                <span className="t-mono text-xs text-white/25">{logs.length} events</span>
              </div>
              <div className="space-y-2">
                {logs.map(log => {
                  const ringColor = log.ring ? RING_META[log.ring as keyof typeof RING_META]?.color : 'rgba(245,244,240,0.3)'
                  const statusColor = log.status === 'completed' ? 'var(--ring-activity)' : log.status === 'flagged' ? 'var(--ring-wealth)' : 'var(--ring-social)'
                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 border border-white/6"
                      style={{ borderRadius: 'var(--radius)', borderLeft: `2px solid ${statusColor}40` }}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold" style={{ color: ringColor || 'rgba(245,244,240,0.6)' }}>{log.agent}</span>
                          <span className="text-white/15">·</span>
                          <span className="text-xs text-white/25">{formatRelTime(log.ts)}</span>
                          {log.status === 'flagged' && (
                            <span className="ml-auto text-xs px-1.5 py-0.5 border" style={{ borderColor: 'var(--ring-wealth)30', color: 'var(--ring-wealth)', borderRadius: '3px', background: 'rgba(225,29,72,0.08)' }}>
                              flagged
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/55 leading-relaxed">{log.action}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Ring impact */}
            <section className="border border-white/6 p-5" style={{ borderRadius: 'var(--radius)' }}>
              <p className="t-caption mb-4" style={{ fontSize: '0.625rem' }}>TWIN IMPACT ON RINGS · THIS WEEK</p>
              <div className="grid grid-cols-5 gap-3">
                {(Object.entries(RING_META) as any[]).map(([key, meta]) => {
                  const impact = { sleep: +3, nutrition: -2, activity: +8, social: +1, wealth: +5 }[key] || 0
                  return (
                    <div key={key} className="flex flex-col items-center gap-2">
                      <span className="t-mono text-xs font-bold" style={{ color: impact >= 0 ? 'var(--ring-activity)' : 'var(--ring-wealth)' }}>
                        {impact >= 0 ? '+' : ''}{impact}
                      </span>
                      <div className="w-1 h-10 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="w-full rounded-full transition-all duration-700"
                          style={{
                            height: `${Math.abs(impact) * 10}%`,
                            background: meta.color,
                            marginTop: impact < 0 ? '0' : `${100 - Math.abs(impact) * 10}%`,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.55rem', opacity: 0.35 }}>{meta.label.slice(0, 3).toUpperCase()}</span>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatRelTime(ts: number) {
  const diff = Date.now() - ts
  const h = Math.floor(diff / 3600000)
  if (h < 1) return `${Math.floor(diff / 60000)}m`
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}
