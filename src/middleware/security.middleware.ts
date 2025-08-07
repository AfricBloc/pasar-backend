/**
 * SECURITY MIDDLEWARE TO HANDLE BRUTE FORCE ATTACK
 *  A suite of pure-function Express.js middlewares for security hardening.
 *  Features: Rate Limiting, Account Lockout, Exponential Backoff, IP Reputation + Blacklist, Geolocation Jump Detection.
 *
 */
import { Request, Response, NextFunction } from "express";
import { RateLimiterRedis } from "rate-limiter-flexible";
import Redis from "ioredis";
import geoip from "geoip-lite";
import fetch from "node-fetch";
import { redisUrl } from "@/utils/redisClient/redis";
import { sendError } from "@/utils/response";

interface CustomRequest extends Request {
  user?: { id: string };
}

interface AbuseIPDBResponse {
  data: {
    ipAddress: string;
    isPublic: boolean;
    abuseConfidenceScore: number;
    [key: string]: any; // allow extra props if needed
  };
}
// ---------- Shared Redis Client ----------
const redisClient = new Redis(redisUrl); //redis url inside utils

redisClient.on("connect", () => {
  console.log("Redis client is connecting...");
});

redisClient.on("ready", () => {
  console.log("Redis client connected successfully!");
});

redisClient.on("error", (err) => {
  console.error("Redis connection error:", err);
});
// ---------- 1. Rate Limiting Middleware ----------
interface RateLimiterOptions {
  points: number; // max number of requests
  duration: number; // per duration in seconds
  keyPrefix: string; // unique prefix per limiter
}
export function createRateLimiter(opts: RateLimiterOptions) {
  const limiter = new RateLimiterRedis({
    storeClient: redisClient,
    points: opts.points,
    duration: opts.duration,
    keyPrefix: opts.keyPrefix,
  });
  return async function rateLimiter(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // use IP or user identifier if authenticated

      const customReq = req as CustomRequest;
      const key = (customReq.user?.id ?? req.ip ?? "unknown") as string;
      await limiter.consume(key);
      // console.log("RateLimit READY");
      //console.log(req.ip);

      next();
    } catch (_err) {
      res.setHeader("Retry-After", String(opts.duration));
      res.status(429).json({ error: "Too many requests" });
    }
  };
}

// ---------- 2. Account Lockout Middleware ----------
interface LockoutOptions {
  maxFailed: number;
  lockDuration: number; // seconds
  prefix: string;
}
// Check if account/IP locked
export function createLockoutChecker(opts: LockoutOptions) {
  return async function lockoutChecker(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const key = `${opts.prefix}:${req.ip}`;
    console.log("key:", key);
    const locked: number = await redisClient.ttl(key);
    console.log("locked:", locked);
    if (locked > 0) {
      return res.status(403).json({
        status: "locked",
        message: `Locked. Try again in ${locked} seconds`,
      });
    }
    // console.log("CREATELOCKOUTCHECKER READY");

    next();
  };
}
// Increment failures and lockout
export function createLockoutTracker(opts: LockoutOptions) {
  return async function lockoutTracker(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const ip = req.ip;

    const failKey = `${opts.prefix}:fail:${ip}`;
    const lockKey = `${opts.prefix}:${ip}`;
    console.log("failKey:", failKey);
    console.log("lockKey:", lockKey);

    // Increment the failure count
    const failures = await redisClient.incr(failKey);

    if (failures === 1) {
      // Set expiry only on first failure
      await redisClient.expire(failKey, opts.lockDuration);
    }

    if (failures >= opts.maxFailed) {
      // Lock the IP
      await redisClient.set(lockKey, "1", "EX", opts.lockDuration);
    }

    console.log(`Failed attempts for ${ip}: ${failures}`);
    next();
  };
}
// ---------- 3. Exponential Backoff Middleware ----------
interface BackoffOptions {
  initialDelay: number; // in ms
  maxDelay: number; // cap in ms
  prefix: string;
}
export function createBackoff(opts: BackoffOptions) {
  return async function backoff(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const key = `${opts.prefix}:${req.ip}`;
    const count = parseInt((await redisClient.get(key)) || "0", 10);
    if (count > 0) {
      const delay = Math.min(
        opts.initialDelay * 2 ** (count - 1),
        opts.maxDelay
      );
      await new Promise((r) => setTimeout(r, delay));
    }
    next();
  };
}
// On failure, bump counter
export function createBackoffTracker(opts: BackoffOptions) {
  return async function backoffTracker(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const key = `${opts.prefix}:${req.ip}`;
    const count = await redisClient.incr(key);
    if (count === 1) {
      await redisClient.expire(key, opts.maxDelay / 1000);
    }
    next();
  };
}

