import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/error'

const router = Router()

const AGENT_TYPES = ['schedule', 'finance', 'health', 'social', 'market', 'search'] as const

// GET /api/twin/tasks
router.get('/tasks', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const tasks = await prisma.agentTask.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json(tasks)
  } catch (e) { next(e) }
})

// POST /api/twin/tasks — create task
router.post('/tasks', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({
      agentType: z.enum(AGENT_TYPES),
      title: z.string().min(1).max(256),
      description: z.string().max(2000).optional(),
      autonomy: z.number().int().min(1).max(3).default(1),
      scheduledFor: z.string().datetime().optional(),
    }).parse(req.body)

    const task = await prisma.agentTask.create({
      data: {
        ...body,
        userId: req.userId!,
        scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
      },
    })
    res.status(201).json(task)
  } catch (e) { next(e) }
})

// POST /api/twin/chat — meta-agent chat
router.post('/chat', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { message, history } = z.object({
      message: z.string().min(1).max(2000),
      history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })).optional(),
    }).parse(req.body)

    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) throw new AppError(401, 'Unauthorized')

    // Simulated AI Twin response engine (replace with real LLM in prod)
    const responses: Record<string, string> = {
      default: `I've analyzed your rings. Sleep ${user.sleepRing}%, Activity ${user.activityRing}%, Nutrition ${user.nutritionRing}%. Recommend: prioritize sleep consistency this week.`,
      health: `Health ring at ${user.activityRing}% activity. Suggest 30-min walk today. V-Score impact: +12 points estimated.`,
      market: `Prediction market opportunity: health prediction closing in 48h. Your V-Score of ${user.vScore} qualifies for all markets.`,
      finance: `Token price up 3.2% today. Wealth ring at ${user.wealthRing}%. Recommend staking 50 $VIVA in the Stable pool.`,
      social: `Social ring at ${user.socialRing}%. 3 match requests pending. Attending audio rooms could boost social score by 15%.`,
    }

    const key = Object.keys(responses).find(k => message.toLowerCase().includes(k)) || 'default'
    const reply = responses[key]

    res.json({
      response: reply,
      agentType: key,
      actionsAvailable: ['log_health', 'stake_market', 'send_message'],
    })
  } catch (e) { next(e) }
})

// PATCH /api/twin/tasks/:id
router.patch('/tasks/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({
      status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
      result: z.string().optional(),
    }).parse(req.body)

    const task = await prisma.agentTask.findUnique({ where: { id: req.params.id } })
    if (!task) throw new AppError(404, 'Task not found')
    if (task.userId !== req.userId) throw new AppError(403, 'Forbidden')

    const updated = await prisma.agentTask.update({
      where: { id: task.id },
      data: {
        ...body,
        ...(body.status === 'COMPLETED' ? { completedAt: new Date() } : {}),
      },
    })
    res.json(updated)
  } catch (e) { next(e) }
})

export default router
