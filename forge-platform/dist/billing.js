"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupBillingRoutes = void 0;
const setupBillingRoutes = (app, db, requireAuth) => {
    app.get('/api/billing/status', requireAuth, (req, res) => {
        res.json({ success: true, status: 'active' });
    });
};
exports.setupBillingRoutes = setupBillingRoutes;
//# sourceMappingURL=billing.js.map