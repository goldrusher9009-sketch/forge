import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/error'

const router = Router()

// GET /api/feed
router.get('/', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const category = z.string().optional().parse(req.query.category)
    const cursor = z.string().optional().parse(req.query.cursor)
    const limit = Math.min(Number(req.query.limit) || 20, 50)

    const posts = await prisma.post.findMany({
      where: category && category !== 'all' ? { category } : undefined,
      include: {
        author: {
          select: { id: true, handle: true, displayName: true, avatarUrl: true, vScore: true, tier: true },
        },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    })

    const hasMore = posts.length > limit
    const data = hasMore ? posts.slice(0, -1) : posts

    res.json({
      posts: data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
    })
  } catch (e) { next(e) }
})

// POST /api/feed
router.post('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({
      content: z.string().min(1).max(2000),
      category: z.string().default('general'),
      mediaUrl: z.string().url().optional(),
    }).parse(req.body)

    const post = await prisma.post.create({
      data: { ...body, authorId: req.userId! },
      include: {
        author: {
          select: { id: true, handle: true, displayName: true, avatarUrl: true, vScore: true, tier: true },
        },
        _count: { select: { likes: true, comments: true } },
      },
    })
    res.status(201).json(post)
  } catch (e) { next(e) }
})

// POST /api/feed/:id/like
router.post('/:id/like', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const postId = req.params.id
    const existing = await prisma.postLike.findUnique({
      where: { userId_postId: { userId: req.userId!, postId } },
    })
    if (existing) {
      await prisma.postLike.delete({ where: { userId_postId: { userId: req.userId!, postId } } })
      res.json({ liked: false })
    } else {
      await prisma.postLike.create({ data: { userId: req.userId!, postId } })
      // Notify post author
      const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } })
      if (post && post.authorId !== req.userId) {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            type: 'like',
            title: 'Someone liked your post',
            body: 'Your post received an attention signal.',
            linkUrl: '/feed',
          },
        }).catch(() => {})
      }
      res.json({ liked: true })
    }
  } catch (e) { next(e) }
})

// GET /api/feed/:id/comments
router.get('/:id/comments', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const comments = await prisma.postComment.findMany({
      where: { postId: req.params.id },
      include: {
        author: { select: { id: true, handle: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    })
    res.json(comments)
  } catch (e) { next(e) }
})

// POST /api/feed/:id/comments
router.post('/:id/comments', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { content } = z.object({ content: z.string().min(1).max(500) }).parse(req.body)
    const comment = await prisma.postComment.create({
      data: { postId: req.params.id, authorId: req.userId!, content },
      include: {
        author: { select: { id: true, handle: true, displayName: true, avatarUrl: true } },
      },
    })
    // Notify post author
    const post = await prisma.post.findUnique({ where: { id: req.params.id }, select: { authorId: true } })
    if (post && post.authorId !== req.userId) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'like',
          title: 'New comment on your post',
          body: content.slice(0, 80),
          linkUrl: '/feed',
        },
      }).catch(() => {})
    }
    res.status(201).json(comment)
  } catch (e) { next(e) }
})

// DELETE /api/feed/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } })
    if (!post) throw new AppError(404, 'Post not found')
    if (post.authorId !== req.userId) throw new AppError(403, 'Forbidden')
    await prisma.post.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

export default router
