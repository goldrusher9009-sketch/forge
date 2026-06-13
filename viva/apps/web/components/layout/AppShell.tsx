'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const NAV_PRIMARY = [
  { id: 'home',    label: 'Canvas',   path: '/home',    icon: HomeIcon },
  { id: 'feed',    label: 'Feed',     path: '/feed',    icon: FeedIcon },
  { id: 'twin',    label: 'Twin',     path: '/twin',    icon: TwinIcon },
  { id: 'markets', label: 'Markets',  path: '/markets', icon: MarketsIcon },
  { id: 'rooms',   label: 'Rooms',    path: '/rooms',   icon: RoomsIcon },
]

const NAV_MORE = [
  { id: 'messages', label: 'Messages',   path: '/messages', icon: MsgIcon },
  { id: 'dating',   label: 'Match',      path: '/dating',   icon: MatchIcon },
  { id: 'health',   label: 'Health ZK',  path: '/health',   icon: HealthIcon },
  { id: 'token',    label: 'YouToken',   path: '/token',    icon: TokenIcon },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [moreSheetOpen, setMoreSheetOpen] = useState(false)

  const activeId = [...NAV_PRIMARY, ...NAV_MORE].find(n => pathname.startsWith(n.path))?.id

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--ink)' }}>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-16 border-r border-white/5 py-6 items-center gap-1 z-20 relative">
        {/* Logo */}
        <Link href="/home" className="mb-8 flex items-center justify-center w-10 h-10">
          <span className="text-xl font-bold tracking-tighter" style={{ color: 'var(--v)' }}>V</span>
        </Link>

        {NAV_PRIMARY.map(({ id, label, path, icon: Icon }) => (
          <Link
            key={id}
            href={path}
            className={clsx(
              'group flex flex-col items-center justify-center w-12 h-12 rounded-sm transition-all duration-200 relative',
              activeId === id
                ? 'bg-white/8'
                : 'hover:bg-white/4'
            )}
            title={label}
          >
            <Icon
              size={18}
              className={clsx(
                'transition-colors',
                activeId === id ? 'text-white' : 'text-white/40 group-hover:text-white/70'
              )}
            />
            {activeId === id && (
              <span className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full" style={{ background: 'var(--v)' }} />
            )}
          </Link>
        ))}

        {/* More button */}
        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className={clsx(
            'group flex flex-col items-center justify-center w-12 h-12 rounded-sm transition-all duration-200 mt-auto relative',
            drawerOpen ? 'bg-white/8' : 'hover:bg-white/4'
          )}
          title="More"
        >
          <MoreIcon size={18} className="text-white/40 group-hover:text-white/70 transition-colors" />
        </button>

        {/* Drawer */}
        {drawerOpen && (
          <div
            className="absolute left-16 top-0 bottom-0 w-52 z-30 border-r border-white/5 flex flex-col py-6 px-3 gap-1"
            style={{ background: 'var(--ink-dim)' }}
          >
            <p className="t-caption px-3 mb-3" style={{ fontSize: '0.625rem', opacity: 0.4 }}>More modules</p>
            {NAV_MORE.map(({ id, label, path, icon: Icon }) => (
              <Link
                key={id}
                href={path}
                onClick={() => setDrawerOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-200',
                  activeId === id ? 'bg-white/8 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/4'
                )}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            ))}
          </div>
        )}
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto relative pb-16 lg:pb-0">
        {children}
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-white/5 flex items-center justify-around px-2 pb-safe"
        style={{ background: 'rgba(4,4,10,0.97)', backdropFilter: 'blur(20px)', minHeight: '64px', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {NAV_PRIMARY.slice(0, 4).map(({ id, label, path, icon: Icon }) => (
          <Link
            key={id}
            href={path}
            className="flex flex-col items-center gap-1 py-2 px-3"
          >
            <Icon
              size={20}
              className={clsx(
                'transition-colors',
                activeId === id ? 'text-white' : 'text-white/35'
              )}
              style={activeId === id ? { color: 'var(--v)' } : undefined}
            />
            <span
              className="text-xs font-medium transition-colors"
              style={{
                fontSize: '0.625rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: activeId === id ? 'var(--v)' : 'rgba(245,244,240,0.4)',
              }}
            >
              {label}
            </span>
          </Link>
        ))}

        {/* More button mobile */}
        <button
          onClick={() => setMoreSheetOpen(true)}
          className="flex flex-col items-center gap-1 py-2 px-3"
        >
          <MoreIcon size={20} className="text-white/35" />
          <span style={{ fontSize: '0.625rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(245,244,240,0.4)' }}>
            More
          </span>
        </button>
      </nav>

      {/* MOBILE MORE SHEET */}
      {moreSheetOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex flex-col"
          style={{ background: 'rgba(4,4,10,0.97)', backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-center justify-between px-6 pt-8 pb-6 border-b border-white/5">
            <span className="t-caption" style={{ fontSize: '0.625rem', opacity: 0.4 }}>All modules</span>
            <button onClick={() => setMoreSheetOpen(false)} className="text-white/40 hover:text-white text-2xl">×</button>
          </div>
          <div className="grid grid-cols-2 gap-3 p-6">
            {[...NAV_PRIMARY, ...NAV_MORE].map(({ id, label, path, icon: Icon }) => (
              <Link
                key={id}
                href={path}
                onClick={() => setMoreSheetOpen(false)}
                className={clsx(
                  'flex items-center gap-3 p-4 rounded border transition-all',
                  activeId === id
                    ? 'border-violet-500/30 bg-violet-500/8'
                    : 'border-white/6 bg-white/2 hover:bg-white/5'
                )}
              >
                <Icon size={20} className={activeId === id ? 'text-violet-400' : 'text-white/50'} />
                <span className={clsx('text-sm font-medium', activeId === id ? 'text-white' : 'text-white/60')}>
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Icons ──────────────────────────────────────────────
function HomeIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="10" y1="3" x2="10" y2="6.5" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="17" y1="10" x2="13.5" y2="10" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="10" y1="17" x2="10" y2="13.5" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="3" y1="10" x2="6.5" y2="10" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

function FeedIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <line x1="4" y1="5" x2="16" y2="5" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="4" y1="10" x2="13" y2="10" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="4" y1="15" x2="10" y2="15" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

function TwinIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="13" cy="13" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="9.5" y1="9.5" x2="10.5" y2="10.5" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    </svg>
  )
}

function MarketsIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <polyline points="3,14 7,9 11,12 17,5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <line x1="3" y1="17" x2="17" y2="17" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

function RoomsIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6 15.5C6 13.3 7.8 11.5 10 11.5s4 1.8 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="4" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="16" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  )
}

function MsgIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M3 4h14v10H11l-3 3v-3H3V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  )
}

function MatchIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M10 16s-7-4.5-7-8.5A4 4 0 0 1 10 5a4 4 0 0 1 7 2.5C17 11.5 10 16 10 16z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  )
}

function HealthIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M3 10h3l2-5 3 10 2-5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function TokenIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <text x="10" y="14" textAnchor="middle" fontSize="8" fill="currentColor" fontWeight="700">Y</text>
    </svg>
  )
}

function MoreIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="5" cy="10" r="1.5" fill="currentColor"/>
      <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
      <circle cx="15" cy="10" r="1.5" fill="currentColor"/>
    </svg>
  )
}
