//THIS IS THE MAIN SETUP FOR THE SERVER
//MAIN SERVER IS THE SERVER.TS

import express from "express";
import bodyParser from "body-parser";
//import dotenv from "dotenv";
//dotenv.config();
//Created a new file for env variable inside the config folder so just add your .env.development.local
import userRouter from "./src/router/user.router";
//import errorMiddleware from "./src/middleware/error.middleware";
//import createUserTable from "./src/data/createUserTable";
import authRouter from "./src/router/auth.router";
//import { sendOTPEmail } from "./src/utils/mailer/sendOTP";
import cookieParser from "cookie-parser";
import {
  createIPReputation,
  createRateLimiter,
} from "@/middleware/security.middleware";
import arcjetMiddleware from "@/middleware/arcjet.middleware";
import cors from "cors";
const app = express();

//Global Middleware
app.use(express.json());
app.set("trust proxy", true); //Cus we would be using nginx
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(arcjetMiddleware);
app.use(
  //Global Rate Limiter (all routes)
  createRateLimiter({
    points: 50, // 50 requests...
    duration: 60, // per 60 seconds
    keyPrefix: "rl_global",
  })
);
const staticBlacklist = new Set<string>(["1.2.3.4", "5.6.7.8"]);
app.use(
  //  IP Reputation (block known bad IPs)
  createIPReputation({
    abuseKey: process.env.ABUSEIPDB_KEY!,
    blacklist: staticBlacklist,
    cacheTTL: 3600, // cache for 1h
  })
);
app.use(cors({ origin: "http://localhost:3000", credentials: true })); // Adjust origin as needed
app.use(cookieParser());
//Rate limiter more rateLimiter would be added at production nginx, crowdsec, fail2ban and modsecurity and owsap

//Error handling middleware
//app.use(errorMiddleware);

//Autocreate Tables This would no longer be need cuz we are going to be using prisma
//createUserTable();
//createOtpTable();

//API Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/auth", authRouter);

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express backend!" });
});

export default app;
function notImplementedCors(): any {
  throw new Error("Function not implemented.");
}
