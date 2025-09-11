"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtp = exports.resendOtp = exports.createOtp = void 0;
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("@prisma/client");
const redis_1 = require("@/utils/redisClient/redis");
const response_1 = require("@/utils/response");
const otpDataGenerator_1 = __importDefault(require("@/utils/otp-utils/otpDataGenerator"));
const sendOTP_1 = require("@/utils/mailer/sendOTP");
const prisma = new client_1.PrismaClient();
const RESEND_TTL = 24 * 3600; // seconds
const MAX_RESEND = 5; //Number of times a user can resend
/**
 * POST /api/otp
 * Generate & send an OTP
 */
const createOtp = async (req, res, next) => {
    try {
        const { userId } = req.user || {};
        if (!userId) {
            return (0, response_1.sendError)(res, "Unauthorized in token", 401);
        }
        const user = await prisma.user.findUnique({
            where: {
                id: userId, // userId should be a string or number depending on your schema
            },
        });
        console.log("user:", user);
        if (!user) {
            return (0, response_1.sendError)(res, "User not found", 404);
        }
        const email = user.email;
        console.log("email:", email);
        // Rate-limit check
        const resendKey = `otp:resend:${userId}`;
        console.log("resendKey:", resendKey);
        const count = await redis_1.redis.incr(resendKey);
        console.log(count);
        if (count === 1) {
            await redis_1.redis.expire(resendKey, RESEND_TTL);
        }
        if (count > MAX_RESEND) {
            return (0, response_1.sendError)(res, "Resend limit reached for today", 429);
        }
        // Generate OTP data
        const { OTP_TTL, otp, hashedOtp, expiry } = await (0, otpDataGenerator_1.default)();
        // Store hashed OTP in Redis
        await redis_1.redis.set(`otp:${userId}`, hashedOtp, "EX", OTP_TTL);
        /* // Persist in Postgres via Prisma
        const record = await prisma.otpData.create({
          data: {
            userId,
            otpHash: hashedOtp,
            expiresAt: expiry,
          },
        });*/
        // TODO: send `otp` via email/SMS
        await (0, sendOTP_1.sendOTPEmail)(email, otp);
        return (0, response_1.sendSuccess)(res, "OTP created and sent", { otpId: otp, expiry: expiry }, 201);
    }
    catch (err) {
        console.error("Error in createOtp:", err);
        next(err);
        return (0, response_1.sendError)(res, "Failed to create OTP", 500);
    }
};
exports.createOtp = createOtp;
/**
 * POST /api/otp/resend
 * Just re-uses createOtp logic
 */
const resendOtp = async (req, res, next) => (0, exports.createOtp)(req, res, next);
exports.resendOtp = resendOtp;
/**
 * POST /api/otp/verify
 * Verify a submitted OTP
 */
