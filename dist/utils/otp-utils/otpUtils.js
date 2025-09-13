"use strict";
//ReFactor later
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareOtp = exports.getOTPExpiry = exports.deleteOtp = exports.hashOTP = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("@/db"));
// Hash the OTP
const hashOTP = async (otp) => {
    const saltRounds = 10;
    return await bcryptjs_1.default.hash(otp, saltRounds);
};
exports.hashOTP = hashOTP;
const deleteOtp = async (userId) => {
    await db_1.default.query("DELETE FROM otp_data WHERE user_id = $1", [userId]);
    console.log("otp has been deleted");
};
exports.deleteOtp = deleteOtp;
// Get OTP expiry timestamp
const getOTPExpiry = (minutes) => {
    return new Date(Date.now() + minutes * 60 * 1000);
};
exports.getOTPExpiry = getOTPExpiry;
//Compare submitted OTP to stored hash
const compareOtp = async (otp, hashedOtp) => {
    return await bcryptjs_1.default.compare(otp, hashedOtp);
};
exports.compareOtp = compareOtp;
