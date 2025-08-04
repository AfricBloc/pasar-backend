import bcrypt from "bcryptjs";
import { hashOTP, generateOTP, getOTPExpiry } from "./otpUtils";

interface OTPData {
  otp: string;
  hashedOtp: string;
  expiry: string;
}

let otpData: OTPData;

//  Main function to generate complete OTP data
const generateOTPData = async (
  length: number = 6,
  expiryMinutes: number = 1
) => {
  const otp = generateOTP(length);
  const hashedOtp = await hashOTP(otp);
  const expiry = getOTPExpiry(expiryMinutes).toISOString(); // convert to ISO string for PostgreSQL
  otpData = {
    otp,
    hashedOtp,
    expiry,
  };
};

// ✅ Export the function (not the promise)
export { generateOTPData, otpData };
