import { Router } from "express";
import { Request, Response } from "express";
import { validate } from "../middleware/validator.middleware";
import { createUserSchema } from "../model/user.model";
import { createUser } from "../controller/auth.controller";

const authRouter = Router();

authRouter.post("/signup", validate(createUserSchema), createUser);
authRouter.post("/signin", (req: Request, res: Response) => {
  res.send("signin");
});
authRouter.post("/signout", (req: Request, res: Response) => {
  res.send("signout");
});
export default authRouter;
