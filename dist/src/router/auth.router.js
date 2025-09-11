"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validator_middleware_1 = require("../middleware/validator.middleware");
const user_model_1 = require("../model/user.model");
const auth_controller_1 = require("../controller/authControllers.ts/auth.controller");
const auth_middleware_1 = __importDefault(require("@/middleware/auth.middleware"));
const otp_controller_1 = require("@/controller/authControllers.ts/otp.controller");
const oauth_controller_1 = require("@/controller/authControllers.ts/oauth.controller");
const security_middleware_1 = require("@/middleware/security.middleware");
const auths_1 = require("@/utils/authUtils/auths");
const authRouter = (0, express_1.Router)();
// ── Apply a per-router rate limit to all /auth/* endpoints ───────────────────────
authRouter.use((0, security_middleware_1.createRateLimiter)({
    points: 10, // max 10 requests...
    duration: 60, // ...per 60 seconds
    keyPrefix: "rl:auth", // Redis key prefix
}));
// ── SIGN UP ───────────────────────────────────────────────────────────────────────
authRouter.post("/signup", (0, security_middleware_1.createRateLimiter)(auths_1.limitOpts), // Per-route rate limit (e.g. 5 sign-ups / 1 minute)
/* IP reputation & static blacklist
createIPReputation({
  abuseKey: process.env.ABUSEIPDB_KEY!,
  blacklist: new Set(["1.2.3.4"]),
  cacheTTL: 3600,
}),*/
(0, security_middleware_1.createBackoff)(auths_1.signupBackOffOpts), //  Exponential backoff
(0, validator_middleware_1.validate)(user_model_1.createUserSchema), // validate request body
auth_controller_1.createUser // create user handler controller
);
// ── SIGN IN (with brute-force protection chain) ─────────────────────────────────
authRouter.post("/signin", 
// Check if the IP is currently locked (This still as some issues tho fix later)
(0, security_middleware_1.createLockoutChecker)(auths_1.lockoutChecker), 
// ⏳ Step 2: Optional - Add delay for each failed attempt
(0, security_middleware_1.createBackoff)(auths_1.signInBackOffOpts), 
// Optional - Detect unusual login location jumps
(0, security_middleware_1.createGeoJump)(auths_1.geoJump), 
// Actual signIn logic
auths_1.signInHandler, 
// Track failure *only if signIn throws "AuthFailed"*
auths_1.signInErrorHandler);
// ── OTP ROUTES (protected by authMiddleware) ───────────────────────────────────
// generate OTP
authRouter.get("/otp", auth_middleware_1.default, (0, security_middleware_1.createLockoutChecker)(auths_1.otpLockOpts), (0, security_middleware_1.createBackoff)(auths_1.otpBackoffOpts), otp_controller_1.createOtp);
// verify OTP
authRouter.post("/otp/verify", auth_middleware_1.default, (0, security_middleware_1.createLockoutChecker)(auths_1.otpLockOpts), (0, security_middleware_1.createBackoff)(auths_1.otpBackoffOpts), otp_controller_1.verifyOtp);
// resend OTP
authRouter.get("/otp/resend", auth_middleware_1.default, (0, security_middleware_1.createLockoutChecker)(auths_1.otpLockOpts), (0, security_middleware_1.createBackoff)(auths_1.otpBackoffOpts), otp_controller_1.resendOtp);
// sign out (just an example endpoint)
authRouter.post("/signout", auth_middleware_1.default, (req, res) => {
    res.send("signout");
});
// ── OAUTH (Google) ───────────────────────────────────────────────────────────────
authRouter.get("/google", oauth_controller_1.redirectToGoogle);
authRouter.get("/google/callback", oauth_controller_1.googleCallback);
exports.default = authRouter;
/*import { Router } from "express";
import { Request, Response } from "express";
import { validate } from "../middleware/validator.middleware";
import { createUserSchema } from "../model/user.model";
import {
  createUser,
  signIn,
} from "../controller/authControllers.ts/auth.controller";
import authMiddleware from "@/middleware/auth.middleware";
import {
  createOtp,
  resendOtp,
  verifyOtp,
} from "@/controller/authControllers.ts/otp.controller";
import {
  googleCallback,
  redirectToGoogle,
} from "@/controller/authControllers.ts/oauth.controller";
import {
  createRateLimiter,
  createLockoutChecker,
  createLockoutTracker,
  createBackoff,
  createBackoffTracker,
  createIPReputation,
  createGeoJump,
} from "@/middleware/security.middleware";

const authRouter = Router();
// Apply rate limiter to ALL /auth/* routes
authRouter.use(
  createRateLimiter({
    points: 10, // Max 10 requests
    duration: 60, // Per 60 seconds (1 minute)
    keyPrefix: "rl:auth", // Redis key prefix (if using Redis)
  })
);
authRouter.post("/signup", validate(createUserSchema), createUser);
authRouter.post(
  "/signin",
  // 1. fail-open IP reputation + static blacklist
 /* createIPReputation({
    abuseKey: process.env.ABUSEIPDB_KEY!,
    blacklist: new Set(["1.2.3.4"]),
    cacheTTL: 3600,
  }),
  // 2. account lockout check (blocks after 5 fails for 15m)
  createLockoutChecker({
    maxFailed: 5,
    lockDuration: 15 * 60,
    prefix: "lock:signin",
  }),
  // 3. exponential backoff delay
  createBackoff({
    initialDelay: 500,
    maxDelay: 8000,
    prefix: "backoff:signin",
  }),
  // 4. geo-jump detection (if userId present; you might run this _after_ auth)
  createGeoJump({
    maxDistanceKm: 5000,
    historyTTL: 24 * 3600,
    prefix: "geo:signin",
  }),
  signIn
);
authRouter.get("/otp", authMiddleware, createOtp);
authRouter.post("/otp/verify", authMiddleware, verifyOtp);
authRouter.get("/otp/resend", authMiddleware, resendOtp);
authRouter.post("/signout", authMiddleware, (req: Request, res: Response) => {
  res.send("signout");
});
authRouter.get("/google", redirectToGoogle);
authRouter.get("/google/callback", googleCallback);

export default authRouter;
*/
