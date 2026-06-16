'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface CollectionItem {
  id: string
  title: string
  type: 'post' | 'nft' | 'signal' | 'audio' | 'video'
  icon: string
  preview: string
  value?: string
  ts: string
}

interface Collection {
  id: string
  title: string
  description: string
  coverColor: string
  icon: string
  ownerHandle: string
  ownerName: string
  ownerColor: string
  type: 'public' | 'token-gated' | 'private'
  minTokens?: number
  tokenSymbol?: string
  items: CollectionItem[]
  followers: number
  youFollow: boolean
}

const COLLECTIONS: Record<string, Collection> = {
  col1: {
    id: 'col1',
    title: 'DeFi Deep Dives',
    description: 'My best long-form research threads, signal packs, and market analysis going back 2 years. Curated for serious investors.',
    coverColor: '#a855f7',
    icon: '📊',
    ownerHandle: 'sovereign_v',
    ownerName: 'Sovereign V',
    ownerColor: '#a855f7',
    type: 'token-gated',
    minTokens: 25,
    tokenSymbol: 'SVRN',
    followers: 1842,
    youFollow: false,
    items: [
      { id: 'i1', type: 'post',   icon: '✍️', title: 'The BTC cycle thesis — deep dive',         preview: '5,400 words on why BTC cycles are compressing', ts: '2026-05-20T10:00:00Z' },
      { id: 'i2', type: 'signal', icon: '📈', title: 'ETH accumulation signal — May 14',          preview: 'Entry $2,800 · TP $3,600 · SL $2,600',           value: '+28.6%',            ts: '2026-05-14T08:00:00Z' },
      { id: 'i3', type: 'post',   icon: '✍️', title: 'DeFi protocol risk scoring framework',     preview: 'How I evaluate new protocols before investing',   ts: '2026-04-30T12:00:00Z' },
      { id: 'i4', type: 'signal', icon: '📈', title: 'SOL breakout signal — April 22',           preview: 'Entry $148 · TP1 $180 · TP2 $220',               value: '+38.2%',            ts: '2026-04-22T09:00:00Z' },
      { id: 'i5', type: 'post',   icon: '✍️', title: 'Stablecoin yield strategy 2026',           preview: '18% APY without touching dodgy protocols',       ts: '2026-04-01T11:00:00Z' },
    ],
  },
  col2: {
    id: 'col2',
    title: 'Beat Collection Vol. 1',
    description: 'Original beats, production tutorials, and exclusive sample packs from my studio sessions. 2 new tracks added monthly.',
    coverColor: '#ec4899',
    icon: '🎵',
    ownerHandle: 'jaxbeats',
    ownerName: 'Jax Beats',
    ownerColor: '#ec4899',
    type: 'token-gated',
    minTokens: 10,
    tokenSymbol: 'JAX',
    followers: 743,
    youFollow: false,
    items: [
      { id: 'j1', type: 'audio', icon: '🎵', title: 'Midnight Flex — prod. by Jax',       preview: 'Trap · 140bpm · Available for leasing', ts: '2026-06-01T00:00:00Z' },
      { id: 'j2', type: 'audio', icon: '🎵', title: 'Cloud Walk (Instrumental)',            preview: 'Lo-fi hip hop · 92bpm · Royalty-free for holders', ts: '2026-05-15T00:00:00Z' },
      { id: 'j3', type: 'video', icon: '🎬', title: 'How I made "Midnight Flex" in 2hr',   preview: 'Full studio session breakdown', ts: '2026-05-10T00:00:00Z' },
      { id: 'j4', type: 'audio', icon: '🎵', title: 'Sample Pack — Drum Kit Vol. 3',       preview: '128 drum samples, all royalty-free', ts: '2026-04-20T00:00:00Z' },
    ],
  },
}

