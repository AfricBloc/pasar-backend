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
  createOTP,
  verifyOTP,
} from "@/controller/authControllers.ts/otp.controller";

const authRouter = Router();

authRouter.post("/signup", validate(createUserSchema), createUser);
authRouter.post("/signin", signIn);
authRouter.post("/otp", authMiddleware, createOTP);
authRouter.post("/otp/verify", authMiddleware, verifyOTP);
authRouter.post(
  "/otp/resend",
  authMiddleware,
  (req: Request, res: Response) => {
    res.send("signout");
  }
);
authRouter.post("/signout", authMiddleware, (req: Request, res: Response) => {
  res.send("signout");
});
export default authRouter;
