"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const error_1 = require("../middleware/error");
const router = (0, express_1.Router)();
function bondingCurvePrice(supply) {
    // p = 0.01 * (supply / 1000)^1.4
    return 0.01 * Math.pow(supply / 1000 + 1, 1.4);
}
// GET /api/tokens — marketplace list
router.get('/', auth_1.optionalAuth, async (_req, res, next) => {
    try {
        const tokens = await prisma_1.prisma.token.findMany({
            include: {
                owner: { select: { id: true, handle: true, displayName: true, avatarUrl: true, vScore: true } },
                _count: { select: { holdings: true } },
            },
            orderBy: { supply: 'desc' },
            take: 50,
        });
        res.json(tokens);
    }
    catch (e) {
        next(e);
    }
});
// GET /api/tokens/mine
router.get('/mine', auth_1.requireAuth, async (req, res, next) => {
    try {
        const token = await prisma_1.prisma.token.findUnique({
            where: { ownerId: req.userId },
            include: {
                holdings: {
                    include: { user: { select: { id: true, handle: true, displayName: true, avatarUrl: true } } },
                    orderBy: { amount: 'desc' },
                    take: 10,
                },
                _count: { select: { holdings: true } },
            },
        });
        res.json(token ?? null);
    }
    catch (e) {
        next(e);
    }
});
// POST /api/tokens/create
router.post('/create', auth_1.requireAuth, async (req, res, next) => {
    try {
        const { symbol, name } = zod_1.z.object({
            symbol: zod_1.z.string().min(2).max(6).regex(/^[A-Z]+$/, 'Uppercase letters only'),
            name: zod_1.z.string().min(1).max(64),
        }).parse(req.body);
        const existing = await prisma_1.prisma.token.findUnique({ where: { ownerId: req.userId } });
        if (existing)
            throw new error_1.AppError(400, 'You already have a token');
        const symbolTaken = await prisma_1.prisma.token.findUnique({ where: { symbol } });
        if (symbolTaken)
            throw new error_1.AppError(409, 'Symbol already taken');
        const token = await prisma_1.prisma.token.create({
            data: { ownerId: req.userId, symbol, name, supply: 0, price: 0.01 },
        });
        await prisma_1.prisma.user.update({
            where: { id: req.userId },
            data: { tokenSymbol: symbol, tokenPrice: 0.01 },
        });
        res.status(201).json(token);
    }
    catch (e) {
        next(e);
    }
});
// POST /api/tokens/:id/mint
router.post('/:id/mint', auth_1.requireAuth, async (req, res, next) => {
    try {
        const { amount } = zod_1.z.object({ amount: zod_1.z.number().int().min(1).max(1000) }).parse(req.body);
        const token = await prisma_1.prisma.token.findUnique({ where: { id: req.params.id } });
        if (!token)
            throw new error_1.AppError(404, 'Token not found');
        if (token.ownerId !== req.userId)
            throw new error_1.AppError(403, 'Only owner can mint');
        const newSupply = token.supply + amount;
        const newPrice = bondingCurvePrice(newSupply);
        const updated = await prisma_1.prisma.token.update({
            where: { id: token.id },
            data: { supply: newSupply, price: newPrice },
        });
        // Update or create holding for owner
        await prisma_1.prisma.tokenHolding.upsert({
            where: { tokenId_userId: { tokenId: token.id, userId: req.userId } },
            create: { tokenId: token.id, userId: req.userId, amount, avgPrice: newPrice },
            update: { amount: { increment: amount } },
        });
        await prisma_1.prisma.user.update({
            where: { id: req.userId },
            data: { tokenSupply: newSupply, tokenPrice: newPrice },
        });
        res.json(updated);
    }
    catch (e) {
        next(e);
    }
});
// POST /api/tokens/:id/buy
router.post('/:id/buy', auth_1.requireAuth, async (req, res, next) => {
    try {
        const { amount } = zod_1.z.object({ amount: zod_1.z.number().int().min(1).max(10000) }).parse(req.body);
        const token = await prisma_1.prisma.token.findUnique({ where: { id: req.params.id } });
        if (!token)
            throw new error_1.AppError(404, 'Token not found');
        const cost = bondingCurvePrice(token.supply) * amount;
        const newSupply = token.supply + amount;
        const newPrice = bondingCurvePrice(newSupply);
        await prisma_1.prisma.token.update({
            where: { id: token.id },
            data: { supply: newSupply, price: newPrice },
        });
        await prisma_1.prisma.tokenHolding.upsert({
            where: { tokenId_userId: { tokenId: token.id, userId: req.userId } },
            create: { tokenId: token.id, userId: req.userId, amount, avgPrice: token.price },
            update: { amount: { increment: amount } },
        });
        res.json({ ok: true, cost, newPrice, newSupply });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
//# sourceMappingURL=tokens.js.map