const ITEM_COLORS: Record<string, string> = {
  post:   '#818cf8',
  nft:    '#a855f7',
  signal: '#22c55e',
  audio:  '#ec4899',
  video:  '#f59e0b',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

export default function CollectionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : 'col1'
  const col = COLLECTIONS[id] ?? COLLECTIONS.col1

  const [following, setFollowing] = useState(col.youFollow)
  const [unlocked, setUnlocked] = useState(false)
  const [unlocking, setUnlocking] = useState(false)

  async function unlock() {
    setUnlocking(true)
    await new Promise(r => setTimeout(r, 1200))
    setUnlocking(false)
    setUnlocked(true)
  }

  const locked = col.type === 'token-gated' && !unlocked

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      {/* Header / hero */}
      <div className="relative"
        style={{ background: `linear-gradient(to bottom, ${col.coverColor}20, transparent)` }}>
        <div className="absolute inset-0 opacity-5"
          style={{ background: `radial-gradient(circle at 30% 50%, ${col.coverColor}, transparent 70%)` }} />
        <div className="relative px-4 pt-4 pb-5">
          <button onClick={() => router.back()} className="mb-4 p-1.5 rounded-lg hover:bg-white/5 text-white/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="text-4xl mb-3">{col.icon}</div>
          <div className="text-2xl font-black text-white mb-1">{col.title}</div>
          <div className="flex items-center gap-2 mb-3">
            {col.type === 'token-gated' && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: `${col.coverColor}15`, color: col.coverColor }}>
                🔒 {col.minTokens}+ ${col.tokenSymbol}
              </span>
            )}
            <span className="text-xs text-white/25">{col.items.length} items · {col.followers.toLocaleString()} followers</span>
          </div>
          <p className="text-sm text-white/45 leading-relaxed">{col.description}</p>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Owner */}
        <button onClick={() => router.push(`/profile/${col.ownerHandle}`)}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/5 text-left"
          style={{ background: 'rgba(255,255,255,0.018)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs"
            style={{ background: `${col.ownerColor}18`, color: col.ownerColor }}>
            {col.ownerName[0]}
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm text-white/80">{col.ownerName}</div>
            <div className="text-xs text-white/25">@{col.ownerHandle}</div>
          </div>
          <button onClick={e => { e.stopPropagation(); setFollowing(f => !f) }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold"
            style={following ? { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' } : { background: col.ownerColor, color: '#04040A' }}>
            {following ? 'Following' : 'Follow'}
          </button>
        </button>

        {/* Unlock CTA */}
        {locked && (
          <div className="p-4 rounded-2xl border space-y-3"
            style={{ background: `${col.coverColor}08`, borderColor: `${col.coverColor}20` }}>
            <div className="text-sm text-white/60">
              Hold <strong style={{ color: col.coverColor }}>{col.minTokens}+ ${col.tokenSymbol}</strong> tokens to unlock this collection.
            </div>
            <div className="flex gap-2">
              <button onClick={unlock} disabled={unlocking}
                className="flex-1 py-2.5 rounded-xl font-black text-sm disabled:opacity-50"
                style={{ background: col.coverColor, color: '#04040A' }}>
                {unlocking ? 'Unlocking…' : `Get $${col.tokenSymbol} Tokens`}
              </button>
              <button onClick={() => router.push(`/tokens/${col.tokenSymbol}`)}
                className="px-3 py-2.5 rounded-xl text-xs font-bold"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                View Token
              </button>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="space-y-2">
          <div className="text-xs text-white/35 font-semibold uppercase tracking-wider">
            {col.items.length} Items
          </div>
          {col.items.map(item => {
            const color = ITEM_COLORS[item.type] ?? 'white'
            return (
              <div key={item.id}
                className="flex items-center gap-3 p-3 rounded-2xl border border-white/4 relative overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.015)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: `${color}10`, border: `1px solid ${color}15` }}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-sm text-white/80 truncate ${locked ? 'blur-sm select-none' : ''}`}>
                    {item.title}
                  </div>
                  <div className={`text-xs text-white/30 truncate ${locked ? 'blur-sm select-none' : ''}`}>
                    {item.preview}
                  </div>
                  <div className="text-xs text-white/20 mt-0.5">{fmtDate(item.ts)}</div>
                </div>
                {item.value && (
                  <div className="font-black text-sm flex-shrink-0" style={{ color: '#22c55e' }}>{item.value}</div>
                )}
                {locked && (
                  <div className="absolute inset-0 flex items-center justify-end pr-4"
                    style={{ background: 'rgba(4,4,10,0.3)' }}>
                    <span style={{ color: col.coverColor }} className="text-sm">🔒</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
