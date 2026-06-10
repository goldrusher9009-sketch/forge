import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/error'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

const RINGS = ['sleep', 'nutrition', 'activity', 'social', 'wealth'] as const

// GET /api/health/logs
router.get('/logs', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ring = z.enum(RINGS).optional().parse(req.query.ring)
    const logs = await prisma.healthLog.findMany({
      where: { userId: req.userId!, ...(ring ? { ring } : {}) },
      orderBy: { loggedAt: 'desc' },
      take: 100,
    })
    res.json(logs)
  } catch (e) { next(e) }
})

// POST /api/health/logs
router.post('/logs', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({
      ring: z.enum(RINGS),
      value: z.number().min(0).max(100),
      unit: z.string().optional(),
      note: z.string().max(500).optional(),
    }).parse(req.body)

    const log = await prisma.healthLog.create({
      data: { ...body, userId: req.userId! },
    })

    // Update user ring value
    const ringField = `${body.ring}Ring` as `${typeof RINGS[number]}Ring`
    await prisma.user.update({
      where: { id: req.userId },
      data: { [ringField]: Math.round(body.value) },
    })

    res.status(201).json(log)
  } catch (e) { next(e) }
})

// GET /api/health/proofs
router.get('/proofs', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const proofs = await prisma.zKProof.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
    })
    res.json(proofs)
  } catch (e) { next(e) }
})

// POST /api/health/proofs/generate
router.post('/proofs/generate', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { proofType } = z.object({
      proofType: z.enum(['health', 'income', 'location', 'identity']),
    }).parse(req.body)

    // Simulate ZK commitment generation
    const commitment = `0x${uuidv4().replace(/-/g, '')}${uuidv4().replace(/-/g, '')}`

    const proof = await prisma.zKProof.create({
      data: {
        userId: req.userId!,
        proofType,
        status: 'ACTIVE',
        commitment,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    })
    res.status(201).json(proof)
  } catch (e) { next(e) }
})

// POST /api/health/proofs/:id/mint-sbt
router.post('/proofs/:id/mint-sbt', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const proof = await prisma.zKProof.findUnique({ where: { id: req.params.id } })
    if (!proof) throw new AppError(404, 'Proof not found')
    if (proof.userId !== req.userId) throw new AppError(403, 'Forbidden')
    if (proof.sbtTokenId) throw new AppError(400, 'SBT already minted')

    // Simulate on-chain SBT mint
    const sbtTokenId = `SBT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    const updated = await prisma.zKProof.update({
      where: { id: proof.id },
      data: { sbtTokenId, mintedAt: new Date(), status: 'ACTIVE' },
    })
    res.json(updated)
  } catch (e) { next(e) }
})

export default router
