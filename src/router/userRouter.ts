import { Router } from "express";
import UserController from "../controller/user.controller.js";
import { authenticate } from "../middleware/authenticate.js";

export const userRouter = Router();

const userController = UserController.getInstance();
userRouter.get("/users", authenticate, userController.getAllUser);
userRouter.patch(
  "/users/me/password",
  authenticate,
  userController.changePassword,
);