// ---------- 4. IP Reputation + Blacklist Middleware ----------
interface IPReputationOptions {
  abuseKey: string; // AbuseIPDB API key
  blacklist: Set<string>; // local static blacklist
  cacheTTL: number; // seconds to cache lookups
}
export function createIPReputation(opts: IPReputationOptions) {
  return async function ipReputation(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const ip = req.ip as string;
    if (!ip) {
      return res.status(400).json({ error: "IP address missing" });
    }
    // 1. static blacklist
    if (opts.blacklist.has(ip)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const cacheKey = `iprep:${ip}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      if (cached === "bad") return sendError(res, "Forbidden", 403);
      return next();
    }
    // 2. query external reputation
    try {
      const resp = await fetch(
        `https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}`,
        {
          headers: { Key: opts.abuseKey, Accept: "application/json" },
        }
      );
      const data = (await resp.json()) as AbuseIPDBResponse;
      const isBad = data.data.abuseConfidenceScore > 50;
      await redisClient.set(
        cacheKey,
        isBad ? "bad" : "good",
        "EX",
        opts.cacheTTL
      );
      if (isBad) return sendError(res, "Forbidden", 403);
      next();
    } catch (err) {
      next(); // fail-open to avoid blocking legitimate users
    }
  };
}

// ---------- 5. Geolocation Jump Detection Middleware ----------
interface GeoJumpOptions {
  maxDistanceKm: number; // e.g. 5000km
  historyTTL: number; // seconds to keep IP history
  prefix: string;
}
export function createGeoJump(opts: GeoJumpOptions) {
  return async function geoJump(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const customReq = req as CustomRequest;
    const userId = customReq.user?.id;
    if (!userId) return next();

    const ip = req.ip as string;
    if (!ip) {
      return sendError(res, "IP address missing", 400);
    }
    const loc = geoip.lookup(ip);
    if (!loc) return next();

    const key = `${opts.prefix}:${userId}`;
    const prev = await redisClient.lrange(key, 0, 0); // most recent
    // push current
    await redisClient.lpush(key, JSON.stringify(loc));
    await redisClient.expire(key, opts.historyTTL);

    if (prev.length > 0) {
      const prevLoc = JSON.parse(prev[0]);
      // calculate distance (haversine)
      const toRad = (d: number) => (d * Math.PI) / 180;
      const R = 6371;
      const dLat = toRad(loc.ll[0] - prevLoc.ll[0]);
      const dLon = toRad(loc.ll[1] - prevLoc.ll[1]);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(prevLoc.ll[0])) *
          Math.cos(toRad(loc.ll[0])) *
          Math.sin(dLon / 2) ** 2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (dist > opts.maxDistanceKm) {
        return sendError(res, "Suspicious login location change detected", 403);
      }
    }
    next();
  };
}

// ---------- Export all for easy import ----------
export const middlewares = {
  createRateLimiter,
  createLockoutChecker,
  createLockoutTracker,
  createBackoff,
  createBackoffTracker,
  createIPReputation,
  createGeoJump,
};
