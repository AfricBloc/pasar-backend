import poolConfig from "../db";

/**
 * Initializes the OTP table if it doesn't already exist.
 * This is a temporary solution for testing before switching to Redis.
 */
const createOtpTable = async (): Promise<void> => {
  const query = `
   CREATE TABLE IF NOT EXISTS otp_data (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  otp VARCHAR(255) NOT NULL,
  expiry TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)`;
  try {
    await poolConfig.query(query);
    console.log("OTP table ready (created if not exists).");
  } catch (error) {
    console.error("Failed to create OTP table:", error);
    throw error; // Optional: rethrow if you want the app to stop on error
  }
};

export default createOtpTable;
