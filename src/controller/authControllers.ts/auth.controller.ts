import { sendError, sendSuccess } from "../../utils/response/index";
import { NextFunction, Request, Response } from "express";
import poolConfig from "../../db/index";
import bcrypt from "bcryptjs";
import { ENV, JWT_EXPIRES_IN, JWT_SECRET } from "../../config/env.config";
import jwt, { SignOptions, Secret } from "jsonwebtoken";
import { sanitizer } from "../../utils/sanitizer/sanitizeUser";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
//SignUp
const createUser = async (req: Request, res: Response, next: NextFunction) => {
  console.log("server signup ");
  let { username, email, password } = req.body;
  const hashPassword = await bcrypt.hash(password, 10);

  password = hashPassword;

  if (!username || !email || !password) {
    return sendError(res, "Incomplete details", 400);
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
    return sendError(res, "User already exists", 400);
  }

  try {
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password,
      },
    });

    const secret = JWT_SECRET as Secret;
    const expiresIn = JWT_EXPIRES_IN as SignOptions["expiresIn"];

    if (!secret || !expiresIn) {
      throw new Error("Missing env vars");
    }

    // Sanitize the user object to remove sensitive details like password
    const sanitizedUser = sanitizer(newUser);
    console.log(sanitizedUser);

    //generate token
    const token = jwt.sign({ userId: newUser.id }, secret, { expiresIn });

    // Set HTTP-only cookie with the token
    // Use secure in production and sameSite lax to prevent CSRF
    res.cookie("session", token, {
      httpOnly: true,
      secure: ENV === "production",
      sameSite: "None", //"lax",
      path: "/",
      // set a reasonable maxAge (24 hours); adjust as needed
      maxAge: 24 * 60 * 60 * 1000,
    });

    sendSuccess(
      res,
      "Signup successful",
      {
        token: token,
        user: sanitizedUser, //Sanitize to remove sensitive details like password etc
      },
      201
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return sendError(res, "Failed to create user", 500);
    next(error);
  }
};

const signIn = async (req: Request, res: Response, next: NextFunction) => {
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
      return sendError(res, "Invalid credentials", 401);
    }

    // 3. Handle case where password might be null (OAuth users)
    if (!user.password) {
      throw new Error("AuthFailed"); // Throw instead of sendError
    }
    //compare password

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("AuthFailed"); // Throw instead of sendError
    }

    // 2. Get env vars make sure these exist in .env.development.local
    const secret = JWT_SECRET as Secret;
    const expiresIn = JWT_EXPIRES_IN as SignOptions["expiresIn"];

    if (!secret || !expiresIn) {
      throw new Error("Missing env vars");
    }

    //Refactor this later so as to make it reusable

    const sanitizedUser = sanitizer(user);
    console.log(sanitizedUser);
    //generate token
    const token = jwt.sign({ userId: user?.id }, secret, { expiresIn });
    console.log("calling next function");

    // Set HTTP-only cookie with the token
    res.cookie("session", token, {
      httpOnly: true,
      secure: ENV === "production",
      sameSite: "None", //"lax",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });

    sendSuccess(
      res,
      "Signin successful",
      {
        token: token,
        user: sanitizedUser, //Sanitize to remove sensitive details like password etc
      },
      200
    );
  } catch (err) {
    console.log(`Sign in Error ${err}`);
    next(err);
  }
};
const logout = (req: Request, res: Response) => {
  res.clearCookie("session", {
    httpOnly: true,
    secure: ENV === "production",
    sameSite: "None",
    path: "/", // ensure same path as set
  });
  res.status(200).json({ message: "Logged out" });
};
export { createUser, signIn, logout };
