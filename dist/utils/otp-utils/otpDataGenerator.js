"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate a 6-digit OTP, its SHA-256 hash, and an expiry timestamp.
 */
async function generateOTPData() {
    const OTP_TTL = 5 * 60; // seconds
    const otp = String(crypto_1.default.randomInt(100000, 999999)).padStart(6, "0");
    const expiry = new Date(Date.now() + OTP_TTL * 1000);
    const hashedOtp = crypto_1.default.createHash("sha256").update(otp).digest("hex");
    return { OTP_TTL, otp, hashedOtp, expiry };
}
exports.default = generateOTPData;
