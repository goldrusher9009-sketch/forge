"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const error_1 = require("../middleware/error");
const router = (0, express_1.Router)();
// GET /api/feed
router.get('/', auth_1.optionalAuth, async (req, res, next) => {
    try {
        const category = zod_1.z.string().optional().parse(req.query.category);
        const cursor = zod_1.z.string().optional().parse(req.query.cursor);
        const limit = Math.min(Number(req.query.limit) || 20, 50);
        const posts = await prisma_1.prisma.post.findMany({
            where: category && category !== 'all' ? { category } : undefined,
            include: {
                author: {
                    select: { id: true, handle: true, displayName: true, avatarUrl: true, vScore: true, tier: true },
                },
                _count: { select: { likes: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            skip: cursor ? 1 : 0,
        });
        const hasMore = posts.length > limit;
        const data = hasMore ? posts.slice(0, -1) : posts;
        res.json({
            posts: data,
            nextCursor: hasMore ? data[data.length - 1].id : null,
        });
    }
    catch (e) {
        next(e);
    }
});
// POST /api/feed
router.post('/', auth_1.requireAuth, async (req, res, next) => {
    try {
        const body = zod_1.z.object({
            content: zod_1.z.string().min(1).max(2000),
            category: zod_1.z.string().default('general'),
            mediaUrl: zod_1.z.string().url().optional(),
        }).parse(req.body);
        const post = await prisma_1.prisma.post.create({
            data: { ...body, authorId: req.userId },
            include: {
                author: {
                    select: { id: true, handle: true, displayName: true, avatarUrl: true, vScore: true, tier: true },
                },
                _count: { select: { likes: true } },
            },
        });
        res.status(201).json(post);
    }
    catch (e) {
        next(e);
    }
});
// POST /api/feed/:id/like
router.post('/:id/like', auth_1.requireAuth, async (req, res, next) => {
    try {
        const postId = req.params.id;
        const existing = await prisma_1.prisma.postLike.findUnique({
            where: { userId_postId: { userId: req.userId, postId } },
        });
        if (existing) {
            await prisma_1.prisma.postLike.delete({ where: { userId_postId: { userId: req.userId, postId } } });
            res.json({ liked: false });
        }
        else {
            await prisma_1.prisma.postLike.create({ data: { userId: req.userId, postId } });
            res.json({ liked: true });
        }
    }
    catch (e) {
        next(e);
    }
});
// DELETE /api/feed/:id
router.delete('/:id', auth_1.requireAuth, async (req, res, next) => {
    try {
        const post = await prisma_1.prisma.post.findUnique({ where: { id: req.params.id } });
        if (!post)
            throw new error_1.AppError(404, 'Post not found');
        if (post.authorId !== req.userId)
            throw new error_1.AppError(403, 'Forbidden');
        await prisma_1.prisma.post.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
//# sourceMappingURL=feed.js.map