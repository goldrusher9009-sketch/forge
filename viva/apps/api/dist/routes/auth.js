"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const jwt_1 = require("../lib/jwt");
const error_1 = require("../middleware/error");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const RegisterSchema = zod_1.z.object({
    handle: zod_1.z.string().min(3).max(32).regex(/^[a-z0-9_]+$/),
    displayName: zod_1.z.string().min(1).max(64),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(128),
    walletAddress: zod_1.z.string().optional(),
    sleepRing: zod_1.z.number().int().min(0).max(100).default(0),
    nutritionRing: zod_1.z.number().int().min(0).max(100).default(0),
    activityRing: zod_1.z.number().int().min(0).max(100).default(0),
    socialRing: zod_1.z.number().int().min(0).max(100).default(0),
    wealthRing: zod_1.z.number().int().min(0).max(100).default(0),
});
const LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
function calcVScore(rings) {
    const avg = (rings.sleepRing + rings.nutritionRing + rings.activityRing + rings.socialRing + rings.wealthRing) / 5;
    return Math.round(avg * 4); // 0-400 from rings alone
}
function getTier(score) {
    if (score >= 800)
        return 'SOVEREIGN';
    if (score >= 600)
        return 'GUARDIAN';
    if (score >= 400)
        return 'STABLE';
    if (score >= 200)
        return 'RISING';
    return 'SEED';
}
// POST /api/auth/register
router.post('/register', async (req, res, next) => {
    try {
        const body = RegisterSchema.parse(req.body);
        const existing = await prisma_1.prisma.user.findFirst({
            where: { OR: [{ email: body.email }, { handle: body.handle }] },
        });
        if (existing)
            throw new error_1.AppError(409, 'Handle or email already taken');
        const passwordHash = await bcryptjs_1.default.hash(body.password, 12);
        const vScore = calcVScore(body);
        const tier = getTier(vScore);
        const user = await prisma_1.prisma.user.create({
            data: {
                handle: body.handle,
                displayName: body.displayName,
                email: body.email,
                passwordHash,
                walletAddress: body.walletAddress,
                vScore,
                tier,
                sleepRing: body.sleepRing,
                nutritionRing: body.nutritionRing,
                activityRing: body.activityRing,
                socialRing: body.socialRing,
                wealthRing: body.wealthRing,
            },
        });
        const access = (0, jwt_1.signAccess)({ userId: user.id, handle: user.handle });
        const refresh = (0, jwt_1.signRefresh)({ userId: user.id, handle: user.handle });
        await prisma_1.prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: refresh,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });
        const { passwordHash: _, ...safeUser } = user;
        res.status(201).json({ user: safeUser, accessToken: access, refreshToken: refresh });
    }
    catch (e) {
        next(e);
    }
});
// POST /api/auth/login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = LoginSchema.parse(req.body);
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            throw new error_1.AppError(401, 'Invalid credentials');
        const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!valid)
            throw new error_1.AppError(401, 'Invalid credentials');
        const access = (0, jwt_1.signAccess)({ userId: user.id, handle: user.handle });
        const refresh = (0, jwt_1.signRefresh)({ userId: user.id, handle: user.handle });
        await prisma_1.prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: refresh,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });
        const { passwordHash: _, ...safeUser } = user;
        res.json({ user: safeUser, accessToken: access, refreshToken: refresh });
    }
    catch (e) {
        next(e);
    }
});
// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = zod_1.z.object({ refreshToken: zod_1.z.string() }).parse(req.body);
        const stored = await prisma_1.prisma.refreshToken.findUnique({ where: { token: refreshToken } });
        if (!stored || stored.expiresAt < new Date())
            throw new error_1.AppError(401, 'Invalid refresh token');
        const payload = (0, jwt_1.verifyRefresh)(refreshToken);
        const access = (0, jwt_1.signAccess)({ userId: payload.userId, handle: payload.handle });
        res.json({ accessToken: access });
    }
    catch (e) {
        next(e);
    }
});
// POST /api/auth/logout
router.post('/logout', auth_1.requireAuth, async (req, res, next) => {
    try {
        const { refreshToken } = zod_1.z.object({ refreshToken: zod_1.z.string() }).parse(req.body);
        await prisma_1.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
        res.json({ ok: true });
    }
    catch (e) {
        next(e);
    }
});
// GET /api/auth/me
router.get('/me', auth_1.requireAuth, async (req, res, next) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true, handle: true, displayName: true, email: true,
                avatarUrl: true, bio: true, walletAddress: true,
                vScore: true, tier: true,
                sleepRing: true, nutritionRing: true, activityRing: true, socialRing: true, wealthRing: true,
                tokenSymbol: true, tokenSupply: true, tokenPrice: true,
                createdAt: true, updatedAt: true,
            },
        });
        if (!user)
            throw new error_1.AppError(404, 'User not found');
        res.json(user);
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map