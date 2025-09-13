import { Router, Request, Response, NextFunction } from "express";
import { validate } from "../middleware/validator.middleware";
import { createUserSchema } from "../model/user.model";
import {
  createUser,
  signIn,
} from "../controller/authControllers.ts/auth.controller";
import authMiddleware from "@/middleware/auth.middleware";
import { PrismaClient } from "@prisma/client";
import { sanitizer } from "@/utils/sanitizer/sanitizeUser";

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
import Redis from "ioredis";
import {
  signupBackOffOpts,
  limitOpts,
  signInBackOffOpts,
  lockoutChecker,
  geoJump,
  signInHandler,
  signInErrorHandler,
  otpLockOpts,
  otpBackoffOpts,
} from "@/utils/authUtils/auths";

const authRouter = Router();

// ── Apply a per-router rate limit to all /auth/* endpoints ───────────────────────
authRouter.use(
  createRateLimiter({
    points: 10, // max 10 requests...
    duration: 60, // ...per 60 seconds
    keyPrefix: "rl:auth", // Redis key prefix
  })
);

// ── SIGN UP ───────────────────────────────────────────────────────────────────────
authRouter.post(
  "/signup",
  createRateLimiter(limitOpts), // Per-route rate limit (e.g. 5 sign-ups / 1 minute)
  /* IP reputation & static blacklist
  createIPReputation({
    abuseKey: process.env.ABUSEIPDB_KEY!,
    blacklist: new Set(["1.2.3.4"]),
    cacheTTL: 3600,
  }),*/
  createBackoff(signupBackOffOpts), //  Exponential backoff
  validate(createUserSchema), // validate request body
  createUser // create user handler controller
);

// ── SIGN IN (with brute-force protection chain) ─────────────────────────────────
authRouter.post(
  "/signin",
  // Check if the IP is currently locked (This still as some issues tho fix later)
  createLockoutChecker(lockoutChecker),
  // ⏳ Step 2: Optional - Add delay for each failed attempt
  createBackoff(signInBackOffOpts),
  // Optional - Detect unusual login location jumps
  createGeoJump(geoJump),
  // Actual signIn logic
  signInHandler,
  // Track failure *only if signIn throws "AuthFailed"*
  signInErrorHandler
);
// ── AUTH ME (check if user is authenticated via httpOnly cookie) ──────────────
const prisma = new PrismaClient();
authRouter.get("/me", authMiddleware, async (req: any, res: Response) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    // Fetch user from DB for fresh info
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user: sanitizer(user) });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});
// ── OTP ROUTES (protected by authMiddleware) ───────────────────────────────────
// generate OTP
authRouter.get(
  "/otp",
  authMiddleware,
  createLockoutChecker(otpLockOpts),
  createBackoff(otpBackoffOpts),
  createOtp
);

// verify OTP
authRouter.post(
  "/otp/verify",
  authMiddleware,
  createLockoutChecker(otpLockOpts),
  createBackoff(otpBackoffOpts),
  verifyOtp
);

// resend OTP
authRouter.get(
  "/otp/resend",
  authMiddleware,
  createLockoutChecker(otpLockOpts),
  createBackoff(otpBackoffOpts),
  resendOtp
);

// sign out (just an example endpoint)
authRouter.post("/signout", authMiddleware, (req: Request, res: Response) => {
  res.send("signout");
});

// ── OAUTH (Google) ───────────────────────────────────────────────────────────────
authRouter.get("/google", redirectToGoogle);
authRouter.get("/google/callback", googleCallback);

export default authRouter;

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
