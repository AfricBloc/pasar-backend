"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const response_1 = require("../utils/response");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_config_1 = require("../config/env.config");
const authMiddleware = async (req, res, next) => {
    // Only extract token from httpOnly cookie named 'session'
    const token = req.cookies?.session;
    if (!token) {
        return (0, response_1.sendError)(res, "You are not authorized to access this resource", 401);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_config_1.JWT_SECRET);
        console.log(decoded);
        req.user = decoded; // Cast to JwtPayload or your custom type
        // Sanitize the user object
        //req.user = sanitizer(req.user);
        console.log("Sanitized user:", req.user); // Log the sanitized user for debugging
        next();
    }
    catch (error) {
        console.error("Error verifying token:", error);
        return (0, response_1.sendError)(res, "Invalid or expired token", 401);
    }
};
exports.default = authMiddleware;
