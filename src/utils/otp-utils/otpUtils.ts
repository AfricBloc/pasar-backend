//ReFactor later

import bcrypt from "bcryptjs";
import { response, Response } from "express";
//import { otpData } from "./otpDataGenerator";
import { sendError } from "../response";
import poolConfig from "@/db";
// Hash the OTP
const hashOTP = async (otp: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(otp, saltRounds);
};
const deleteOtp = async (userId: any) => {
  await poolConfig.query("DELETE FROM otp_data WHERE user_id = $1", [userId]);
  console.log("otp has been deleted");
};

// Get OTP expiry timestamp
const getOTPExpiry = (minutes: number): Date => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

//Compare submitted OTP to stored hash
const compareOtp = async (otp: string, hashedOtp: string) => {
  return await bcrypt.compare(otp, hashedOtp);
};
/*
//Check if OTP is expired or not
const now = Date.now();
const isExpired = async (
  res: Response = response,
  now: number,
  expiration: number
) => {
  if (now > expiration) {
    sendError(res, "OTP expired", 404);
  }
};*/
export { hashOTP, deleteOtp, getOTPExpiry, compareOtp };
