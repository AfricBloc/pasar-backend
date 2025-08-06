import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * Protects routes by validating the session JWT from the cookie.
 * Attaches minimal verified user info to req.user.
 */

interface AuthPayload {
  userId: string;
  email: string;
}

interface AuthRequest extends Request {
  user?: AuthPayload;
}
export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.session;
    if (!token) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET is not configured");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const payload = jwt.verify(token, secret) as AuthPayload;
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch (err) {
    console.warn("Authentication failed:", err);
    return res.status(401).json({ error: "Invalid or expired session" });
  }
};
