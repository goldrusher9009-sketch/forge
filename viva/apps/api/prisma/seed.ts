import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

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
  console.log('Demo user:', demoUser.handle)

  // Markets — match schema: title, description, category, yesProb, totalVolume, closesAt
  const markets = [
    { title: 'BTC hits $100K by end of 2025', description: 'Will Bitcoin reach six figures?', category: 'crypto', yesProb: 0.62, totalVolume: 1240000, closesAt: new Date('2027-12-31') },
    { title: 'ETH flips BTC market cap by 2026', description: 'Will Ethereum overtake Bitcoin?', category: 'crypto', yesProb: 0.18, totalVolume: 540000, closesAt: new Date('2026-01-01') },
    { title: 'AI contributes 5%+ of global GDP by 2027', description: 'Measured by IMF or World Bank.', category: 'tech', yesProb: 0.45, totalVolume: 890000, closesAt: new Date('2027-01-01') },
    { title: 'Viva reaches 1M users in 2025', description: 'Total registered users on platform.', category: 'social', yesProb: 0.71, totalVolume: 320000, closesAt: new Date('2027-12-31') },
    { title: 'Longevity escape velocity declared by 2030', description: 'Will a credible body make the declaration?', category: 'health', yesProb: 0.22, totalVolume: 670000, closesAt: new Date('2030-01-01') },
  ]

  for (const m of markets) {
    const existing = await prisma.market.findFirst({ where: { title: m.title } })
    if (!existing) await prisma.market.create({ data: m })
  }
  console.log(`Seeded ${markets.length} markets`)

  // Rooms — match schema: title, hostId, topic, isLive, minVScore
  const rooms = [
    { title: 'Biohacking HQ', topic: 'Longevity, sleep, nutrition protocols.', hostId: demoUser.id, isLive: false },
    { title: 'Crypto Signals', topic: 'Alpha, calls, market analysis.', hostId: demoUser.id, isLive: false },
    { title: 'Builder Lounge', topic: 'Founders, PMs, engineers building in public.', hostId: demoUser.id, isLive: false },
    { title: 'Mindset Lab', topic: 'Mental performance, stoicism, flow states.', hostId: demoUser.id, isLive: false },
  ]

  for (const r of rooms) {
    const existing = await prisma.room.findFirst({ where: { title: r.title } })
    if (!existing) {
      const room = await prisma.room.create({ data: r })
      await prisma.roomMember.create({
        data: { roomId: room.id, userId: demoUser.id, role: 'HOST' },
      })
    }
  }
  console.log(`Seeded ${rooms.length} rooms`)

  console.log('Seed complete.')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
