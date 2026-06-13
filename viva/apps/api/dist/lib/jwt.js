"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefresh = exports.verifyAccess = exports.signRefresh = exports.signAccess = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'viva_access_secret_change_in_prod';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'viva_refresh_secret_change_in_prod';
function signAccess(payload) {
    return jsonwebtoken_1.default.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
}
exports.signAccess = signAccess;
function signRefresh(payload) {
    return jsonwebtoken_1.default.sign(payload, REFRESH_SECRET, { expiresIn: '30d' });
}
exports.signRefresh = signRefresh;
function verifyAccess(token) {
    return jsonwebtoken_1.default.verify(token, ACCESS_SECRET);
}
exports.verifyAccess = verifyAccess;
function verifyRefresh(token) {
    return jsonwebtoken_1.default.verify(token, REFRESH_SECRET);
}
exports.verifyRefresh = verifyRefresh;
//# sourceMappingURL=jwt.js.map