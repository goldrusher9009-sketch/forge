import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/error'

const router = Router()

// GET /api/markets
router.get('/', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const category = z.string().optional().parse(req.query.category)
    const sort = z.enum(['volume', 'closes', 'probability']).default('volume').parse(req.query.sort)

    const orderBy: Record<string, 'asc' | 'desc'> = {
      volume: { totalVolume: 'desc' },
      closes: { closesAt: 'asc' },
      probability: { yesProb: 'desc' },
    }[sort] as any

    const markets = await prisma.market.findMany({
      where: {
        resolvedAt: null,
        ...(category && category !== 'all' ? { category } : {}),
      },
      include: { _count: { select: { positions: true } } },
      orderBy,
      take: 30,
    })
    res.json(markets)
  } catch (e) { next(e) }
})

// GET /api/markets/:id
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const market = await prisma.market.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { positions: true } } },
    })
    if (!market) throw new AppError(404, 'Market not found')
    res.json(market)
  } catch (e) { next(e) }
})

// POST /api/markets/:id/stake
router.post('/:id/stake', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { side, amount } = z.object({
      side: z.enum(['YES', 'NO']),
      amount: z.number().int().min(1).max(10000),
    }).parse(req.body)

    const market = await prisma.market.findUnique({ where: { id: req.params.id } })
    if (!market) throw new AppError(404, 'Market not found')
    if (market.resolvedAt) throw new AppError(400, 'Market already resolved')
    if (market.closesAt < new Date()) throw new AppError(400, 'Market closed')

    const price = side === 'YES' ? market.yesProb : 1 - market.yesProb
    const payout = amount / price

    const position = await prisma.marketPosition.create({
      data: { marketId: market.id, userId: req.userId!, side, amount, price, payout },
    })

    // Update market probability (simple market maker simulation)
    const shift = side === 'YES' ? 0.02 : -0.02
    const newProb = Math.min(0.99, Math.max(0.01, market.yesProb + shift))
    await prisma.market.update({
      where: { id: market.id },
      data: { yesProb: newProb, totalVolume: { increment: amount } },
    })

    res.status(201).json({ position, newProbability: newProb, newYesProb: newProb })
  } catch (e) { next(e) }
})

// GET /api/markets/user/positions
router.get('/user/positions', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const positions = await prisma.marketPosition.findMany({
      where: { userId: req.userId },
      include: { market: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(positions)
  } catch (e) { next(e) }
})

export default router
