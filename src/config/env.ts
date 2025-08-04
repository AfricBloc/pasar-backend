import { config } from "dotenv";

config({ path: `.env.${process.env.NODE_ENV || `development`}.local` });

export const {
  PORT,
  DATABASE_URL,
  NODE_ENV,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  EMAIL_USER,
  EMAIL_PASS,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URL,
} = process.env;
