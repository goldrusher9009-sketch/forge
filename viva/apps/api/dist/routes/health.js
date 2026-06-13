"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const error_1 = require("../middleware/error");
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
const RINGS = ['sleep', 'nutrition', 'activity', 'social', 'wealth'];
// GET /api/health/logs
router.get('/logs', auth_1.requireAuth, async (req, res, next) => {
    try {
        const ring = zod_1.z.enum(RINGS).optional().parse(req.query.ring);
        const logs = await prisma_1.prisma.healthLog.findMany({
            where: { userId: req.userId, ...(ring ? { ring } : {}) },
            orderBy: { loggedAt: 'desc' },
            take: 100,
        });
        res.json(logs);
    }
    catch (e) {
        next(e);
    }
});
// POST /api/health/logs
router.post('/logs', auth_1.requireAuth, async (req, res, next) => {
    try {
        const body = zod_1.z.object({
            ring: zod_1.z.enum(RINGS),
            value: zod_1.z.number().min(0).max(100),
            unit: zod_1.z.string().optional(),
            note: zod_1.z.string().max(500).optional(),
        }).parse(req.body);
        const log = await prisma_1.prisma.healthLog.create({
            data: { ...body, userId: req.userId },
        });
        // Update user ring value
        const ringField = `${body.ring}Ring`;
        await prisma_1.prisma.user.update({
            where: { id: req.userId },
            data: { [ringField]: Math.round(body.value) },
        });
        res.status(201).json(log);
    }
    catch (e) {
        next(e);
    }
});
// GET /api/health/proofs
router.get('/proofs', auth_1.requireAuth, async (req, res, next) => {
    try {
        const proofs = await prisma_1.prisma.zKProof.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(proofs);
    }
    catch (e) {
        next(e);
    }
});
// POST /api/health/proofs/generate
router.post('/proofs/generate', auth_1.requireAuth, async (req, res, next) => {
    try {
        const { proofType } = zod_1.z.object({
            proofType: zod_1.z.enum(['health', 'income', 'location', 'identity']),
        }).parse(req.body);
        // Simulate ZK commitment generation
        const commitment = `0x${(0, uuid_1.v4)().replace(/-/g, '')}${(0, uuid_1.v4)().replace(/-/g, '')}`;
        const proof = await prisma_1.prisma.zKProof.create({
            data: {
                userId: req.userId,
                proofType,
                status: 'ACTIVE',
                commitment,
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            },
        });
        res.status(201).json(proof);
    }
    catch (e) {
        next(e);
    }
});
// POST /api/health/proofs/:id/mint-sbt
router.post('/proofs/:id/mint-sbt', auth_1.requireAuth, async (req, res, next) => {
    try {
        const proof = await prisma_1.prisma.zKProof.findUnique({ where: { id: req.params.id } });
        if (!proof)
            throw new error_1.AppError(404, 'Proof not found');
        if (proof.userId !== req.userId)
            throw new error_1.AppError(403, 'Forbidden');
        if (proof.sbtTokenId)
            throw new error_1.AppError(400, 'SBT already minted');
        // Simulate on-chain SBT mint
        const sbtTokenId = `SBT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const updated = await prisma_1.prisma.zKProof.update({
            where: { id: proof.id },
            data: { sbtTokenId, mintedAt: new Date(), status: 'ACTIVE' },
        });
        res.json(updated);
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
//# sourceMappingURL=health.js.map