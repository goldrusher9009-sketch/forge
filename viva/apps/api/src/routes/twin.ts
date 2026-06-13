import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/error'
import { twinChat, runAgentTask } from '../lib/fable'

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

// POST /api/twin/tasks/:id/run — Fable 5 agentic execution
router.post('/tasks/:id/run', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const task = await prisma.agentTask.findUnique({ where: { id: req.params.id } })
    if (!task) throw new AppError(404, 'Task not found')
    if (task.userId !== req.userId) throw new AppError(403, 'Forbidden')
    if (task.status === 'COMPLETED') throw new AppError(400, 'Task already completed')

    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) throw new AppError(401, 'Unauthorized')

    const rings = {
      sleep: user.sleepRing ?? 50,
      nutrition: user.nutritionRing ?? 50,
      activity: user.activityRing ?? 50,
      social: user.socialRing ?? 50,
      wealth: user.wealthRing ?? 50,
    }

    await prisma.agentTask.update({ where: { id: task.id }, data: { status: 'RUNNING' } })

    const agentResult = await runAgentTask(
      { title: task.title, description: task.description, agentType: task.agentType, autonomy: task.autonomy },
      { vScore: user.vScore, tier: user.tier, rings, handle: user.handle, displayName: user.displayName }
    )

    const updated = await prisma.agentTask.update({
      where: { id: task.id },
      data: {
        status: agentResult.success ? 'COMPLETED' : 'FAILED',
        result: JSON.stringify({ summary: agentResult.result, actions: agentResult.actions, usedAI: agentResult.usedAI }),
        completedAt: agentResult.success ? new Date() : null,
      },
    })

    res.json({ task: updated, ...agentResult })
  } catch (e) { next(e) }
})

// POST /api/twin/chat — meta-agent chat via Fable 5
router.post('/chat', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { message, history } = z.object({
      message: z.string().min(1).max(2000),
      history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })).optional(),
    }).parse(req.body)

    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) throw new AppError(401, 'Unauthorized')

    const rings = {
      sleep: user.sleepRing ?? 50,
      nutrition: user.nutritionRing ?? 50,
      activity: user.activityRing ?? 50,
      social: user.socialRing ?? 50,
      wealth: user.wealthRing ?? 50,
    }

    const ctx = { vScore: user.vScore, tier: user.tier, rings, handle: user.handle, displayName: user.displayName }
    const fableResult = await twinChat(message, ctx, (history ?? []) as { role: 'user' | 'assistant'; content: string }[])

    let reply: string
    let agentType: string

    if (fableResult.usedAI && fableResult.response) {
      reply = fableResult.response
      agentType = fableResult.agentType
    } else {
      // Keyword fallback
      const msg = message.toLowerCase()
      const weakest = Object.entries(rings).sort((a, b) => a[1] - b[1])[0]
      const intents = [
        { keys: ['sleep', 'rest', 'tired'], type: 'health', reply: `Sleep ring: ${rings.sleep}%. ${rings.sleep < 70 ? 'Below baseline — aim for 7-9h and cut screens 90 min before bed.' : 'On track. Consistency is protecting your V-Score.'}` },
        { keys: ['nutrition', 'food', 'eat', 'diet'], type: 'health', reply: `Nutrition ring: ${rings.nutrition}%. ${rings.nutrition < 65 ? 'Focus on hitting protein targets — 0.8g/lb bodyweight daily.' : 'Solid. Keep the protein anchor and vary micronutrients.'}` },
        { keys: ['activity', 'workout', 'exercise', 'steps'], type: 'health', reply: `Activity ring: ${rings.activity}%. ${rings.activity > 80 ? 'Top 20% of users — watch for overtraining, take 2 rest days/week.' : '30 min zone-2 cardio daily closes the gap in ~12 days. Estimated V-Score uplift: +18 pts.'}` },
        { keys: ['market', 'predict', 'stake', 'bet'], type: 'market', reply: `V-Score ${user.vScore} unlocks all active markets. Top opportunity: Longevity escape velocity at 22% YES — historically underpriced by 8-12%.` },
        { keys: ['token', 'youtoken', 'wealth', 'money'], type: 'finance', reply: `Wealth ring: ${rings.wealth}%. Key levers: token holder growth, market accuracy, and activity consistency. Current trajectory: +15 pts in 30 days with 3 health logs/week.` },
        { keys: ['social', 'connect', 'match', 'date'], type: 'social', reply: `Social ring: ${rings.social}%. ${rings.social < 60 ? 'Join an audio room for 20+ min (+5 pts), reply to 3 feed posts (+6 pts). Fastest ring to move.' : '5 new compatible profiles visible. Compatibility scores 71-89%.'}` },
        { keys: ['twin', 'agent', 'task', 'automate'], type: 'twin', reply: `Autonomy: L2. I can flag, analyze, and recommend — you confirm actions. V-Score ${user.vScore}${user.vScore >= 800 ? ' — L3 eligible: I can execute scheduling and market stakes autonomously.' : ` — need ${800 - user.vScore} more pts for L3 unlock.`}` },
      ]
      const match = intents.find(i => i.keys.some(k => msg.includes(k)))
      agentType = match?.type ?? 'default'
      reply = match?.reply ?? `V-Score ${user.vScore} — weakest ring: ${weakest[0]} at ${weakest[1]}%. That's your highest-leverage focus. What do you want to work on?`
    }

    res.json({
      response: reply,
      agentType,
      actionsAvailable: ['log_health', 'stake_market', 'send_message', 'create_task'],
      poweredBy: fableResult.usedAI ? 'claude-fable-5' : 'keyword-engine',
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
