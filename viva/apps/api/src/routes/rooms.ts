import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/error'

const router = Router()

// GET /api/rooms
router.get('/', optionalAuth, async (_req, res, next) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        _count: { select: { members: true } },
      },
      orderBy: [
        { isLive: 'desc' },
        { scheduledFor: 'asc' },
      ],
      take: 20,
    })
    res.json(rooms)
  } catch (e) { next(e) }
})

// GET /api/rooms/:id
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: req.params.id },
      include: {
        members: {
          where: { leftAt: null },
          include: {
            user: { select: { id: true, handle: true, displayName: true, avatarUrl: true, vScore: true } },
          },
        },
      },
    })
    if (!room) throw new AppError(404, 'Room not found')
    res.json(room)
  } catch (e) { next(e) }
})

// POST /api/rooms — create
router.post('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({
      title: z.string().min(1).max(128),
      topic: z.string().max(256).optional(),
      minVScore: z.number().int().min(0).max(1000).default(0),
      scheduledFor: z.string().datetime().optional(),
    }).parse(req.body)

    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) throw new AppError(401, 'Unauthorized')

    const room = await prisma.room.create({
      data: {
        ...body,
        scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
        hostId: req.userId!,
        isLive: !body.scheduledFor,
        members: {
          create: { userId: req.userId!, role: 'HOST', isMuted: false },
        },
      },
    })
    res.status(201).json(room)
  } catch (e) { next(e) }
})

// POST /api/rooms/:id/join
router.post('/:id/join', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const room = await prisma.room.findUnique({ where: { id: req.params.id } })
    if (!room) throw new AppError(404, 'Room not found')

    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) throw new AppError(401, 'Unauthorized')
    if (user.vScore < room.minVScore) {
      throw new AppError(403, `V-Score ${room.minVScore}+ required to join`)
    }

    await prisma.roomMember.upsert({
      where: { roomId_userId: { roomId: room.id, userId: req.userId! } },
      create: { roomId: room.id, userId: req.userId!, role: 'LISTENER' },
      update: { leftAt: null },
    })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// POST /api/rooms/:id/leave
router.post('/:id/leave', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    await prisma.roomMember.update({
      where: { roomId_userId: { roomId: req.params.id, userId: req.userId! } },
      data: { leftAt: new Date() },
    })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// PATCH /api/rooms/:id/mute
router.patch('/:id/mute', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { muted } = z.object({ muted: z.boolean() }).parse(req.body)
    await prisma.roomMember.update({
      where: { roomId_userId: { roomId: req.params.id, userId: req.userId! } },
      data: { isMuted: muted },
    })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

export default router
