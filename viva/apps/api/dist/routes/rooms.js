"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const error_1 = require("../middleware/error");
const router = (0, express_1.Router)();
// GET /api/rooms
router.get('/', auth_1.optionalAuth, async (_req, res, next) => {
    try {
        const rooms = await prisma_1.prisma.room.findMany({
            include: {
                _count: { select: { members: true } },
            },
            orderBy: [
                { isLive: 'desc' },
                { scheduledFor: 'asc' },
            ],
            take: 20,
        });
        res.json(rooms);
    }
    catch (e) {
        next(e);
    }
});
// GET /api/rooms/:id
router.get('/:id', auth_1.optionalAuth, async (req, res, next) => {
    try {
        const room = await prisma_1.prisma.room.findUnique({
            where: { id: req.params.id },
            include: {
                members: {
                    where: { leftAt: null },
                    include: {
                        user: { select: { id: true, handle: true, displayName: true, avatarUrl: true, vScore: true } },
                    },
                },
            },
        });
        if (!room)
            throw new error_1.AppError(404, 'Room not found');
        res.json(room);
    }
    catch (e) {
        next(e);
    }
});
// POST /api/rooms — create
router.post('/', auth_1.requireAuth, async (req, res, next) => {
    try {
        const body = zod_1.z.object({
            title: zod_1.z.string().min(1).max(128),
            topic: zod_1.z.string().max(256).optional(),
            minVScore: zod_1.z.number().int().min(0).max(1000).default(0),
            scheduledFor: zod_1.z.string().datetime().optional(),
        }).parse(req.body);
        const user = await prisma_1.prisma.user.findUnique({ where: { id: req.userId } });
        if (!user)
            throw new error_1.AppError(401, 'Unauthorized');
        const room = await prisma_1.prisma.room.create({
            data: {
                ...body,
                scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
                hostId: req.userId,
                isLive: !body.scheduledFor,
                members: {
                    create: { userId: req.userId, role: 'HOST', isMuted: false },
                },
            },
        });
        res.status(201).json(room);
    }
    catch (e) {
        next(e);
    }
});
// POST /api/rooms/:id/join
router.post('/:id/join', auth_1.requireAuth, async (req, res, next) => {
    try {
        const room = await prisma_1.prisma.room.findUnique({ where: { id: req.params.id } });
        if (!room)
            throw new error_1.AppError(404, 'Room not found');
        const user = await prisma_1.prisma.user.findUnique({ where: { id: req.userId } });
        if (!user)
            throw new error_1.AppError(401, 'Unauthorized');
        if (user.vScore < room.minVScore) {
            throw new error_1.AppError(403, `V-Score ${room.minVScore}+ required to join`);
        }
        await prisma_1.prisma.roomMember.upsert({
            where: { roomId_userId: { roomId: room.id, userId: req.userId } },
            create: { roomId: room.id, userId: req.userId, role: 'LISTENER' },
            update: { leftAt: null },
        });
        res.json({ ok: true });
    }
    catch (e) {
        next(e);
    }
});
// POST /api/rooms/:id/leave
router.post('/:id/leave', auth_1.requireAuth, async (req, res, next) => {
    try {
        await prisma_1.prisma.roomMember.update({
            where: { roomId_userId: { roomId: req.params.id, userId: req.userId } },
            data: { leftAt: new Date() },
        });
        res.json({ ok: true });
    }
    catch (e) {
        next(e);
    }
});
// PATCH /api/rooms/:id/mute
router.patch('/:id/mute', auth_1.requireAuth, async (req, res, next) => {
    try {
        const { muted } = zod_1.z.object({ muted: zod_1.z.boolean() }).parse(req.body);
        await prisma_1.prisma.roomMember.update({
            where: { roomId_userId: { roomId: req.params.id, userId: req.userId } },
            data: { isMuted: muted },
        });
        res.json({ ok: true });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
//# sourceMappingURL=rooms.js.map