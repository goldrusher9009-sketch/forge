'use client'
import { useState, useEffect, useRef } from 'react'
import { useAppStore, mockUser, RING_META } from '@/lib/store'
import { twin as twinApi } from '@/lib/api'
import clsx from 'clsx'

type AutonomyLevel = 'L1' | 'L2' | 'L3'

const AUTONOMY_META: Record<AutonomyLevel, { label: string; desc: string; color: string }> = {
  L1: { label: 'Suggestions', desc: 'Twin observes and advises. You decide everything.', color: '#6B7280' },
  L2: { label: 'Semi-Auto', desc: 'Twin handles routine tasks. Reviews required for high-stakes.', color: 'var(--ring-nutrition)' },
  L3: { label: 'Full Auto', desc: 'Twin manages autonomously. You set goals and review outcomes.', color: 'var(--v)' },
}

const AGENT_TYPES = [
  { id: 'health', label: 'Health', icon: '◎', ring: 'sleep' },
  { id: 'finance', label: 'Finance', icon: '◈', ring: 'wealth' },
  { id: 'social', label: 'Social', icon: '◉', ring: 'social' },
  { id: 'schedule', label: 'Schedule', icon: '◇', ring: 'activity' },
  { id: 'market', label: 'Market', icon: '↗', ring: 'wealth' },
  { id: 'search', label: 'Search', icon: '◫', ring: 'nutrition' },
]

interface Task {
  id: string
  title: string
  description?: string
  agentType: string
  autonomy: number
  status: string
  result?: string
  createdAt: string
  completedAt?: string
}

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
  agentType?: string
  poweredBy?: string
}

