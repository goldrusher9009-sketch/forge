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
  tokenSymbol: true, tokenSupply: true, tokenPrice: true,
  createdAt: true,
}

// GET /api/users/:handle
router.get('/:handle', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { handle: req.params.handle },
      select: safeSelect,
    })
    if (!user) throw new AppError(404, 'User not found')
    res.json(user)
  } catch (e) { next(e) }
})

// PATCH /api/users/me
router.patch('/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({
      displayName: z.string().min(1).max(64).optional(),
      bio: z.string().max(500).optional(),
      avatarUrl: z.string().url().optional(),
      walletAddress: z.string().optional(),
      sleepRing: z.number().int().min(0).max(100).optional(),
      nutritionRing: z.number().int().min(0).max(100).optional(),
      activityRing: z.number().int().min(0).max(100).optional(),
      socialRing: z.number().int().min(0).max(100).optional(),
      wealthRing: z.number().int().min(0).max(100).optional(),
    }).parse(req.body)

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: body,
      select: safeSelect,
    })
    res.json(user)
  } catch (e) { next(e) }
})

// GET /api/users  — search
router.get('/', async (req, res, next) => {
  try {
    const q = z.string().optional().parse(req.query.q)
    const users = await prisma.user.findMany({
      where: q ? {
        OR: [
          { handle: { contains: q, mode: 'insensitive' } },
          { displayName: { contains: q, mode: 'insensitive' } },
        ],
      } : undefined,
      select: safeSelect,
      take: 20,
      orderBy: { vScore: 'desc' },
    })
    res.json(users)
  } catch (e) { next(e) }
})

export default router
