"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = exports.redisUrl = void 0;
// src/lib/redis.ts
const ioredis_1 = __importDefault(require("ioredis"));
const env_config_1 = require("@/config/env.config");
exports.redisUrl = env_config_1.REDIS_URI;
//console.log("Redis URL:", redisUrl);
exports.redis = exports.redisUrl
    ? new ioredis_1.default(exports.redisUrl)
    : new ioredis_1.default({
        host: env_config_1.REDIS_HOST,
        port: Number(env_config_1.REDIS_PORT),
        // password: REDIS_PASSWORD,
    });
