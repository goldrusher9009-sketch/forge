"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const error_1 = require("../middleware/error");
const router = (0, express_1.Router)();
const AGENT_TYPES = ['schedule', 'finance', 'health', 'social', 'market', 'search'];
// GET /api/twin/tasks
router.get('/tasks', auth_1.requireAuth, async (req, res, next) => {
    try {
        const tasks = await prisma_1.prisma.agentTask.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        res.json(tasks);
    }
    catch (e) {
        next(e);
    }
});
// POST /api/twin/tasks — create task
router.post('/tasks', auth_1.requireAuth, async (req, res, next) => {
    try {
        const body = zod_1.z.object({
            agentType: zod_1.z.enum(AGENT_TYPES),
            title: zod_1.z.string().min(1).max(256),
            description: zod_1.z.string().max(2000).optional(),
            autonomy: zod_1.z.number().int().min(1).max(3).default(1),
            scheduledFor: zod_1.z.string().datetime().optional(),
        }).parse(req.body);
        const task = await prisma_1.prisma.agentTask.create({
            data: {
                ...body,
                userId: req.userId,
                scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
            },
        });
        res.status(201).json(task);
    }
    catch (e) {
        next(e);
    }
});
// POST /api/twin/chat — meta-agent chat
router.post('/chat', auth_1.requireAuth, async (req, res, next) => {
    try {
        const { message, history } = zod_1.z.object({
            message: zod_1.z.string().min(1).max(2000),
            history: zod_1.z.array(zod_1.z.object({ role: zod_1.z.enum(['user', 'assistant']), content: zod_1.z.string() })).optional(),
        }).parse(req.body);
        const user = await prisma_1.prisma.user.findUnique({ where: { id: req.userId } });
        if (!user)
            throw new error_1.AppError(401, 'Unauthorized');
        // Simulated AI Twin response engine (replace with real LLM in prod)
        const responses = {
            default: `I've analyzed your rings. Sleep ${user.sleepRing}%, Activity ${user.activityRing}%, Nutrition ${user.nutritionRing}%. Recommend: prioritize sleep consistency this week.`,
            health: `Health ring at ${user.activityRing}% activity. Suggest 30-min walk today. V-Score impact: +12 points estimated.`,
            market: `Prediction market opportunity: health prediction closing in 48h. Your V-Score of ${user.vScore} qualifies for all markets.`,
            finance: `Token price up 3.2% today. Wealth ring at ${user.wealthRing}%. Recommend staking 50 $VIVA in the Stable pool.`,
            social: `Social ring at ${user.socialRing}%. 3 match requests pending. Attending audio rooms could boost social score by 15%.`,
        };
        const key = Object.keys(responses).find(k => message.toLowerCase().includes(k)) || 'default';
        const reply = responses[key];
        res.json({
            response: reply,
            agentType: key,
            actionsAvailable: ['log_health', 'stake_market', 'send_message'],
        });
    }
    catch (e) {
        next(e);
    }
});
// PATCH /api/twin/tasks/:id
router.patch('/tasks/:id', auth_1.requireAuth, async (req, res, next) => {
    try {
        const body = zod_1.z.object({
            status: zod_1.z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
            result: zod_1.z.string().optional(),
        }).parse(req.body);
        const task = await prisma_1.prisma.agentTask.findUnique({ where: { id: req.params.id } });
        if (!task)
            throw new error_1.AppError(404, 'Task not found');
        if (task.userId !== req.userId)
            throw new error_1.AppError(403, 'Forbidden');
        const updated = await prisma_1.prisma.agentTask.update({
            where: { id: task.id },
            data: {
                ...body,
                ...(body.status === 'COMPLETED' ? { completedAt: new Date() } : {}),
            },
        });
        res.json(updated);
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
//# sourceMappingURL=twin.js.map