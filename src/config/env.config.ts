import { config as loadEnv } from "dotenv";
import { existsSync } from "fs";
import path from "path";

// Set the current environment (default to 'development')
const NODE_ENV = process.env.NODE_ENV || "development";

// Priority order: .env.[env].local → .env.local → .env
const envFiles = [`.env.${NODE_ENV}.local`, `.env.local`, `.env`];

for (const file of envFiles) {
  const fullPath = path.resolve(process.cwd(), file);
  if (existsSync(fullPath)) {
    loadEnv({ path: fullPath });
    console.log(`Loaded environment variables from ${file}`);
    break; // Stop after loading the first found file
  }
}

// Export all required environment variables
export const {
  PORT,
  DATABASE_URL,
  NODE_ENV: ENV,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  EMAIL_USER,
  EMAIL_PASS,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URL,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  ARCJET_KEY,
  ARCJET_ENV,
} = process.env;
