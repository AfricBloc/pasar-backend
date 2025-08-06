import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { redis } from "@/utils/redisClient/redis";
import { sendSuccess, sendError } from "@/utils/response";
import generateOTPData from "@/utils/otp-utils/otpDataGenerator";
import { sendOTPEmail } from "@/utils/mailer/sendOTP";

const prisma = new PrismaClient();

const RESEND_TTL = 24 * 3600; // seconds
const MAX_RESEND = 5; //Number of times a user can resend

/**
 * POST /api/otp
 * Generate & send an OTP
 */
export const createOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, email } = (req as any).user || {};
    if (!userId || !email) {
      return sendError(res, "Unauthorized or missing email in token", 401);
    }

    // Rate-limit check
    const resendKey = `otp:resend:${userId}`;
    const count = await redis.incr(resendKey);
    if (count === 1) {
      await redis.expire(resendKey, RESEND_TTL);
    }
    if (count > MAX_RESEND) {
      return sendError(res, "Resend limit reached for today", 429);
    }

    // Generate OTP data
    const { OTP_TTL, otp, hashedOtp, expiry } = await generateOTPData();

    // Store hashed OTP in Redis
    await redis.set(`otp:${userId}`, hashedOtp, "EX", OTP_TTL);

    // Persist in Postgres via Prisma
    const record = await prisma.otpData.create({
      data: {
        userId,
        otpHash: hashedOtp,
        expiresAt: expiry,
      },
    });

    // TODO: send `otp` via email/SMS
    await sendOTPEmail(email, otp);

    return sendSuccess(res, "OTP created and sent", { otpId: record.id }, 201);
  } catch (err) {
    console.error("Error in createOtp:", err);
    next(err);
    return sendError(res, "Failed to create OTP", 500);
  }
};

/**
 * POST /api/otp/resend
 * Just re-uses createOtp logic
 */
export const resendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => createOtp(req, res, next);

/**
 * POST /api/otp/verify
 * Verify a submitted OTP
 */

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = (req as any).user || {};
    const { otp } = req.body as { otp?: string };

    if (!userId) {
      return sendError(res, "Unauthorized", 401);
    }
    if (!otp || !/^\d{6}$/.test(otp)) {
      return sendError(res, "Invalid OTP format", 400);
    }

    // 1. Fetch the stored hash from Redis (this also handles the 5-min TTL)
    const storedHash = await redis.get(`otp:${userId}`);
    if (!storedHash) {
      return sendError(res, "OTP expired or not found", 400);
    }

    // 2. Compare incoming OTP
    const incomingHash = crypto.createHash("sha256").update(otp).digest("hex");
    if (incomingHash !== storedHash) {
      return sendError(res, "Incorrect OTP", 400);
    }

    // 3. Fetch the corresponding DB record to check expiry & used status
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
    });

    // 5. Cleanup Redis
    await redis.del(`otp:${userId}`);

    return sendSuccess(res, "OTP verified successfully", null, 200);
  } catch (err) {
    console.error("Error in verifyOtp:", err);
    next(err);
    return sendError(res, "Failed to verify OTP", 500);
  }
};

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
