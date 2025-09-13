"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const arcjet_config_1 = __importDefault(require("../config/arcjet.config"));
const response_1 = require("../utils/response");
const arcjetMiddleware = async (req, res, next) => {
    try {
        const decision = await arcjet_config_1.default.protect(req, { requested: 5 }); // Deduct 5 tokens from the bucket
        //console.log("Arcjet decision", decision);
        if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) {
                return (0, response_1.sendError)(res, "Too Many Requests", 429);
            }
            if (decision.reason.isBot()) {
                return (0, response_1.sendError)(res, "No bots allowed", 403);
            }
            return (0, response_1.sendError)(res, "Access Denied", 403);
        }
        next();
    }
    catch (err) {
        console.log(`Arcjet middleware error: ${err}`);
        return (0, response_1.sendError)(res, "Server error", 500);
    }
};
exports.default = arcjetMiddleware;
