"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const requireAuth = (req, res, next) => {
    try {
        const token = req.cookies?.session;
        if (!token) {
            return res.status(401).json({ error: "Unauthenticated" });
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("JWT_SECRET is not configured");
            return res.status(500).json({ error: "Server configuration error" });
        }
        const payload = jsonwebtoken_1.default.verify(token, secret);
        req.user = { userId: payload.userId, email: payload.email };
        next();
    }
    catch (err) {
        console.warn("Authentication failed:", err);
        return res.status(401).json({ error: "Invalid or expired session" });
    }
};
exports.requireAuth = requireAuth;
