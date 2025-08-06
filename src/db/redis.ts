import { createClient } from "redis";
import Redis from "ioredis";
import { REDIS_HOST, REDIS_PORT } from "@/config/env.config";

const client = createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
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
