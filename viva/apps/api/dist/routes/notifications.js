"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const error_1 = require("../middleware/error");
const router = (0, express_1.Router)();
// GET /api/notifications
router.get('/', auth_1.requireAuth, async (req, res, next) => {
    try {
        const notifications = await prisma_1.prisma.notification.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        const unread = notifications.filter(n => !n.read).length;
        res.json({ notifications, unread });
    }
    catch (e) { next(e); }
});
// GET /api/notifications/unread-count
router.get('/unread-count', auth_1.requireAuth, async (req, res, next) => {
    try {
        const count = await prisma_1.prisma.notification.count({
            where: { userId: req.userId, read: false },
        });
        res.json({ count });
    }
    catch (e) { next(e); }
});
// POST /api/notifications/:id/read
router.post('/:id/read', auth_1.requireAuth, async (req, res, next) => {
    try {
        const n = await prisma_1.prisma.notification.findUnique({ where: { id: req.params.id } });
        if (!n) throw new error_1.AppError(404, 'Not found');
        if (n.userId !== req.userId) throw new error_1.AppError(403, 'Forbidden');
        const updated = await prisma_1.prisma.notification.update({ where: { id: n.id }, data: { read: true } });
        res.json(updated);
    }
    catch (e) { next(e); }
});
// POST /api/notifications/read-all
router.post('/read-all', auth_1.requireAuth, async (req, res, next) => {
    try {
        await prisma_1.prisma.notification.updateMany({
            where: { userId: req.userId, read: false },
            data: { read: true },
        });
        res.json({ ok: true });
    }
    catch (e) { next(e); }
});
exports.default = router;
