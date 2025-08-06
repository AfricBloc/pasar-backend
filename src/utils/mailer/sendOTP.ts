import nodemailer from "nodemailer";
import { EMAIL_USER, EMAIL_PASS } from "../../config/env.config";

if (!EMAIL_USER || !EMAIL_PASS) {
  throw new Error(
    "Email user or password is not defined in environment variables"
  );
}
// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: EMAIL_USER, // generated ethereal user
    pass: EMAIL_PASS, // generated ethereal password
  },
});

export const sendOTPEmail = async (
  email: string,
  otp: string
): Promise<void> => {
  try {
    await transporter.sendMail({
      from: `no-reply ${EMAIL_USER}`,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}`,
      html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
    });
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    throw error;
  }
};
