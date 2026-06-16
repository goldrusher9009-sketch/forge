'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { notifications as notifApi } from '@/lib/api'
import clsx from 'clsx'

const NAV_PRIMARY = [
  { id: 'home',    label: 'Canvas',   path: '/home',    icon: HomeIcon },
  { id: 'feed',    label: 'Feed',     path: '/feed',    icon: FeedIcon },
  { id: 'twin',    label: 'Twin',     path: '/twin',    icon: TwinIcon },
  { id: 'markets', label: 'Markets',  path: '/markets', icon: MarketsIcon },
  { id: 'rooms',   label: 'Rooms',    path: '/rooms',   icon: RoomsIcon },
]

const NAV_MORE = [
  { id: 'explore',       label: 'Explore',      path: '/explore',       icon: ExploreIcon },
  { id: 'messages',      label: 'Messages',     path: '/messages',      icon: MsgIcon },
  { id: 'dating',        label: 'Match',        path: '/dating',        icon: MatchIcon },
  { id: 'health',        label: 'Health ZK',    path: '/health',        icon: HealthIcon },
  { id: 'token',         label: 'YouToken',     path: '/token',         icon: TokenIcon },
  { id: 'tokens',        label: 'Token Market', path: '/tokens',        icon: TokenIcon },
  { id: 'wallet',        label: 'Wallet',       path: '/wallet',        icon: TokenIcon },
  { id: 'staking',       label: 'Staking',      path: '/staking',       icon: TokenIcon },
  { id: 'invest',        label: 'Portfolio',    path: '/invest',        icon: TokenIcon },
  { id: 'creator',       label: 'Creator Hub',  path: '/creator',       icon: TokenIcon },
  { id: 'dao',           label: 'Governance',   path: '/dao',           icon: LeaderIcon },
  { id: 'referral',      label: 'Refer & Earn', path: '/referral',      icon: TokenIcon },
  { id: 'activity',      label: 'Live Activity',path: '/activity',      icon: FeedIcon },
  { id: 'analytics',     label: 'Analytics',    path: '/analytics',     icon: LeaderIcon },
  { id: 'advertise',     label: 'Advertise',    path: '/advertise',     icon: TokenIcon },
  { id: 'identity',      label: 'ZK Identity',  path: '/identity',      icon: LeaderIcon },
  { id: 'events',        label: 'Events',       path: '/events',        icon: FeedIcon },
  { id: 'grants',        label: 'Grants',       path: '/grants',        icon: TokenIcon },
  { id: 'airdrop',       label: 'Airdrop',      path: '/airdrop',       icon: TokenIcon },
  { id: 'marketplace',   label: 'Marketplace',  path: '/marketplace',   icon: TokenIcon },
  { id: 'badges',        label: 'Badges',       path: '/badges',        icon: LeaderIcon },
  { id: 'challenges',    label: 'Challenges',   path: '/challenges',    icon: FeedIcon },
  { id: 'leaderboard',   label: 'Leaderboard',  path: '/leaderboard',   icon: LeaderIcon },
  { id: 'notifications', label: 'Notifications',path: '/notifications', icon: BellIcon },
  { id: 'settings',      label: 'Settings',     path: '/settings',      icon: GearIcon },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [moreSheetOpen, setMoreSheetOpen] = useState(false)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const { user } = useAppStore()

  useEffect(() => {
    notifApi.unreadCount().then(d => setUnreadNotifs(d.count ?? 0)).catch(() => {})
    const iv = setInterval(() => {
      notifApi.unreadCount().then(d => setUnreadNotifs(d.count ?? 0)).catch(() => {})
    }, 60000)
    return () => clearInterval(iv)
  }, [])

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
              'press group flex flex-col items-center justify-center w-12 h-12 rounded-sm transition-all duration-200 relative',
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
            'press group flex flex-col items-center justify-center w-12 h-12 rounded-sm transition-all duration-200 mt-auto relative',
            drawerOpen ? 'bg-white/8' : 'hover:bg-white/4'
          )}
          title="More"
        >
          <MoreIcon size={18} className="text-white/40 group-hover:text-white/70 transition-colors" />
        </button>

        {/* Profile avatar */}
        <Link href="/settings" className="press flex items-center justify-center w-9 h-9 rounded-full overflow-hidden mt-2 ring-1 ring-white/10 hover:ring-white/30 transition-all" title="Settings">
          {user?.avatar
            ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white/50" style={{ background: 'rgba(124,58,237,0.2)' }}>?</div>
          }
        </Link>

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
        className="lg:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-white/5 flex items-center justify-around px-1"
        style={{ background: 'rgba(4,4,10,0.97)', backdropFilter: 'blur(24px)', minHeight: '60px', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {NAV_PRIMARY.slice(0, 4).map(({ id, label, path, icon: Icon }) => (
          <Link
            key={id}
            href={path}
            className="press flex flex-col items-center gap-1 py-2 px-4 min-w-[56px]"
          >
            <div className="relative">
              <Icon
                size={22}
                className={clsx(
                  'transition-all duration-200',
                  activeId === id ? 'text-white drop-shadow-[0_0_8px_rgba(124,58,237,0.8)]' : 'text-white/30'
                )}
              />
              {activeId === id && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: 'var(--v)' }} />
              )}
            </div>
            <span
              className="transition-all duration-200"
              style={{
                fontSize: '0.55rem',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontWeight: 600,
                color: activeId === id ? 'var(--v)' : 'rgba(245,244,240,0.3)',
              }}
            >
              {label}
            </span>
          </Link>
        ))}

        {/* More button mobile */}
        <button
          onClick={() => setMoreSheetOpen(true)}
          className="press flex flex-col items-center gap-1 py-2 px-4 min-w-[56px]"
        >
          <div className="relative">
            <MoreIcon size={22} className="text-white/30" />
            {unreadNotifs > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                style={{ background: 'var(--v)', fontSize: '0.45rem', fontWeight: 700, color: 'white' }}>
                {unreadNotifs > 9 ? '9+' : unreadNotifs}
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.55rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, color: 'rgba(245,244,240,0.3)' }}>
            More
          </span>
        </button>
      </nav>

      {/* MOBILE MORE SHEET — animated slide-up */}
      <div
        className="lg:hidden fixed inset-0 z-50 flex flex-col"
        style={{
          background: 'rgba(4,4,10,0.97)',
          backdropFilter: 'blur(24px)',
          transform: moreSheetOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          pointerEvents: moreSheetOpen ? 'auto' : 'none',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <span className="font-semibold text-sm text-white/70">All Modules</span>
          <button onClick={() => setMoreSheetOpen(false)} className="press w-8 h-8 flex items-center justify-center rounded-full bg-white/6 text-white/50 hover:text-white text-lg">×</button>
        </div>
        <div className="grid grid-cols-2 gap-3 p-5 overflow-y-auto">
          {[...NAV_PRIMARY, ...NAV_MORE].map(({ id, label, path, icon: Icon }) => (
            <Link
              key={id}
              href={path}
              onClick={() => setMoreSheetOpen(false)}
              className={clsx(
                'press flex items-center gap-3 p-4 border transition-all',
                activeId === id
                  ? 'border-violet-500/40 bg-violet-500/10'
                  : 'border-white/6 bg-white/2 hover:bg-white/5'
              )}
              style={{ borderRadius: 'var(--radius)' }}
            >
              <Icon size={20} className={activeId === id ? 'text-violet-400' : 'text-white/50'} />
              <span className={clsx('text-sm font-medium', activeId === id ? 'text-white' : 'text-white/60')}>
                {label}
              </span>
            </Link>
          ))}
        </div>
        <div style={{ height: 'env(safe-area-inset-bottom, 20px)' }} />
      </div>
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

function BellIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M10 3a5 5 0 0 1 5 5v3l1.5 2.5H3.5L5 11V8a5 5 0 0 1 5-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8 15.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

function GearIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 3v2M10 15v2M3 10h2M15 10h2M5.05 5.05l1.41 1.41M13.54 13.54l1.41 1.41M14.95 5.05l-1.41 1.41M6.46 13.54l-1.41 1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function ExploreIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M13 7l-2.5 5.5L5 15l2.5-5.5L13 7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="10" cy="10" r="1.2" fill="currentColor"/>
    </svg>
  )
}

function LeaderIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="7" y="8" width="6" height="9" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="2" y="11" width="5" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="13" y="5" width="5" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 5l-1.5 2h3L10 5z" fill="currentColor" opacity="0.6"/>
    </svg>
  )
}
