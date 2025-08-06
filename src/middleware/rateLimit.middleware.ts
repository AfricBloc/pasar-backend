import rateLimit from "express-rate-limit";
import { Request } from "express";
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  // This is the updated syntax for the latest version of the library
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => req.path === "/healthcheck",

  handler: (req, res) => {
    res.status(429).json({
      status: 429,
      error: "Too many requests. Please try again later.",
    });
  },
});
