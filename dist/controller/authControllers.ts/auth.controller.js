"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.signIn = exports.createUser = void 0;
const index_1 = require("../../utils/response/index");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const env_config_1 = require("../../config/env.config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sanitizeUser_1 = require("../../utils/sanitizer/sanitizeUser");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
//SignUp
const createUser = async (req, res, next) => {
    console.log("server signup ");
    let { username, email, password } = req.body;
    const hashPassword = await bcryptjs_1.default.hash(password, 10);
    password = hashPassword;
    if (!username || !email || !password) {
        return (0, index_1.sendError)(res, "Incomplete details", 400);
    }
    console.log(email, password, username);
    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
        where: {
            email, // Critical for Citext fields
        },
    });
    console.log("existingUser:", existingUser);
    if (existingUser) {
        return (0, index_1.sendError)(res, "User already exists", 400);
    }
    try {
        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                password,
            },
        });
        const secret = env_config_1.JWT_SECRET;
        const expiresIn = env_config_1.JWT_EXPIRES_IN;
        if (!secret || !expiresIn) {
            throw new Error("Missing env vars");
        }
        // Sanitize the user object to remove sensitive details like password
        const sanitizedUser = (0, sanitizeUser_1.sanitizer)(newUser);
        console.log(sanitizedUser);
        //generate token
        const token = jsonwebtoken_1.default.sign({ userId: newUser.id }, secret, { expiresIn });
        // Set HTTP-only cookie with the token
        // Use secure in production and sameSite lax to prevent CSRF
        res.cookie("session", token, {
            httpOnly: true,
            secure: env_config_1.ENV === "production",
            sameSite: "none", //"lax",
            path: "/",
            // set a reasonable maxAge (24 hours); adjust as needed
            maxAge: 24 * 60 * 60 * 1000,
        });
        (0, index_1.sendSuccess)(res, "Signup successful", {
            token: token,
            user: sanitizedUser, //Sanitize to remove sensitive details like password etc
        }, 201);
    }
    catch (error) {
        console.error("Error creating user:", error);
        return (0, index_1.sendError)(res, "Failed to create user", 500);
        next(error);
    }
};
exports.createUser = createUser;
const signIn = async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new Error("AuthFailed"); // Throw instead of sendError
    }
    try {
        // 1. Find user with case-insensitive email match
        const user = await prisma.user.findFirst({
            where: {
                email: {
                    equals: email,
                    mode: "insensitive",
                },
            },
        });
        if (!user) {
            return (0, index_1.sendError)(res, "Invalid credentials", 401);
        }
        // 3. Handle case where password might be null (OAuth users)
        if (!user.password) {
            throw new Error("AuthFailed"); // Throw instead of sendError
        }
        //compare password
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error("AuthFailed"); // Throw instead of sendError
        }
        // 2. Get env vars make sure these exist in .env.development.local
        const secret = env_config_1.JWT_SECRET;
        const expiresIn = env_config_1.JWT_EXPIRES_IN;
        if (!secret || !expiresIn) {
            throw new Error("Missing env vars");
        }
        //Refactor this later so as to make it reusable
        const sanitizedUser = (0, sanitizeUser_1.sanitizer)(user);
        console.log(sanitizedUser);
        //generate token
        const token = jsonwebtoken_1.default.sign({ userId: user?.id }, secret, { expiresIn });
        console.log("calling next function");
        // Set HTTP-only cookie with the token
        res.cookie("session", token, {
            httpOnly: true,
            secure: env_config_1.ENV === "production",
            sameSite: "none", //"lax",
            path: "/",
            maxAge: 24 * 60 * 60 * 1000,
        });
        (0, index_1.sendSuccess)(res, "Signin successful", {
            token: token,
            user: sanitizedUser, //Sanitize to remove sensitive details like password etc
        }, 200);
    }
    catch (err) {
        console.log(`Sign in Error ${err}`);
        next(err);
    }
};
exports.signIn = signIn;
const logout = (req, res) => {
    res.clearCookie("session", {
        httpOnly: true,
        secure: env_config_1.ENV === "production",
        sameSite: "lax",
        path: "/", // ensure same path as set
    });
    res.status(200).json({ message: "Logged out" });
};
exports.logout = logout;
