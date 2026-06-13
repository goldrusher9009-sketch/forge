"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding VIVA database...');
    // ── Users ──────────────────────────────────────────────
    const users = await Promise.all([
        prisma.user.upsert({
            where: { email: 'alex@viva.app' },
            update: {},
            create: {
                handle: 'alex_sovereign',
                displayName: 'Alex Chen',
                email: 'alex@viva.app',
                passwordHash: await bcryptjs_1.default.hash('password123', 12),
                vScore: 847,
                tier: 'SOVEREIGN',
                sleepRing: 88, nutritionRing: 82, activityRing: 91, socialRing: 79, wealthRing: 85,
                bio: 'Building the life OS. Sovereign data, sovereign life.',
                walletAddress: '0xAlex1234567890abcdef1234567890abcdef1234',
            },
        }),
        prisma.user.upsert({
            where: { email: 'mia@viva.app' },
            update: {},
            create: {
                handle: 'mia_guardian',
                displayName: 'Mia Torres',
                email: 'mia@viva.app',
                passwordHash: await bcryptjs_1.default.hash('password123', 12),
                vScore: 612,
                tier: 'GUARDIAN',
                sleepRing: 74, nutritionRing: 88, activityRing: 67, socialRing: 91, wealthRing: 72,
                bio: 'Health optimizer. ZK proof evangelist.',
                walletAddress: '0xMia1234567890abcdef1234567890abcdef5678',
            },
        }),
        prisma.user.upsert({
            where: { email: 'kai@viva.app' },
            update: {},
            create: {
                handle: 'kai_stable',
                displayName: 'Kai Nakamura',
                email: 'kai@viva.app',
                passwordHash: await bcryptjs_1.default.hash('password123', 12),
                vScore: 423,
                tier: 'STABLE',
                sleepRing: 65, nutritionRing: 71, activityRing: 78, socialRing: 62, wealthRing: 69,
                bio: 'Prediction market strategist.',
            },
        }),
        prisma.user.upsert({
            where: { email: 'demo@viva.app' },
            update: {},
            create: {
                handle: 'demo_user',
                displayName: 'Demo User',
                email: 'demo@viva.app',
                passwordHash: await bcryptjs_1.default.hash('demo1234', 12),
                vScore: 200,
                tier: 'RISING',
                sleepRing: 50, nutritionRing: 55, activityRing: 60, socialRing: 45, wealthRing: 40,
                bio: 'Just getting started.',
            },
        }),
    ]);
    console.log(`✅ Created ${users.length} users`);
    // ── Tokens ──────────────────────────────────────────────
    const tokens = await Promise.all([
        prisma.token.upsert({
            where: { ownerId: users[0].id },
            update: {},
            create: {
                ownerId: users[0].id,
                symbol: 'ALEX',
                name: 'Alex Token',
                supply: 2400,
                price: 0.034,
            },
        }),
        prisma.token.upsert({
            where: { ownerId: users[1].id },
            update: {},
            create: {
                ownerId: users[1].id,
                symbol: 'MIA',
                name: 'Mia Token',
                supply: 1800,
                price: 0.028,
            },
        }),
    ]);
    console.log(`✅ Created ${tokens.length} tokens`);
    // ── Markets ──────────────────────────────────────────────
    const markets = await Promise.all([
        prisma.market.upsert({
            where: { id: 'market-1' },
            update: {},
            create: {
                id: 'market-1',
                title: 'Will VIVA reach 1M users by Q4 2026?',
                description: 'Resolved YES if VIVA platform reaches 1,000,000 registered users before Jan 1, 2027.',
                category: 'platform',
                yesProb: 0.72,
                totalVolume: 48200,
                closesAt: new Date('2026-12-31'),
            },
        }),
        prisma.market.upsert({
            where: { id: 'market-2' },
            update: {},
            create: {
                id: 'market-2',
                title: 'Global avg sleep score above 70% by end of 2026?',
                description: 'Based on aggregate VIVA health data. Requires 100K+ data points.',
                category: 'health',
                yesProb: 0.41,
                totalVolume: 29100,
                closesAt: new Date('2026-12-31'),
            },
        }),
        prisma.market.upsert({
            where: { id: 'market-3' },
            update: {},
            create: {
                id: 'market-3',
                title: '$VIVA token price above $1 within 6 months?',
                description: 'Market closes if $VIVA closes above $1.00 on any major DEX for 3 consecutive days.',
                category: 'markets',
                yesProb: 0.58,
                totalVolume: 91400,
                closesAt: new Date('2026-12-09'),
            },
        }),
        prisma.market.upsert({
            where: { id: 'market-4' },
            update: {},
            create: {
                id: 'market-4',
                title: 'Will ZK health proofs be adopted by 3+ insurers in 2026?',
                description: 'At least 3 major health insurers accept VIVA ZK-SBT as proof of wellness.',
                category: 'health',
                yesProb: 0.31,
                totalVolume: 17800,
                closesAt: new Date('2026-12-31'),
            },
        }),
        prisma.market.upsert({
            where: { id: 'market-5' },
            update: {},
            create: {
                id: 'market-5',
                title: 'AI Twin reaches L3 autonomy for 10K+ users?',
                description: 'L3 = fully autonomous agent decisions without user confirmation.',
                category: 'twin',
                yesProb: 0.64,
                totalVolume: 33700,
                closesAt: new Date('2026-09-30'),
            },
        }),
    ]);
    console.log(`✅ Created ${markets.length} markets`);
    // ── Posts ──────────────────────────────────────────────
    const posts = await Promise.all([
        prisma.post.create({
            data: {
                authorId: users[0].id,
                content: 'Sleep ring hit 91% this week. Consistent 8h + no screens after 10pm. The data doesn\'t lie — everything else improves when sleep locks in.',
                category: 'health',
                attentionScore: 847,
                reachCount: 2341,
            },
        }),
        prisma.post.create({
            data: {
                authorId: users[1].id,
                content: 'ZK health proof live on Base L2. No one sees your data. Insurer verifies wellness without accessing a single record. This is the future.',
                category: 'zkp',
                attentionScore: 612,
                reachCount: 1890,
            },
        }),
        prisma.post.create({
            data: {
                authorId: users[2].id,
                content: 'Staked 200 on YES for the $VIVA $1 market. Prob at 58% seems undervalued given the roadmap. DYOR.',
                category: 'markets',
                attentionScore: 423,
                reachCount: 1102,
            },
        }),
    ]);
    console.log(`✅ Created ${posts.length} posts`);
    // ── Rooms ──────────────────────────────────────────────
    await Promise.all([
        prisma.room.upsert({
            where: { id: 'room-1' },
            update: {},
            create: {
                id: 'room-1',
                title: 'Sovereign Data: The Future of Health Records',
                hostId: users[0].id,
                topic: 'ZK proofs, SBTs, and data ownership',
                isLive: true,
                minVScore: 500,
                members: {
                    create: [
                        { userId: users[0].id, role: 'HOST', isMuted: false },
                        { userId: users[1].id, role: 'SPEAKER', isMuted: false },
                    ],
                },
            },
        }),
        prisma.room.upsert({
            where: { id: 'room-2' },
            update: {},
            create: {
                id: 'room-2',
                title: 'Prediction Markets Alpha: Q3 Strategies',
                hostId: users[2].id,
                topic: 'Market analysis and staking strategies',
                isLive: true,
                minVScore: 300,
                members: {
                    create: [{ userId: users[2].id, role: 'HOST', isMuted: false }],
                },
            },
        }),
        prisma.room.upsert({
            where: { id: 'room-3' },
            update: {},
            create: {
                id: 'room-3',
                title: 'AI Twin Deep Dive: Autonomy Levels Explained',
                hostId: users[1].id,
                topic: 'L1 vs L2 vs L3 autonomy, risks, benefits',
                isLive: false,
                minVScore: 0,
                scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000),
            },
        }),
    ]);
    console.log(`✅ Created 3 rooms`);
    // ── Thread + Messages ──────────────────────────────────
    const thread = await prisma.thread.create({
        data: {
            members: {
                create: [
                    { userId: users[0].id },
                    { userId: users[3].id },
                ],
            },
        },
    });
    await prisma.message.createMany({
        data: [
            { threadId: thread.id, senderId: users[0].id, content: 'Welcome to VIVA. Your V-Score is initialized.' },
            { threadId: thread.id, senderId: users[3].id, content: 'Thanks! What should I focus on first?' },
            { threadId: thread.id, senderId: users[0].id, content: 'Start with health rings. Sleep + Activity compound fastest.' },
        ],
    });
    console.log(`✅ Created 1 thread, 3 messages`);
    console.log('\n✅ Seed complete!');
    console.log('\n📋 Demo login:');
    console.log('  Email: demo@viva.app');
    console.log('  Password: demo1234');
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map