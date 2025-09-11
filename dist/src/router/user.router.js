"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controller/userControllers/user.controller");
const validator_middleware_1 = require("../middleware/validator.middleware");
const user_model_1 = require("../model/user.model");
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const userRouter = express_1.default.Router();
// Route to create a new user
//router.post("/create", validate(createUserSchema), createUser);
userRouter.get("/:id", auth_middleware_1.default, user_controller_1.getSingleUser);
userRouter.get("/", auth_middleware_1.default, user_controller_1.getAllUsers);
userRouter.get("/delete-user", user_controller_1.deleteUser);
userRouter.put("/update-user/:id", (0, validator_middleware_1.validate)(user_model_1.createUserSchema), user_controller_1.updateUser);
// Export the router to be used in the main app
exports.default = userRouter;
