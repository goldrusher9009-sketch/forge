"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const error_1 = require("../middleware/error");
const router = (0, express_1.Router)();
const safeSelect = {
    id: true, handle: true, displayName: true, avatarUrl: true, bio: true,
    vScore: true, tier: true,
    sleepRing: true, nutritionRing: true, activityRing: true, socialRing: true, wealthRing: true,
};
function calcCompatibility(a, b) {
    const rings = ['sleepRing', 'nutritionRing', 'activityRing', 'socialRing', 'wealthRing'];
    const diffs = rings.map(r => Math.abs((a[r] ?? 50) - (b[r] ?? 50)));
    const avgDiff = diffs.reduce((s, d) => s + d, 0) / diffs.length;
    return Math.round(100 - avgDiff);
}
// GET /api/dating/discover — profiles to discover
router.get('/discover', auth_1.requireAuth, async (req, res, next) => {
    try {
        const me = await prisma_1.prisma.user.findUnique({ where: { id: req.userId } });
        if (!me)
            throw new error_1.AppError(401, 'Unauthorized');
        // Exclude already matched/passed
        const existing = await prisma_1.prisma.match.findMany({
            where: { OR: [{ userAId: req.userId }, { userBId: req.userId }] },
            select: { userAId: true, userBId: true },
        });
        const seen = new Set(existing.flatMap(m => [m.userAId, m.userBId]));
        seen.add(req.userId);
        const profiles = await prisma_1.prisma.user.findMany({
            where: { id: { notIn: [...seen] } },
            select: { ...safeSelect, sleepRing: true, nutritionRing: true, activityRing: true, socialRing: true, wealthRing: true },
            take: 20,
            orderBy: { vScore: 'desc' },
        });
        const withCompat = profiles.map(p => ({
            ...p,
            compatibility: calcCompatibility(me, p),
        }));
        res.json(withCompat);
    }
    catch (e) {
        next(e);
    }
});
// GET /api/dating/matches — my matches
router.get('/matches', auth_1.requireAuth, async (req, res, next) => {
    try {
        const matches = await prisma_1.prisma.match.findMany({
            where: {
                OR: [{ userAId: req.userId }, { userBId: req.userId }],
                status: 'MATCHED',
            },
            include: {
                userA: { select: safeSelect },
                userB: { select: safeSelect },
            },
            orderBy: { updatedAt: 'desc' },
        });
        const result = matches.map(m => ({
            ...m,
            otherUser: m.userAId === req.userId ? m.userB : m.userA,
        }));
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
// POST /api/dating/connect/:targetId
router.post('/connect/:targetId', auth_1.requireAuth, async (req, res, next) => {
    try {
        const targetId = req.params.targetId;
        if (targetId === req.userId)
            throw new error_1.AppError(400, 'Cannot match with yourself');
        const me = await prisma_1.prisma.user.findUnique({ where: { id: req.userId } });
        const target = await prisma_1.prisma.user.findUnique({ where: { id: targetId } });
        if (!target)
            throw new error_1.AppError(404, 'User not found');
        // Check if target already connected to us
        const reverse = await prisma_1.prisma.match.findUnique({
            where: { userAId_userBId: { userAId: targetId, userBId: req.userId } },
        });
        if (reverse && reverse.status === 'PENDING') {
            // Mutual match!
            const matched = await prisma_1.prisma.match.update({
                where: { id: reverse.id },
                data: { status: 'MATCHED', compatibility: calcCompatibility(me, target) },
            });
            return res.json({ status: 'MATCHED', match: matched });
        }
        // Create pending connect
        const match = await prisma_1.prisma.match.upsert({
            where: { userAId_userBId: { userAId: req.userId, userBId: targetId } },
            create: {
                userAId: req.userId,
                userBId: targetId,
                status: 'PENDING',
                compatibility: calcCompatibility(me, target),
            },
            update: { status: 'PENDING' },
        });
        res.json({ status: 'PENDING', match });
    }
    catch (e) {
        next(e);
    }
});
// POST /api/dating/pass/:targetId
router.post('/pass/:targetId', auth_1.requireAuth, async (req, res, next) => {
    try {
        await prisma_1.prisma.match.upsert({
            where: { userAId_userBId: { userAId: req.userId, userBId: req.params.targetId } },
            create: { userAId: req.userId, userBId: req.params.targetId, status: 'PASSED' },
            update: { status: 'PASSED' },
        });
        res.json({ ok: true });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
//# sourceMappingURL=dating.js.map