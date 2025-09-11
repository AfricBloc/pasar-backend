import pkg from "pg";
import { DATABASE_URL } from "../config/env.config";
const { Pool } = pkg;

console.log("Database URL:", DATABASE_URL);
const poolConfig = new Pool({
  //connectionString: process.env.DATABASE_URL,
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
//Check if the db connection is successful
export async function verifyDBConnection() {
  try {
    await poolConfig.query("SELECT 1");
    console.log(`PostgreSQL connection successful`);
  } catch (err: unknown) {
    console.error(`PostgreSQL connection failed ${err}`);
    process.exit(1);
  }
}

export default poolConfig;
