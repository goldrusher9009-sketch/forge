import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { signAccess, signRefresh, verifyRefresh } from '../lib/jwt'
import { AppError } from '../middleware/error'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

const RegisterSchema = z.object({
  handle: z.string().min(3).max(32).regex(/^[a-z0-9_]+$/),
  displayName: z.string().min(1).max(64),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  walletAddress: z.string().optional(),
  sleepRing: z.number().int().min(0).max(100).default(0),
  nutritionRing: z.number().int().min(0).max(100).default(0),
  activityRing: z.number().int().min(0).max(100).default(0),
  socialRing: z.number().int().min(0).max(100).default(0),
  wealthRing: z.number().int().min(0).max(100).default(0),
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

function calcVScore(rings: { sleepRing: number; nutritionRing: number; activityRing: number; socialRing: number; wealthRing: number }) {
  const avg = (rings.sleepRing + rings.nutritionRing + rings.activityRing + rings.socialRing + rings.wealthRing) / 5
  return Math.round(avg * 4) // 0-400 from rings alone
}

function getTier(score: number) {
  if (score >= 800) return 'SOVEREIGN' as const
  if (score >= 600) return 'GUARDIAN' as const
  if (score >= 400) return 'STABLE' as const
  if (score >= 200) return 'RISING' as const
  return 'SEED' as const
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const body = RegisterSchema.parse(req.body)
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: body.email }, { handle: body.handle }] },
    })
    if (existing) throw new AppError(409, 'Handle or email already taken')

    const passwordHash = await bcrypt.hash(body.password, 12)
    const vScore = calcVScore(body)
    const tier = getTier(vScore)

    const user = await prisma.user.create({
      data: {
        handle: body.handle,
        displayName: body.displayName,
        email: body.email,
        passwordHash,
        walletAddress: body.walletAddress,
        vScore,
        tier,
        sleepRing: body.sleepRing,
        nutritionRing: body.nutritionRing,
        activityRing: body.activityRing,
        socialRing: body.socialRing,
        wealthRing: body.wealthRing,
      },
    })

    const access = signAccess({ userId: user.id, handle: user.handle })
    const refresh = signRefresh({ userId: user.id, handle: user.handle })
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refresh,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    const { passwordHash: _, ...safeUser } = user
    res.status(201).json({ user: safeUser, accessToken: access, refreshToken: refresh })
  } catch (e) {
    next(e)
  }
})

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = LoginSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw new AppError(401, 'Invalid credentials')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new AppError(401, 'Invalid credentials')

    const access = signAccess({ userId: user.id, handle: user.handle })
    const refresh = signRefresh({ userId: user.id, handle: user.handle })
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refresh,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    const { passwordHash: _, ...safeUser } = user
    res.json({ user: safeUser, accessToken: access, refreshToken: refresh })
  } catch (e) {
    next(e)
  }
})

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body)
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
    if (!stored || stored.expiresAt < new Date()) throw new AppError(401, 'Invalid refresh token')

    const payload = verifyRefresh(refreshToken)
    const access = signAccess({ userId: payload.userId, handle: payload.handle })

    res.json({ accessToken: access })
  } catch (e) {
    next(e)
  }
})

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body)
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true, handle: true, displayName: true, email: true,
        avatarUrl: true, bio: true, walletAddress: true,
        vScore: true, tier: true,
        sleepRing: true, nutritionRing: true, activityRing: true, socialRing: true, wealthRing: true,
        tokenSymbol: true, tokenSupply: true, tokenPrice: true,
        createdAt: true, updatedAt: true,
      },
    })
    if (!user) throw new AppError(404, 'User not found')
    res.json(user)
  } catch (e) {
    next(e)
  }
})

export default router
