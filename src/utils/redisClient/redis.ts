// src/lib/redis.ts
import Redis from "ioredis";
import { REDIS_HOST, REDIS_PORT, REDIS_URI } from "@/config/env.config";

export const redisUrl = REDIS_URI;
//console.log("Redis URL:", redisUrl);

export const redis = redisUrl
  ? new Redis(redisUrl)
  : new Redis({
      host: REDIS_HOST,
      port: Number(REDIS_PORT),
      // password: REDIS_PASSWORD,
    });
