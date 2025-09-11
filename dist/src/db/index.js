"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyDBConnection = verifyDBConnection;
const pg_1 = __importDefault(require("pg"));
const env_config_1 = require("../config/env.config");
const { Pool } = pg_1.default;
console.log("Database URL:", env_config_1.DATABASE_URL);
const poolConfig = new Pool({
    //connectionString: process.env.DATABASE_URL,
    connectionString: env_config_1.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});
//Check if the db connection is successful
async function verifyDBConnection() {
    try {
        await poolConfig.query("SELECT 1");
        console.log(`PostgreSQL connection successful`);
    }
    catch (err) {
        console.error(`PostgreSQL connection failed ${err}`);
        process.exit(1);
    }
}
exports.default = poolConfig;
