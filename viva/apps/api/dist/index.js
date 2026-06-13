"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const http_1 = require("http");
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const feed_1 = __importDefault(require("./routes/feed"));
const messages_1 = __importDefault(require("./routes/messages"));
const markets_1 = __importDefault(require("./routes/markets"));
const health_1 = __importDefault(require("./routes/health"));
const tokens_1 = __importDefault(require("./routes/tokens"));
const rooms_1 = __importDefault(require("./routes/rooms"));
const twin_1 = __importDefault(require("./routes/twin"));
const dating_1 = __importDefault(require("./routes/dating"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const server_1 = require("./ws/server");
const error_1 = require("./middleware/error");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// ── Middleware ──────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, cb) => {
        const allowed = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(s => s.trim());
        if (!origin || allowed.some(a => origin.startsWith(a)))
            return cb(null, true);
        cb(new Error('CORS'));
    },
    credentials: true,
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
// ── Health check ─────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: '0.1.0', ts: new Date().toISOString() });
});
// ── Routes ───────────────────────────────────────────
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/feed', feed_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/markets', markets_1.default);
app.use('/api/health', health_1.default);
app.use('/api/tokens', tokens_1.default);
app.use('/api/rooms', rooms_1.default);
app.use('/api/twin', twin_1.default);
app.use('/api/dating', dating_1.default);
app.use('/api/notifications', notifications_1.default);
// ── Error handler ────────────────────────────────────
app.use(error_1.errorHandler);
// ── WebSocket ────────────────────────────────────────
(0, server_1.setupWebSocket)(httpServer);
// ── Start ────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
    console.log(`🚀 VIVA API running on http://localhost:${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map