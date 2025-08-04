//THIS IS THE MAIN SETUP FOR THE SERVER
//MAIN SERVER IS THE SERVER.TS

import express from "express";
//import dotenv from "dotenv";
//dotenv.config();
//Created a new file for env variable inside the config folder so just add your .env.development.local
import userRouter from "./src/router/user.router";
import errorMiddleware from "./src/middleware/error.middleware";
import createUserTable from "./src/data/createUserTable";
import authRouter from "./src/router/auth.router";
import { sendOTPEmail } from "./src/utils/mailer/sendOTP";
import { generatedOTP } from "./src/middleware";
import { otpData } from "./src/utils/otp-utils/otpDataGenerator";
import createOtpTable from "@/data/createOtpTable";

const app = express();

//Global Middleware
app.use(express.json());
//app.use(cors())

//Error handling middleware
//app.use(errorMiddleware);

//Autocreate Tables
createUserTable();
createOtpTable();

// Call to generate OTP data
//API Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/auth", authRouter);

export default app;
