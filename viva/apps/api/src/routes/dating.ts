import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/error'

const router = Router()

const safeSelect = {
  id: true, handle: true, displayName: true, avatarUrl: true, bio: true,
  vScore: true, tier: true,
  sleepRing: true, nutritionRing: true, activityRing: true, socialRing: true, wealthRing: true,
}

function calcCompatibility(a: any, b: any): number {
  const rings: Array<'sleepRing' | 'nutritionRing' | 'activityRing' | 'socialRing' | 'wealthRing'> =
    ['sleepRing', 'nutritionRing', 'activityRing', 'socialRing', 'wealthRing']
  const diffs = rings.map(r => Math.abs((a[r] ?? 50) - (b[r] ?? 50)))
  const avgDiff = diffs.reduce((s, d) => s + d, 0) / diffs.length
  return Math.round(100 - avgDiff)
}

// GET /api/dating/discover — profiles to discover
router.get('/discover', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const me = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!me) throw new AppError(401, 'Unauthorized')

    // Exclude already matched/passed
    const existing = await prisma.match.findMany({
      where: { OR: [{ userAId: req.userId }, { userBId: req.userId }] },
      select: { userAId: true, userBId: true },
    })
    const seen = new Set(existing.flatMap(m => [m.userAId, m.userBId]))
    seen.add(req.userId!)

    const profiles = await prisma.user.findMany({
      where: { id: { notIn: [...seen] } },
      select: { ...safeSelect, sleepRing: true, nutritionRing: true, activityRing: true, socialRing: true, wealthRing: true },
      take: 20,
      orderBy: { vScore: 'desc' },
    })

    const withCompat = profiles.map(p => ({
      ...p,
      compatibility: calcCompatibility(me, p),
    }))

    res.json(withCompat)
  } catch (e) { next(e) }
})

// GET /api/dating/matches — my matches
router.get('/matches', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ userAId: req.userId }, { userBId: req.userId }],
        status: 'MATCHED',
      },
      include: {
        userA: { select: safeSelect },
        userB: { select: safeSelect },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const result = matches.map(m => ({
      ...m,
      otherUser: m.userAId === req.userId ? m.userB : m.userA,
    }))

    res.json(result)
  } catch (e) { next(e) }
})

// POST /api/dating/connect/:targetId
router.post('/connect/:targetId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const targetId = req.params.targetId
    if (targetId === req.userId) throw new AppError(400, 'Cannot match with yourself')

    const me = await prisma.user.findUnique({ where: { id: req.userId } })
    const target = await prisma.user.findUnique({ where: { id: targetId } })
    if (!target) throw new AppError(404, 'User not found')

    // Check if target already connected to us
    const reverse = await prisma.match.findUnique({
      where: { userAId_userBId: { userAId: targetId, userBId: req.userId! } },
    })

    if (reverse && reverse.status === 'PENDING') {
      // Mutual match!
      const matched = await prisma.match.update({
        where: { id: reverse.id },
        data: { status: 'MATCHED', compatibility: calcCompatibility(me, target) },
      })
      return res.json({ status: 'MATCHED', match: matched })
    }

    // Create pending connect
    const match = await prisma.match.upsert({
      where: { userAId_userBId: { userAId: req.userId!, userBId: targetId } },
      create: {
        userAId: req.userId!,
        userBId: targetId,
        status: 'PENDING',
        compatibility: calcCompatibility(me, target),
      },
      update: { status: 'PENDING' },
    })

    res.json({ status: 'PENDING', match })
  } catch (e) { next(e) }
})

// POST /api/dating/pass/:targetId
router.post('/pass/:targetId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    await prisma.match.upsert({
      where: { userAId_userBId: { userAId: req.userId!, userBId: req.params.targetId } },
      create: { userAId: req.userId!, userBId: req.params.targetId, status: 'PASSED' },
      update: { status: 'PASSED' },
    })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

export default router