export default function TwinPage() {
  const { user, setUser } = useAppStore()
  const [autonomy, setAutonomy] = useState<AutonomyLevel>('L2')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [runningId, setRunningId] = useState<string | null>(null)
  const [runResult, setRunResult] = useState<Record<string, any>>({})

  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newAgentType, setNewAgentType] = useState('health')
  const [creating, setCreating] = useState(false)

  const [chat, setChat] = useState<ChatMsg[]>([])
  const [prompt, setPrompt] = useState('')
  const [thinking, setThinking] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!user) setUser(mockUser())
    loadTasks()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat])

  async function loadTasks() {
    setLoadingTasks(true)
    try {
      const data = await twinApi.tasks()
      setTasks(Array.isArray(data) ? data : [])
    } catch { setTasks([]) }
    finally { setLoadingTasks(false) }
  }

  async function createTask() {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const task = await twinApi.createTask({
        agentType: newAgentType,
        title: newTitle,
        description: newDesc || undefined,
        autonomy: autonomy === 'L1' ? 1 : autonomy === 'L2' ? 2 : 3,
      })
      setTasks(prev => [task, ...prev])
      setNewTitle('')
      setNewDesc('')
      setShowCreate(false)
    } catch (e: any) {
      alert(e.message || 'Create failed')
    } finally { setCreating(false) }
  }

  async function runTask(task: Task) {
    setRunningId(task.id)
    try {
      const res = await twinApi.runTask(task.id)
      setRunResult(prev => ({ ...prev, [task.id]: res }))
      const updated = await twinApi.tasks()
      setTasks(Array.isArray(updated) ? updated : [])
    } catch (e: any) {
      setRunResult(prev => ({ ...prev, [task.id]: { success: false, result: e.message } }))
    } finally { setRunningId(null) }
  }

  async function sendChat() {
    if (!prompt.trim() || thinking) return
    setThinking(true)
    const q = prompt.trim()
    setPrompt('')
    setChat(prev => [...prev, { role: 'user', content: q }])
    try {
      const history = chat.map(m => ({ role: m.role, content: m.content }))
      const res = await twinApi.chat(q, history)
      setChat(prev => [...prev, {
        role: 'assistant',
        content: res.response,
        agentType: res.agentType,
        poweredBy: (res as any).poweredBy,
      }])
    } catch {
      setChat(prev => [...prev, { role: 'assistant', content: 'Twin offline — try again shortly.' }])
    } finally { setThinking(false) }
  }

  if (!mounted) return null
  const activeLevel = AUTONOMY_META[autonomy]

  return (
    <div className="min-h-screen" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-10 px-6 lg:px-10 py-5 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.9)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="t-caption" style={{ fontSize: '0.625rem' }}>HYPERAGENT SYSTEM</p>
            <h1 className="font-bold mt-0.5" style={{ fontSize: 'clamp(1.2rem,3vw,1.8rem)', letterSpacing: '-0.03em' }}>AI Twin</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--ring-activity)' }} />
            <span className="text-xs text-white/40">online · {autonomy}</span>
          </div>
        </div>
      </header>

      <div className="container-editorial py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT */}
          <div className="lg:col-span-4 space-y-6">
            <section>
              <p className="t-caption mb-4" style={{ fontSize: '0.625rem' }}>AUTONOMY LEVEL</p>
              <div className="space-y-2">
                {(Object.entries(AUTONOMY_META) as [AutonomyLevel, typeof AUTONOMY_META[AutonomyLevel]][]).map(([level, meta]) => (
                  <button key={level} onClick={() => setAutonomy(level)}
                    className="w-full flex items-start p-4 border text-left transition-all"
                    style={{
                      borderRadius: 'var(--radius)',
                      borderColor: autonomy === level ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.06)',
                      background: autonomy === level ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.01)',
                    }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="t-mono text-xs font-bold" style={{ color: meta.color }}>{level}</span>
                        <span className="text-sm font-semibold text-white/80">{meta.label}</span>
                        {autonomy === level && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />}
                      </div>
                      <p className="text-xs text-white/40 leading-relaxed">{meta.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <div className="rule" />

            <section>
              <p className="t-caption mb-3" style={{ fontSize: '0.625rem' }}>AGENT MODULES</p>
              <div className="grid grid-cols-2 gap-2">
                {AGENT_TYPES.map(a => {
                  const ringColor = RING_META[a.ring as keyof typeof RING_META]?.color ?? 'var(--ghost)'
                  return (
                    <button key={a.id} onClick={() => { setNewAgentType(a.id); setShowCreate(true) }}
                      className="flex items-center gap-2 p-3 border border-white/6 hover:border-white/18 transition-all text-left"
                      style={{ borderRadius: 'var(--radius)' }}>
                      <span style={{ color: ringColor, fontFamily: 'monospace' }}>{a.icon}</span>
                      <span className="text-xs font-medium text-white/60">{a.label}</span>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-white/20 mt-2">Click agent to create task</p>
            </section>

            <div className="rule" />

            <section className="border border-white/6 p-4" style={{ borderRadius: 'var(--radius)' }}>
              <p className="t-caption mb-4" style={{ fontSize: '0.625rem' }}>TWIN IMPACT · THIS WEEK</p>
              <div className="grid grid-cols-5 gap-2">
                {(Object.entries(RING_META) as any[]).map(([key, meta]) => {
                  const impact: Record<string,number> = { sleep: 3, nutrition: -2, activity: 8, social: 1, wealth: 5 }
                  const v = impact[key] ?? 0
                  return (
                    <div key={key} className="flex flex-col items-center gap-1.5">
                      <span className="font-bold" style={{ color: v >= 0 ? 'var(--ring-activity)' : 'var(--ring-wealth)', fontSize: '0.6rem' }}>
                        {v >= 0 ? '+' : ''}{v}
                      </span>
                      <div className="w-1 h-8 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="w-full rounded-full" style={{ height: `${Math.abs(v)*10}%`, background: meta.color, marginTop: `${100-Math.abs(v)*10}%` }} />
                      </div>
                      <span style={{ fontSize: '0.5rem', opacity: 0.35 }}>{meta.label.slice(0,3).toUpperCase()}</span>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-8 space-y-6">

            {/* Chat */}
            <section className="border border-white/8 p-5" style={{ borderRadius: 'var(--radius)' }}>
              <p className="t-caption mb-4" style={{ fontSize: '0.625rem' }}>ASK HYPERAGENT</p>
              {chat.length > 0 && (
                <div className="mb-4 space-y-3 max-h-72 overflow-y-auto pr-1">
                  {chat.map((m, i) => (
                    <div key={i} className={clsx('flex gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                      {m.role === 'assistant' && (
                        <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                          style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--v)' }} />
                        </div>
                      )}
                      <div className={clsx('max-w-[85%] px-4 py-2.5 text-sm leading-relaxed')}
                        style={{
                          borderRadius: m.role === 'user' ? 'var(--radius)' : '0 8px 8px 0',
                          background: m.role === 'user' ? 'rgba(255,255,255,0.03)' : 'rgba(124,58,237,0.06)',
                          border: m.role === 'user' ? '1px solid rgba(255,255,255,0.08)' : '2px solid rgba(124,58,237,0.3)',
                          borderLeft: m.role === 'assistant' ? '2px solid var(--v)' : undefined,
                          color: 'rgba(245,244,240,0.8)',
                        }}>
                        {m.role === 'assistant' && m.agentType && (
                          <div className="flex items-center gap-2 mb-1">
                            <span style={{ color: 'var(--v)', fontSize: '0.6rem', fontWeight: 700 }}>{m.agentType.toUpperCase()} AGENT</span>
                            {m.poweredBy === 'claude-fable-5' && (
                              <span className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--v)', fontSize: '0.55rem' }}>FABLE 5</span>
                            )}
                          </div>
                        )}
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {thinking && (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.2)' }}>
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--v)' }} />
                      </div>
                      <span className="text-xs text-white/30 animate-pulse">Twin thinking…</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
              <div className="flex gap-3">
                <input value={prompt} onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder="Ask your twin anything…"
                  className="flex-1 bg-white/4 border border-white/8 px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/40 transition-colors"
                  style={{ borderRadius: 'var(--radius)' }} disabled={thinking} />
                <button onClick={sendChat} disabled={!prompt.trim() || thinking}
                  className="px-5 py-3 text-sm font-semibold text-white disabled:opacity-30"
                  style={{ background: 'var(--v)', borderRadius: 'var(--radius)' }}>
                  {thinking ? '…' : '→'}
                </button>
              </div>
            </section>

            {/* Create form */}
            {showCreate ? (
              <section className="border border-violet-500/30 p-5 space-y-4"
                style={{ borderRadius: 'var(--radius)', background: 'rgba(124,58,237,0.05)' }}>
                <div className="flex items-center justify-between">
                  <p className="t-caption" style={{ fontSize: '0.625rem' }}>NEW TASK</p>
                  <button onClick={() => setShowCreate(false)} className="text-white/30 hover:text-white text-xl">×</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {AGENT_TYPES.map(a => (
                    <button key={a.id} onClick={() => setNewAgentType(a.id)}
                      className="px-3 py-1.5 text-xs font-medium border transition-all"
                      style={{
                        borderRadius: '99px',
                        borderColor: newAgentType === a.id ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.1)',
                        background: newAgentType === a.id ? 'rgba(124,58,237,0.15)' : 'transparent',
                        color: newAgentType === a.id ? 'var(--v)' : 'rgba(245,244,240,0.4)',
                      }}>
                      {a.icon} {a.label}
                    </button>
                  ))}
                </div>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  placeholder="Task title…"
                  className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/30" />
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)}
                  placeholder="Description (optional)…" rows={2}
                  className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/30 resize-none" />
                <div className="flex items-center">
                  <p className="text-xs text-white/40">Autonomy: <span style={{ color: activeLevel.color }}>{autonomy}</span></p>
                  <button onClick={createTask} disabled={!newTitle.trim() || creating}
                    className="ml-auto px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
                    style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 'var(--radius)' }}>
                    {creating ? 'Creating…' : 'Create task'}
                  </button>
                </div>
              </section>
            ) : (
              <button onClick={() => setShowCreate(true)}
                className="w-full py-3 border border-dashed border-white/10 hover:border-violet-500/40 text-sm text-white/30 hover:text-white/60 transition-all"
                style={{ borderRadius: 'var(--radius)' }}>
                + New task
              </button>
            )}

            {/* Task list */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <p className="t-caption" style={{ fontSize: '0.625rem' }}>AGENT TASKS</p>
                <span className="t-mono text-xs text-white/25">{tasks.length} tasks</span>
              </div>
              {loadingTasks ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-10 text-white/25 text-sm">No tasks yet — create one above</div>
              ) : (
                <div className="space-y-3">
                  {tasks.map(task => {
                    const agentMeta = AGENT_TYPES.find(a => a.id === task.agentType)
                    const ringColor = agentMeta?.ring ? RING_META[agentMeta.ring as keyof typeof RING_META]?.color : 'var(--ghost)'
                    const isRunning = task.id === runningId
                    const statusColor = task.status === 'COMPLETED' ? 'var(--ring-activity)'
                      : task.status === 'FAILED' ? 'var(--ring-wealth)'
                      : isRunning ? 'var(--ring-social)'
                      : 'rgba(255,255,255,0.2)'
                    const liveResult = runResult[task.id]
                    const parsedResult = (() => {
                      if (!task.result) return null
                      try { return JSON.parse(task.result) } catch { return { summary: task.result } }
                    })()
                    const showResult = liveResult || parsedResult

                    return (
                      <div key={task.id} className="p-4 border border-white/6"
                        style={{ borderRadius: 'var(--radius)', borderLeft: `2px solid ${statusColor}50` }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span style={{ color: ringColor, fontFamily: 'monospace', fontSize: '0.85rem' }}>{agentMeta?.icon ?? '◎'}</span>
                              <span className="text-xs font-semibold text-white/70">{task.title}</span>
                            </div>
                            {task.description && <p className="text-xs text-white/35 mb-2">{task.description}</p>}
                            <div className="flex items-center gap-3">
                              <span className="text-xs px-2 py-0.5 rounded" style={{
                                background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30`,
                              }}>
                                {isRunning ? 'RUNNING…' : task.status}
                              </span>
                              <span className="text-xs text-white/20">L{task.autonomy} · {agentMeta?.label ?? task.agentType}</span>
                            </div>
                          </div>
                          {(task.status === 'PENDING' || task.status === 'FAILED') && !isRunning && (
                            <button onClick={() => runTask(task)}
                              className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold transition-all"
                              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)', color: 'var(--v)', borderRadius: 'var(--radius)' }}>
                              Run ▶
                            </button>
                          )}
                          {isRunning && <div className="w-4 h-4 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin flex-shrink-0" />}
                        </div>
                        {showResult && (
                          <div className="mt-3 pt-3 border-t border-white/5">
                            <p className="text-xs text-white/50 leading-relaxed">
                              {parsedResult?.summary ?? liveResult?.result ?? ''}
                            </p>
                            {(parsedResult?.actions ?? liveResult?.actions ?? []).length > 0 && (
                              <ul className="mt-2 space-y-1">
                                {(parsedResult?.actions ?? liveResult?.actions ?? []).map((a: string, i: number) => (
                                  <li key={i} className="text-xs text-white/35 flex items-start gap-1.5">
                                    <span style={{ color: 'var(--ring-activity)' }}>✓</span> {a}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {(parsedResult?.usedAI || liveResult?.usedAI) && (
                              <span className="mt-2 inline-block px-1.5 py-0.5 rounded"
                                style={{ background: 'rgba(124,58,237,0.1)', color: 'var(--v)', fontSize: '0.55rem' }}>
                                FABLE 5
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
