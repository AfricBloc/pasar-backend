import { Router } from "express";
import { Request, Response } from "express";
import { validate } from "../middleware/validator.middleware";
import { createUserSchema } from "../model/user.model";
import {
  createUser,
  signIn,
} from "../controller/authControllers.ts/auth.controller";
import authMiddleware from "@/middleware/auth.middleware";
import {
  createOtp,
  resendOtp,
  verifyOtp,
} from "@/controller/authControllers.ts/otp.controller";
import {
  googleCallback,
  redirectToGoogle,
} from "@/controller/authControllers.ts/oauth.controller";

const authRouter = Router();

authRouter.post("/signup", validate(createUserSchema), createUser);
authRouter.post("/signin", signIn);
authRouter.post("/otp", authMiddleware, createOtp);
authRouter.post("/otp/verify", authMiddleware, verifyOtp);
authRouter.post("/otp/resend", authMiddleware, resendOtp);
authRouter.post("/signout", authMiddleware, (req: Request, res: Response) => {
  res.send("signout");
});
authRouter.get("/google", redirectToGoogle);
authRouter.get("/google/callback", googleCallback);

export default authRouter;
