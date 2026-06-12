import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

/** Run after main seed to add token + posts if missing — safe to call every startup */
export async function seedExtras() {
  try {
    const demoUser = await prisma.user.findUnique({ where: { email: 'demo@viva.app' } })
    if (!demoUser) return

    // Token (unique on ownerId so upsert is safe)
    const existing = await prisma.token.findUnique({ where: { ownerId: demoUser.id } })
    if (!existing) {
      await prisma.token.create({
        data: { ownerId: demoUser.id, symbol: 'SOV', name: 'Sovereign Token', supply: 100000, price: 2.45 },
      })
      console.log('[seed] demo token created')
    }

    // Posts — only seed if none exist
    const postCount = await prisma.post.count()
    if (postCount === 0) {
      const posts = [
        { content: 'Built my first ZK health proof today. The idea that I can prove I sleep 8hrs without revealing my actual sleep data is wild. Sovereignty starts here.', category: 'health', attentionScore: 142 },
        { content: 'My YouToken just crossed 50 holders. Watching my bonding curve move in real time — this is what ownership feels like. V-Score up 40pts this week.', category: 'general', attentionScore: 89 },
        { content: 'The prediction markets called the Fed move before the news did. 3 data points in my feed, all converging. VIVA AI twin flagged it 6hrs early.', category: 'markets', attentionScore: 217 },
        { content: 'Set my twin to L2 autonomy this morning. It handled 3 calendar negotiations, flagged 2 suspicious contracts, and bumped my activity ring to 94%.', category: 'twin', attentionScore: 334 },
        { content: 'Longevity escape velocity market sitting at 22% YES. Staking NO — not because I\'m pessimistic, but the timeline is underestimated. 2035 is more likely.', category: 'markets', attentionScore: 156 },
      ]
      for (const p of posts) {
        await prisma.post.create({ data: { ...p, authorId: demoUser.id } })
      }
      console.log('[seed] demo posts created')
    }
  } catch (e) {
    console.error('[seed extras] error:', e)
  }
}

export async function seedDatabase() {
  try {
    // Check if already seeded
    const count = await prisma.market.count()
    if (count > 0) {
      console.log('[seed] already seeded, skipping')
      return
    }

    console.log('[seed] seeding database...')

    // Demo user
    const hash = await bcrypt.hash('demo1234', 10)
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo@viva.app' },
      update: {},
      create: {
        email: 'demo@viva.app',
        handle: 'sovereign',
        displayName: 'Sovereign',
        passwordHash: hash,
        bio: 'Living the viva life.',
        vScore: 850,
        tier: 'GUARDIAN',
        sleepRing: 78,
        nutritionRing: 65,
        activityRing: 92,
        socialRing: 55,
        wealthRing: 70,
        tokenSymbol: 'SOV',
        tokenPrice: 2.45,
        tokenSupply: 100000,
      },
    })

    // Markets
    const markets = [
      { title: 'BTC hits $100K by end of 2025', description: 'Will Bitcoin reach six figures?', category: 'crypto', yesProb: 0.62, totalVolume: 1240000, closesAt: new Date('2025-12-31') },
      { title: 'ETH flips BTC market cap by 2026', description: 'Will Ethereum overtake Bitcoin?', category: 'crypto', yesProb: 0.18, totalVolume: 540000, closesAt: new Date('2026-01-01') },
      { title: 'AI contributes 5%+ of global GDP by 2027', description: 'Measured by IMF or World Bank.', category: 'tech', yesProb: 0.45, totalVolume: 890000, closesAt: new Date('2027-01-01') },
      { title: 'Viva reaches 1M users in 2025', description: 'Total registered users on platform.', category: 'social', yesProb: 0.71, totalVolume: 320000, closesAt: new Date('2025-12-31') },
      { title: 'Longevity escape velocity declared by 2030', description: 'Will a credible body make the declaration?', category: 'health', yesProb: 0.22, totalVolume: 670000, closesAt: new Date('2030-01-01') },
    ]
    for (const m of markets) {
      await prisma.market.create({ data: m })
    }

    // Rooms
    const rooms = [
      { title: 'Biohacking HQ', topic: 'Longevity, sleep, nutrition protocols.', hostId: demoUser.id, isLive: false },
      { title: 'Crypto Signals', topic: 'Alpha, calls, market analysis.', hostId: demoUser.id, isLive: false },
      { title: 'Builder Lounge', topic: 'Founders, PMs, engineers building in public.', hostId: demoUser.id, isLive: false },
      { title: 'Mindset Lab', topic: 'Mental performance, stoicism, flow states.', hostId: demoUser.id, isLive: false },
    ]
    for (const r of rooms) {
      const room = await prisma.room.create({ data: r })
      await prisma.roomMember.create({
        data: { roomId: room.id, userId: demoUser.id, role: 'HOST' },
      })
    }

    // Demo YouToken
    await prisma.token.create({
      data: {
        ownerId: demoUser.id,
        symbol: 'SOV',
        name: 'Sovereign Token',
        supply: 100000,
        price: 2.45,
      },
    })

    // Seed feed posts
    const posts = [
      { content: 'Built my first ZK health proof today. The idea that I can prove I sleep 8hrs without revealing my actual sleep data is wild. Sovereignty starts here.', category: 'health', attentionScore: 142 },
      { content: 'My YouToken just crossed 50 holders. Watching my bonding curve move in real time — this is what ownership feels like. V-Score up 40pts this week.', category: 'general', attentionScore: 89 },
      { content: 'The prediction markets called the Fed move before the news did. 3 data points in my feed, all converging. VIVA AI twin flagged it 6hrs early.', category: 'markets', attentionScore: 217 },
      { content: 'Set my twin to L2 autonomy this morning. It handled 3 calendar negotiations, flagged 2 suspicious contracts, and bumped my activity ring to 94%. Feels like having a chief of staff.', category: 'twin', attentionScore: 334 },
      { content: 'Longevity escape velocity market sitting at 22% YES. I\'m staking NO — not because I\'m pessimistic, but because the timeline is underestimated. 2035 is more likely.', category: 'markets', attentionScore: 156 },
    ]
    for (const p of posts) {
      await prisma.post.create({ data: { ...p, authorId: demoUser.id } })
    }

    console.log('[seed] done — markets, rooms, token, posts, demo user created')
  } catch (e) {
    console.error('[seed] error:', e)
  }
}
