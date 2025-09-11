"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ARCJET_ENV = exports.ARCJET_KEY = exports.REDIS_URI = exports.REDIS_PORT = exports.REDIS_HOST = exports.REDIRECT_URL = exports.GOOGLE_CLIENT_SECRET = exports.GOOGLE_CLIENT_ID = exports.EMAIL_PASS = exports.EMAIL_USER = exports.JWT_EXPIRES_IN = exports.JWT_SECRET = exports.ENV = exports.DATABASE_URL = exports.PORT = void 0;
const dotenv_1 = require("dotenv");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
// Set the current environment (default to 'development')
const NODE_ENV = process.env.NODE_ENV || "development";
// Priority order: .env.[env].local → .env.local → .env
const envFiles = [`.env.${NODE_ENV}.local`, `.env.local`, `.env`];
for (const file of envFiles) {
    const fullPath = path_1.default.resolve(process.cwd(), file);
    if ((0, fs_1.existsSync)(fullPath)) {
        (0, dotenv_1.config)({ path: fullPath });
        console.log(`Loaded environment variables from ${file}`);
        break; // Stop after loading the first found file
    }
}
// Export all required environment variables
_a = process.env, exports.PORT = _a.PORT, exports.DATABASE_URL = _a.DATABASE_URL, exports.ENV = _a.NODE_ENV, exports.JWT_SECRET = _a.JWT_SECRET, exports.JWT_EXPIRES_IN = _a.JWT_EXPIRES_IN, exports.EMAIL_USER = _a.EMAIL_USER, exports.EMAIL_PASS = _a.EMAIL_PASS, exports.GOOGLE_CLIENT_ID = _a.GOOGLE_CLIENT_ID, exports.GOOGLE_CLIENT_SECRET = _a.GOOGLE_CLIENT_SECRET, exports.REDIRECT_URL = _a.REDIRECT_URL, exports.REDIS_HOST = _a.REDIS_HOST, exports.REDIS_PORT = _a.REDIS_PORT, exports.REDIS_URI = _a.REDIS_URI, exports.ARCJET_KEY = _a.ARCJET_KEY, exports.ARCJET_ENV = _a.ARCJET_ENV;
