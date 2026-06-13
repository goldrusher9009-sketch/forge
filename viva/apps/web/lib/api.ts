// VIVA API Client — typed fetch wrapper

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'APIError'
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('viva_access_token')
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('viva_access_token', access)
  localStorage.setItem('viva_refresh_token', refresh)
}

export function clearTokens() {
  localStorage.removeItem('viva_access_token')
  localStorage.removeItem('viva_refresh_token')
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem('viva_refresh_token')
  if (!refresh) return null
  try {
    const r = await fetch(`${BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    })
    if (!r.ok) return null
    const { accessToken } = await r.json()
    localStorage.setItem('viva_access_token', accessToken)
    return accessToken
  } catch { return null }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken()
    if (newToken) return request<T>(path, options, false)
    clearTokens()
    if (typeof window !== 'undefined') window.location.href = '/auth/onboard'
    throw new APIError(401, 'Session expired')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new APIError(res.status, body.error || `HTTP ${res.status}`)
  }

  return res.json()
}

// ── Auth ─────────────────────────────────────────────────

export const auth = {
  register: (data: {
    handle: string; displayName: string; email: string; password: string;
    walletAddress?: string;
    sleepRing?: number; nutritionRing?: number; activityRing?: number;
    socialRing?: number; wealthRing?: number;
  }) => request<{ user: any; accessToken: string; refreshToken: string }>(
    '/api/auth/register', { method: 'POST', body: JSON.stringify(data) }
  ),

  login: (email: string, password: string) =>
    request<{ user: any; accessToken: string; refreshToken: string }>(
      '/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }
    ),

  logout: (refreshToken: string) =>
    request('/api/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),

  me: () => request<any>('/api/auth/me'),
}

// ── Users ─────────────────────────────────────────────────

export const users = {
  get: (handle: string) => request<any>(`/api/users/${handle}`),
  search: (q?: string) => request<any[]>(`/api/users${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  updateMe: (data: Record<string, any>) =>
    request<any>('/api/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
}

// ── Feed ──────────────────────────────────────────────────

export const feed = {
  list: (category?: string, cursor?: string) =>
    request<{ posts: any[]; nextCursor: string | null }>(
      `/api/feed${new URLSearchParams({ ...(category ? { category } : {}), ...(cursor ? { cursor } : {}) }).toString() ? '?' + new URLSearchParams({ ...(category ? { category } : {}), ...(cursor ? { cursor } : {}) }).toString() : ''}`
    ),
  create: (data: { content: string; category?: string; mediaUrl?: string }) =>
    request<any>('/api/feed', { method: 'POST', body: JSON.stringify(data) }),
  like: (id: string) =>
    request<{ liked: boolean }>(`/api/feed/${id}/like`, { method: 'POST' }),
  delete: (id: string) =>
    request(`/api/feed/${id}`, { method: 'DELETE' }),
}

// ── Messages ──────────────────────────────────────────────

export const messages = {
  threads: () => request<any[]>('/api/messages/threads'),
  createThread: (recipientId: string) =>
    request<any>('/api/messages/threads', { method: 'POST', body: JSON.stringify({ recipientId }) }),
  getMessages: (threadId: string, cursor?: string) =>
    request<{ messages: any[]; nextCursor: string | null }>(
      `/api/messages/threads/${threadId}${cursor ? `?cursor=${cursor}` : ''}`
    ),
  send: (threadId: string, content: string) =>
    request<any>(`/api/messages/threads/${threadId}`, { method: 'POST', body: JSON.stringify({ content }) }),
}

// ── Markets ───────────────────────────────────────────────

export const markets = {
  list: (category?: string, sort?: string) =>
    request<any[]>(`/api/markets${new URLSearchParams({ ...(category ? { category } : {}), ...(sort ? { sort } : {}) }).toString() ? '?' + new URLSearchParams({ ...(category ? { category } : {}), ...(sort ? { sort } : {}) }).toString() : ''}`),
  get: (id: string) => request<any>(`/api/markets/${id}`),
  stake: (id: string, side: 'YES' | 'NO', amount: number) =>
    request<any>(`/api/markets/${id}/stake`, { method: 'POST', body: JSON.stringify({ side, amount }) }),
  myPositions: () => request<any[]>('/api/markets/user/positions'),
}

// ── Health ────────────────────────────────────────────────

export const health = {
  logs: (ring?: string) =>
    request<any[]>(`/api/health/logs${ring ? `?ring=${ring}` : ''}`),
  logEntry: (data: { ring: string; value: number; unit?: string; note?: string }) =>
    request<any>('/api/health/logs', { method: 'POST', body: JSON.stringify(data) }),
  proofs: () => request<any[]>('/api/health/proofs'),
  generateProof: (proofType: string) =>
    request<any>('/api/health/proofs/generate', { method: 'POST', body: JSON.stringify({ proofType }) }),
  mintSBT: (proofId: string) =>
    request<any>(`/api/health/proofs/${proofId}/mint-sbt`, { method: 'POST' }),
}

// ── Tokens ────────────────────────────────────────────────

export const tokens = {
  list: () => request<any[]>('/api/tokens'),
  mine: () => request<any | null>('/api/tokens/mine'),
  create: (symbol: string, name: string) =>
    request<any>('/api/tokens/create', { method: 'POST', body: JSON.stringify({ symbol, name }) }),
  mint: (id: string, amount: number) =>
    request<any>(`/api/tokens/${id}/mint`, { method: 'POST', body: JSON.stringify({ amount }) }),
  buy: (id: string, amount: number) =>
    request<any>(`/api/tokens/${id}/buy`, { method: 'POST', body: JSON.stringify({ amount }) }),
}

// ── Rooms ─────────────────────────────────────────────────

export const rooms = {
  list: () => request<any[]>('/api/rooms'),
  get: (id: string) => request<any>(`/api/rooms/${id}`),
  create: (data: { title: string; topic?: string; minVScore?: number; scheduledFor?: string }) =>
    request<any>('/api/rooms', { method: 'POST', body: JSON.stringify(data) }),
  join: (id: string) => request(`/api/rooms/${id}/join`, { method: 'POST' }),
  leave: (id: string) => request(`/api/rooms/${id}/leave`, { method: 'POST' }),
  setMute: (id: string, muted: boolean) =>
    request(`/api/rooms/${id}/mute`, { method: 'PATCH', body: JSON.stringify({ muted }) }),
}

// ── Twin ──────────────────────────────────────────────────

export const twin = {
  tasks: () => request<any[]>('/api/twin/tasks'),
  createTask: (data: { agentType: string; title: string; description?: string; autonomy?: number }) =>
    request<any>('/api/twin/tasks', { method: 'POST', body: JSON.stringify(data) }),
  chat: (message: string, history?: { role: string; content: string }[]) =>
    request<{ response: string; agentType: string; actionsAvailable: string[] }>(
      '/api/twin/chat', { method: 'POST', body: JSON.stringify({ message, history }) }
    ),
  updateTask: (id: string, data: { status?: string; result?: string }) =>
    request<any>(`/api/twin/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  runTask: (id: string) =>
    request<any>(`/api/twin/tasks/${id}/run`, { method: 'POST' }),
}

// ── Dating ────────────────────────────────────────────

export const dating = {
  discover: () => request<any[]>('/api/dating/discover'),
  matches: () => request<any[]>('/api/dating/matches'),
  connect: (targetId: string) =>
    request<{ status: string; match: any }>(`/api/dating/connect/${targetId}`, { method: 'POST' }),
  pass: (targetId: string) =>
    request(`/api/dating/pass/${targetId}`, { method: 'POST' }),
}

// ── WebSocket ─────────────────────────────────────────────

export class VivaWS {
  private ws: WebSocket | null = null
  private listeners = new Map<string, Set<(data: any) => void>>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  connect() {
    const token = getToken()
    if (!token) return

    const wsBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000')
      .replace('https://', 'wss://')
      .replace('http://', 'ws://')

    this.ws = new WebSocket(`${wsBase}/ws?token=${encodeURIComponent(token)}`)

    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        this.emit(msg.type, msg)
      } catch { /* ignore */ }
    }

    this.ws.onclose = () => {
      this.reconnectTimer = setTimeout(() => this.connect(), 3000)
    }

    this.ws.onerror = () => this.ws?.close()
  }

  send(data: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  on(type: string, fn: (data: any) => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set())
    this.listeners.get(type)!.add(fn)
  }

  off(type: string, fn: (data: any) => void) {
    this.listeners.get(type)?.delete(fn)
  }

  private emit(type: string, data: any) {
    this.listeners.get(type)?.forEach(fn => fn(data))
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
    this.ws = null
  }
}

// ── Notifications ──────────────────────────────────────────

export const notifications = {
  list: () => request<{ notifications: any[]; unread: number }>('/api/notifications'),
  unreadCount: () => request<{ count: number }>('/api/notifications/unread-count'),
  markRead: (id: string) => request<any>(`/api/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => request<{ ok: boolean }>('/api/notifications/read-all', { method: 'POST' }),
}
