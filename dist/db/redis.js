"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
//import Redis from "ioredis";
//import { REDIS_HOST, REDIS_PORT, REDIS_URI } from "@/config/env.config";
const redis_2 = require("@/utils/redisClient/redis");
const client = (0, redis_1.createClient)({
    url: redis_2.redisUrl,
});
const testRedisConnection = async () => {
    try {
        await client.connect();
        const pong = await client.ping();
        console.log("Connection successful:", pong === "PONG");
    }
    catch (err) {
        console.error("Redis connection failed:", err);
    }
    finally {
        await client.quit();
    }
};
exports.default = testRedisConnection;
