import { create } from 'zustand'

// ── Types ──────────────────────────────────────────────
export interface User {
  id: string
  handle: string
  displayName: string
  // API returns avatarUrl; alias avatar for convenience
  avatar?: string
  avatarUrl?: string
  bio?: string
  // Both spellings kept; vscore is canonical for UI
  vscore: number
  vScore?: number
  tier: 'seed' | 'rising' | 'stable' | 'guardian' | 'sovereign'
  rings: {
    sleep: number     // 0–100
    nutrition: number
    activity: number
    social: number
    wealth: number
  }
  youtoken: {
    symbol: string
    price: number
    supply: number
    holders: number
  }
  zkProofs: string[]  // proof type slugs
  walletAddress?: string
  joinedAt?: string
}

/** Map raw API user response to store User */
export function mapApiUser(me: any, fallback?: User): User {
  return {
    ...(fallback ?? mockUser()),
    id: me.id,
    handle: me.handle,
    displayName: me.displayName,
    avatar: me.avatarUrl ?? me.avatar,
    avatarUrl: me.avatarUrl ?? me.avatar,
    bio: me.bio,
    vscore: me.vScore ?? me.vscore ?? 0,
    vScore: me.vScore ?? me.vscore ?? 0,
    tier: (me.tier?.toLowerCase() ?? 'seed') as User['tier'],
    rings: {
      sleep:     me.sleepRing     ?? me.rings?.sleep     ?? 0,
      nutrition: me.nutritionRing ?? me.rings?.nutrition ?? 0,
      activity:  me.activityRing  ?? me.rings?.activity  ?? 0,
      social:    me.socialRing    ?? me.rings?.social    ?? 0,
      wealth:    me.wealthRing    ?? me.rings?.wealth    ?? 0,
    },
    youtoken: {
      symbol:  me.tokenSymbol  ?? fallback?.youtoken.symbol  ?? 'YOU',
      price:   me.tokenPrice   ?? fallback?.youtoken.price   ?? 0.01,
      supply:  me.tokenSupply  ?? fallback?.youtoken.supply  ?? 0,
      holders: me.tokenHolders ?? fallback?.youtoken.holders ?? 0,
    },
    zkProofs:      me.zkProofs      ?? fallback?.zkProofs      ?? [],
    walletAddress: me.walletAddress ?? fallback?.walletAddress ?? '',
    joinedAt:      me.createdAt     ?? fallback?.joinedAt      ?? '',
  }
}

export interface Message {
  id: string
  threadId: string
  from: string
  text: string
  ts: number
  encrypted: boolean
}

export interface Thread {
  id: string
  participants: string[]
  lastMsg: string
  lastTs: number
  unread: number
}

export interface Post {
  id: string
  author: string
  handle: string
  avatar: string
  content: string
  ts: number
  attentionEarned: number
  replies: number
  boosts: number
  tags: string[]
}

export interface Market {
  id: string
  question: string
  yesProb: number
  volume: number
  category: string
  closes: string
  myStake?: number
}

export interface Profile {
  id: string
  handle: string
  displayName: string
  avatar: string
  vscore: number
  tier: User['tier']
  bio: string
  distance: number
  compatibility: number
  verified: boolean
  zkBadges: string[]
}

// ── Mock data factories ────────────────────────────────
export function mockUser(): User {
  return {
    id: 'usr_01',
    handle: 'scott',
    displayName: 'Scott',
    avatar: `https://api.dicebear.com/8.x/shapes/svg?seed=scott&backgroundColor=7C3AED&size=96`,
    vscore: 712,
    tier: 'guardian',
    rings: { sleep: 82, nutrition: 67, activity: 91, social: 75, wealth: 58 },
    youtoken: { symbol: 'SCOTT', price: 0.148, supply: 10000, holders: 47 },
    zkProofs: ['health_basic', 'income_range', 'location_city'],
    walletAddress: '0x7c3a...ed42',
    joinedAt: '2024-01-15',
  }
}

export const RING_META = {
  sleep:     { label: 'Sleep',     color: '#7C3AED', unit: '%' },
  nutrition: { label: 'Nutrition', color: '#0891B2', unit: '%' },
  activity:  { label: 'Activity',  color: '#059669', unit: '%' },
  social:    { label: 'Social',    color: '#D97706', unit: '%' },
  wealth:    { label: 'Wealth',    color: '#E11D48', unit: '%' },
}

export const TIER_META: Record<User['tier'], { label: string; min: number; max: number; color: string }> = {
  seed:      { label: 'Seed',      min: 0,   max: 199,  color: '#6B7280' },
  rising:    { label: 'Rising',    min: 200, max: 399,  color: '#059669' },
  stable:    { label: 'Stable',    min: 400, max: 599,  color: '#0891B2' },
  guardian:  { label: 'Guardian',  min: 600, max: 799,  color: '#7C3AED' },
  sovereign: { label: 'Sovereign', min: 800, max: 1000, color: '#E11D48' },
}

// ── App Store ──────────────────────────────────────────
interface AppState {
  user: User | null
  onboarded: boolean
  setUser: (u: User) => void
  setOnboarded: (v: boolean) => void
  updateRings: (rings: Partial<User['rings']>) => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  onboarded: false,
  setUser: (user) => set({ user }),
  setOnboarded: (onboarded) => set({ onboarded }),
  updateRings: (rings) =>
    set((s) => s.user ? { user: { ...s.user, rings: { ...s.user.rings, ...rings } } } : s),
}))

