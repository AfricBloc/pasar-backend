//This is jus for testing the schema would later be changed

import { z } from "zod";

// This schema defines the structure of OTP data used in the application.
// It includes fields for user ID, OTP, hashed OTP, and expiry timestamp.

const OTPSchema = z.object({
  user_id: z
    .number()
    .int({ message: "User ID must be an integer" })
    .positive({ message: "User ID must be positive" }),

  otp: z
    .string()
    .min(20, { message: "Hashed OTP must be a valid bcrypt string" }),

  expiry: z
    .number()
    .int()
    .nonnegative({ message: "Expiry must be a valid timestamp in ms" }),
});

export type OTPData = z.infer<typeof OTPSchema>;
