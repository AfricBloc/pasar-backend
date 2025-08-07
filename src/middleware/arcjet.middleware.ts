import { NextFunction, Request, Response } from "express";
import aj from "@/config/arcjet.config";
import { sendError } from "@/utils/response";

const arcjetMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const decision = await aj.protect(req, { requested: 5 }); // Deduct 5 tokens from the bucket
    //console.log("Arcjet decision", decision);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return sendError(res, "Too Many Requests", 429);
      }
      if (decision.reason.isBot()) {
        return sendError(res, "No bots allowed", 403);
      }

      return sendError(res, "Access Denied", 403);
    }
    next();
  } catch (err) {
    console.log(`Arcjet middleware error: ${err}`);
    return sendError(res, "Server error", 500);
  }
};

export default arcjetMiddleware;
