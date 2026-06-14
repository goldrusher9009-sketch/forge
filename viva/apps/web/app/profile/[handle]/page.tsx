'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { users as usersApi, feed as feedApi, dating as datingApi } from '@/lib/api'
import { RING_META, TIER_META } from '@/lib/store'

export default function ProfilePage() {
  const { handle } = useParams<{ handle: string }>()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!handle) return
    Promise.all([
      usersApi.get(handle as string),
      feedApi.list().then(r => r.posts),
    ]).then(([user, allPosts]) => {
      setProfile(user)
      setPosts(allPosts.filter((p: any) => p.author?.handle === handle || p.authorId === user.id).slice(0, 6))
    }).catch(() => setError('User not found'))
      .finally(() => setLoading(false))
  }, [handle])

  async function handleConnect() {
    if (!profile) return
    setConnecting(true)
    try {
      await datingApi.connect(profile.id)
      setConnected(true)
    } catch { /* ignore */ }
    finally { setConnecting(false) }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ink)' }}>
      <div className="w-8 h-8 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
    </div>
  )

  if (error || !profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--ink)' }}>
      <p className="text-white/40">User not found</p>
      <button onClick={() => router.back()} className="t-caption text-white/60 hover:text-white">← Go back</button>
    </div>
  )

  const tier = TIER_META[profile.tier as keyof typeof TIER_META] ?? TIER_META.seed
  const rings = {
    sleep: profile.sleepRing ?? 50,
    nutrition: profile.nutritionRing ?? 50,
    activity: profile.activityRing ?? 50,
    social: profile.socialRing ?? 50,
    wealth: profile.wealthRing ?? 50,
  }
  const vscore = profile.vScore ?? 0
  const entries = Object.entries(rings) as [string, number][]
  const strongest = entries.sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="min-h-screen" style={{ background: 'var(--ink)' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-6 py-4 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.85)' }}>
        <button onClick={() => router.back()} className="text-white/40 hover:text-white transition-colors mr-1">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="font-semibold text-sm">@{profile.handle}</span>
      </header>

      <div className="max-w-lg mx-auto px-5 py-8 space-y-8">

        {/* Hero */}
        <div className="flex items-start gap-5">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2" style={{ borderColor: `${tier.color}60` }}>
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl font-bold" style={{ background: `${tier.color}20`, color: tier.color }}>
                    {profile.displayName?.[0]?.toUpperCase()}
                  </div>
              }
            </div>
            {/* V-Score ring overlay */}
            <svg className="absolute -inset-1.5 w-24 h-24" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
              <circle
                cx="48" cy="48" r="44" fill="none"
                stroke={tier.color} strokeWidth="2" strokeLinecap="round"
                strokeDasharray={`${(vscore / 1000) * 276} 276`}
                strokeDashoffset="69" style={{ transition: 'stroke-dasharray 1s ease' }}
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-xl leading-tight">{profile.displayName}</h1>
            <p className="t-caption mt-0.5" style={{ color: 'var(--ghost)' }}>@{profile.handle}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="t-caption px-2 py-0.5 border rounded-full" style={{
                borderColor: `${tier.color}40`, color: tier.color, fontSize: '0.6rem'
              }}>{tier.label}</span>
              <span className="t-caption font-mono" style={{ color: 'var(--ghost)', fontSize: '0.65rem' }}>
                V-Score {vscore}
              </span>
            </div>
            {profile.bio && <p className="text-sm mt-2 text-white/60 leading-relaxed">{profile.bio}</p>}
          </div>
        </div>

        {/* Connect button */}
        <button
          onClick={handleConnect}
          disabled={connecting || connected}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
          style={{
            background: connected ? 'rgba(255,255,255,0.05)' : `${tier.color}20`,
            border: `1px solid ${connected ? 'rgba(255,255,255,0.1)' : `${tier.color}40`}`,
            color: connected ? 'var(--ghost)' : tier.color,
          }}
        >
          {connected ? '✓ Request sent' : connecting ? 'Connecting…' : 'Connect'}
        </button>

        {/* Rings */}
        <div>
          <p className="t-caption mb-3" style={{ color: 'var(--ghost)', fontSize: '0.65rem' }}>SOVEREIGN RINGS</p>
          <div className="space-y-2.5">
            {(Object.entries(rings) as [string, number][]).map(([key, val]) => {
              const meta = RING_META[key as keyof typeof RING_META]
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="t-caption w-16 flex-shrink-0" style={{ color: 'var(--ghost)', fontSize: '0.65rem' }}>
                    {meta.label}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${val}%`, background: meta.color }} />
                  </div>
                  <span className="font-mono text-xs w-8 text-right" style={{ color: meta.color }}>{val}</span>
                </div>
              )
            })}
          </div>
          <p className="t-caption mt-3" style={{ color: 'var(--ghost)', fontSize: '0.6rem' }}>
            Strongest ring: <span style={{ color: RING_META[strongest[0] as keyof typeof RING_META]?.color }}>{strongest[0]} ({strongest[1]}%)</span>
          </p>
        </div>

        {/* Token */}
        {profile.tokenSymbol && (
          <div className="p-4 rounded-xl border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="t-caption mb-1" style={{ color: 'var(--ghost)', fontSize: '0.65rem' }}>YOUTOKEN</p>
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold">${profile.tokenSymbol}</span>
              <div className="text-right">
                <p className="font-mono text-sm" style={{ color: tier.color }}>
                  ${(profile.tokenPrice ?? 0).toFixed(4)}
                </p>
                <p className="t-caption" style={{ color: 'var(--ghost)', fontSize: '0.6rem' }}>
                  {(profile.tokenSupply ?? 0).toLocaleString()} supply
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Posts */}
        {posts.length > 0 && (
          <div>
            <p className="t-caption mb-3" style={{ color: 'var(--ghost)', fontSize: '0.65rem' }}>RECENT POSTS</p>
            <div className="space-y-3">
              {posts.map((post: any) => (
                <div key={post.id} className="p-4 rounded-xl border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <p className="text-sm text-white/80 leading-relaxed">{post.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="t-caption" style={{ color: 'var(--ghost)', fontSize: '0.6rem' }}>
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                    {(post._count?.likes ?? post.likesCount ?? 0) > 0 && (
                      <span className="t-caption" style={{ color: 'var(--ghost)', fontSize: '0.6rem' }}>
                        ♥ {post._count?.likes ?? post.likesCount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
