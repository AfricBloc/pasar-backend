"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpBackoffOpts = exports.otpLockOpts = exports.signInErrorHandler = exports.signInHandler = exports.geoJump = exports.lockoutChecker = exports.lockOffOpts = exports.signInBackOffOpts = exports.signupBackOffOpts = exports.limitOpts = void 0;
const auth_controller_1 = require("../../controller/authControllers.ts/auth.controller");
const redis_1 = require("../redisClient/redis");
const security_middleware_1 = require("../../middleware/security.middleware");
const redisClient = redis_1.redis;
// For createRateLimiter
exports.limitOpts = { points: 5, duration: 60, keyPrefix: "rl:signup" };
//For createBackoff
// Apply exponential backoff for signup attempts to prevent brute-force attacks
// and reduce server load during high traffic or retry scenarios
exports.signupBackOffOpts = {
    // Initial delay in milliseconds before first retry attempt
    initialDelay: 300, //0.3sec
    // Maximum delay in milliseconds between retry attempts
    // This caps the exponential growth of the delay time
    maxDelay: 5000, // 5sec
    // Unique prefix for Redis keys to track backoff state
    // Allows separate tracking for different use cases (signup vs login etc)
    prefix: "backoff:signup", // Redis key format: "backoff:signup:[userIdentifier]"
};
exports.signInBackOffOpts = {
    initialDelay: 500, // ms 0.5sec
    maxDelay: 8000, // ms cap 8sec
    prefix: "backoff:signin",
};
exports.lockOffOpts = {
    // Maximum number of allowed failed attempts before lockout
    maxFailed: 5, // After 5 failed attempts, account gets locked
    // Duration of lockout in seconds (15 minutes in this case)
    lockDuration: 15 * 60, // 900 seconds (15 minutes)
    // Redis key prefix for storing lockout state
    prefix: "lock:signin", // Redis key format: "lock:signin:[userIdentifier]"
};
//for createLockoutChecker
exports.lockoutChecker = {
    maxFailed: 5, //5 failed attempt
    lockDuration: 15 * 60, // 15minutes
    prefix: "lock:signin", // save in redis
};
//createGeoJump
exports.geoJump = {
    maxDistanceKm: 5000,
    historyTTL: 24 * 3600,
    prefix: "geo:signin",
};
const signInHandler = async (req, res, next) => {
    console.log("sign in handler ready");
    try {
        await (0, auth_controller_1.signIn)(req, res, next); // your existing login logic
        console.log("sign in");
        // ✅ Step 5: Clear lockout/backoff data on success
        await Promise.all([
            redisClient.del(`lock:signin:${req.ip}`),
            redisClient.del(`backoff:signin:${req.ip}`),
        ]);
    }
    catch (err) {
        console.log("error:", err);
        return next(err); // pass to error handler
    }
};
exports.signInHandler = signInHandler;
const signInErrorHandler = (err, req, res, next) => {
    if (err.message === "AuthFailed") {
        console.log("signup error handler");
        (0, security_middleware_1.createLockoutTracker)({
            maxFailed: 5,
            lockDuration: 15 * 60,
            prefix: "lock:signin",
        })(req, res, () => { });
        (0, security_middleware_1.createBackoffTracker)({
            initialDelay: 500,
            maxDelay: 8000,
            prefix: "backoff:signin",
        })(req, res, () => { });
        return res.status(401).json({ error: "Invalid credentials" });
    }
    next(err); // pass other errors
};
exports.signInErrorHandler = signInErrorHandler;
exports.otpLockOpts = {
    maxFailed: 3,
    lockDuration: 10 * 60,
    prefix: "lock:otp",
};
exports.otpBackoffOpts = {
    initialDelay: 300,
    maxDelay: 5000,
    prefix: "backoff:otp",
};
