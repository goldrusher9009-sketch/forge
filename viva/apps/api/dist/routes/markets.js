"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const error_1 = require("../middleware/error");
const router = (0, express_1.Router)();
// GET /api/markets
router.get('/', auth_1.optionalAuth, async (req, res, next) => {
    try {
        const category = zod_1.z.string().optional().parse(req.query.category);
        const sort = zod_1.z.enum(['volume', 'closes', 'probability']).default('volume').parse(req.query.sort);
        const orderBy = {
            volume: { totalVolume: 'desc' },
            closes: { closesAt: 'asc' },
            probability: { yesProb: 'desc' },
        }[sort];
        const markets = await prisma_1.prisma.market.findMany({
            where: {
                resolvedAt: null,
                ...(category && category !== 'all' ? { category } : {}),
            },
            include: { _count: { select: { positions: true } } },
            orderBy,
            take: 30,
        });
        res.json(markets);
    }
    catch (e) {
        next(e);
    }
});
// GET /api/markets/:id
router.get('/:id', auth_1.optionalAuth, async (req, res, next) => {
    try {
        const market = await prisma_1.prisma.market.findUnique({
            where: { id: req.params.id },
            include: { _count: { select: { positions: true } } },
        });
        if (!market)
            throw new error_1.AppError(404, 'Market not found');
        res.json(market);
    }
    catch (e) {
        next(e);
    }
});
// POST /api/markets/:id/stake
router.post('/:id/stake', auth_1.requireAuth, async (req, res, next) => {
    try {
        const { side, amount } = zod_1.z.object({
            side: zod_1.z.enum(['YES', 'NO']),
            amount: zod_1.z.number().int().min(1).max(10000),
        }).parse(req.body);
        const market = await prisma_1.prisma.market.findUnique({ where: { id: req.params.id } });
        if (!market)
            throw new error_1.AppError(404, 'Market not found');
        if (market.resolvedAt)
            throw new error_1.AppError(400, 'Market already resolved');
        if (market.closesAt < new Date())
            throw new error_1.AppError(400, 'Market closed');
        const price = side === 'YES' ? market.yesProb : 1 - market.yesProb;
        const payout = amount / price;
        const position = await prisma_1.prisma.marketPosition.create({
            data: { marketId: market.id, userId: req.userId, side, amount, price, payout },
        });
        // Update market probability (simple market maker simulation)
        const shift = side === 'YES' ? 0.02 : -0.02;
        const newProb = Math.min(0.99, Math.max(0.01, market.yesProb + shift));
        await prisma_1.prisma.market.update({
            where: { id: market.id },
            data: { yesProb: newProb, totalVolume: { increment: amount } },
        });
        res.status(201).json({ position, newProbability: newProb });
    }
    catch (e) {
        next(e);
    }
});
// GET /api/markets/user/positions
router.get('/user/positions', auth_1.requireAuth, async (req, res, next) => {
    try {
        const positions = await prisma_1.prisma.marketPosition.findMany({
            where: { userId: req.userId },
            include: { market: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(positions);
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
//# sourceMappingURL=markets.js.map