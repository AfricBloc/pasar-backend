import { createClient } from "redis";
//import Redis from "ioredis";
//import { REDIS_HOST, REDIS_PORT, REDIS_URI } from "@/config/env.config";
import { redisUrl } from "@/utils/redisClient/redis";

const client = createClient({
  url: redisUrl,
});

const testRedisConnection = async () => {
  try {
    await client.connect();
    const pong = await client.ping();
    console.log("Connection successful:", pong === "PONG");
  } catch (err) {
    console.error("Redis connection failed:", err);
  } finally {
    await client.quit();
  }
};
export default testRedisConnection;
