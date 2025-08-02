import express from "express";
import {
  deleteUser,
  getAllUsers,
  getSingleUser,
  updateUser,
} from "../controller/user.controller";
import { validate } from "../middleware/validator.middleware";
import { createUserSchema } from "../model/user.model";

const userRouter = express.Router();

// Route to create a new user
//router.post("/create", validate(createUserSchema), createUser);
userRouter.get("/user/:id", getSingleUser);
userRouter.get("/users", getAllUsers);
userRouter.get("/delete-user", deleteUser);
userRouter.put("/update-user/:id", validate(createUserSchema), updateUser);

// Export the router to be used in the main app
export default userRouter;
