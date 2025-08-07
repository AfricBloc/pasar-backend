// src/lib/redis.ts
import Redis from "ioredis";
import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } from "@/config/env.config";
export const redis = new Redis({
  host: REDIS_HOST,
  port: Number(REDIS_PORT),
  // password: REDIS_PASSWORD,
});

export const redisUrl = `redis://${REDIS_HOST}:${REDIS_PORT}`;
