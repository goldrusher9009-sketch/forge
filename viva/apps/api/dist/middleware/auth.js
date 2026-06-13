"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireAuth = void 0;
const jwt_1 = require("../lib/jwt");
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing token' });
    }
    const token = header.slice(7);
    try {
        const payload = (0, jwt_1.verifyAccess)(token);
        req.userId = payload.userId;
        req.userHandle = payload.handle;
        next();
    }
    catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
exports.requireAuth = requireAuth;
function optionalAuth(req, _res, next) {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
        try {
            const payload = (0, jwt_1.verifyAccess)(header.slice(7));
            req.userId = payload.userId;
            req.userHandle = payload.handle;
        }
        catch { /* ignore */ }
    }
    next();
}
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map