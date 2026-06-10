import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/error'

const router = Router()

// GET /api/messages/threads — list my threads
router.get('/threads', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const threads = await prisma.thread.findMany({
      where: {
        members: { some: { userId: req.userId } },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, handle: true, displayName: true, avatarUrl: true, vScore: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
    res.json(threads)
  } catch (e) { next(e) }
})

// POST /api/messages/threads — create or get DM thread
router.post('/threads', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { recipientId } = z.object({ recipientId: z.string() }).parse(req.body)
    if (recipientId === req.userId) throw new AppError(400, 'Cannot message yourself')

    // Check existing DM thread
    const existing = await prisma.thread.findFirst({
      where: {
        isGroup: false,
        members: { every: { userId: { in: [req.userId!, recipientId] } } },
        AND: [
          { members: { some: { userId: req.userId } } },
          { members: { some: { userId: recipientId } } },
        ],
      },
    })
    if (existing) return res.json(existing)

    const thread = await prisma.thread.create({
      data: {
        members: {
          create: [
            { userId: req.userId! },
            { userId: recipientId },
          ],
        },
      },
      include: { members: { include: { user: { select: { id: true, handle: true, displayName: true } } } } },
    })
    res.status(201).json(thread)
  } catch (e) { next(e) }
})

// GET /api/messages/threads/:threadId
router.get('/threads/:threadId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const member = await prisma.threadMember.findUnique({
      where: { threadId_userId: { threadId: req.params.threadId, userId: req.userId! } },
    })
    if (!member) throw new AppError(403, 'Not in this thread')

    const cursor = z.string().optional().parse(req.query.cursor)
    const limit = 50

    const messages = await prisma.message.findMany({
      where: { threadId: req.params.threadId },
      include: {
        sender: { select: { id: true, handle: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    })

    const hasMore = messages.length > limit
    res.json({
      messages: hasMore ? messages.slice(0, -1).reverse() : messages.reverse(),
      nextCursor: hasMore ? messages[messages.length - 1].id : null,
    })
  } catch (e) { next(e) }
})

// POST /api/messages/threads/:threadId — send message
router.post('/threads/:threadId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const member = await prisma.threadMember.findUnique({
      where: { threadId_userId: { threadId: req.params.threadId, userId: req.userId! } },
    })
    if (!member) throw new AppError(403, 'Not in this thread')

    const { content } = z.object({ content: z.string().min(1).max(10000) }).parse(req.body)

    const message = await prisma.message.create({
      data: { threadId: req.params.threadId, senderId: req.userId!, content },
      include: { sender: { select: { id: true, handle: true, displayName: true, avatarUrl: true } } },
    })

    await prisma.thread.update({
      where: { id: req.params.threadId },
      data: { updatedAt: new Date() },
    })

    res.status(201).json(message)
  } catch (e) { next(e) }
})

export default router