// ── Mock data ──────────────────────────────────────────
export const MOCK_POSTS: Post[] = [
  {
    id: 'p1', author: 'Zara K.', handle: 'zarak', avatar: `https://api.dicebear.com/8.x/shapes/svg?seed=zara&backgroundColor=059669&size=48`,
    content: 'Built my first ZK health proof today. The idea that I can prove I sleep 8hrs without revealing my actual sleep data is wild. Sovereignty starts here.',
    ts: Date.now() - 3600000, attentionEarned: 142, replies: 23, boosts: 67, tags: ['health', 'zkp'],
  },
  {
    id: 'p2', author: 'Mateus O.', handle: 'mateuso', avatar: `https://api.dicebear.com/8.x/shapes/svg?seed=mateus&backgroundColor=0891B2&size=48`,
    content: 'My YouToken just crossed 50 holders. Watching my bonding curve move in real time — this is what ownership feels like. V-Score up 40pts this week.',
    ts: Date.now() - 7200000, attentionEarned: 89, replies: 14, boosts: 31, tags: ['youtoken', 'vscore'],
  },
  {
    id: 'p3', author: 'Aisha M.', handle: 'aisham', avatar: `https://api.dicebear.com/8.x/shapes/svg?seed=aisha&backgroundColor=D97706&size=48`,
    content: 'The prediction markets called the Fed move before the news did. 3 data points in my feed, all converging. VIVA AI twin flagged it 6hrs early.',
    ts: Date.now() - 14400000, attentionEarned: 217, replies: 41, boosts: 103, tags: ['markets', 'twin'],
  },
  {
    id: 'p4', author: 'Daniel R.', handle: 'danr', avatar: `https://api.dicebear.com/8.x/shapes/svg?seed=daniel&backgroundColor=E11D48&size=48`,
    content: 'Set my twin to L2 autonomy this morning. It handled 3 calendar negotiations, flagged 2 suspicious contracts, and bumped my activity ring to 94%. Feels like having a chief of staff.',
    ts: Date.now() - 21600000, attentionEarned: 334, replies: 58, boosts: 142, tags: ['twin', 'autonomy'],
  },
]

export const MOCK_MARKETS: Market[] = [
  { id: 'm1', question: 'Will Bitcoin exceed $150K before December 2025?', yesProb: 0.63, volume: 142000, category: 'Crypto', closes: '2025-12-01', myStake: 200 },
  { id: 'm2', question: 'Will the Fed cut rates 3+ times in 2025?', yesProb: 0.41, volume: 89000, category: 'Macro', closes: '2025-12-31' },
  { id: 'm3', question: 'Will VIVA reach 1M users by Q3?', yesProb: 0.72, volume: 34000, category: 'VIVA', closes: '2025-09-30', myStake: 500 },
  { id: 'm4', question: 'Will Ethereum surpass Ethereum in market cap?', yesProb: 0.08, volume: 12000, category: 'Crypto', closes: '2025-12-31' },
  { id: 'm5', question: 'Will Apple announce AR glasses at WWDC 2025?', yesProb: 0.55, volume: 67000, category: 'Tech', closes: '2025-06-15' },
  { id: 'm6', question: 'Will GPT-5 pass AGI benchmarks?', yesProb: 0.29, volume: 180000, category: 'AI', closes: '2025-12-31' },
]

export const MOCK_PROFILES: Profile[] = [
  {
    id: 'pr1', handle: 'luna_v', displayName: 'Luna V.', avatar: `https://api.dicebear.com/8.x/shapes/svg?seed=luna&backgroundColor=7C3AED&size=200`,
    vscore: 834, tier: 'sovereign', bio: 'Builder of systems. Believer in sovereign data. ZK-native.', distance: 2.1, compatibility: 94, verified: true, zkBadges: ['health', 'income', 'location'],
  },
  {
    id: 'pr2', handle: 'noa_d', displayName: 'Noa D.', avatar: `https://api.dicebear.com/8.x/shapes/svg?seed=noa&backgroundColor=059669&size=200`,
    vscore: 671, tier: 'guardian', bio: 'Permaculture + protocols. Growing things that last.', distance: 4.7, compatibility: 87, verified: true, zkBadges: ['health', 'location'],
  },
  {
    id: 'pr3', handle: 'felix_r', displayName: 'Felix R.', avatar: `https://api.dicebear.com/8.x/shapes/svg?seed=felix&backgroundColor=0891B2&size=200`,
    vscore: 589, tier: 'stable', bio: 'Researcher. Prediction markets addict. Usually right.', distance: 8.3, compatibility: 79, verified: false, zkBadges: ['income'],
  },
]

export const MOCK_THREADS: Thread[] = [
  { id: 't1', participants: ['luna_v', 'scott'], lastMsg: 'The ZK proof system is live. Check your health module.', lastTs: Date.now() - 1800000, unread: 2 },
  { id: 't2', participants: ['noa_d', 'scott'], lastMsg: 'You in for the rooms session tonight?', lastTs: Date.now() - 5400000, unread: 0 },
  { id: 't3', participants: ['mateuso', 'scott'], lastMsg: 'My YouToken just hit 50 holders!', lastTs: Date.now() - 28800000, unread: 1 },
]
