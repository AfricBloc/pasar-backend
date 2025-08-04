import poolConfig from "../db";
// Remember to add unique to the username and email fields
// This function will create the user table if it does not exist
const createUserTable = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    isVerified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
)`;
  try {
    poolConfig.query(queryText);
    console.log("User table will be created if not it does not exist");
  } catch (err) {
    console.log("Error creating table:", err);
  }
};
export default createUserTable;
