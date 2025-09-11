"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * IGNORE THIS
 * IGNORE THIS
 * IGNORE THIS
 * IGNORE THIS
 * IGNORE THIS
 * IGNORE THIS
 */
const db_1 = __importDefault(require("../db")); // your configured pg Pool
/**
 * IGNORE THIS
 * Ensures the users table exists with a production-grade schema.
 * Safe to run multiple times (idempotent).
 */
const createUserTable = async () => {
    try {
        // Enable required extensions if not already enabled
        await db_1.default.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
        await db_1.default.query(`CREATE EXTENSION IF NOT EXISTS citext;`);
        // Create the users table with improved schema
        await db_1.default.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email CITEXT NOT NULL UNIQUE,
        email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        password TEXT,                     -- nullable for OAuth-only users
        google_id TEXT UNIQUE,                 -- Google OAuth sub for linking
        username TEXT UNIQUE,                         
        full_name TEXT,
        picture_url TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        last_login_at TIMESTAMP WITH TIME ZONE,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb
      );
    `);
        // Indexes to optimize common lookup patterns
        await db_1.default.query(`CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);`);
        await db_1.default.query(`CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);`);
        await db_1.default.query(`CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);`);
        // Trigger to keep updated_at up to date
        await db_1.default.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
        await db_1.default.query(`DROP TRIGGER IF EXISTS trigger_set_updated_at ON users;`);
        await db_1.default.query(`
      CREATE TRIGGER trigger_set_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    `);
        console.log("User table will be created if not it does not exist");
    }
    catch (err) {
        console.error("Error creating users table:", err);
        throw err; // propagate so caller can fail startup if desired
    }
};
exports.default = createUserTable;
