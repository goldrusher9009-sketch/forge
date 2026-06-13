'use client'
import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TYPE_CONFIG: Record<ToastType, { icon: string; color: string; bg: string; border: string }> = {
  success: { icon: '✓', color: 'var(--ring-activity)', bg: 'rgba(20,184,166,0.12)', border: 'rgba(20,184,166,0.25)' },
  error:   { icon: '✕', color: 'var(--ring-wealth)',   bg: 'rgba(225,29,72,0.12)',  border: 'rgba(225,29,72,0.25)' },
  info:    { icon: '◉', color: 'var(--v)',             bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.25)' },
  warning: { icon: '⚠', color: '#F59E0B',             bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false)
  const cfg = TYPE_CONFIG[toast.type]

  useEffect(() => {
    // Animate in
    const t1 = setTimeout(() => setVisible(true), 10)
    // Animate out before dismiss
    const dur = toast.duration ?? 3500
    const t2 = setTimeout(() => setVisible(false), dur - 300)
    const t3 = setTimeout(() => onDismiss(toast.id), dur)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(() => onDismiss(toast.id), 300) }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: '10px',
        backdropFilter: 'blur(20px)',
        cursor: 'pointer',
        userSelect: 'none',
        maxWidth: '340px',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.96)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <span style={{ color: cfg.color, fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>{cfg.icon}</span>
      <span style={{ color: 'rgba(245,244,240,0.9)', fontSize: '0.8125rem', lineHeight: 1.4 }}>{toast.message}</span>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info', duration = 3500) => {
    const id = `t${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev.slice(-4), { id, message, type, duration }])
  }, [])

  const value: ToastContextValue = {
    toast,
    success: (msg) => toast(msg, 'success'),
    error:   (msg) => toast(msg, 'error', 4500),
    info:    (msg) => toast(msg, 'info'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container — bottom center, above mobile nav */}
      <div style={{
        position: 'fixed',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 76px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'center',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
