import { sendError } from "@/utils/response";
import { NextFunction, Response, Request } from "express";
import jwt, { Secret, JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@/config/env.config";
import { sanitizer } from "@/utils/sanitizer/sanitizeUser";

// Extend the Request type to include a user property
interface AuthenticatedRequest extends Request {
  user?: JwtPayload; // or your custom payload type
}

const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  let token;
  // Check if the token is present in the headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Extract the token from the Authorization header
    token = req.headers.authorization.split(" ")[1];
  }
  // If no token is provided, return an error
  if (!token) {
    return sendError(
      res,
      "You are not authorized to access this resource",
      401
    );
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET as Secret);
    console.log(decoded);
    req.user = decoded as JwtPayload; // Cast to JwtPayload or your custom type

    // Sanitize the user object
    //req.user = sanitizer(req.user);
    console.log("Sanitized user:", req.user); // Log the sanitized user for debugging

    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    return sendError(res, "Invalid or expired token", 401);
  }
};

export default authMiddleware;
