"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.middlewares = void 0;
exports.createRateLimiter = createRateLimiter;
exports.createLockoutChecker = createLockoutChecker;
exports.createLockoutTracker = createLockoutTracker;
exports.createBackoff = createBackoff;
exports.createBackoffTracker = createBackoffTracker;
exports.createIPReputation = createIPReputation;
exports.createGeoJump = createGeoJump;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const geoip_lite_1 = __importDefault(require("geoip-lite"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const redis_1 = require("../utils/redisClient/redis");
const response_1 = require("../utils/response");
// ---------- Shared Redis Client ----------
const redisClient = redis_1.redis; //redis url inside utils
redisClient.on("connect", () => {
    console.log("Redis client is connecting...");
});
redisClient.on("ready", () => {
    console.log("Redis client connected successfully!");
});
redisClient.on("error", (err) => {
    console.error("Redis connection error:", err);
});
function createRateLimiter(opts) {
    const limiter = new rate_limiter_flexible_1.RateLimiterRedis({
        storeClient: redisClient,
        points: opts.points,
        duration: opts.duration,
        keyPrefix: opts.keyPrefix,
    });
    return async function rateLimiter(req, res, next) {
        try {
            // use IP or user identifier if authenticated
            const customReq = req;
            const key = (customReq.user?.id ?? req.ip ?? "unknown");
            await limiter.consume(key);
            // console.log("RateLimit READY");
            //console.log(req.ip);
            next();
        }
        catch (_err) {
            res.setHeader("Retry-After", String(opts.duration));
            res.status(429).json({ error: "Too many requests" });
        }
    };
}
// Check if account/IP locked
function createLockoutChecker(opts) {
    return async function lockoutChecker(req, res, next) {
        const key = `${opts.prefix}:${req.ip}`;
        console.log("key:", key);
        const locked = await redisClient.ttl(key);
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
function createLockoutTracker(opts) {
    return async function lockoutTracker(req, res, next) {
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
function createBackoff(opts) {
    return async function backoff(req, res, next) {
        const key = `${opts.prefix}:${req.ip}`;
        const count = parseInt((await redisClient.get(key)) || "0", 10);
        if (count > 0) {
            const delay = Math.min(opts.initialDelay * 2 ** (count - 1), opts.maxDelay);
            await new Promise((r) => setTimeout(r, delay));
        }
        next();
    };
}
// On failure, bump counter
function createBackoffTracker(opts) {
    return async function backoffTracker(req, res, next) {
        const key = `${opts.prefix}:${req.ip}`;
        const count = await redisClient.incr(key);
        if (count === 1) {
            await redisClient.expire(key, opts.maxDelay / 1000);
        }
        next();
    };
}
function createIPReputation(opts) {
    return async function ipReputation(req, res, next) {
        const ip = req.ip;
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
            if (cached === "bad")
                return (0, response_1.sendError)(res, "Forbidden", 403);
            return next();
        }
        // 2. query external reputation
        try {
            const resp = await (0, node_fetch_1.default)(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}`, {
                headers: { Key: opts.abuseKey, Accept: "application/json" },
            });
            const data = (await resp.json());
            const isBad = data.data.abuseConfidenceScore > 50;
            await redisClient.set(cacheKey, isBad ? "bad" : "good", "EX", opts.cacheTTL);
            if (isBad)
                return (0, response_1.sendError)(res, "Forbidden", 403);
            next();
        }
        catch (err) {
            next(); // fail-open to avoid blocking legitimate users
        }
    };
}
function createGeoJump(opts) {
    return async function geoJump(req, res, next) {
        const customReq = req;
        const userId = customReq.user?.id;
        if (!userId)
            return next();
        const ip = req.ip;
        if (!ip) {
            return (0, response_1.sendError)(res, "IP address missing", 400);
        }
        const loc = geoip_lite_1.default.lookup(ip);
        if (!loc)
            return next();
        const key = `${opts.prefix}:${userId}`;
        const prev = await redisClient.lrange(key, 0, 0); // most recent
        // push current
        await redisClient.lpush(key, JSON.stringify(loc));
        await redisClient.expire(key, opts.historyTTL);
        if (prev.length > 0) {
            const prevLoc = JSON.parse(prev[0]);
            // calculate distance (haversine)
            const toRad = (d) => (d * Math.PI) / 180;
            const R = 6371;
            const dLat = toRad(loc.ll[0] - prevLoc.ll[0]);
            const dLon = toRad(loc.ll[1] - prevLoc.ll[1]);
            const a = Math.sin(dLat / 2) ** 2 +
                Math.cos(toRad(prevLoc.ll[0])) *
                    Math.cos(toRad(loc.ll[0])) *
                    Math.sin(dLon / 2) ** 2;
            const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            if (dist > opts.maxDistanceKm) {
                return (0, response_1.sendError)(res, "Suspicious login location change detected", 403);
            }
        }
        next();
    };
}
// ---------- Export all for easy import ----------
exports.middlewares = {
    createRateLimiter,
    createLockoutChecker,
    createLockoutTracker,
    createBackoff,
    createBackoffTracker,
    createIPReputation,
    createGeoJump,
};
