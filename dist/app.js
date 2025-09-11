"use strict";
//THIS IS THE MAIN SETUP FOR THE SERVER
//MAIN SERVER IS THE SERVER.TS
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
//import dotenv from "dotenv";
//dotenv.config();
//Created a new file for env variable inside the config folder so just add your .env.development.local
const user_router_1 = __importDefault(require("./router/user.router"));
//import errorMiddleware from "./src/middleware/error.middleware";
//import createUserTable from "./src/data/createUserTable";
const auth_router_1 = __importDefault(require("./router/auth.router"));
//import { sendOTPEmail } from "./src/utils/mailer/sendOTP";
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const security_middleware_1 = require("./middleware/security.middleware");
const arcjet_middleware_1 = __importDefault(require("./middleware/arcjet.middleware"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
//Global Middleware
app.use(express_1.default.json());
app.set("trust proxy", true); //Cus we would be using nginx
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(arcjet_middleware_1.default);
app.use(
//Global Rate Limiter (all routes)
(0, security_middleware_1.createRateLimiter)({
    points: 50, // 50 requests...
    duration: 60, // per 60 seconds
    keyPrefix: "rl_global",
}));
const staticBlacklist = new Set(["1.2.3.4", "5.6.7.8"]);
app.use(
//  IP Reputation (block known bad IPs)
(0, security_middleware_1.createIPReputation)({
    abuseKey: process.env.ABUSEIPDB_KEY,
    blacklist: staticBlacklist,
    cacheTTL: 3600, // cache for 1h
}));
app.use((0, cors_1.default)({ origin: "http://localhost:3000", credentials: true })); // Adjust origin as needed
app.use((0, cookie_parser_1.default)());
//Rate limiter more rateLimiter would be added at production nginx, crowdsec, fail2ban and modsecurity and owsap
//Error handling middleware
//app.use(errorMiddleware);
//Autocreate Tables This would no longer be need cuz we are going to be using prisma
//createUserTable();
//createOtpTable();
//API Routes
app.use("/api/v1/users", user_router_1.default);
app.use("/api/v1/auth", auth_router_1.default);
app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello from Express backend!" });
});
exports.default = app;
function notImplementedCors() {
    throw new Error("Function not implemented.");
}