const verifyOtp = async (req, res, next) => {
    try {
        const { userId } = req.user || {};
        const { otp } = req.body;
        if (!userId) {
            return (0, response_1.sendError)(res, "Unauthorized", 401);
        }
        if (!otp || !/^\d{6}$/.test(otp)) {
            return (0, response_1.sendError)(res, "Invalid OTP format", 400);
        }
        // 1. Fetch the stored hash from Redis (this also handles the 5-min TTL)
        const storedHash = await redis_1.redis.get(`otp:${userId}`);
        console.log("storedHash:", storedHash);
        if (!storedHash) {
            return (0, response_1.sendError)(res, "OTP expired or not found", 400);
        }
        // 2. Compare incoming OTP
        const incomingHash = crypto_1.default.createHash("sha256").update(otp).digest("hex");
        console.log("incomingHash:", incomingHash);
        if (incomingHash !== storedHash) {
            return (0, response_1.sendError)(res, "Incorrect OTP", 400);
        }
        /*   // 3. Fetch the corresponding DB record to check expiry & used status
        const otpRecord = await prisma.otpData.findFirst({
          where: {
            userId,
            otpHash: storedHash,
          },
        });
    
        if (!otpRecord) {
          return sendError(res, "OTP record not found", 400);
        }
        if (otpRecord.used) {
          return sendError(res, "OTP already used", 400);
        }
        if (otpRecord.expiresAt < new Date()) {
          return sendError(res, "OTP has expired", 400);
        }
    
        // 4. Mark it used
        await prisma.otpData.update({
          where: { id: otpRecord.id },
          data: { used: true },
        });*/
        // 5. Cleanup Redis
        await redis_1.redis.del(`otp:${userId}`);
        return (0, response_1.sendSuccess)(res, "OTP verified successfully", null, 200);
    }
    catch (err) {
        console.error("Error in verifyOtp:", err);
        next(err);
        return (0, response_1.sendError)(res, "Failed to verify OTP", 500);
    }
};
exports.verifyOtp = verifyOtp;
/*import { NextFunction, Request, Response } from "express";
import { sendSuccess, sendError } from "@/utils/response";
import poolConfig from "@/db";
import { generateOTPData, otpData } from "@/utils/otp-utils/otpDataGenerator";
import { compareOtp, deleteOtp, isExpired } from "@/utils/otp-utils/otpUtils";
import { PrismaClient } from '@prisma/client';
import { redis } from "@/utils/redisClient/redis"

const createOTP = async (
  req: Request, // or AuthenticatedRequest if you've extended globally
  res: Response,
  next: NextFunction
) => {
  try {

      await redis.set(`otp:${userId}`, otp, 'EX', OTP_TTL);
  // log in Postgres
  await prisma.otpLog.create({
    data: { userId, otp }
  });
  return otp;
}
    //access user id from the req.user from the auth.middleware
    const { userId } = (req as any).user || {};

    if (!userId) {
      return sendError(res, "Unauthorized: No userId in token", 401);
    }
    console.log("User ID:", userId);

    //Fetch user from DB
    console.log("fetching user");
    const result = await poolConfig.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    console.log("fetched user:", result);

    if (result.rows.length === 0) {
      sendError(res, "User not found", 404);
    }

    //Extract user
    const user = result.rows[0];
    console.log("User:", user);

    //get user email
    const email = user.email;
    if (!email) {
      sendError(res, "Could not fetch email", 404);
    }
    console.log("Email:", email);
    //generate a otp
    await generateOTPData();
    // extract the hashed otp and the expiry
    const { otp, hashedOtp, expiry } = otpData;
    console.log("otp:", otp);
    console.log(hashedOtp);

    //add otp to the db
    const addOtp = await poolConfig.query(
      "INSERT INTO otp_data (user_id, otp, expiry) VALUES ($1, $2, $3) RETURNING *",
      [userId, hashedOtp, expiry]
    );

    const userOtp = addOtp.rows[0];
    console.log("user:", userOtp);

    sendSuccess(
      res,
      "OTP created and stored",
      {
        data: userOtp,
      },
      201
    );
  } catch (err) {
    console.log("Error creating otp:", err);
    next(err);
    return sendError(res, "Failed to create otp", 500);
  }
};
//Not yet completed
const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = (req as any).user;
    const { otp } = req.body;

    console.log("User ID:", userId);

    //Fetch hashed otp in the db
    const result = await poolConfig.query(
      "SELECT user_id, otp, expiry FROM otp_data WHERE user_id = $1",
      [userId]
    );
    if (result.rows.length === 0) {
      return sendError(res, "Code not found", 404);
    }
    console.log("result:", result);

    const otpResults = result.rows[0];
    console.log("otpresults:", otpResults);

    //Fetch the hashed otp
    const hashedOtp = otpResults.otp;
    console.log("hashedOtp:", hashedOtp);

    //Check if the otp is expired
    const expiry: number = new Date(otpResults.expiry).getTime(); // .getTime() gives timestamp
    const now: number = Date.now();
    console.log("Expiry", expiry, now);
    if (now > expiry) {
      //  await deleteOtp(userId);
      //    await poolConfig.query("DELETE FROM otp_data WHERE user_id = $1", [
      //   userId,
      //   ]);
      console.log("otp expired and deleted");
      return sendError(res, "OTP expired", 403);
    }

    //verify by comparing the opt whit the hash otp from the db
    console.log("verifying otp :", otp);
    const verify = await compareOtp(otp, hashedOtp);
    console.log(verify);
    if (!verify) {
      return sendError(res, "Invalid otp", 403);
    }

    //Delete otp from the Db after it as been used
    // await deleteOtp(userId);
    await poolConfig.query("DELETE FROM otp_data WHERE user_id = $1", [userId]);
    const newResult = await poolConfig.query(
      "SELECT user_id, otp, expiry FROM otp_data WHERE user_id = $1",
      [userId]
    );
    console.log(newResult.rowCount);
    console.log(newResult.rows);

    if (newResult.rows.length === 0) {
      console.log("row is empty");
    }
    sendSuccess(res, "Verification was successful", 200);
  } catch (err) {
    console.log(err);
    sendError(res, "Error verifying otp", 403);
  }
};
export { createOTP, verifyOTP };
*/
