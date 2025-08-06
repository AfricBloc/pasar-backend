import { sendError, sendSuccess } from "../../utils/response/index";
import { NextFunction, Request, Response } from "express";
import poolConfig from "../../db/index";
import bcrypt from "bcryptjs";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../../config/env.config";
import jwt, { SignOptions, Secret } from "jsonwebtoken";
import { sanitizer } from "../../utils/sanitizer/sanitizeUser";
//This function is not yet completed it does generate tokens
//and also remember to remove the password from the response
const createUser = async (req: Request, res: Response, next: NextFunction) => {
  let { username, email, password } = req.body;
  const hashPassword = await bcrypt.hash(password, 10);

  password = hashPassword;

  // Check if the user already exists
  const existingUser = await poolConfig.query(
    //This would be changed to a prisma and not direct DB query
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  if (existingUser.rows.length > 0) {
    return sendError(res, "User already exists", 400);
  }

  try {
    const result = await poolConfig.query(
      //This would be changed to a prisma and not direct DB query
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
      [username, email, password]
    );
    const newUser = result.rows[0];

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
    sendSuccess(
      res,
      "Signin successful",
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
    return sendError(res, "Email and password are required", 400);
  }
  try {
    //Validating email
    const userExist = await poolConfig.query(
      //This would be changed to a prisma and not direct DB query
      `SELECT id, username, email, password FROM users WHERE lower(email) = lower($1) LIMIT 1`,
      [email]
    );
    console.log(userExist);

    const result = userExist.rowCount;
    console.log(result);
    if (result === 0) {
      sendError(res, "Invalid credentials", 401);
    }
    const user = userExist.rows[0];

    //compare password
    //Please change the user.password to user.password_hash when the createTable code ass been updated
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      sendError(res, "Invalid credentials");
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
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn });
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
    next(err);
  }
};
const logout = (req: Request, res: Response) => {
  res.clearCookie("session", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/", // ensure same path as set
  });
  res.status(200).json({ message: "Logged out" });
};
export { createUser, signIn };
