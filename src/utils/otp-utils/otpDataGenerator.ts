import crypto from "crypto";
interface OTPData {
  OTP_TTL: number;
  otp: string;
  hashedOtp: string;
  expiry: Date;
}

/**
 * Generate a 6-digit OTP, its SHA-256 hash, and an expiry timestamp.
 */
async function generateOTPData(): Promise<OTPData> {
  const OTP_TTL = 5 * 60; // seconds
  const otp = String(crypto.randomInt(100000, 999999)).padStart(6, "0");
  const expiry = new Date(Date.now() + OTP_TTL * 1000);
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
  return { OTP_TTL, otp, hashedOtp, expiry };
}
export default generateOTPData;
