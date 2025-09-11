"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTPEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_config_1 = require("../../config/env.config");
if (!env_config_1.EMAIL_USER || !env_config_1.EMAIL_PASS) {
    throw new Error("Email user or password is not defined in environment variables");
}
// Create a test account or replace with real credentials.
const transporter = nodemailer_1.default.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: env_config_1.EMAIL_USER, // generated ethereal user
        pass: env_config_1.EMAIL_PASS, // generated ethereal password
    },
});
const sendOTPEmail = async (email, otp) => {
    try {
        await transporter.sendMail({
            from: `no-reply ${env_config_1.EMAIL_USER}`,
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP is: ${otp}`,
            html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
        });
        console.log(`OTP sent to ${email}`);
    }
    catch (error) {
        console.error("Failed to send OTP email:", error);
        throw error;
    }
};
exports.sendOTPEmail = sendOTPEmail;
