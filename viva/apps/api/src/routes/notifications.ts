import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/error'

const router = Router()

// GET /api/notifications
router.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    const unread = notifications.filter(n => !n.read).length
    res.json({ notifications, unread })
  } catch (e) { next(e) }
})

// GET /api/notifications/unread-count  ← before /:id routes
router.get('/unread-count', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const count = await prisma.notification.count({ where: { userId: req.userId!, read: false } })
    res.json({ count })
  } catch (e) { next(e) }
})

// POST /api/notifications/read-all  ← before /:id/read
router.post('/read-all', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId!, read: false },
      data: { read: true },
    })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// POST /api/notifications/:id/read
router.post('/:id/read', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const n = await prisma.notification.findUnique({ where: { id: req.params.id } })
    if (!n) throw new AppError(404, 'Not found')
    if (n.userId !== req.userId) throw new AppError(403, 'Forbidden')
    const updated = await prisma.notification.update({ where: { id: n.id }, data: { read: true } })
    res.json(updated)
  } catch (e) { next(e) }
})

export default router
