"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const error_1 = require("../middleware/error");
const router = (0, express_1.Router)();
const safeSelect = {
    id: true, handle: true, displayName: true, avatarUrl: true, bio: true,
    vScore: true, tier: true,
    sleepRing: true, nutritionRing: true, activityRing: true, socialRing: true, wealthRing: true,
    tokenSymbol: true, tokenSupply: true, tokenPrice: true,
    createdAt: true,
};
// GET /api/users/:handle
router.get('/:handle', async (req, res, next) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { handle: req.params.handle },
            select: safeSelect,
        });
        if (!user)
            throw new error_1.AppError(404, 'User not found');
        res.json(user);
    }
    catch (e) {
        next(e);
    }
});
// PATCH /api/users/me
router.patch('/me', auth_1.requireAuth, async (req, res, next) => {
    try {
        const body = zod_1.z.object({
            displayName: zod_1.z.string().min(1).max(64).optional(),
            bio: zod_1.z.string().max(500).optional(),
            avatarUrl: zod_1.z.string().url().optional(),
            walletAddress: zod_1.z.string().optional(),
            sleepRing: zod_1.z.number().int().min(0).max(100).optional(),
            nutritionRing: zod_1.z.number().int().min(0).max(100).optional(),
            activityRing: zod_1.z.number().int().min(0).max(100).optional(),
            socialRing: zod_1.z.number().int().min(0).max(100).optional(),
            wealthRing: zod_1.z.number().int().min(0).max(100).optional(),
        }).parse(req.body);
        const user = await prisma_1.prisma.user.update({
            where: { id: req.userId },
            data: body,
            select: safeSelect,
        });
        res.json(user);
    }
    catch (e) {
        next(e);
    }
});
// GET /api/users  — search
router.get('/', async (req, res, next) => {
    try {
        const q = zod_1.z.string().optional().parse(req.query.q);
        const users = await prisma_1.prisma.user.findMany({
            where: q ? {
                OR: [
                    { handle: { contains: q, mode: 'insensitive' } },
                    { displayName: { contains: q, mode: 'insensitive' } },
                ],
            } : undefined,
            select: safeSelect,
            take: 20,
            orderBy: { vScore: 'desc' },
        });
        res.json(users);
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map